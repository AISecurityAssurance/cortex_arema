"use client";

import React from "react";
import { PipelineNode } from "../types/pipeline";

interface ConfigPanelProps {
  node: PipelineNode;
  onUpdateConfig: (config: any) => void;
  onClose: () => void;
}

export function ConfigPanel({ node, onUpdateConfig, onClose }: ConfigPanelProps) {
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
              <label className="config-label">Upload Architecture Diagram</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="config-input"
              />
              {(node as any).config.fileName && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                  File: {(node as any).config.fileName}
                </div>
              )}
            </div>
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
              <label className="config-label">Model</label>
              <select
                value={(node as any).config.modelId}
                onChange={(e) => onUpdateConfig({ ...(node as any).config, modelId: e.target.value })}
                className="config-select"
              >
                <option value="us.anthropic.claude-opus-4-20250514-v1:0">Claude Opus</option>
                <option value="us.anthropic.claude-sonnet-4-20250514-v1:0">Claude Sonnet</option>
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
                    <option value="stride-default">STRIDE Default</option>
                    <option value="stride-detailed">STRIDE Detailed</option>
                  </>
                ) : (
                  <>
                    <option value="stpa-sec-default">STPA-SEC Default</option>
                    <option value="stpa-sec-detailed">STPA-SEC Detailed</option>
                  </>
                )}
              </select>
            </div>
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