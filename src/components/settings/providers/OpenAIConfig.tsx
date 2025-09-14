"use client";

import React, { useState } from 'react';
import { OpenAIConfig } from '@/types/modelProvider';

interface OpenAIConfigProps {
  config?: Partial<OpenAIConfig>;
  onChange: (config: OpenAIConfig) => void;
}

export const OpenAIConfigForm: React.FC<OpenAIConfigProps> = ({
  config = {},
  onChange
}) => {
  const [localConfig, setLocalConfig] = useState<Partial<OpenAIConfig>>({
    apiKey: config.apiKey || '',
    organization: config.organization || '',
    baseUrl: config.baseUrl || ''
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleChange = (field: keyof OpenAIConfig, value: string) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    if (field === 'apiKey' && value) {
      onChange(updated as OpenAIConfig);
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
      // Test the API key by making a simple request
      const response = await fetch('http://localhost:8000/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'openai',
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
        <label htmlFor="openai-key">API Key *</label>
        <input
          id="openai-key"
          type="password"
          placeholder="sk-..."
          value={localConfig.apiKey || ''}
          onChange={(e) => handleChange('apiKey', e.target.value)}
        />
        <small>
          Get your API key from{' '}
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
            OpenAI Platform
          </a>
        </small>
      </div>

      <div className="config-field">
        <label htmlFor="openai-org">Organization ID (Optional)</label>
        <input
          id="openai-org"
          type="text"
          placeholder="org-..."
          value={localConfig.organization || ''}
          onChange={(e) => handleChange('organization', e.target.value)}
        />
        <small>Required for some enterprise accounts</small>
      </div>

      <div className="config-field">
        <label htmlFor="openai-baseurl">Base URL (Optional)</label>
        <input
          id="openai-baseurl"
          type="text"
          placeholder="https://api.openai.com/v1"
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