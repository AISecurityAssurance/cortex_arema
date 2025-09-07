import { create } from 'zustand';
import { TemplateDefinition } from '@/data/templates';
import { TemplateService } from '@/services/templates/TemplateService';
import { TemplateMigration } from '@/services/templates/TemplateMigration';

interface TemplateState {
  // Template collections
  coreTemplates: Map<string, TemplateDefinition>;
  userOverrides: Map<string, TemplateDefinition>;
  draftEdits: Map<string, TemplateDefinition>;

  // UI state
  selectedTemplateId: string | null;
  editingTemplateId: string | null;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions - Loading
  loadTemplates: () => Promise<void>;
  reloadTemplates: () => Promise<void>;

  // Actions - Selection
  selectTemplate: (id: string | null) => void;
  getTemplate: (id: string) => TemplateDefinition | null;
  getAllTemplates: () => TemplateDefinition[];

  // Actions - Editing
  startEditing: (id: string) => void;
  updateDraft: (id: string, updates: Partial<TemplateDefinition>) => void;
  saveDraft: (id: string) => Promise<void>;
  cancelEdit: (id: string) => void;
  discardAllDrafts: () => void;

  // Actions - CRUD
  createTemplate: (template: Omit<TemplateDefinition, 'id'>) => Promise<string>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string, newName: string) => Promise<string>;

  // Actions - Import/Export
  importTemplate: (file: File) => Promise<void>;
  importTemplates: (file: File) => Promise<void>;
  exportTemplate: (id: string) => void;
  exportTemplates: (ids: string[]) => void;
  exportAllTemplates: () => void;

  // Actions - Migration
  runMigration: () => Promise<void>;

  // Helper methods
  getTemplateSource: (id: string) => 'core' | 'custom' | 'draft' | null;
  hasUnsavedChanges: (id: string) => boolean;
  isCustomTemplate: (id: string) => boolean;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  // Initial state
  coreTemplates: new Map(),
  userOverrides: new Map(),
  draftEdits: new Map(),
  selectedTemplateId: null,
  editingTemplateId: null,
  isDirty: false,
  isLoading: false,
  error: null,

  // Load templates from service
  loadTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const { core, overrides } = await TemplateService.loadAllTemplates();
      set({
        coreTemplates: new Map(core.map(t => [t.id, t])),
        userOverrides: overrides,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load templates',
        isLoading: false,
      });
    }
  },

  // Reload templates (useful for hot-reload in dev)
  reloadTemplates: async () => {
    const { loadTemplates } = get();
    set({ draftEdits: new Map(), isDirty: false, editingTemplateId: null });
    await loadTemplates();
  },

  // Select a template
  selectTemplate: (id) => {
    set({ selectedTemplateId: id });
  },

  // Get a template with priority: draft > override > core
  getTemplate: (id) => {
    const state = get();
    return (
      state.draftEdits.get(id) ||
      state.userOverrides.get(id) ||
      state.coreTemplates.get(id) ||
      null
    );
  },

  // Get all templates (merged)
  getAllTemplates: () => {
    const state = get();
    const templates: TemplateDefinition[] = [];
    const addedIds = new Set<string>();

    // Add drafts first (highest priority)
    for (const [id, template] of state.draftEdits) {
      templates.push(template);
      addedIds.add(id);
    }

    // Add overrides (skip if already added as draft)
    for (const [id, template] of state.userOverrides) {
      if (!addedIds.has(id)) {
        templates.push(template);
        addedIds.add(id);
      }
    }

    // Add core templates (skip if already added)
    for (const [id, template] of state.coreTemplates) {
      if (!addedIds.has(id)) {
        templates.push(template);
        addedIds.add(id);
      }
    }

    return templates;
  },

  // Start editing a template
  startEditing: (id) => {
    const template = get().getTemplate(id);
    if (template) {
      set(state => ({
        draftEdits: new Map(state.draftEdits).set(id, { ...template }),
        editingTemplateId: id,
        isDirty: false,
      }));
    }
  },

  // Update a draft template
  updateDraft: (id, updates) => {
    set(state => {
      const draft = state.draftEdits.get(id);
      if (draft) {
        const newDrafts = new Map(state.draftEdits);
        newDrafts.set(id, { ...draft, ...updates });
        return { draftEdits: newDrafts, isDirty: true };
      }
      return state;
    });
  },

  // Save a draft
  saveDraft: async (id) => {
    const draft = get().draftEdits.get(id);
    if (!draft) return;

    set({ isLoading: true, error: null });
    
    try {
      // Save to filesystem via API
      await TemplateService.saveUserOverride(draft);
      
      // Update state
      set(state => {
        const newOverrides = new Map(state.userOverrides);
        newOverrides.set(id, draft);
        
        const newDrafts = new Map(state.draftEdits);
        newDrafts.delete(id);
        
        return {
          userOverrides: newOverrides,
          draftEdits: newDrafts,
          editingTemplateId: state.editingTemplateId === id ? null : state.editingTemplateId,
          isDirty: false,
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save template',
        isLoading: false,
      });
      throw error;
    }
  },

  // Cancel editing
  cancelEdit: (id) => {
    set(state => {
      const newDrafts = new Map(state.draftEdits);
      newDrafts.delete(id);
      
      return {
        draftEdits: newDrafts,
        editingTemplateId: state.editingTemplateId === id ? null : state.editingTemplateId,
        isDirty: false,
      };
    });
  },

  // Discard all drafts
  discardAllDrafts: () => {
    set({
      draftEdits: new Map(),
      editingTemplateId: null,
      isDirty: false,
    });
  },

  // Create a new template
  createTemplate: async (template) => {
    const newId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTemplate: TemplateDefinition = {
      ...template as TemplateDefinition,
      id: newId,
      metadata: {
        ...template.metadata,
        isCore: false,
        isEditable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    set({ isLoading: true, error: null });
    
    try {
      await TemplateService.saveUserOverride(newTemplate);
      
      set(state => {
        const newOverrides = new Map(state.userOverrides);
        newOverrides.set(newId, newTemplate);
        return { userOverrides: newOverrides, isLoading: false };
      });

      return newId;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create template',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete a template
  deleteTemplate: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      await TemplateService.deleteUserOverride(id);
      
      set(state => {
        const newOverrides = new Map(state.userOverrides);
        newOverrides.delete(id);
        
        const newDrafts = new Map(state.draftEdits);
        newDrafts.delete(id);
        
        return {
          userOverrides: newOverrides,
          draftEdits: newDrafts,
          selectedTemplateId: state.selectedTemplateId === id ? null : state.selectedTemplateId,
          editingTemplateId: state.editingTemplateId === id ? null : state.editingTemplateId,
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete template',
        isLoading: false,
      });
      throw error;
    }
  },

  // Duplicate a template (always creates a custom template)
  duplicateTemplate: async (id, newName) => {
    const template = get().getTemplate(id);
    if (!template) throw new Error('Template not found');

    const newId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duplicated: TemplateDefinition = {
      ...template,
      id: newId,
      name: newName,
      metadata: {
        ...template.metadata,
        isCore: false,  // Always make duplicates non-core
        isEditable: true,
        isUserOverride: false,  // It's a new custom template, not an override
        originalId: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    set({ isLoading: true, error: null });
    
    try {
      await TemplateService.saveUserOverride(duplicated);
      
      set(state => {
        const newOverrides = new Map(state.userOverrides);
        newOverrides.set(newId, duplicated);
        return { userOverrides: newOverrides, isLoading: false };
      });

      return newId;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to duplicate template',
        isLoading: false,
      });
      throw error;
    }
  },


  // Import a single template
  importTemplate: async (file) => {
    try {
      const imported = await TemplateService.importTemplate(file);
      TemplateService.saveUserOverride(imported);
      
      set(state => {
        const newOverrides = new Map(state.userOverrides);
        newOverrides.set(imported.id, imported);
        return { userOverrides: newOverrides };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to import template',
      });
      throw error;
    }
  },

  // Import multiple templates
  importTemplates: async (file) => {
    try {
      const imported = await TemplateService.importTemplates(file);
      
      for (const template of imported) {
        TemplateService.saveUserOverride(template);
      }
      
      set(state => {
        const newOverrides = new Map(state.userOverrides);
        for (const template of imported) {
          newOverrides.set(template.id, template);
        }
        return { userOverrides: newOverrides };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to import templates',
      });
      throw error;
    }
  },

  // Export a template
  exportTemplate: (id) => {
    const template = get().getTemplate(id);
    if (!template) return;

    const blob = TemplateService.exportTemplate(template);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Export multiple templates
  exportTemplates: (ids) => {
    const templates = ids.map(id => get().getTemplate(id)).filter(Boolean) as TemplateDefinition[];
    if (templates.length === 0) return;

    const blob = TemplateService.exportTemplates(templates);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `templates-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Export all templates
  exportAllTemplates: () => {
    const templates = get().getAllTemplates();
    const blob = TemplateService.exportTemplates(templates);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-templates-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Run migration
  runMigration: async () => {
    try {
      const result = await TemplateMigration.migrate();
      if (!result.skipped && result.migrated > 0) {
        // Reload templates to include migrated ones
        await get().loadTemplates();
      }
      console.log('Migration result:', result);
    } catch (error) {
      console.error('Migration failed:', error);
      set({
        error: error instanceof Error ? error.message : 'Migration failed',
      });
    }
  },

  // Get template source
  getTemplateSource: (id) => {
    const state = get();
    
    if (state.draftEdits.has(id)) {
      return 'draft';
    }
    
    if (state.coreTemplates.has(id)) {
      return 'core';
    } else if (state.userOverrides.has(id)) {
      return 'custom';
    }
    
    return null;
  },
  
  // Check if template is custom (user-created)
  isCustomTemplate: (id) => {
    const state = get();
    return state.userOverrides.has(id) && !state.coreTemplates.has(id);
  },

  // Check if template has unsaved changes
  hasUnsavedChanges: (id) => {
    return get().draftEdits.has(id);
  },
}));