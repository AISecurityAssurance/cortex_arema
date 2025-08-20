// Result types for pipeline execution

export interface DiagramResult {
  type: 'diagram';
  data: {
    base64Image: string;
    fileName?: string;
    mimeType?: string;
    analysis?: string;
  };
}

export interface TextResult {
  type: 'text';
  data: {
    systemName: string;
    description: string;
    context?: string;
  };
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  confidence?: number;
  impact?: string;
  mitigations?: string[];
  references?: string[];
  cweId?: string;
}

export interface FindingsResult {
  type: 'findings';
  data: Finding[];
  rawResponse?: string;
  modelId?: string;
  timestamp?: string;
}

export type NodeResult = DiagramResult | TextResult | FindingsResult;

export interface ExecutionResultData {
  nodeId: string;
  success: boolean;
  data?: NodeResult;
  error?: string;
  duration: number;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  confidence?: number;
}