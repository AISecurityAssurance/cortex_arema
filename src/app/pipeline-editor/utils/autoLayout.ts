import dagre from 'dagre';
import { PipelineNode, Connection } from '../types/pipeline';

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  nodeSpacingX?: number;
  nodeSpacingY?: number;
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  nodeWidth: 200,
  nodeHeight: 120,
  nodeSpacingX: 120,  // Increased horizontal spacing for better visual flow
  nodeSpacingY: 100,  // Increased vertical spacing
  direction: 'LR', // Left to Right for pipeline flow
};

export function autoLayoutNodes(
  nodes: PipelineNode[],
  connections: Connection[],
  options: LayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();
  
  // Set graph properties
  g.setGraph({
    rankdir: config.direction,
    nodesep: config.nodeSpacingX,
    ranksep: config.nodeSpacingY,
    marginx: 50,
    marginy: 50,
  });
  
  // Default to {} for node and edge labels
  g.setDefaultEdgeLabel(() => ({}));
  
  // Add nodes to the graph
  nodes.forEach(node => {
    g.setNode(node.id, {
      width: config.nodeWidth,
      height: config.nodeHeight,
    });
  });
  
  // Add edges (connections) to the graph
  connections.forEach(connection => {
    // Only add valid connections
    if (nodes.some(n => n.id === connection.from.nodeId) &&
        nodes.some(n => n.id === connection.to.nodeId)) {
      g.setEdge(connection.from.nodeId, connection.to.nodeId);
    }
  });
  
  // Run the layout algorithm
  dagre.layout(g);
  
  // Extract the new positions
  const newPositions = new Map<string, { x: number; y: number }>();
  
  nodes.forEach(node => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      // Dagre positions nodes at their center, so adjust to top-left
      newPositions.set(node.id, {
        x: Math.round(dagreNode.x - config.nodeWidth / 2),
        y: Math.round(dagreNode.y - config.nodeHeight / 2),
      });
    }
  });
  
  return newPositions;
}

export function categorizeNodes(nodes: PipelineNode[]) {
  const inputNodes = nodes.filter(n => n.type.startsWith('input-'));
  const analysisNodes = nodes.filter(n => n.type.startsWith('analysis-'));
  const outputNodes = nodes.filter(n => n.type.startsWith('output-'));
  
  return { inputNodes, analysisNodes, outputNodes };
}

export function suggestLayoutDirection(nodes: PipelineNode[], connections: Connection[]): 'LR' | 'TB' {
  const { inputNodes, analysisNodes, outputNodes } = categorizeNodes(nodes);
  
  // For small node counts (2-5), prefer horizontal layout
  if (nodes.length <= 5) {
    return 'LR';
  }
  
  // If we have a clear pipeline flow (input -> analysis -> output), use left-to-right
  if (inputNodes.length > 0 || analysisNodes.length > 0 || outputNodes.length > 0) {
    return 'LR';
  }
  
  // Check if connections suggest a directional flow
  // If most connections flow in one direction, use horizontal
  if (connections.length > 0) {
    return 'LR';
  }
  
  // For large graphs without clear structure, use top-to-bottom
  return nodes.length > 10 ? 'TB' : 'LR';
}