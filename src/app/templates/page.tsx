"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, 
  Input, 
  Select, 
  Textarea, 
  SpaceBetween,
  Alert,
  Badge,
  ButtonDropdown,
  RadioGroup,
  Modal,
  Box,
  Header,
  Container
} from '@cloudscape-design/components';
import { useTemplateStore } from '@/stores/templateStore';
import { TemplateDefinition } from '@/data/templates';
import { TemplateService } from '@/services/templates/TemplateService';
import './page.css';

export default function TemplatesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Zustand store
  const {
    coreTemplates,
    userOverrides,
    draftEdits,
    selectedTemplateId,
    editingTemplateId,
    isDirty,
    isLoading,
    error,
    loadTemplates,
    reloadTemplates,
    selectTemplate,
    getTemplate,
    getAllTemplates,
    startEditing,
    updateDraft,
    saveDraft,
    cancelEdit,
    createTemplate,
    deleteTemplate,
    duplicateTemplate,
    importTemplate,
    exportTemplate,
    exportAllTemplates,
    runMigration,
    getTemplateSource,
    hasUnsavedChanges,
  } = useTemplateStore();

  // Local UI state
  const [filterMode, setFilterMode] = useState<'all' | 'core' | 'custom'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  // Form state for new template
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: '',
    variables: '',
    analysisType: 'custom' as 'stride' | 'stpa-sec' | 'custom'
  });

  // Load templates and run migration on mount
  useEffect(() => {
    const initialize = async () => {
      await runMigration();
      await loadTemplates();
    };
    initialize();
  }, [loadTemplates, runMigration]);

  // Get filtered templates
  const getFilteredTemplates = (): (TemplateDefinition & { source: string; hasUnsavedChanges: boolean })[] => {
    const all: (TemplateDefinition & { source: string; hasUnsavedChanges: boolean })[] = [];
    
    // Add core templates
    for (const [id, template] of coreTemplates) {
      const source = getTemplateSource(id) || 'core';
      all.push({
        ...getTemplate(id) || template,
        source,
        hasUnsavedChanges: hasUnsavedChanges(id),
      });
    }
    
    // Add user-only templates
    for (const [id, template] of userOverrides) {
      if (!coreTemplates.has(id)) {
        const source = getTemplateSource(id) || 'custom';
        all.push({
          ...getTemplate(id) || template,
          source,
          hasUnsavedChanges: hasUnsavedChanges(id),
        });
      }
    }
    
    // Apply filter
    switch (filterMode) {
      case 'core':
        return all.filter(t => t.metadata?.isCore);
      case 'custom':
        return all.filter(t => !t.metadata?.isCore);
      default:
        return all;
    }
  };
  
  const filteredTemplates = getFilteredTemplates();

  const handleCreateNew = () => {
    setIsCreating(true);
    selectTemplate(null);
    setFormData({
      name: '',
      description: '',
      template: '',
      variables: '',
      analysisType: 'custom'
    });
  };

  const handleEdit = (template: TemplateDefinition) => {
    startEditing(template.id);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (isCreating) {
      // Create new template
      const variables = TemplateService.extractVariables(formData.template);
      const newTemplate: Omit<TemplateDefinition, 'id'> = {
        name: formData.name,
        description: formData.description,
        template: formData.template,
        version: '1.0.0',
        author: 'User',
        tags: [formData.analysisType],
        analysisType: formData.analysisType,
        expectedOutputFormat: 'structured',
        variables: variables.map(v => ({
          name: v,
          label: v.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim(),
          type: 'text' as const,
          required: true,
        })),
        metadata: {
          isCore: false,
          isEditable: true,
          createdAt: new Date().toISOString(),
        },
      };
      
      await createTemplate(newTemplate);
      setIsCreating(false);
    } else if (editingTemplateId) {
      // Save existing draft
      await saveDraft(editingTemplateId);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id);
    }
  };

  const handleDuplicate = async (template: TemplateDefinition) => {
    const newName = `${template.name} (Copy)`;
    await duplicateTemplate(template.id, newName);
  };

  const handleUseTemplate = (template: TemplateDefinition) => {
    router.push(`/analysis?template=${template.id}`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setImportError(null);
      await importTemplate(file);
      setShowImportModal(false);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const extractVariables = () => {
    const variables = TemplateService.extractVariables(formData.template);
    setFormData({ ...formData, variables: variables.join(', ') });
  };

  // Render the editor for existing templates (with draft support)
  const renderTemplateEditor = () => {
    const template = getTemplate(editingTemplateId!);
    if (!template) return null;

    return (
      <Container
        header={
          <Header
            variant="h2"
            description="Edit template with draft support"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  onClick={() => saveDraft(editingTemplateId!)}
                  variant="primary"
                  disabled={!isDirty}
                >
                  Save Changes
                </Button>
                <Button onClick={() => cancelEdit(editingTemplateId!)}>
                  Cancel
                </Button>
              </SpaceBetween>
            }
          >
            Edit Template: {template.name}
          </Header>
        }
      >
        {isDirty && (
          <Alert type="warning" dismissible={false}>
            You have unsaved changes
          </Alert>
        )}
        
        <SpaceBetween size="l">
          <div className="form-group">
            <label>Template Name</label>
            <Input
              value={template.name}
              onChange={({ detail }) => 
                updateDraft(editingTemplateId!, { name: detail.value })
              }
              placeholder="Enter template name..."
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <Input
              value={template.description}
              onChange={({ detail }) =>
                updateDraft(editingTemplateId!, { description: detail.value })
              }
              placeholder="Brief description of this template..."
            />
          </div>

          <div className="form-group">
            <label>Template Content</label>
            <Textarea
              value={template.template}
              onChange={({ detail }) =>
                updateDraft(editingTemplateId!, { template: detail.value })
              }
              placeholder="Enter your prompt template here. Use {{variableName}} for variables..."
              rows={15}
            />
          </div>
        </SpaceBetween>
      </Container>
    );
  };

  return (
    <div className="templates-page">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />

      <div className="templates-header">
        <h1>Security Analysis Templates</h1>
        <SpaceBetween direction="horizontal" size="xs">
          <ButtonDropdown
            items={[
              { text: 'Import Template', id: 'import' },
              { text: 'Export All', id: 'export-all' },
              { text: 'Reload Templates', id: 'reload' },
            ]}
            onItemClick={({ detail }) => {
              switch (detail.id) {
                case 'import':
                  handleImportClick();
                  break;
                case 'export-all':
                  exportAllTemplates();
                  break;
                case 'reload':
                  reloadTemplates();
                  break;
              }
            }}
          >
            Actions
          </ButtonDropdown>
          <Button onClick={handleCreateNew} variant="primary" iconName="add-plus">
            New Template
          </Button>
        </SpaceBetween>
      </div>

      {error && (
        <Alert type="error" dismissible onDismiss={() => {}}>
          {error}
        </Alert>
      )}

      <div className="templates-container">
        <aside className="templates-sidebar">
          <div className="filter-section">
            <h3>Filter Templates</h3>
            <RadioGroup
              value={filterMode}
              onChange={({ detail }) => setFilterMode(detail.value as any)}
              items={[
                { value: "all", label: "All Templates" },
                { value: "core", label: "Core Templates" },
                { value: "custom", label: "Custom Templates" }
              ]}
            />
          </div>

          <div className="stats-section">
            <h3>Statistics</h3>
            <div className="stat-item">
              <span className="stat-label">Core Templates</span>
              <span className="stat-value">{coreTemplates.size}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Custom Templates</span>
              <span className="stat-value">
                {Array.from(userOverrides.values()).filter(t => !t.metadata?.isCore).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Unsaved Drafts</span>
              <span className="stat-value">{draftEdits.size}</span>
            </div>
          </div>
        </aside>

        <main className="templates-main">
          {isCreating ? (
            <Container
              header={
                <Header
                  variant="h2"
                  actions={
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button onClick={handleSave} variant="primary">
                        Create Template
                      </Button>
                      <Button onClick={() => setIsCreating(false)}>
                        Cancel
                      </Button>
                    </SpaceBetween>
                  }
                >
                  Create New Template
                </Header>
              }
            >
              <SpaceBetween size="l">
                <div className="form-group">
                  <label>Template Name</label>
                  <Input
                    value={formData.name}
                    onChange={({ detail }) => setFormData({ ...formData, name: detail.value })}
                    placeholder="Enter template name..."
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <Input
                    value={formData.description}
                    onChange={({ detail }) => setFormData({ ...formData, description: detail.value })}
                    placeholder="Brief description of this template..."
                  />
                </div>

                <div className="form-group">
                  <label>Analysis Type</label>
                  <Select
                    selectedOption={{ value: formData.analysisType, label: formData.analysisType.toUpperCase() }}
                    onChange={({ detail }) => setFormData({ ...formData, analysisType: detail.selectedOption?.value as any })}
                    options={[
                      { value: "stride", label: "STRIDE" },
                      { value: "stpa-sec", label: "STPA-SEC" },
                      { value: "custom", label: "Custom" }
                    ]}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Template Content
                    <Button onClick={extractVariables}>
                      Extract Variables
                    </Button>
                  </label>
                  <Textarea
                    value={formData.template}
                    onChange={({ detail }) => setFormData({ ...formData, template: detail.value })}
                    placeholder="Enter your prompt template here. Use {{variableName}} for variables..."
                    rows={15}
                  />
                </div>

                <div className="form-group">
                  <label>Variables (auto-extracted)</label>
                  <Input
                    value={formData.variables}
                    onChange={({ detail }) => setFormData({ ...formData, variables: detail.value })}
                    placeholder="Variables will be extracted from template..."
                    disabled
                  />
                </div>
              </SpaceBetween>
            </Container>
          ) : editingTemplateId ? (
            renderTemplateEditor()
          ) : (
            <div className="templates-grid">
              {filteredTemplates.length === 0 ? (
                <div className="empty-state">
                  <p>No templates found</p>
                  <Button onClick={handleCreateNew} variant="primary">
                    Create your first template
                  </Button>
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <div 
                    key={template.id} 
                    className={`template-card ${selectedTemplateId === template.id ? 'selected' : ''}`}
                    onClick={() => selectTemplate(template.id)}
                  >
                    <div className="template-header">
                      <h3>{template.name}</h3>
                      <SpaceBetween direction="horizontal" size="xs">
                        {template.source === 'core' && <Badge color="blue">Core</Badge>}
                        {template.source === 'custom' && <Badge color="green">Custom</Badge>}
                        {template.hasUnsavedChanges && <Badge color="red">Unsaved</Badge>}
                      </SpaceBetween>
                    </div>

                    <p className="template-description">{template.description}</p>

                    <div className="template-meta">
                      <span className="meta-item">
                        {template.variables?.length || 0} variables
                      </span>
                      <span className="meta-item">v{template.version}</span>
                    </div>

                    <div className="template-preview">
                      <pre>{template.template.substring(0, 150)}...</pre>
                    </div>

                    <div className="template-actions">
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button 
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUseTemplate(template);
                          }}
                        >
                          Use Template
                        </Button>
                        
                        <Button 
                          iconName="edit"
                          variant="icon"
                          ariaLabel="Edit template"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(template);
                          }}
                        />
                        <Button 
                          iconName="copy"
                          variant="icon"
                          ariaLabel="Duplicate template"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(template);
                          }}
                        />
                        <Button 
                          iconName="download"
                          variant="icon"
                          ariaLabel="Export template"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportTemplate(template.id);
                          }}
                        />
                        {!template.metadata?.isCore && (
                          <Button 
                            iconName="remove"
                            variant="icon"
                            ariaLabel="Delete template"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(template.id);
                            }}
                          />
                        )}
                      </SpaceBetween>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}