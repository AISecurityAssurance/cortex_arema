import React, { useRef, useState, useEffect } from 'react';
import { AttackTreeGenerationParams } from '@/types/attackTree';
import { MODEL_CATALOG } from '@/types/modelProvider';
import './AttackTreeControls.css';

interface AttackTreeControlsProps {
  params: AttackTreeGenerationParams;
  onParamsChange: (params: AttackTreeGenerationParams) => void;
  onGenerate: () => void;
  onExport: () => void;
  isGenerating: boolean;
  hasTree: boolean;
  viewSettings: {
    zoom: number;
    layoutMode: 'horizontal' | 'vertical' | 'radial';
    showLabels: boolean;
    showMetrics: boolean;
  };
  onViewSettingsChange: (settings: any) => void;
}

const APP_TYPES = [
  { value: 'web', label: 'Web Application' },
  { value: 'mobile', label: 'Mobile Application' },
  { value: 'api', label: 'API Service' },
  { value: 'desktop', label: 'Desktop Application' },
  { value: 'iot', label: 'IoT Device' },
  { value: 'network', label: 'Network Infrastructure' },
  { value: 'cloud', label: 'Cloud Service' },
  { value: 'embedded', label: 'Embedded System' }
];

const AUTH_METHODS = [
  { value: 'session', label: 'Session-based' },
  { value: 'jwt', label: 'JWT' },
  { value: 'oauth2', label: 'OAuth2' },
  { value: 'saml', label: 'SAML' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'api-key', label: 'API Key' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'biometric', label: 'Biometric' }
];

export const AttackTreeControls: React.FC<AttackTreeControlsProps> = ({
  params,
  onParamsChange,
  onGenerate,
  onExport,
  isGenerating,
  hasTree,
  viewSettings,
  onViewSettingsChange
}) => {
  const [availableModels, setAvailableModels] = useState<typeof MODEL_CATALOG>([]);

  useEffect(() => {
    // Load configured providers
    const savedKeys = sessionStorage.getItem('byom_api_keys');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        const configured = ['bedrock']; // Always available

        Object.entries(parsed).forEach(([provider, config]: [string, any]) => {
          if (provider === 'ollama' || provider === 'azure') {
            configured.push(provider);
          } else if (config && config.apiKey) {
            configured.push(provider);
          }
        });

        // Filter models by configured providers
        const models = MODEL_CATALOG.filter(m => configured.includes(m.provider));
        setAvailableModels(models);
      } catch (error) {
        console.error('[AttackTreeControls] Error loading providers:', error);
        // Default to bedrock models
        setAvailableModels(MODEL_CATALOG.filter(m => m.provider === 'bedrock'));
      }
    } else {
      // Default to bedrock models
      setAvailableModels(MODEL_CATALOG.filter(m => m.provider === 'bedrock'));
    }
  }, []);

  const handleAuthToggle = (method: string) => {
    const current = params.authentication || [];
    const updated = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    onParamsChange({ ...params, authentication: updated });
  };


  return (
    <div className="attack-tree-controls">
      <div className="controls-section">
        <h3>System Configuration</h3>

        <div className="form-group">
          <label className="form-label">System Description</label>
          <textarea
            className="form-textarea"
            value={params.systemDescription}
            onChange={(e) => onParamsChange({ ...params, systemDescription: e.target.value })}
            placeholder="Describe your system architecture, components, and data flows..."
            rows={4}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Application Type</label>
          <select
            className="form-select"
            value={params.appType}
            onChange={(e) => onParamsChange({ ...params, appType: e.target.value })}
          >
            {APP_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Authentication Methods</label>
          <div className="multi-select">
            {AUTH_METHODS.map(method => (
              <div
                key={method.value}
                className={`multi-select-option ${params.authentication?.includes(method.value) ? 'selected' : ''}`}
                onClick={() => handleAuthToggle(method.value)}
              >
                {method.label}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <div className="form-checkbox">
            <input
              type="checkbox"
              id="internetFacing"
              checked={params.internetFacing}
              onChange={(e) => onParamsChange({ ...params, internetFacing: e.target.checked })}
            />
            <label htmlFor="internetFacing">Internet Facing</label>
          </div>
        </div>

        <div className="form-group">
          <div className="form-checkbox">
            <input
              type="checkbox"
              id="sensitiveData"
              checked={params.sensitiveData}
              onChange={(e) => onParamsChange({ ...params, sensitiveData: e.target.checked })}
            />
            <label htmlFor="sensitiveData">Handles Sensitive Data</label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">AI Model</label>
          <select
            className="form-select"
            value={params.modelId}
            onChange={(e) => onParamsChange({ ...params, modelId: e.target.value })}
          >
            {availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Custom Instructions (Optional)</label>
          <textarea
            className="form-textarea"
            value={params.customPrompt || ''}
            onChange={(e) => onParamsChange({ ...params, customPrompt: e.target.value })}
            placeholder="Add any specific requirements or focus areas for the attack tree..."
            rows={3}
          />
        </div>
      </div>

      <div className="controls-section">
        <h3>Actions</h3>

        <button
          className="generate-button"
          onClick={onGenerate}
          disabled={isGenerating || !params.systemDescription?.trim()}
        >
          <div className="button-content">
            {isGenerating ? (
              <>
                <div className="spinner" />
                <span>Generating Attack Tree...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                  <path d="M9 16l2 2 4-4" />
                </svg>
                <span>Generate Attack Tree</span>
              </>
            )}
          </div>
        </button>

      </div>

      {hasTree && (
        <div className="controls-section">
          <h3>View Settings</h3>

          <div className="form-group">
            <label className="form-label">Layout Mode</label>
            <select
              className="form-select"
              value={viewSettings.layoutMode}
              onChange={(e) => onViewSettingsChange({
                ...viewSettings,
                layoutMode: e.target.value as 'horizontal' | 'vertical' | 'radial'
              })}
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="radial">Radial</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Zoom: {Math.round(viewSettings.zoom * 100)}%</label>
            <input
              type="range"
              min="25"
              max="200"
              value={viewSettings.zoom * 100}
              onChange={(e) => onViewSettingsChange({
                ...viewSettings,
                zoom: parseInt(e.target.value) / 100
              })}
              className="zoom-slider"
            />
          </div>

          <div className="form-group">
            <div className="form-checkbox">
              <input
                type="checkbox"
                id="showLabels"
                checked={viewSettings.showLabels}
                onChange={(e) => onViewSettingsChange({
                  ...viewSettings,
                  showLabels: e.target.checked
                })}
              />
              <label htmlFor="showLabels">Show Labels</label>
            </div>
          </div>

          <div className="form-group">
            <div className="form-checkbox">
              <input
                type="checkbox"
                id="showMetrics"
                checked={viewSettings.showMetrics}
                onChange={(e) => onViewSettingsChange({
                  ...viewSettings,
                  showMetrics: e.target.checked
                })}
              />
              <label htmlFor="showMetrics">Show Metrics</label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};