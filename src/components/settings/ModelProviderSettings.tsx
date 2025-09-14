"use client";

import React, { useState, useEffect } from 'react';
import { ModelProvider, PROVIDER_CONFIGS } from '@/types/modelProvider';
import { ProviderConfigModal } from './ProviderConfigModal';
import { OllamaSettings } from './OllamaSettings';
import { AzureOpenAISettings } from './AzureOpenAISettings';
import { OpenAIConfigForm } from './providers/OpenAIConfig';
import { AnthropicConfigForm } from './providers/AnthropicConfig';
import { GoogleConfigForm } from './providers/GoogleConfig';
import './ModelProviderSettings.css';

type ProviderConfig =
  | OllamaConfig
  | AzureOpenAIConfig
  | OpenAIConfig
  | AnthropicConfig
  | GoogleConfig
  | CohereConfig
  | MistralConfig;

import {
  OllamaConfig,
  AzureOpenAIConfig,
  OpenAIConfig,
  AnthropicConfig,
  GoogleConfig,
  CohereConfig,
  MistralConfig
} from '@/types/modelProvider';

interface ModelProviderSettingsProps {
  onConfigChange?: (provider: ModelProvider, config: ProviderConfig) => void;
  configuredProviders?: ModelProvider[];
}

export const ModelProviderSettings: React.FC<ModelProviderSettingsProps> = ({
  onConfigChange,
  configuredProviders = []
}) => {
  const [activeModal, setActiveModal] = useState<ModelProvider | null>(null);
  const [configs, setConfigs] = useState<Partial<Record<ModelProvider, ProviderConfig>>>({});

  useEffect(() => {
    // Load saved API keys from session storage
    const savedKeys = sessionStorage.getItem('byom_api_keys');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        setConfigs(parsed);
      } catch {
        // Ignore parse errors - start with empty configs
      }
    }
  }, []);

  const handleProviderConfig = (provider: ModelProvider, config: ProviderConfig) => {
    const newConfigs = { ...configs, [provider]: config };
    setConfigs(newConfigs);

    // Save to session storage
    sessionStorage.setItem('byom_api_keys', JSON.stringify(newConfigs));

    onConfigChange?.(provider, config);
  };

  const getProviderStatus = (provider: ModelProvider): 'configured' | 'partial' | 'unconfigured' => {
    if (configuredProviders.includes(provider)) return 'configured';

    const config = configs[provider];
    if (!config) return 'unconfigured';

    // Check if required fields are filled
    if (provider === 'ollama' || provider === 'azure') {
      return 'configured'; // These have their own settings components
    }

    if ('apiKey' in config && config.apiKey) {
      return 'configured';
    }

    return 'partial';
  };

  const renderProviderModal = () => {
    if (!activeModal) return null;

    const config = configs[activeModal];

    switch (activeModal) {
      case 'openai':
        return (
          <ProviderConfigModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            title="Configure OpenAI"
          >
            <OpenAIConfigForm
              config={config as OpenAIConfig}
              onChange={(c) => handleProviderConfig('openai', c)}
            />
          </ProviderConfigModal>
        );

      case 'anthropic':
        return (
          <ProviderConfigModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            title="Configure Anthropic"
          >
            <AnthropicConfigForm
              config={config as AnthropicConfig}
              onChange={(c) => handleProviderConfig('anthropic', c)}
            />
          </ProviderConfigModal>
        );

      case 'google':
        return (
          <ProviderConfigModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            title="Configure Google AI"
          >
            <GoogleConfigForm
              config={config as GoogleConfig}
              onChange={(c) => handleProviderConfig('google', c)}
            />
          </ProviderConfigModal>
        );

      case 'ollama':
        return (
          <ProviderConfigModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            title="Configure Ollama"
            showSaveButton={false}
          >
            <OllamaSettings
              onConfigChange={(c) => handleProviderConfig('ollama', c)}
            />
          </ProviderConfigModal>
        );

      case 'azure':
        return (
          <ProviderConfigModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            title="Configure Azure OpenAI"
            showSaveButton={false}
          >
            <AzureOpenAISettings
              onConfigChange={(c) => handleProviderConfig('azure', c)}
            />
          </ProviderConfigModal>
        );

      // Add more providers as needed
      default:
        return null;
    }
  };

  const configurableProviders = Object.entries(PROVIDER_CONFIGS)
    .filter(([, config]) => config.configurable)
    .map(([provider]) => provider as ModelProvider);

  return (
    <div className="model-provider-settings">
      <div className="provider-buttons">
        {configurableProviders.map(provider => {
          const config = PROVIDER_CONFIGS[provider];
          const status = getProviderStatus(provider);

          return (
            <button
              key={provider}
              className={`provider-button ${status}`}
              onClick={() => setActiveModal(provider)}
              title={`Configure ${config.displayName}`}
            >
              <span className="provider-button-name">{config.displayName}</span>
              {status === 'configured' && <span className="provider-status-icon">✓</span>}
              {status === 'partial' && <span className="provider-status-icon">!</span>}
            </button>
          );
        })}
      </div>

      {renderProviderModal()}
    </div>
  );
};