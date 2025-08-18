"use client";

import React, { useState, useEffect } from 'react';
import { Switch } from '../ui/Switch';

interface OllamaConfig {
  mode: 'local' | 'remote';
  private_key_path?: string;
}

interface OllamaSettingsProps {
  onConfigChange?: (config: OllamaConfig) => void;
}

export const OllamaSettings: React.FC<OllamaSettingsProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<OllamaConfig>({ mode: 'local' });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load config from localStorage after hydration
  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== 'undefined') {
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
    // Only save to localStorage and notify parent after hydration
    if (isHydrated) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ollama_config', JSON.stringify(config));
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

              <div style={{
                padding: '0.75rem',
                background: 'var(--info-bg, rgba(59, 130, 246, 0.1))',
                border: '1px solid var(--info-border, rgba(59, 130, 246, 0.3))',
                borderRadius: '0.375rem',
                marginTop: '0.75rem'
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--info-text, #3b82f6)',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  <strong>Remote Infrastructure Setup:</strong><br/>
                  1. First deploy: <code style={{ fontSize: '0.7rem' }}>python agr.py tf-deploy --pem-path [your-key]</code><br/>
                  2. Enter the same key path above<br/>
                  3. When done: <code style={{ fontSize: '0.7rem' }}>python agr.py tf-destroy</code>
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
              ℹ️ These settings control where Ollama models execute. Remote mode automatically provisions EC2 infrastructure on-demand.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};