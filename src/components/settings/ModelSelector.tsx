"use client";

import React, { useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { ModelConfig, ModelProvider, MODEL_CATALOG, PROVIDER_CONFIGS } from '@/types/modelProvider';
import './ModelSelector.css';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  enabledProviders?: ModelProvider[];
  configuredProviders?: ModelProvider[];
  label?: string;
  id?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  enabledProviders,
  configuredProviders = [],
  label = "Select Model",
  id = "model-selector"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const groupedModels = useMemo(() => {
    const groups: Partial<Record<ModelProvider, ModelConfig[]>> = {};

    MODEL_CATALOG.forEach(model => {
      // Filter by enabled providers if specified
      if (enabledProviders && !enabledProviders.includes(model.provider)) {
        return;
      }

      // Check if provider requires configuration
      const providerConfig = PROVIDER_CONFIGS[model.provider];
      if (providerConfig.requiresApiKey && !configuredProviders.includes(model.provider)) {
        return; // Skip models from unconfigured providers
      }

      if (!groups[model.provider]) {
        groups[model.provider] = [];
      }
      groups[model.provider].push(model);
    });

    return groups;
  }, [enabledProviders, configuredProviders]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedModels;

    const filtered: Partial<Record<ModelProvider, ModelConfig[]>> = {};
    Object.entries(groupedModels).forEach(([provider, models]) => {
      const filteredModels = models.filter(model =>
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredModels.length > 0) {
        filtered[provider as ModelProvider] = filteredModels;
      }
    });
    return filtered;
  }, [groupedModels, searchQuery]);

  const selectedModel = useMemo(() => {
    return MODEL_CATALOG.find(m => m.id === value);
  }, [value]);

  const handleModelSelect = (modelId: string) => {
    onChange(modelId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const availableModelCount = useMemo(() => {
    return Object.values(groupedModels).reduce((acc, models) => acc + models.length, 0);
  }, [groupedModels]);

  return (
    <div className="model-selector-wrapper">
      {label && <label htmlFor={id} className="model-selector-label">{label}</label>}

      <div className="model-selector">
        <button
          id={id}
          className="model-selector-trigger"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          <div className="model-selector-value">
            {selectedModel ? (
              <div className="selected-model">
                <span className="model-provider-badge">
                  {PROVIDER_CONFIGS[selectedModel.provider].displayName}
                </span>
                <span className="model-name">{selectedModel.name}</span>
                {selectedModel.supportsVision && (
                  <Eye className="model-feature-badge" size={16} />
                )}
              </div>
            ) : (
              <span className="placeholder">Select a model...</span>
            )}
          </div>
          <span className="dropdown-arrow">▼</span>
        </button>

        {isOpen && (
          <>
            <div className="model-selector-backdrop" onClick={() => setIsOpen(false)} />
            <div className="model-selector-dropdown">
              <div className="model-search">
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="model-search-input"
                  autoFocus
                />
                <span className="model-count">{availableModelCount} models available</span>
              </div>

              <div className="model-groups">
                {Object.entries(filteredGroups).length === 0 ? (
                  <div className="no-models">
                    {searchQuery ? 'No models match your search' : 'No models available. Configure a provider first.'}
                  </div>
                ) : (
                  Object.entries(filteredGroups).map(([provider, models]) => (
                    <div key={provider} className="model-group">
                      <div className="model-group-header">
                        {PROVIDER_CONFIGS[provider as ModelProvider].displayName}
                        <span className="model-group-count">{models.length}</span>
                      </div>
                      <div className="model-list">
                        {models.map(model => (
                          <button
                            key={model.id}
                            className={`model-option ${model.id === value ? 'selected' : ''}`}
                            onClick={() => handleModelSelect(model.id)}
                            type="button"
                          >
                            <div className="model-option-content">
                              <span className="model-option-name">{model.name}</span>
                              <div className="model-option-features">
                                {model.supportsVision && (
                                  <Eye className="feature-badge" size={14} title="Supports vision/images" />
                                )}
                                {model.maxTokens && (
                                  <span className="feature-text" title="Max tokens">
                                    {(model.maxTokens / 1000).toFixed(0)}k
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {Object.keys(groupedModels).length === 0 && (
                <div className="configure-prompt">
                  <p>Configure a model provider to get started</p>
                  <small>Add API keys in the Model Configuration section above</small>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};