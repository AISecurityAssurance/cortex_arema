"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
        <button className="new-template-btn" onClick={handleCreateNew}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 5C10.55 5 11 5.45 11 6V9H14C14.55 9 15 9.45 15 10C15 10.55 14.55 11 14 11H11V14C11 14.55 10.55 15 10 15C9.45 15 9 14.55 9 14V11H6C5.45 11 5 10.55 5 10C5 9.45 5.45 9 6 9H9V6C9 5.45 9.45 5 10 5Z"/>
          </svg>
          New Template
        </button>
      </div>

      <div className="templates-container">
        <aside className="templates-sidebar">
          <div className="filter-section">
            <h3>Analysis Type</h3>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All Templates
              </button>
              <button 
                className={`filter-btn ${filterType === 'stride' ? 'active' : ''}`}
                onClick={() => setFilterType('stride')}
              >
                STRIDE
              </button>
              <button 
                className={`filter-btn ${filterType === 'stpa-sec' ? 'active' : ''}`}
                onClick={() => setFilterType('stpa-sec')}
              >
                STPA-SEC
              </button>
              <button 
                className={`filter-btn ${filterType === 'custom' ? 'active' : ''}`}
                onClick={() => setFilterType('custom')}
              >
                Custom
              </button>
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
                  <button className="save-btn" onClick={handleSave}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13 2H3C2.45 2 2 2.45 2 3V13C2 13.55 2.45 14 3 14H13C13.55 14 14 13.55 14 13V3C14 2.45 13.55 2 13 2ZM12 12H4V4H12V12ZM6 10H10V11H6V10ZM6 8H10V9H6V8ZM6 6H10V7H6V6Z"/>
                    </svg>
                    Save Template
                  </button>
                  <button 
                    className="cancel-btn" 
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="editor-form">
                <div className="form-group">
                  <label>Template Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter template name..."
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this template..."
                  />
                </div>

                <div className="form-group">
                  <label>Analysis Type</label>
                  <select
                    value={formData.analysisType}
                    onChange={(e) => setFormData({ ...formData, analysisType: e.target.value as any })}
                  >
                    <option value="stride">STRIDE</option>
                    <option value="stpa-sec">STPA-SEC</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Template Content
                    <button 
                      className="extract-vars-btn"
                      onClick={extractVariables}
                      type="button"
                    >
                      Extract Variables
                    </button>
                  </label>
                  <textarea
                    value={formData.template}
                    onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                    placeholder="Enter your prompt template here. Use {{variableName}} for variables..."
                    rows={15}
                  />
                </div>

                <div className="form-group">
                  <label>Variables (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
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
                  <button className="create-first-btn" onClick={handleCreateNew}>
                    Create your first template
                  </button>
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
                      <button 
                        className="action-btn primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseTemplate(template);
                        }}
                      >
                        Use Template
                      </button>
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(template);
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(template);
                        }}
                      >
                        Duplicate
                      </button>
                      {!template.id.includes('-default') && (
                        <button 
                          className="action-btn danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(template.id);
                          }}
                        >
                          Delete
                        </button>
                      )}
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