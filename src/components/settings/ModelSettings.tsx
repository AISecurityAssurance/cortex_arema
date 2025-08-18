"use client";

import React from 'react';
import { OllamaSettings } from './OllamaSettings';
import { AzureOpenAISettings } from './AzureOpenAISettings';

interface ModelSettingsProps {
  onOllamaConfigChange?: (config: any) => void;
  onAzureConfigChange?: (config: any) => void;
}

export const ModelSettings: React.FC<ModelSettingsProps> = ({ 
  onOllamaConfigChange,
  onAzureConfigChange 
}) => {
  return (
    <div className="model-settings" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '0.75rem' 
    }}>
      <OllamaSettings onConfigChange={onOllamaConfigChange} />
      <AzureOpenAISettings onConfigChange={onAzureConfigChange} />
    </div>
  );
};