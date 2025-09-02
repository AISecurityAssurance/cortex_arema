import { TemplateDefinition, TemplateVariable } from '@/data/templates';
import { TemplateService } from './TemplateService';

interface OldTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[] | TemplateVariable[];
  analysisType: 'stride' | 'stpa-sec' | 'custom';
  expectedOutputFormat?: string;
  version?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MigrationResult {
  migrated: number;
  skipped: boolean;
  errors: string[];
  backedUp: boolean;
}

export class TemplateMigration {
  private static MIGRATION_FLAG = 'template_migration_v2';
  private static BACKUP_KEY = 'templates_backup_v1';
  private static OLD_TEMPLATE_STORAGE_KEY = 'cortex_security_templates';
  private static OLD_PROMPT_STORE_KEY = 'security-platform-prompts';

  /**
   * Run the migration from old storage to new format
   */
  static async migrate(): Promise<MigrationResult> {
    const result: MigrationResult = {
      migrated: 0,
      skipped: false,
      errors: [],
      backedUp: false,
    };

    try {
      // Check if already migrated
      if (this.isMigrated()) {
        result.skipped = true;
        return result;
      }

      // Get old templates from both possible sources
      const oldTemplates = this.getOldTemplates();
      
      if (oldTemplates.length === 0) {
        // No templates to migrate
        this.markMigrationComplete();
        result.skipped = true;
        return result;
      }

      // Backup original data
      this.backupOldTemplates(oldTemplates);
      result.backedUp = true;

      // Filter out default/core templates that shouldn't be migrated
      const customTemplates = oldTemplates.filter(t => 
        !this.isDefaultTemplate(t.id)
      );

      // Migrate each custom template
      for (const oldTemplate of customTemplates) {
        try {
          const migrated = this.transformTemplate(oldTemplate);
          TemplateService.saveUserOverride(migrated);
          result.migrated++;
        } catch (error) {
          const errorMsg = `Failed to migrate template ${oldTemplate.id}: ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      // Mark migration as complete
      this.markMigrationComplete();

      console.log(`Migration complete: ${result.migrated} templates migrated`);
    } catch (error) {
      const errorMsg = `Migration failed: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  }

  /**
   * Check if migration has already been completed
   */
  static isMigrated(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(this.MIGRATION_FLAG) === 'complete';
  }

  /**
   * Mark migration as complete
   */
  private static markMigrationComplete(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.MIGRATION_FLAG, 'complete');
  }

  /**
   * Get templates from old storage locations
   */
  private static getOldTemplates(): OldTemplate[] {
    if (typeof window === 'undefined') return [];

    const templates: OldTemplate[] = [];

    // Try to get templates from TemplateStorage
    try {
      const fromTemplateStorage = localStorage.getItem(this.OLD_TEMPLATE_STORAGE_KEY);
      if (fromTemplateStorage) {
        const parsed = JSON.parse(fromTemplateStorage);
        if (Array.isArray(parsed)) {
          templates.push(...parsed);
        }
      }
    } catch (error) {
      console.error('Error reading from TemplateStorage:', error);
    }

    // Try to get templates from promptStore
    try {
      const fromPromptStore = localStorage.getItem(this.OLD_PROMPT_STORE_KEY);
      if (fromPromptStore) {
        const data = JSON.parse(fromPromptStore);
        if (data.state?.templates && Array.isArray(data.state.templates)) {
          // Avoid duplicates by checking IDs
          const existingIds = new Set(templates.map(t => t.id));
          const promptStoreTemplates = data.state.templates.filter(
            (t: OldTemplate) => !existingIds.has(t.id)
          );
          templates.push(...promptStoreTemplates);
        }
      }
    } catch (error) {
      console.error('Error reading from promptStore:', error);
    }

    return templates;
  }

  /**
   * Check if a template ID represents a default template
   */
  private static isDefaultTemplate(id: string): boolean {
    const defaultIds = [
      'stride-default',
      'stpa-sec-default',
      'owasp-top10-default',
      'stride-core',
      'stpa-sec-core',
      'owasp-top10-core',
    ];
    return defaultIds.includes(id);
  }

  /**
   * Transform old template format to new format
   */
  private static transformTemplate(old: OldTemplate): TemplateDefinition {
    // Parse variables to new format
    const variables = this.parseVariables(old);

    // Determine the new ID
    let newId = old.id;
    if (this.isDefaultTemplate(old.id)) {
      // For default templates that were customized, create a new ID
      newId = old.id.replace('-default', '-custom');
    } else if (!old.id.includes('-custom') && !old.id.includes('-imported')) {
      // Add suffix to indicate it's a migrated custom template
      newId = `${old.id}-migrated`;
    }

    const transformed: TemplateDefinition = {
      id: newId,
      name: old.name,
      description: old.description,
      template: old.template,
      version: old.version || '1.0.0',
      author: 'Migrated',
      tags: this.inferTags(old),
      analysisType: old.analysisType,
      expectedOutputFormat: this.inferOutputFormat(old),
      variables,
      validationRules: this.inferValidationRules(old),
      metadata: {
        isCore: false,
        isEditable: true,
        isUserOverride: this.isDefaultTemplate(old.id),
        migratedFrom: 'v1',
        originalId: old.id,
        createdAt: old.createdAt || new Date().toISOString(),
        updatedAt: old.updatedAt || new Date().toISOString(),
      },
    };

    return transformed;
  }

  /**
   * Parse variables from old format to new format
   */
  private static parseVariables(template: OldTemplate): TemplateVariable[] {
    if (!template.variables) return [];

    // If already in new format
    if (Array.isArray(template.variables) && template.variables.length > 0) {
      const first = template.variables[0];
      if (typeof first === 'object' && 'name' in first && 'label' in first) {
        return template.variables as TemplateVariable[];
      }
    }

    // Convert from string array to new format
    if (Array.isArray(template.variables)) {
      return template.variables.map((v: string | TemplateVariable) => {
        if (typeof v === 'string') {
          return {
            name: v,
            label: this.formatLabel(v),
            type: this.inferVariableType(v) as 'text' | 'multiline',
            required: true,
            placeholder: this.inferPlaceholder(v),
          };
        }
        return v;
      });
    }

    return [];
  }

  /**
   * Format variable name as label
   */
  private static formatLabel(varName: string): string {
    // Convert camelCase or snake_case to Title Case
    return varName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  /**
   * Infer variable type based on name
   */
  private static inferVariableType(varName: string): string {
    const multilineKeywords = [
      'description',
      'components',
      'structure',
      'flows',
      'details',
      'context',
    ];
    
    const lower = varName.toLowerCase();
    return multilineKeywords.some(keyword => lower.includes(keyword)) 
      ? 'multiline' 
      : 'text';
  }

  /**
   * Infer placeholder text based on variable name
   */
  private static inferPlaceholder(varName: string): string {
    const placeholders: Record<string, string> = {
      systemDescription: 'Describe the system architecture and its purpose',
      architectureComponents: 'List the key components, services, and data flows',
      systemName: 'Enter the system name',
      applicationType: 'Web application, API, Mobile app, etc.',
      techStack: 'React, Node.js, PostgreSQL, etc.',
      authMethod: 'JWT, OAuth2, Session-based, etc.',
      controlStructure: 'Describe the control structure and feedback loops',
      dataFlows: 'Describe the data flows between components',
      components: 'List the system components',
      context: 'Provide additional context',
    };

    return placeholders[varName] || `Enter ${this.formatLabel(varName).toLowerCase()}`;
  }

  /**
   * Infer tags based on template content
   */
  private static inferTags(template: OldTemplate): string[] {
    const tags: string[] = [];

    if (template.analysisType) {
      tags.push(template.analysisType);
    }

    if (template.name.toLowerCase().includes('stride')) {
      tags.push('threat-modeling');
    }

    if (template.name.toLowerCase().includes('stpa')) {
      tags.push('system-analysis');
    }

    if (template.name.toLowerCase().includes('owasp')) {
      tags.push('web-security');
    }

    tags.push('migrated');

    return tags;
  }

  /**
   * Infer output format from template
   */
  private static inferOutputFormat(template: OldTemplate): 'structured' | 'freeform' | 'json' {
    if (template.expectedOutputFormat) {
      return template.expectedOutputFormat as any;
    }

    // Check if template asks for JSON output
    if (template.template.toLowerCase().includes('json')) {
      return 'json';
    }

    // Default to structured for known analysis types
    if (['stride', 'stpa-sec'].includes(template.analysisType)) {
      return 'structured';
    }

    return 'freeform';
  }

  /**
   * Infer validation rules based on template type
   */
  private static inferValidationRules(template: OldTemplate): TemplateDefinition['validationRules'] {
    switch (template.analysisType) {
      case 'stride':
        return {
          minFindings: 6,
          requiredCategories: [
            'spoofing',
            'tampering',
            'repudiation',
            'information_disclosure',
            'denial_of_service',
            'elevation_of_privilege',
          ],
        };
      case 'stpa-sec':
        return {
          minFindings: 5,
          requiredSections: [
            'unsafe_control_actions',
            'inadequate_feedback',
            'component_failures',
            'unsafe_interactions',
          ],
        };
      default:
        return {
          minFindings: 3,
        };
    }
  }

  /**
   * Backup old templates before migration
   */
  private static backupOldTemplates(templates: OldTemplate[]): void {
    if (typeof window === 'undefined') return;

    try {
      const backup = {
        timestamp: new Date().toISOString(),
        templates,
        source: 'pre-migration-backup',
      };
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  }

  /**
   * Restore templates from backup
   */
  static restoreFromBackup(): OldTemplate[] {
    if (typeof window === 'undefined') return [];

    try {
      const backup = localStorage.getItem(this.BACKUP_KEY);
      if (backup) {
        const data = JSON.parse(backup);
        return data.templates || [];
      }
    } catch (error) {
      console.error('Error restoring from backup:', error);
    }

    return [];
  }

  /**
   * Clear migration flag (for testing)
   */
  static resetMigration(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.MIGRATION_FLAG);
  }
}