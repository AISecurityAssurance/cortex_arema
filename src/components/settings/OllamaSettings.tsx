"use client";

import React, { useState, useEffect } from 'react';
import { Switch } from '../ui/Switch';

interface OllamaConfig {
  mode: 'local' | 'remote';
  remoteIp?: string;
  privateKeyPath?: string;
}

interface OllamaSettingsProps {
  onConfigChange?: (config: OllamaConfig) => void;
}

export const OllamaSettings: React.FC<OllamaSettingsProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<OllamaConfig>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ollama_config');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Ignore parse errors
        }
      }
    }
    return { mode: 'local' };
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('ollama_config', JSON.stringify(config));
    }
    // Notify parent of changes
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  const handleModeChange = (checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      mode: checked ? 'remote' : 'local'
    }));
  };

  const handleRemoteIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      remoteIp: e.target.value
    }));
  };

  const handleKeyPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      privateKeyPath: e.target.value
    }));
  };

  return (
    <div className="ollama-settings">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="ollama-settings-toggle"
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
        Ollama Configuration (Optional)
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
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              fontSize: '0.875rem',
              color: 'var(--text-primary)'
            }}>
              <span>Local Mode</span>
              <Switch
                checked={config.mode === 'remote'}
                onChange={handleModeChange}
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
                : 'Ollama will run on a remote instance via SSH'}
            </p>
          </div>

          {config.mode === 'remote' && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  marginBottom: '0.25rem'
                }}>
                  Remote IP Address
                </label>
                <input
                  type="text"
                  value={config.remoteIp || ''}
                  onChange={handleRemoteIpChange}
                  placeholder="e.g., 192.168.1.100"
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
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  marginBottom: '0.25rem'
                }}>
                  SSH Private Key Path
                </label>
                <input
                  type="text"
                  value={config.privateKeyPath || ''}
                  onChange={handleKeyPathChange}
                  placeholder="e.g., ~/.ssh/id_rsa"
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
                  Path to your SSH private key for connecting to the remote instance
                </p>
              </div>
            </>
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
              margin: 0
            }}>
              ℹ️ These settings are only used when selecting Ollama models. They will be passed to the backend API along with your analysis request.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};