"use client";

import React, { useState, useEffect } from 'react';
import { Switch } from '../ui/Switch';

interface OllamaConfig {
  mode: 'local' | 'remote';
  baseUrl?: string;
  private_key_path?: string;
}

interface OllamaSettingsProps {
  onConfigChange?: (config: OllamaConfig) => void;
}

export const OllamaSettings: React.FC<OllamaSettingsProps> = ({ onConfigChange }) => {
  const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
  const [config, setConfig] = useState<OllamaConfig>({
    mode: 'local',
    baseUrl: DEFAULT_OLLAMA_URL
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  // Load config from sessionStorage after hydration
  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== 'undefined') {
      // Load from sessionStorage first (consistent with other providers)
      const savedKeys = sessionStorage.getItem('byom_api_keys');
      if (savedKeys) {
        try {
          const parsed = JSON.parse(savedKeys);
          if (parsed.ollama) {
            setConfig(parsed.ollama);
            return;
          }
        } catch {
          // Ignore parse errors
        }
      }

      // Fall back to localStorage for backward compatibility
      const saved = localStorage.getItem('ollama_config');
      if (saved) {
        try {
          const savedConfig = JSON.parse(saved);
          setConfig(savedConfig);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  useEffect(() => {
    // Only save and notify parent after hydration
    if (isHydrated) {
      if (typeof window !== 'undefined') {
        // Save to localStorage for backward compatibility
        localStorage.setItem('ollama_config', JSON.stringify(config));

        // Also save to sessionStorage under byom_api_keys for consistency
        const savedKeys = sessionStorage.getItem('byom_api_keys') || '{}';
        try {
          const parsed = JSON.parse(savedKeys);
          parsed.ollama = config;
          sessionStorage.setItem('byom_api_keys', JSON.stringify(parsed));
        } catch {
          // If parse fails, create new
          sessionStorage.setItem('byom_api_keys', JSON.stringify({ ollama: config }));
        }
      }
      // Notify parent of changes
      onConfigChange?.(config);
    }
  }, [config, onConfigChange, isHydrated]);

  const handleModeChange = (checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      mode: checked ? 'remote' : 'local'
    }));
  };

  const handleKeyPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      private_key_path: e.target.value
    }));
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      baseUrl: e.target.value || DEFAULT_OLLAMA_URL
    }));
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('http://localhost:8000/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'ollama',
          config: {
            mode: config.mode,
            ollama_host: config.baseUrl || DEFAULT_OLLAMA_URL,
            private_key_path: config.private_key_path
          }
        })
      });

      if (response.ok) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        const error = await response.text();
        setTestResult({ success: false, message: error || 'Connection failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to connect to backend. Ensure the backend is running on port 8000.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="ollama-settings">
      <div style={{
        padding: '1rem',
        background: 'var(--panel-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '0.375rem'
      }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              fontSize: '0.875rem',
              color: 'var(--text-primary)'
            }}>
              <span>Local Mode</span>
              <Switch
                checked={config.mode === 'remote'}
                onCheckedChange={handleModeChange}
                disabled={!isHydrated}
              />
              <span>Remote Mode</span>
            </label>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem'
            }}>
              {config.mode === 'local' 
                ? 'Ollama will run on your local machine (requires Ollama installed locally)'
                : 'Ollama will run on a remote EC2 instance (infrastructure deployed on-demand)'}
            </p>
          </div>

          {config.mode === 'local' && (
            <div style={{ marginTop: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                marginBottom: '0.25rem'
              }}>
                Ollama Server URL
              </label>
              <input
                type="text"
                value={config.baseUrl || ''}
                onChange={handleUrlChange}
                placeholder={DEFAULT_OLLAMA_URL}
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
                Default: {DEFAULT_OLLAMA_URL}. Change if using a different port.
              </p>
            </div>
          )}

          {config.mode === 'remote' && (
            <>
              <div style={{ marginTop: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  marginBottom: '0.25rem'
                }}>
                  SSH Private Key Path <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={config.private_key_path || ''}
                  onChange={handleKeyPathChange}
                  placeholder="e.g., ~/.ssh/id_rsa or ~/.ssh/your-key.pem"
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
                  Path to your SSH private key for connecting to the remote EC2 instance
                </p>
              </div>
            </>
          )}

          {config.mode === 'local' && (
            <div style={{
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={testConnection}
                disabled={testing}
                style={{
                  padding: '0.5rem 1rem',
                  background: testing ? 'var(--button-disabled-bg)' : 'var(--button-primary-bg, #3b82f6)',
                  color: 'var(--button-primary-text, white)',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: testing ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              {testResult && (
                <span style={{
                  fontSize: '0.875rem',
                  color: testResult.success ? 'var(--success-color, #10b981)' : 'var(--error-color, #ef4444)'
                }}>
                  {testResult.message}
                </span>
              )}
            </div>
          )}

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
              {config.mode === 'local' ? (
                <>
                  1. Install Ollama: <code style={{ fontSize: '0.7rem' }}>curl -fsSL https://ollama.com/install.sh | sh</code><br/>
                  2. Pull models: <code style={{ fontSize: '0.7rem' }}>ollama pull llama3.2</code> or <code style={{ fontSize: '0.7rem' }}>ollama pull llava</code><br/>
                  3. Ollama automatically starts on port 11434<br/>
                  4. Click "Test Connection" above to verify setup
                </>
              ) : (
                <>
                  1. Deploy infrastructure: <code style={{ fontSize: '0.7rem' }}>python agr.py tf-deploy --pem-path [your-key]</code><br/>
                  2. Enter the SSH key path above (same key used in deployment)<br/>
                  3. The remote Ollama server URL will be configured automatically<br/>
                  4. When done: <code style={{ fontSize: '0.7rem' }}>python agr.py tf-destroy</code>
                </>
              )}
            </p>
          </div>
      </div>
    </div>
  );
};