// Node configuration types

export interface DiagramNodeConfig {
  file?: File;
  fileName?: string;
  uploadStatus: "empty" | "uploading" | "ready" | "error";
}

export interface TextNodeConfig {
  systemName: string;
  description: string;
  context: string;
}

export interface AnalysisNodeConfig {
  modelId: string;
  temperature: number;
  promptTemplate: string;
  systemDescription: string;
}

export interface ResultsNodeConfig {
  displayMode: "summary" | "detailed";
  autoOpenValidation: boolean;
}

export type NodeConfig = 
  | DiagramNodeConfig 
  | TextNodeConfig 
  | AnalysisNodeConfig 
  | ResultsNodeConfig;