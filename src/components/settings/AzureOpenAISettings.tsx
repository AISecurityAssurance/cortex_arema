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
  const [isHydrated, setIsHydrated] = useState(false);
  const [config, setConfig] = useState<AzureOpenAIConfig>(() => {
    // Load from sessionStorage if available (consistent with other providers)
    if (typeof window !== 'undefined') {
      const savedKeys = sessionStorage.getItem('byom_api_keys');
      if (savedKeys) {
        try {
          const parsed = JSON.parse(savedKeys);
          if (parsed.azure) {
            return parsed.azure;
          }
        } catch {
          // Ignore parse errors
        }
      }

      // Fall back to localStorage for backward compatibility
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

  const [showApiKey, setShowApiKey] = useState(false);

  // Mark component as hydrated
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Save to both localStorage (for backward compatibility) and sessionStorage (for consistency)
    if (typeof window !== 'undefined' && isHydrated) {
      // Save to localStorage for backward compatibility
      localStorage.setItem('azure_openai_config', JSON.stringify(config));

      // Also save to sessionStorage under byom_api_keys for consistency
      const savedKeys = sessionStorage.getItem('byom_api_keys') || '{}';
      try {
        const parsed = JSON.parse(savedKeys);
        parsed.azure = config;
        sessionStorage.setItem('byom_api_keys', JSON.stringify(parsed));
      } catch {
        // If parse fails, create new
        sessionStorage.setItem('byom_api_keys', JSON.stringify({ azure: config }));
      }
    }
  }, [config]);

  // Separate effect for notifying parent to avoid circular dependencies
  useEffect(() => {
    if (isHydrated) {
      onConfigChange?.(config);
    }
  }, [config, onConfigChange, isHydrated]);

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
      <div style={{
        padding: '1rem',
        background: 'var(--panel-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '0.375rem'
      }}>
        {isConfigured && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.25rem 0.5rem',
            background: 'var(--success-bg, rgba(34, 197, 94, 0.1))',
            color: 'var(--success-text, #22c55e)',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            display: 'inline-block'
          }}>
            ✓ Configured
          </div>
        )}

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
              placeholder="Enter your API key"
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
                fontSize: '0.75rem',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '0.25rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
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
            Found in Azure Portal → Your Resource → Keys and Endpoint
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            marginBottom: '0.25rem'
          }}>
            Deployment Name
          </label>
          <input
            type="text"
            value={config.deployment || ''}
            onChange={handleDeploymentChange}
            placeholder="gpt-4o"
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
            Optional: Specific deployment name (defaults to model ID)
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
            API version to use (default: 2025-01-01-preview)
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
            margin: 0,
            lineHeight: '1.4'
          }}>
            <strong>Setup Instructions:</strong><br/>
            1. Create an Azure OpenAI resource in Azure Portal<br/>
            2. Deploy your desired model (e.g., gpt-4o)<br/>
            3. Copy the endpoint URL and API key from the resource<br/>
            4. Enter them above to enable Azure OpenAI models
          </p>
        </div>
      </div>
    </div>
  );
};