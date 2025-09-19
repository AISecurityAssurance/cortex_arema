// Simplified node structure for Mermaid-based trees
export interface AttackTreeNode {
  id: string;
  label: string;
  metadata?: Record<string, any>;
}

export interface AttackTreeData {
  id: string;
  name: string;
  systemDescription: string;
  root: AttackTreeNode;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    appType?: string;
    authentication?: string[];
    internetFacing?: boolean;
    sensitiveData?: boolean;
    analysisType?: 'STRIDE' | 'ATTACK_TREE' | 'CUSTOM';
    renderMode?: 'mermaid' | 'custom';
  };
}

export interface AttackTreeSession {
  id: string;
  treeData: AttackTreeData;
  selectedNodeId?: string;
  expandedNodes: string[];
  viewSettings: {
    zoom: number;
    panX: number;
    panY: number;
    layoutMode: 'horizontal' | 'vertical' | 'radial';
    showLabels: boolean;
    showMetrics: boolean;
  };
}

export interface AttackTreeGenerationParams {
  systemDescription: string;
  appType?: string;
  authentication?: string[];
  internetFacing?: boolean;
  sensitiveData?: boolean;
  customPrompt?: string;
  modelId?: string;
}

