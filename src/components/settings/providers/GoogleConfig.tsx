"use client";

import React, { useState } from 'react';
import { GoogleConfig } from '@/types/modelProvider';

interface GoogleConfigProps {
  config?: Partial<GoogleConfig>;
  onChange: (config: GoogleConfig) => void;
}

export const GoogleConfigForm: React.FC<GoogleConfigProps> = ({
  config = {},
  onChange
}) => {
  const [localConfig, setLocalConfig] = useState<Partial<GoogleConfig>>({
    apiKey: config.apiKey || ''
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleChange = (field: keyof GoogleConfig, value: string) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    if (field === 'apiKey' && value) {
      onChange(updated as GoogleConfig);
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
          provider: 'google',
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
        <label htmlFor="google-key">API Key *</label>
        <input
          id="google-key"
          type="password"
          placeholder="AIza..."
          value={localConfig.apiKey || ''}
          onChange={(e) => handleChange('apiKey', e.target.value)}
        />
        <small>
          Get your API key from{' '}
          <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
            Google AI Studio
          </a>
        </small>
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