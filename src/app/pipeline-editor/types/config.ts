// Configuration types for nodes

export interface OllamaConfig {
  mode: 'local' | 'remote';
  remoteIp?: string;
  privateKeyPath?: string;
  model?: string;
  temperature?: number;
}

export interface AzureConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion?: string;
}

export interface ModelConfig {
  provider: 'bedrock' | 'ollama' | 'azure';
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  ollamaConfig?: OllamaConfig;
  azureConfig?: AzureConfig;
}