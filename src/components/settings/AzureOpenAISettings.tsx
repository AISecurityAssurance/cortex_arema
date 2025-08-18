"use client";

import React, { useState, useEffect } from 'react';

interface AzureOpenAIConfig {
  endpoint?: string;
  apiKey?: string;
  deployment?: string;
  apiVersion?: string;
}

interface AzureOpenAISettingsProps {
  onConfigChange?: (config: AzureOpenAIConfig) => void;
}

export const AzureOpenAISettings: React.FC<AzureOpenAISettingsProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<AzureOpenAIConfig>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('azure_openai_config');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Ignore parse errors
        }
      }
    }
    return {
      apiVersion: '2025-01-01-preview'
    };
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('azure_openai_config', JSON.stringify(config));
    }
    // Notify parent of changes
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      endpoint: e.target.value
    }));
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      apiKey: e.target.value
    }));
  };

  const handleDeploymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      deployment: e.target.value
    }));
  };

  const handleApiVersionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      apiVersion: e.target.value
    }));
  };

  const isConfigured = config.endpoint && config.apiKey;

  return (
    <div className="azure-openai-settings">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="azure-settings-toggle"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          background: 'transparent',
          border: '1px solid var(--border-color)',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <span style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▶</span>
        Azure OpenAI Configuration
        {isConfigured && (
          <span style={{
            marginLeft: 'auto',
            padding: '0.125rem 0.5rem',
            background: 'var(--success-bg, rgba(34, 197, 94, 0.1))',
            color: 'var(--success-text, #22c55e)',
            borderRadius: '0.25rem',
            fontSize: '0.75rem'
          }}>
            Configured
          </span>
        )}
      </button>

      {isExpanded && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'var(--panel-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.375rem'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              marginBottom: '0.25rem'
            }}>
              Azure OpenAI Endpoint <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="url"
              value={config.endpoint || ''}
              onChange={handleEndpointChange}
              placeholder="https://your-resource.openai.azure.com/"
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.875rem',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.375rem',
                color: 'var(--text-primary)'
              }}
            />
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem'
            }}>
              Your Azure OpenAI resource endpoint URL
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              marginBottom: '0.25rem'
            }}>
              API Key <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey || ''}
                onChange={handleApiKeyChange}
                placeholder="Enter your Azure OpenAI API key"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  paddingRight: '3rem',
                  fontSize: '0.875rem',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '0.25rem 0.5rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem'
            }}>
              Found in Azure Portal → Your OpenAI Resource → Keys and Endpoint
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              marginBottom: '0.25rem'
            }}>
              Deployment Name (Optional)
            </label>
            <input
              type="text"
              value={config.deployment || ''}
              onChange={handleDeploymentChange}
              placeholder="e.g., gpt-4o-deployment"
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.875rem',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.375rem',
                color: 'var(--text-primary)'
              }}
            />
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem'
            }}>
              Azure deployment name (if different from model ID)
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              marginBottom: '0.25rem'
            }}>
              API Version
            </label>
            <input
              type="text"
              value={config.apiVersion || ''}
              onChange={handleApiVersionChange}
              placeholder="2025-01-01-preview"
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.875rem',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.375rem',
                color: 'var(--text-primary)'
              }}
            />
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem'
            }}>
              Azure OpenAI API version (default: 2025-01-01-preview)
            </p>
          </div>

          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'var(--info-bg, rgba(59, 130, 246, 0.1))',
            border: '1px solid var(--info-border, rgba(59, 130, 246, 0.3))',
            borderRadius: '0.375rem'
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--info-text, #3b82f6)',
              margin: 0
            }}>
              ℹ️ These settings are required for Azure OpenAI models (GPT-4o, GPT-4 Vision, etc.). 
              The credentials are stored locally and sent securely with your requests.
            </p>
          </div>

          {!isConfigured && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'var(--warning-bg, rgba(251, 146, 60, 0.1))',
              border: '1px solid var(--warning-border, rgba(251, 146, 60, 0.3))',
              borderRadius: '0.375rem'
            }}>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--warning-text, #fb923c)',
                margin: 0
              }}>
                ⚠️ Azure OpenAI models won't work without endpoint and API key configuration.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};