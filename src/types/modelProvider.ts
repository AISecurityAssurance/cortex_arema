export type ModelProvider =
  | 'bedrock'      // AWS Bedrock (pre-configured)
  | 'ollama'       // Local Ollama
  | 'azure'        // Azure OpenAI
  | 'openai'       // OpenAI API
  | 'anthropic'    // Anthropic API
  | 'google'       // Google AI (Gemini)
  | 'cohere'       // Cohere API
  | 'mistral';     // Mistral AI

export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  requiresApiKey: boolean;
  supportsVision?: boolean;
  maxTokens?: number;
  costPer1kTokens?: {
    input: number;
    output: number;
  };
}

export interface ProviderConfig {
  provider: ModelProvider;
  displayName: string;
  requiresApiKey: boolean;
  configurable: boolean;
  settings?: Record<string, unknown>;
}

export interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;
  organization?: string;
  model?: string;
}

export interface AnthropicConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
}

export interface GoogleConfig {
  apiKey: string;
  model?: string;
}

export interface CohereConfig {
  apiKey: string;
  model?: string;
}

export interface MistralConfig {
  apiKey: string;
  model?: string;
}

export interface OllamaConfig {
  mode: 'local' | 'remote';
  baseUrl?: string;
  remoteIp?: string;
  privateKeyPath?: string;
  model?: string;
}

export interface AzureOpenAIConfig {
  endpoint?: string;
  apiKey?: string;
  deployment?: string;
  apiVersion?: string;
}

export type ProviderSettings =
  | { provider: 'openai'; config: OpenAIConfig }
  | { provider: 'anthropic'; config: AnthropicConfig }
  | { provider: 'google'; config: GoogleConfig }
  | { provider: 'cohere'; config: CohereConfig }
  | { provider: 'mistral'; config: MistralConfig }
  | { provider: 'ollama'; config: OllamaConfig }
  | { provider: 'azure'; config: AzureOpenAIConfig }
  | { provider: 'bedrock'; config: Record<string, never> };

export const PROVIDER_CONFIGS: Record<ModelProvider, ProviderConfig> = {
  bedrock: {
    provider: 'bedrock',
    displayName: 'AWS Bedrock',
    requiresApiKey: false,
    configurable: false,
  },
  ollama: {
    provider: 'ollama',
    displayName: 'Ollama (Local/Remote)',
    requiresApiKey: false,
    configurable: true,
  },
  azure: {
    provider: 'azure',
    displayName: 'Azure OpenAI',
    requiresApiKey: true,
    configurable: true,
  },
  openai: {
    provider: 'openai',
    displayName: 'OpenAI',
    requiresApiKey: true,
    configurable: true,
  },
  anthropic: {
    provider: 'anthropic',
    displayName: 'Anthropic',
    requiresApiKey: true,
    configurable: true,
  },
  google: {
    provider: 'google',
    displayName: 'Google AI (Gemini)',
    requiresApiKey: true,
    configurable: true,
  },
  cohere: {
    provider: 'cohere',
    displayName: 'Cohere',
    requiresApiKey: true,
    configurable: true,
  },
  mistral: {
    provider: 'mistral',
    displayName: 'Mistral AI',
    requiresApiKey: true,
    configurable: true,
  },
};

export const MODEL_CATALOG: ModelConfig[] = [
  // AWS Bedrock Models
  { id: 'us.anthropic.claude-opus-4-20250514-v1:0', name: 'Claude Opus 4', provider: 'bedrock', requiresApiKey: false, supportsVision: true },
  { id: 'us.anthropic.claude-sonnet-4-20250514-v1:0', name: 'Claude Sonnet 4', provider: 'bedrock', requiresApiKey: false, supportsVision: true },
  { id: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0', name: 'Claude 3.5 Sonnet', provider: 'bedrock', requiresApiKey: false, supportsVision: true },
  { id: 'us.amazon.nova-pro-v1:0', name: 'Nova Pro', provider: 'bedrock', requiresApiKey: false },
  { id: 'us.amazon.nova-lite-v1:0', name: 'Nova Lite', provider: 'bedrock', requiresApiKey: false },
  { id: 'us.meta.llama3-2-11b-instruct-v1:0', name: 'Llama 3.2 11B', provider: 'bedrock', requiresApiKey: false },
  { id: 'us.mistral.pixtral-large-2502-v1:0', name: 'Pixtral Large', provider: 'bedrock', requiresApiKey: false, supportsVision: true },

  // OpenAI Models
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', requiresApiKey: true, supportsVision: true, maxTokens: 128000 },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', requiresApiKey: true, supportsVision: true, maxTokens: 128000 },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', requiresApiKey: true, supportsVision: true, maxTokens: 128000 },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', requiresApiKey: true, maxTokens: 16384 },
  { id: 'o1-preview', name: 'O1 Preview', provider: 'openai', requiresApiKey: true, maxTokens: 128000 },
  { id: 'o1-mini', name: 'O1 Mini', provider: 'openai', requiresApiKey: true, maxTokens: 128000 },

  // Anthropic Models
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', provider: 'anthropic', requiresApiKey: true, supportsVision: true, maxTokens: 200000 },
  { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', provider: 'anthropic', requiresApiKey: true, supportsVision: true, maxTokens: 200000 },
  { id: 'claude-3-opus-latest', name: 'Claude 3 Opus', provider: 'anthropic', requiresApiKey: true, supportsVision: true, maxTokens: 200000 },

  // Google Models
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'google', requiresApiKey: true, supportsVision: true },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', requiresApiKey: true, supportsVision: true },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', requiresApiKey: true, supportsVision: true },

  // Cohere Models
  { id: 'command-r-plus', name: 'Command R+', provider: 'cohere', requiresApiKey: true, maxTokens: 128000 },
  { id: 'command-r', name: 'Command R', provider: 'cohere', requiresApiKey: true, maxTokens: 128000 },

  // Mistral Models
  { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'mistral', requiresApiKey: true, maxTokens: 128000 },
  { id: 'mistral-medium-latest', name: 'Mistral Medium', provider: 'mistral', requiresApiKey: true, maxTokens: 32000 },
  { id: 'pixtral-12b-latest', name: 'Pixtral 12B', provider: 'mistral', requiresApiKey: true, supportsVision: true },

  // Ollama Models (dynamic, will be populated from Ollama)
  { id: 'ollama:llava', name: 'Llava', provider: 'ollama', requiresApiKey: false, supportsVision: true },
  { id: 'ollama:llama3.2', name: 'Llama 3.2', provider: 'ollama', requiresApiKey: false },
  { id: 'ollama:llama3.2-vision', name: 'Llama 3.2 Vision', provider: 'ollama', requiresApiKey: false, supportsVision: true },
  { id: 'ollama:qwen2.5', name: 'Qwen 2.5', provider: 'ollama', requiresApiKey: false },

  // Azure OpenAI Models (configured deployments)
  { id: 'azure:gpt-4o', name: 'GPT-4o (Azure)', provider: 'azure', requiresApiKey: true, supportsVision: true },
  { id: 'azure:gpt-4o-mini', name: 'GPT-4o Mini (Azure)', provider: 'azure', requiresApiKey: true, supportsVision: true },
  { id: 'azure:gpt-4-vision', name: 'GPT-4 Vision (Azure)', provider: 'azure', requiresApiKey: true, supportsVision: true },
  { id: 'azure:gpt-4-turbo', name: 'GPT-4 Turbo (Azure)', provider: 'azure', requiresApiKey: true },
];