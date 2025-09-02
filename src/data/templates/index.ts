// Template loader and registry
import strideCore from './core/stride.json';
import stpaSecCore from './core/stpa-sec.json';
import owaspCore from './core/owasp-top10.json';

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'multiline';
  required: boolean;
  placeholder?: string;
}

export interface TemplateMetadata {
  isCore: boolean;
  isEditable: boolean;
  isUserOverride?: boolean;
  isImported?: boolean;
  migratedFrom?: string;
  originalId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  tags?: string[];
  analysisType: 'stride' | 'stpa-sec' | 'custom';
  expectedOutputFormat: 'structured' | 'freeform' | 'json';
  variables: TemplateVariable[];
  template: string;
  validationRules?: {
    minFindings?: number;
    requiredCategories?: string[];
    requiredSections?: string[];
  };
  metadata: TemplateMetadata;
}

// Core templates map
export const coreTemplates: Record<string, TemplateDefinition> = {
  'stride-core': strideCore as TemplateDefinition,
  'stpa-sec-core': stpaSecCore as TemplateDefinition,
  'owasp-top10-core': owaspCore as TemplateDefinition,
};

// Load all core templates
export const loadCoreTemplates = async (): Promise<TemplateDefinition[]> => {
  // In development, this will re-import on hot-reload
  return Object.values(coreTemplates);
};

// Get a specific core template
export const getCoreTemplate = (id: string): TemplateDefinition | null => {
  return coreTemplates[id] || null;
};

// Check if a template ID is a core template
export const isCoreTemplate = (id: string): boolean => {
  return id in coreTemplates;
};