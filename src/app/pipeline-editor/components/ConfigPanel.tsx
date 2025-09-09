"use client";

import React, { useState, useEffect } from "react";
import { PipelineNode, ArchitectureDiagramNode } from "../types/pipeline";
import { NodeConfig } from "../types/nodeConfigs";
import { ImageModal } from "./ImageModal";
import { OllamaSettings } from "@/components/settings/OllamaSettings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import '@/components/ui/dropdown-menu.css';

interface ConfigPanelProps {
  node: PipelineNode;
  onUpdateConfig: (config: NodeConfig) => void;
  onClose: () => void;
}

// Helper function to get display name for model IDs
const getModelDisplayName = (modelId: string): string => {
  const modelMap: Record<string, string> = {
    "us.anthropic.claude-opus-4-20250514-v1:0": "Claude Opus",
    "us.anthropic.claude-sonnet-4-20250514-v1:0": "Claude Sonnet",
    "us.anthropic.claude-3-5-sonnet-20241022-v2:0": "Claude 3.5 Sonnet",
    "us.amazon.nova-pro-v1:0": "Nova Pro",
    "us.amazon.nova-lite-v1:0": "Nova Lite",
    "us.meta.llama3-2-11b-instruct-v1:0": "Llama 3.2 11B",
    "us.mistral.pixtral-large-2502-v1:0": "Pixtral Large",
    "ollama:llava": "Ollama Llava (Vision)",
    "ollama:llama3.2": "Ollama Llama 3.2",
    "ollama:llama3.2-vision": "Ollama Llama 3.2 Vision",
    "ollama:qwen2.5": "Ollama Qwen 2.5",
    "gpt-4o": "GPT-4o (Vision)",
    "gpt-4o-mini": "GPT-4o Mini (Vision)",
    "gpt-4-vision-preview": "GPT-4 Vision",
    "gpt-4-turbo": "GPT-4 Turbo",
    "gpt-3.5-turbo": "GPT-3.5 Turbo",
    "o1-preview": "O1 Preview (Reasoning)",
    "o1-mini": "O1 Mini (Reasoning)",
  };
  return modelMap[modelId] || modelId;
};

// Helper function to get display name for template IDs
const getTemplateDisplayName = (templateId: string): string => {
  const templateMap: Record<string, string> = {
    "stride-core": "STRIDE Analysis",
    "owasp-top10-core": "OWASP Top 10",
    "stpa-sec-core": "STPA-SEC Analysis",
  };
  return templateMap[templateId] || "Select template...";
};

export function ConfigPanel({ node, onUpdateConfig, onClose }: ConfigPanelProps) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    // Create preview URL when file is uploaded
    if (node.type === 'input-diagram') {
      const file = (node as ArchitectureDiagramNode).config.file;
      if (file) {
        const url = URL.createObjectURL(file);
        setImagePreviewUrl(url);
        
        // Cleanup URL when component unmounts or file changes
        return () => URL.revokeObjectURL(url);
      }
    }
  }, [node.type === 'input-diagram' ? (node as ArchitectureDiagramNode).config?.file : null]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && node.type === 'input-diagram') {
      onUpdateConfig({
        ...(node as ArchitectureDiagramNode).config,
        file,
        fileName: file.name,
        uploadStatus: 'ready' as const
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
              <DropdownMenu>
                <DropdownMenuTrigger className="dropdown-trigger config-select">
                  <span>
                    {(node as any).config.modelId ? 
                      getModelDisplayName((node as any).config.modelId) : 
                      "Select model..."}
                  </span>
                  <ChevronDown />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="config-dropdown-content" matchTriggerWidth>
                  <DropdownMenuLabel>Bedrock Models</DropdownMenuLabel>
                  <DropdownMenuItem className={(node as any).config.modelId === "us.anthropic.claude-opus-4-20250514-v1:0" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "us.anthropic.claude-opus-4-20250514-v1:0" })}>Claude Opus</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "us.anthropic.claude-sonnet-4-20250514-v1:0" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "us.anthropic.claude-sonnet-4-20250514-v1:0" })}>Claude Sonnet</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "us.anthropic.claude-3-5-sonnet-20241022-v2:0" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0" })}>Claude 3.5 Sonnet</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "us.amazon.nova-pro-v1:0" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "us.amazon.nova-pro-v1:0" })}>Nova Pro</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "us.amazon.nova-lite-v1:0" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "us.amazon.nova-lite-v1:0" })}>Nova Lite</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "us.meta.llama3-2-11b-instruct-v1:0" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "us.meta.llama3-2-11b-instruct-v1:0" })}>Llama 3.2 11B</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "us.mistral.pixtral-large-2502-v1:0" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "us.mistral.pixtral-large-2502-v1:0" })}>Pixtral Large</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Ollama Models</DropdownMenuLabel>
                  <DropdownMenuItem className={(node as any).config.modelId === "ollama:llava" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "ollama:llava" })}>Ollama Llava (Vision)</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "ollama:llama3.2" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "ollama:llama3.2" })}>Ollama Llama 3.2</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "ollama:llama3.2-vision" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "ollama:llama3.2-vision" })}>Ollama Llama 3.2 Vision</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "ollama:qwen2.5" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "ollama:qwen2.5" })}>Ollama Qwen 2.5</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Azure OpenAI Models</DropdownMenuLabel>
                  <DropdownMenuItem className={(node as any).config.modelId === "gpt-4o" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "gpt-4o" })}>GPT-4o (Vision)</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "gpt-4o-mini" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "gpt-4o-mini" })}>GPT-4o Mini (Vision)</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "gpt-4-vision-preview" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "gpt-4-vision-preview" })}>GPT-4 Vision</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "gpt-4-turbo" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "gpt-4-turbo" })}>GPT-4 Turbo</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "gpt-3.5-turbo" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "gpt-3.5-turbo" })}>GPT-3.5 Turbo</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "o1-preview" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "o1-preview" })}>O1 Preview (Reasoning)</DropdownMenuItem>
                  <DropdownMenuItem className={(node as any).config.modelId === "o1-mini" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, modelId: "o1-mini" })}>O1 Mini (Reasoning)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <DropdownMenu>
                <DropdownMenuTrigger className="dropdown-trigger config-select">
                  <span>{getTemplateDisplayName((node as any).config.promptTemplate)}</span>
                  <ChevronDown />
                </DropdownMenuTrigger>
                <DropdownMenuContent matchTriggerWidth>
                  {node.type === 'analysis-stride' ? (
                    <>
                      <DropdownMenuItem className={(node as any).config.promptTemplate === "stride-core" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, promptTemplate: "stride-core" })}>STRIDE Analysis</DropdownMenuItem>
                      <DropdownMenuItem className={(node as any).config.promptTemplate === "owasp-top10-core" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, promptTemplate: "owasp-top10-core" })}>OWASP Top 10</DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem className={(node as any).config.promptTemplate === "stpa-sec-core" ? "selected" : ""} onClick={() => onUpdateConfig({ ...(node as any).config, promptTemplate: "stpa-sec-core" })}>STPA-SEC Analysis</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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