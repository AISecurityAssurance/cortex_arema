import { Finding } from './results';
import { OllamaConfig } from './config';

export interface Point {
  x: number;
  y: number;
}

export interface BaseNode {
  id: string;
  type: string;
  position: Point;
  selected?: boolean;
}

export interface ArchitectureDiagramNode extends BaseNode {
  type: "input-diagram";
  config: {
    file?: File;
    fileName?: string;
    uploadStatus: "empty" | "uploading" | "ready" | "error";
  };
  outputs: ["diagram_data"];
}

export interface TextInputNode extends BaseNode {
  type: "input-text";
  config: {
    systemName: string;
    description: string;
    context: string;
  };
  outputs: ["text_data"];
}

export interface StrideAnalysisNode extends BaseNode {
  type: "analysis-stride";
  config: {
    modelId: string;
    temperature: number;
    promptTemplate: string;
    systemDescription: string;
    ollamaConfig?: OllamaConfig;
  };
  inputs: ["diagram_data" | "text_data"];
  outputs: ["findings_data"];
  status: "idle" | "running" | "complete" | "error";
  executionTime?: number;
}

export interface StpaSecAnalysisNode extends BaseNode {
  type: "analysis-stpa-sec";
  config: {
    modelId: string;
    temperature: number;
    promptTemplate: string;
    systemDescription: string;
    ollamaConfig?: OllamaConfig;
  };
  inputs: ["diagram_data" | "text_data"];
  outputs: ["findings_data"];
  status: "idle" | "running" | "complete" | "error";
  executionTime?: number;
}

export interface ResultsViewNode extends BaseNode {
  type: "results-view";
  config: {
    displayMode: "summary" | "detailed";
    autoOpenValidation: boolean;
  };
  inputs: ["findings_data"];
  outputs: [];
}

export type PipelineNode =
  | ArchitectureDiagramNode
  | TextInputNode
  | StrideAnalysisNode
  | StpaSecAnalysisNode
  | ResultsViewNode;

export interface Connection {
  id: string;
  from: {
    nodeId: string;
    output: string;
  };
  to: {
    nodeId: string;
    input: string;
  };
  isValid?: boolean;
}

export interface Pipeline {
  id: string;
  name: string;
  nodes: PipelineNode[];
  connections: Connection[];
  createdAt: string;
  updatedAt: string;
}

export interface NodeCategory {
  name: string;
  icon: string;
  nodes: NodeTemplate[];
}

export interface NodeTemplate {
  type: string;
  name: string;
  description: string;
  icon: string;
}

export const NODE_CATEGORIES: NodeCategory[] = [
  {
    name: "Inputs",
    icon: "📁",
    nodes: [
      {
        type: "input-diagram",
        name: "Architecture Diagram",
        description: "Upload architecture diagram",
        icon: "📄",
      },
      {
        type: "input-text",
        name: "Text Input",
        description: "System description text",
        icon: "📝",
      },
    ],
  },
  {
    name: "Analysis",
    icon: "🔍",
    nodes: [
      {
        type: "analysis-stride",
        name: "STRIDE Analysis",
        description: "STRIDE threat modeling",
        icon: "🛡️",
      },
      {
        type: "analysis-stpa-sec",
        name: "STPA-SEC Analysis",
        description: "System-theoretic analysis",
        icon: "⚡",
      },
    ],
  },
];
