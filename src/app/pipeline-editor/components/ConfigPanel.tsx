"use client";

import React, { useState, useEffect } from "react";
import { PipelineNode } from "../types/pipeline";
import { ImageModal } from "./ImageModal";
import { OllamaSettings } from "@/components/settings/OllamaSettings";

interface ConfigPanelProps {
  node: PipelineNode;
  onUpdateConfig: (config: any) => void;
  onClose: () => void;
}

export function ConfigPanel({ node, onUpdateConfig, onClose }: ConfigPanelProps) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    // Create preview URL when file is uploaded
    if (node.type === 'input-diagram' && (node as any).config.file) {
      const url = URL.createObjectURL((node as any).config.file);
      setImagePreviewUrl(url);
      
      // Cleanup URL when component unmounts or file changes
      return () => URL.revokeObjectURL(url);
    }
  }, [(node as any).config?.file]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdateConfig({
        ...node.config,
        file,
        fileName: file.name,
        uploadStatus: 'ready'
      });
    }
  };

  const renderConfigFields = () => {
    switch (node.type) {
      case 'input-diagram':
        return (
          <>
            <div className="config-section">
              <label className="config-label">
                Upload Architecture Diagram <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="config-input"
                style={{
                  borderColor: !(node as any).config.file ? '#ef4444' : undefined
                }}
              />
              {(node as any).config.fileName ? (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#10b981' }}>
                  ✓ File: {(node as any).config.fileName}
                </div>
              ) : (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Architecture diagram is required for analysis
                </div>
              )}
              
              {/* Image Preview */}
              {imagePreviewUrl && (
                <div style={{ marginTop: '1rem' }}>
                  <label className="config-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Preview (click to enlarge)
                  </label>
                  <div
                    onClick={() => setShowImageModal(true)}
                    style={{
                      cursor: 'pointer',
                      border: '2px solid var(--panel-border)',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '0.5rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8b5cf6';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--panel-border)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <img
                      src={imagePreviewUrl}
                      alt="Architecture diagram preview"
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        borderRadius: '0.25rem',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Image Modal */}
            {showImageModal && imagePreviewUrl && (
              <ImageModal
                imageUrl={imagePreviewUrl}
                fileName={(node as any).config.fileName}
                onClose={() => setShowImageModal(false)}
              />
            )}
          </>
        );

      case 'input-text':
        return (
          <>
            <div className="config-section">
              <label className="config-label">System Name</label>
              <input
                type="text"
                value={(node as any).config.systemName}
                onChange={(e) => onUpdateConfig({ ...(node as any).config, systemName: e.target.value })}
                className="config-input"
                placeholder="Enter system name"
              />
            </div>
            <div className="config-section">
              <label className="config-label">Description</label>
              <textarea
                value={(node as any).config.description}
                onChange={(e) => onUpdateConfig({ ...(node as any).config, description: e.target.value })}
                className="config-textarea"
                placeholder="Describe the system"
              />
            </div>
            <div className="config-section">
              <label className="config-label">Context</label>
              <textarea
                value={(node as any).config.context}
                onChange={(e) => onUpdateConfig({ ...(node as any).config, context: e.target.value })}
                className="config-textarea"
                placeholder="Additional context"
              />
            </div>
          </>
        );

      case 'analysis-stride':
      case 'analysis-stpa-sec':
        return (
          <>
            <div className="config-section">
              <label className="config-label">
                System Description <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={(node as any).config.systemDescription || ''}
                onChange={(e) => onUpdateConfig({ ...(node as any).config, systemDescription: e.target.value })}
                className="config-textarea"
                placeholder="Required: Describe the system being analyzed (e.g., 'E-commerce platform with microservices architecture handling payment processing and user authentication')"
                style={{ 
                  minHeight: '80px',
                  borderColor: !(node as any).config.systemDescription ? '#ef4444' : undefined 
                }}
              />
              {!(node as any).config.systemDescription && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  System description is required for analysis
                </div>
              )}
            </div>
            <div className="config-section">
              <label className="config-label">Model</label>
              <select
                value={(node as any).config.modelId}
                onChange={(e) => onUpdateConfig({ ...(node as any).config, modelId: e.target.value })}
                className="config-select"
              >
                <optgroup label="Bedrock Models">
                  <option value="us.anthropic.claude-opus-4-20250514-v1:0">Claude Opus</option>
                  <option value="us.anthropic.claude-sonnet-4-20250514-v1:0">Claude Sonnet</option>
                  <option value="us.anthropic.claude-3-5-sonnet-20241022-v2:0">Claude 3.5 Sonnet</option>
                  <option value="us.amazon.nova-pro-v1:0">Nova Pro</option>
                  <option value="us.amazon.nova-lite-v1:0">Nova Lite</option>
                  <option value="us.meta.llama3-2-11b-instruct-v1:0">Llama 3.2 11B</option>
                  <option value="us.mistral.pixtral-large-2502-v1:0">Pixtral Large</option>
                </optgroup>
                <optgroup label="Ollama Models">
                  <option value="ollama:llava">Ollama Llava (Vision)</option>
                  <option value="ollama:llama3.2">Ollama Llama 3.2</option>
                  <option value="ollama:llama3.2-vision">Ollama Llama 3.2 Vision</option>
                  <option value="ollama:qwen2.5">Ollama Qwen 2.5</option>
                </optgroup>
                <optgroup label="Azure OpenAI Models">
                  <option value="gpt-4o">GPT-4o (Vision)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Vision)</option>
                  <option value="gpt-4-vision-preview">GPT-4 Vision</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="o1-preview">O1 Preview (Reasoning)</option>
                  <option value="o1-mini">O1 Mini (Reasoning)</option>
                </optgroup>
              </select>
            </div>
            <div className="config-section">
              <label className="config-label">Temperature</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={(node as any).config.temperature}
                onChange={(e) => onUpdateConfig({ ...(node as any).config, temperature: parseFloat(e.target.value) })}
                className="config-slider"
              />
              <div className="slider-value">{(node as any).config.temperature}</div>
            </div>
            <div className="config-section">
              <label className="config-label">Prompt Template</label>
              <select
                value={(node as any).config.promptTemplate}
                onChange={(e) => onUpdateConfig({ ...(node as any).config, promptTemplate: e.target.value })}
                className="config-select"
              >
                {node.type === 'analysis-stride' ? (
                  <>
                    <option value="stride-default">STRIDE Analysis</option>
                    <option value="owasp-top10-default">OWASP Top 10</option>
                  </>
                ) : (
                  <>
                    <option value="stpa-sec-default">STPA-SEC Analysis</option>
                  </>
                )}
              </select>
            </div>
            
            {/* Show Ollama settings when an Ollama model is selected */}
            {(node as any).config.modelId?.startsWith('ollama:') && (
              <div className="config-section">
                <OllamaSettings 
                  onConfigChange={(ollamaConfig) => {
                    onUpdateConfig({ 
                      ...(node as any).config, 
                      ollamaConfig 
                    });
                  }}
                />
              </div>
            )}
          </>
        );

      case 'output-results':
        return (
          <>
            <div className="config-section">
              <label className="config-label">Display Mode</label>
              <select
                value={(node as any).config.displayMode}
                onChange={(e) => onUpdateConfig({ ...(node as any).config, displayMode: e.target.value })}
                className="config-select"
              >
                <option value="summary">Summary</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
            <div className="config-section">
              <label className="config-label">
                <input
                  type="checkbox"
                  checked={(node as any).config.autoOpenValidation}
                  onChange={(e) => onUpdateConfig({ ...(node as any).config, autoOpenValidation: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Auto-open validation panel
              </label>
            </div>
          </>
        );

      default:
        return <div>No configuration available</div>;
    }
  };

  const getNodeTitle = () => {
    const titles: Record<string, string> = {
      'input-diagram': 'Architecture Diagram',
      'input-text': 'Text Input',
      'analysis-stride': 'STRIDE Analysis',
      'analysis-stpa-sec': 'STPA-SEC Analysis',
      'output-results': 'Results View',
    };
    return titles[node.type] || node.type;
  };

  return (
    <div className="config-panel">
      <div className="config-header">
        <h3 className="config-title">{getNodeTitle()}</h3>
        <button className="config-close" onClick={onClose}>×</button>
      </div>
      {renderConfigFields()}
    </div>
  );
}