"use client";

import React, { useState } from 'react';
import { AnthropicConfig } from '@/types/modelProvider';

interface AnthropicConfigProps {
  config?: Partial<AnthropicConfig>;
  onChange: (config: AnthropicConfig) => void;
}

export const AnthropicConfigForm: React.FC<AnthropicConfigProps> = ({
  config = {},
  onChange
}) => {
  const [localConfig, setLocalConfig] = useState<Partial<AnthropicConfig>>({
    apiKey: config.apiKey || '',
    baseUrl: config.baseUrl || '',
    maxTokens: config.maxTokens || 4096
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleChange = (field: keyof AnthropicConfig, value: string | number) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    if (field === 'apiKey' && value) {
      onChange(updated as AnthropicConfig);
    }
  };

  const testConnection = async () => {
    if (!localConfig.apiKey) {
      setTestResult({ success: false, message: 'API key is required' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('http://localhost:8000/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'anthropic',
          config: localConfig
        })
      });

      if (response.ok) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        const error = await response.text();
        setTestResult({ success: false, message: error || 'Connection failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to connect to backend' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="provider-config-form">
      <div className="config-field">
        <label htmlFor="anthropic-key">API Key *</label>
        <input
          id="anthropic-key"
          type="password"
          placeholder="sk-ant-..."
          value={localConfig.apiKey || ''}
          onChange={(e) => handleChange('apiKey', e.target.value)}
        />
        <small>
          Get your API key from{' '}
          <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noopener noreferrer">
            Anthropic Console
          </a>
        </small>
      </div>

      <div className="config-field">
        <label htmlFor="anthropic-max-tokens">Max Tokens</label>
        <input
          id="anthropic-max-tokens"
          type="number"
          placeholder="4096"
          value={localConfig.maxTokens || ''}
          onChange={(e) => handleChange('maxTokens', parseInt(e.target.value) || 4096)}
        />
        <small>Maximum tokens to generate (default: 4096)</small>
      </div>

      <div className="config-field">
        <label htmlFor="anthropic-baseurl">Base URL (Optional)</label>
        <input
          id="anthropic-baseurl"
          type="text"
          placeholder="https://api.anthropic.com"
          value={localConfig.baseUrl || ''}
          onChange={(e) => handleChange('baseUrl', e.target.value)}
        />
        <small>Only change if using a proxy or custom endpoint</small>
      </div>

      <div className="config-test-section">
        <button
          className="test-connection-btn"
          onClick={testConnection}
          disabled={testing || !localConfig.apiKey}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        {testResult && (
          <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
            {testResult.message}
          </div>
        )}
      </div>
    </div>
  );
};