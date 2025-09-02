import { loadCoreTemplates, TemplateDefinition, isCoreTemplate } from '@/data/templates';

export class TemplateService {
  private static USER_OVERRIDES_KEY = 'cortex_user_templates_v2';
  private static SETTINGS_KEY = 'cortex_template_settings';

  /**
   * Load all templates (core + user overrides)
   */
  static async loadAllTemplates(): Promise<{
    core: TemplateDefinition[];
    overrides: Map<string, TemplateDefinition>;
  }> {
    const core = await loadCoreTemplates();
    const overrides = this.loadUserOverrides();
    return { core, overrides };
  }

  /**
   * Load user template overrides from localStorage
   */
  static loadUserOverrides(): Map<string, TemplateDefinition> {
    if (typeof window === 'undefined') return new Map();

    try {
      const stored = localStorage.getItem(this.USER_OVERRIDES_KEY);
      if (!stored) return new Map();

      const templates = JSON.parse(stored) as TemplateDefinition[];
      return new Map(templates.map(t => [t.id, t]));
    } catch (error) {
      console.error('Error loading user templates:', error);
      return new Map();
    }
  }

  /**
   * Save a user template (custom template)
   */
  static saveUserOverride(template: TemplateDefinition): void {
    if (typeof window === 'undefined') return;

    const overrides = this.loadUserOverrides();
    
    // Update metadata for user template
    const updatedTemplate: TemplateDefinition = {
      ...template,
      metadata: {
        ...template.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    overrides.set(template.id, updatedTemplate);
    
    try {
      localStorage.setItem(
        this.USER_OVERRIDES_KEY,
        JSON.stringify(Array.from(overrides.values()))
      );
    } catch (error) {
      console.error('Error saving user template:', error);
      throw new Error('Failed to save template');
    }
  }

  /**
   * Delete a user template override
   */
  static deleteUserOverride(id: string): void {
    if (typeof window === 'undefined') return;

    // Don't allow deletion of core templates
    if (isCoreTemplate(id)) {
      console.warn('Cannot delete core template:', id);
      return;
    }

    const overrides = this.loadUserOverrides();
    overrides.delete(id);

    try {
      localStorage.setItem(
        this.USER_OVERRIDES_KEY,
        JSON.stringify(Array.from(overrides.values()))
      );
    } catch (error) {
      console.error('Error deleting template:', error);
      throw new Error('Failed to delete template');
    }
  }


  /**
   * Export a template as JSON blob
   */
  static exportTemplate(template: TemplateDefinition): Blob {
    const exportData = {
      ...template,
      metadata: {
        ...template.metadata,
        exportedAt: new Date().toISOString(),
        exportVersion: '2.0.0',
      },
    };

    const json = JSON.stringify(exportData, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Export multiple templates
   */
  static exportTemplates(templates: TemplateDefinition[]): Blob {
    const exportData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      templates: templates.map(t => ({
        ...t,
        metadata: {
          ...t.metadata,
          exportedAt: new Date().toISOString(),
        },
      })),
    };

    const json = JSON.stringify(exportData, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Import a template from file
   */
  static async importTemplate(file: File): Promise<TemplateDefinition> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Check if it's a multi-template export
      if (data.templates && Array.isArray(data.templates)) {
        throw new Error('This file contains multiple templates. Use importTemplates() instead.');
      }

      // Validate template structure
      if (!data.id || !data.name || !data.template) {
        throw new Error('Invalid template format: missing required fields');
      }

      // Generate new ID to avoid conflicts
      const importedTemplate: TemplateDefinition = {
        ...data,
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          ...data.metadata,
          isImported: true,
          originalId: data.id,
          importedAt: new Date().toISOString(),
          isCore: false,
          isEditable: true,
        },
      };

      return importedTemplate;
    } catch (error) {
      console.error('Error importing template:', error);
      throw new Error(`Failed to import template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import multiple templates from file
   */
  static async importTemplates(file: File): Promise<TemplateDefinition[]> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      let templates: any[] = [];

      // Check if it's a multi-template export
      if (data.templates && Array.isArray(data.templates)) {
        templates = data.templates;
      } else if (data.id && data.name && data.template) {
        // Single template
        templates = [data];
      } else {
        throw new Error('Invalid file format');
      }

      // Process each template
      return templates.map(t => ({
        ...t,
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          ...t.metadata,
          isImported: true,
          originalId: t.id,
          importedAt: new Date().toISOString(),
          isCore: false,
          isEditable: true,
        },
      }));
    } catch (error) {
      console.error('Error importing templates:', error);
      throw new Error(`Failed to import templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a template
   */
  static validateTemplate(template: Partial<TemplateDefinition>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.template || template.template.trim().length === 0) {
      errors.push('Template content is required');
    }

    if (!template.analysisType) {
      errors.push('Analysis type is required');
    }

    if (template.variables) {
      // Extract variables from template
      const templateVars = this.extractVariables(template.template || '');
      const definedVars = template.variables.map(v => v.name);

      // Check for undefined variables in template
      const undefinedVars = templateVars.filter(v => !definedVars.includes(v));
      if (undefinedVars.length > 0) {
        errors.push(`Undefined variables in template: ${undefinedVars.join(', ')}`);
      }

      // Check for unused variable definitions
      const unusedVars = definedVars.filter(v => !templateVars.includes(v));
      if (unusedVars.length > 0) {
        errors.push(`Unused variable definitions: ${unusedVars.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract variable names from template content
   */
  static extractVariables(template: string): string[] {
    const matches = template.match(/\{\{(\s*\w+\s*)\}\}/g) || [];
    const variables = matches.map(m => m.replace(/[{}]/g, '').trim());
    return Array.from(new Set(variables));
  }

  /**
   * Save template settings
   */
  static saveSettings(settings: Record<string, any>): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Load template settings
   */
  static loadSettings(): Record<string, any> {
    if (typeof window === 'undefined') return {};

    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }
}