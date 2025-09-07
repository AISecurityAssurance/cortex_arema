"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTemplateStore } from '@/stores/templateStore';
import { TemplateDefinition } from '@/data/templates';
import { TemplateService } from '@/services/templates/TemplateService';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import './page.css';

export default function TemplatesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const { showToast } = useToast();
  
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
    getTemplateSource,
    hasUnsavedChanges,
  } = useTemplateStore();

  // Local UI state
  const [filterMode, setFilterMode] = useState<'all' | 'core' | 'custom'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [viewingTemplateId, setViewingTemplateId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  
  // Form state for new template
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: '',
    variables: '',
    analysisType: 'custom' as 'stride' | 'stpa-sec' | 'custom'
  });

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showActionsDropdown && !(e.target as HTMLElement).closest('.actions-dropdown')) {
        setShowActionsDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showActionsDropdown]);

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
    // Don't allow editing core templates
    if (template.metadata?.isCore) {
      showToast('Core templates cannot be edited. Duplicate it first to create a custom version.', 'warning');
      return;
    }
    startEditing(template.id);
    setIsCreating(false);
    setIsViewing(false);
  };

  const handleView = (template: TemplateDefinition) => {
    setViewingTemplateId(template.id);
    setIsViewing(true);
    setIsCreating(false);
    if (editingTemplateId) {
      cancelEdit(editingTemplateId);
    }
  };

  const handleSave = async () => {
    try {
      if (isCreating) {
        // Validate form
        if (!formData.name.trim()) {
          showToast('Template name is required', 'error');
          return;
        }
        if (!formData.template.trim()) {
          showToast('Template content is required', 'error');
          return;
        }
        
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
        showToast('Template created successfully', 'success');
      } else if (editingTemplateId) {
        // Save existing draft
        await saveDraft(editingTemplateId);
        showToast('Template saved successfully', 'success');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to save template',
        'error'
      );
    }
  };

  const handleDelete = async (id: string) => {
    setTemplateToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (templateToDelete) {
      try {
        await deleteTemplate(templateToDelete);
        showToast('Template deleted successfully', 'success');
        setShowDeleteModal(false);
        setTemplateToDelete(null);
      } catch (error) {
        console.error('Error deleting template:', error);
        showToast(
          error instanceof Error ? error.message : 'Failed to delete template',
          'error'
        );
      }
    }
  };

  const handleDuplicate = async (template: TemplateDefinition) => {
    try {
      const newName = `${template.name} (Copy)`;
      await duplicateTemplate(template.id, newName);
      showToast('Template duplicated successfully', 'success');
    } catch (error) {
      console.error('Error duplicating template:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to duplicate template',
        'error'
      );
    }
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
      await importTemplate(file);
      showToast('Template imported successfully', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to import template',
        'error'
      );
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const extractVariables = () => {
    const variables = TemplateService.extractVariables(formData.template);
    setFormData({ ...formData, variables: variables.join(', ') });
    showToast(`Found ${variables.length} variable${variables.length !== 1 ? 's' : ''}`, 'info');
  };

  // Render the read-only viewer for core templates
  const renderTemplateViewer = () => {
    const template = getTemplate(viewingTemplateId!);
    if (!template) return null;

    return (
      <div className="template-viewer">
        <div className="viewer-header">
          <h2>View Template: {template.name}</h2>
          <div className="viewer-actions">
            <button 
              className="action-btn primary"
              onClick={() => handleUseTemplate(template)}
            >
              Use Template
            </button>
            <button 
              className="action-btn"
              onClick={() => handleDuplicate(template)}
            >
              Duplicate
            </button>
            <button 
              className="cancel-btn"
              onClick={() => setIsViewing(false)}
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="viewer-content">
          <div className="info-group">
            <label>Template Name</label>
            <div className="info-value">{template.name}</div>
          </div>

          <div className="info-group">
            <label>Description</label>
            <div className="info-value">{template.description}</div>
          </div>

          <div className="info-group">
            <label>Analysis Type</label>
            <div className="info-value">
              <Badge variant="info" size="small">
                {template.analysisType?.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="info-group">
            <label>Variables</label>
            <div className="info-value">
              {template.variables?.length ? (
                <div className="variables-list">
                  {template.variables.map(v => (
                    <Badge key={v.name} variant="default" size="small">
                      {v.label || v.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="no-variables">No variables defined</span>
              )}
            </div>
          </div>

          <div className="info-group">
            <label>Template Content</label>
            <div className="template-content-viewer">
              <pre>{template.template}</pre>
            </div>
          </div>

          <div className="info-group">
            <label>Metadata</label>
            <div className="metadata-info">
              <span>Version: {template.version}</span>
              <span>Author: {template.author}</span>
              {template.metadata?.createdAt && (
                <span>Created: {new Date(template.metadata.createdAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the editor for existing templates (with draft support)
  const renderTemplateEditor = () => {
    const template = getTemplate(editingTemplateId!);
    if (!template) return null;

    return (
      <div className="template-editor">
        <div className="editor-header">
          <h2>Edit Template: {template.name}</h2>
          <div className="editor-actions">
            <button 
              className="save-btn"
              onClick={() => saveDraft(editingTemplateId!)}
              disabled={!isDirty || isLoading}
            >
              {isLoading ? <LoadingSpinner size="small" /> : null}
              Save Changes
            </button>
            <button 
              className="cancel-btn"
              onClick={() => cancelEdit(editingTemplateId!)}
            >
              Cancel
            </button>
          </div>
        </div>
        
        {isDirty && (
          <div className="unsaved-warning">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
            You have unsaved changes
          </div>
        )}
        
        <div className="editor-form">
          <div className="form-group">
            <label htmlFor="name">Template Name</label>
            <input
              id="name"
              type="text"
              value={template.name}
              onChange={(e) => updateDraft(editingTemplateId!, { name: e.target.value })}
              placeholder="Enter template name..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              value={template.description}
              onChange={(e) => updateDraft(editingTemplateId!, { description: e.target.value })}
              placeholder="Brief description of this template..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="template">
              Template Content
              <button 
                className="extract-vars-btn"
                onClick={() => {
                  const variables = TemplateService.extractVariables(template.template);
                  showToast(`Found ${variables.length} variable${variables.length !== 1 ? 's' : ''}`, 'info');
                }}
              >
                Extract Variables
              </button>
            </label>
            <textarea
              id="template"
              value={template.template}
              onChange={(e) => updateDraft(editingTemplateId!, { template: e.target.value })}
              placeholder="Enter your prompt template here. Use {{variableName}} for variables..."
              rows={15}
            />
          </div>
        </div>
      </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setTemplateToDelete(null);
          }}
          title="Delete Template"
        >
          <div className="delete-modal-content">
            <p>Are you sure you want to delete this template? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="confirm-delete-btn" onClick={confirmDelete}>
                Delete Template
              </button>
              <button 
                className="cancel-btn" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setTemplateToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="templates-header">
        <h1>Security Analysis Templates</h1>
        <div className="header-actions">
          <div className="actions-dropdown">
            <button 
              className="actions-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowActionsDropdown(!showActionsDropdown);
              }}
            >
              Actions
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 8.5L2 4.5h8z"/>
              </svg>
            </button>
            {showActionsDropdown && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={handleImportClick}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                  </svg>
                  Import Template
                </button>
                <button className="dropdown-item" onClick={exportAllTemplates}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                  </svg>
                  Export All
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={reloadTemplates}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                  </svg>
                  Reload Templates
                </button>
              </div>
            )}
          </div>
          <button 
            className="new-template-btn" 
            onClick={handleCreateNew}
            disabled={isLoading}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
            </svg>
            New Template
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
          {error}
        </div>
      )}

      <div className="templates-container">
        <aside className="templates-sidebar">
          <div className="filter-section">
            <h3>Filter Templates</h3>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filterMode === 'all' ? 'active' : ''}`}
                onClick={() => setFilterMode('all')}
              >
                All Templates
              </button>
              <button 
                className={`filter-btn ${filterMode === 'core' ? 'active' : ''}`}
                onClick={() => setFilterMode('core')}
              >
                Core Templates
              </button>
              <button 
                className={`filter-btn ${filterMode === 'custom' ? 'active' : ''}`}
                onClick={() => setFilterMode('custom')}
              >
                Custom Templates
              </button>
            </div>
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
            <div className="template-editor">
              <div className="editor-header">
                <h2>Create New Template</h2>
                <div className="editor-actions">
                  <button 
                    className="save-btn"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner size="small" /> : null}
                    Create Template
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
              
              <div className="editor-form">
                <div className="form-group">
                  <label htmlFor="new-name">Template Name *</label>
                  <input
                    id="new-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter template name..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-description">Description</label>
                  <input
                    id="new-description"
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this template..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-type">Analysis Type</label>
                  <select
                    id="new-type"
                    value={formData.analysisType}
                    onChange={(e) => setFormData({ ...formData, analysisType: e.target.value as any })}
                  >
                    <option value="stride">STRIDE</option>
                    <option value="stpa-sec">STPA-SEC</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="new-template">
                    Template Content *
                    <button 
                      className="extract-vars-btn"
                      onClick={extractVariables}
                      type="button"
                    >
                      Extract Variables
                    </button>
                  </label>
                  <textarea
                    id="new-template"
                    value={formData.template}
                    onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                    placeholder="Enter your prompt template here. Use {{variableName}} for variables..."
                    rows={15}
                    required
                  />
                </div>

                {formData.variables && (
                  <div className="form-group">
                    <label htmlFor="new-variables">Variables (auto-extracted)</label>
                    <input
                      id="new-variables"
                      type="text"
                      value={formData.variables}
                      disabled
                      placeholder="Variables will be extracted from template..."
                    />
                  </div>
                )}
              </div>
            </div>
          ) : editingTemplateId ? (
            renderTemplateEditor()
          ) : isViewing ? (
            renderTemplateViewer()
          ) : (
            <div className="templates-grid">
              {filteredTemplates.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="currentColor" opacity="0.2">
                    <path d="M8 16h48v32H8z"/>
                    <path d="M16 8h32v8H16z"/>
                  </svg>
                  <p>No templates found</p>
                  <button className="create-first-btn" onClick={handleCreateNew}>
                    Create your first template
                  </button>
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
                      <div className="template-badges">
                        {template.source === 'core' && (
                          <Badge variant="primary" size="small">Core</Badge>
                        )}
                        {template.source === 'custom' && (
                          <Badge variant="success" size="small">Custom</Badge>
                        )}
                        {template.hasUnsavedChanges && (
                          <Badge variant="warning" size="small">Unsaved</Badge>
                        )}
                      </div>
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
                      <button 
                        className="action-btn primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseTemplate(template);
                        }}
                      >
                        Use Template
                      </button>
                      
                      <div className="action-buttons">
                        {template.metadata?.isCore ? (
                          <button 
                            className="icon-btn"
                            title="View template"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(template);
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                              <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
                            </svg>
                          </button>
                        ) : (
                          <button 
                            className="icon-btn"
                            title="Edit template"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(template);
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                            </svg>
                          </button>
                        )}
                        <button 
                          className="icon-btn"
                          title="Duplicate template"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(template);
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2z"/>
                          </svg>
                        </button>
                        <button 
                          className="icon-btn"
                          title="Export template"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportTemplate(template.id);
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                          </svg>
                        </button>
                        {!template.metadata?.isCore && (
                          <button 
                            className="icon-btn danger"
                            title="Delete template"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(template.id);
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                          </button>
                        )}
                      </div>
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