"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, 
  Input, 
  Select, 
  Textarea, 
  SpaceBetween
} from '@cloudscape-design/components';
import { TemplateStorage } from '@/lib/storage/templateStorage';
import { PromptTemplate } from '@/types';
import './page.css';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: '',
    variables: '',
    analysisType: 'custom' as 'stride' | 'stpa-sec' | 'custom'
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const allTemplates = TemplateStorage.getAllTemplates();
    setTemplates(allTemplates);
  };

  const filteredTemplates = filterType === 'all' 
    ? templates 
    : templates.filter(t => t.analysisType === filterType);

  const handleCreateNew = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedTemplate(null);
    setFormData({
      name: '',
      description: '',
      template: '',
      variables: '',
      analysisType: 'custom'
    });
  };

  const handleEdit = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
    setIsCreating(false);
    setFormData({
      name: template.name,
      description: template.description,
      template: template.template,
      variables: template.variables.join(', '),
      analysisType: template.analysisType
    });
  };

  const handleSave = () => {
    const variables = formData.variables
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);

    if (isCreating) {
      TemplateStorage.createTemplate(
        formData.name,
        formData.description,
        formData.template,
        variables,
        formData.analysisType
      );
    } else if (isEditing && selectedTemplate) {
      TemplateStorage.saveTemplate({
        ...selectedTemplate,
        name: formData.name,
        description: formData.description,
        template: formData.template,
        variables,
        analysisType: formData.analysisType
      });
    }

    setIsEditing(false);
    setIsCreating(false);
    loadTemplates();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      TemplateStorage.deleteTemplate(id);
      loadTemplates();
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
    }
  };

  const handleDuplicate = (template: PromptTemplate) => {
    const newName = `${template.name} (Copy)`;
    TemplateStorage.duplicateTemplate(template.id, newName);
    loadTemplates();
  };

  const handleUseTemplate = (template: PromptTemplate) => {
    router.push(`/analysis?template=${template.id}`);
  };

  const extractVariables = () => {
    const matches = formData.template.match(/{{(\s*\w+\s*)}}/g) || [];
    const variables = matches.map(m => m.replace(/[{}]/g, '').trim());
    const unique = Array.from(new Set(variables));
    setFormData({ ...formData, variables: unique.join(', ') });
  };

  return (
    <div className="templates-page">
      <div className="templates-header">
        <h1>Security Analysis Templates</h1>
        <div className="new-template-btn">
          <Button onClick={handleCreateNew} variant="primary" iconName="add-plus">
            New Template
          </Button>
        </div>
      </div>

      <div className="templates-container">
        <aside className="templates-sidebar">
          <div className="filter-section">
            <h3>Analysis Type</h3>
            <div className="filter-buttons">
              <SpaceBetween direction="vertical" size="xs">
                <Button 
                  className="filter-btn"
                  variant={filterType === 'all' ? 'primary' : 'normal'}
                  onClick={() => setFilterType('all')}
                  fullWidth
                >
                  All Templates
                </Button>
                <Button 
                  className="filter-btn"
                  variant={filterType === 'stride' ? 'primary' : 'normal'}
                  onClick={() => setFilterType('stride')}
                  fullWidth
                >
                  STRIDE
                </Button>
                <Button 
                  className="filter-btn"
                  variant={filterType === 'stpa-sec' ? 'primary' : 'normal'}
                  onClick={() => setFilterType('stpa-sec')}
                  fullWidth
                >
                  STPA-SEC
                </Button>
                <Button 
                  className="filter-btn"
                  variant={filterType === 'custom' ? 'primary' : 'normal'}
                  onClick={() => setFilterType('custom')}
                  fullWidth
                >
                  Custom
                </Button>
              </SpaceBetween>
            </div>
          </div>

          <div className="stats-section">
            <h3>Statistics</h3>
            <div className="stat-item">
              <span className="stat-label">Total Templates</span>
              <span className="stat-value">{templates.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Templates</span>
              <span className="stat-value">{templates.filter(t => t.isActive).length}</span>
            </div>
          </div>
        </aside>

        <main className="templates-main">
          {isCreating || isEditing ? (
            <div className="template-editor">
              <div className="editor-header">
                <h2>{isCreating ? 'Create New Template' : 'Edit Template'}</h2>
                <div className="editor-actions">
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={handleSave} variant="primary" iconName="check">
                      Save Template
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </SpaceBetween>
                </div>
              </div>

              <div className="editor-form">
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
                    <Button 
                      className="extract-vars-btn"
                      onClick={extractVariables}
                    >
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
                  <label>Variables (comma-separated)</label>
                  <Input
                    value={formData.variables}
                    onChange={({ detail }) => setFormData({ ...formData, variables: detail.value })}
                    placeholder="systemDescription, architectureComponents, ..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="templates-grid">
              {filteredTemplates.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="currentColor" opacity="0.2">
                    <path d="M32 12C21 12 12 21 12 32C12 43 21 52 32 52C43 52 52 43 52 32C52 21 43 12 32 12ZM32 48C23.2 48 16 40.8 16 32C16 23.2 23.2 16 32 16C40.8 16 48 23.2 48 32C48 40.8 40.8 48 32 48Z"/>
                  </svg>
                  <p>No templates found</p>
                  <div className="create-first-btn">
                    <Button onClick={handleCreateNew} variant="primary">
                      Create your first template
                    </Button>
                  </div>
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <div 
                    key={template.id} 
                    className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="template-header">
                      <h3>{template.name}</h3>
                      <div className="template-badges">
                        <span className={`badge badge-${template.analysisType}`}>
                          {template.analysisType.toUpperCase()}
                        </span>
                        {template.isActive && (
                          <span className="badge badge-active">Active</span>
                        )}
                      </div>
                    </div>

                    <p className="template-description">{template.description}</p>

                    <div className="template-meta">
                      <span className="meta-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 1L2 3V8C2 11.5 3.84 14.74 6.62 16.47L8 17L9.38 16.47C12.16 14.74 14 11.5 14 8V3L8 1Z"/>
                        </svg>
                        {template.variables.length} variables
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(template);
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(template);
                          }}
                        >
                          Duplicate
                        </Button>
                        {!template.id.includes('-default') && (
                          <Button 
                            variant="link"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(template.id);
                            }}
                          >
                            Delete
                          </Button>
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