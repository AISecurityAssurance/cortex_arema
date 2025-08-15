import { useState, useCallback, useEffect } from "react";
import { PipelineNode, Connection, Point } from "../types/pipeline";
import { useHistory } from "./useHistory";

interface PipelineState {
  nodes: PipelineNode[];
  connections: Connection[];
}

export function usePipeline() {
  const { state, setState, undo, redo, canUndo, canRedo } = useHistory<PipelineState>({
    nodes: [],
    connections: [],
  });
  
  const { nodes, connections } = state;
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  const generateNodeId = () =>
    `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const generateConnectionId = () =>
    `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const setNodes = useCallback((updater: (prev: PipelineNode[]) => PipelineNode[]) => {
    setState(prev => ({
      ...prev,
      nodes: updater(prev.nodes)
    }));
  }, [setState]);

  const setConnections = useCallback((updater: (prev: Connection[]) => Connection[]) => {
    setState(prev => ({
      ...prev,
      connections: updater(prev.connections)
    }));
  }, [setState]);

  const setBoth = useCallback((nodeUpdater: (prev: PipelineNode[]) => PipelineNode[], connUpdater: (prev: Connection[]) => Connection[]) => {
    setState(prev => ({
      nodes: nodeUpdater(prev.nodes),
      connections: connUpdater(prev.connections)
    }));
  }, [setState]);

  const addNode = useCallback((nodeType: string, position: Point) => {
    const nodeId = generateNodeId();
    let newNode: PipelineNode;

    switch (nodeType) {
      case "input-diagram":
        newNode = {
          id: nodeId,
          type: "input-diagram",
          position,
          config: {
            uploadStatus: "empty",
          },
          outputs: ["diagram_data"],
        } as any;
        break;

      case "input-text":
        newNode = {
          id: nodeId,
          type: "input-text",
          position,
          config: {
            systemName: "",
            description: "",
            context: "",
          },
          outputs: ["text_data"],
        } as any;
        break;

      case "analysis-stride":
        newNode = {
          id: nodeId,
          type: "analysis-stride",
          position,
          config: {
            modelId: "us.anthropic.claude-sonnet-4-20250514-v1:0",  // Changed to Sonnet for better performance
            temperature: 0.7,
            promptTemplate: "stride-default",
            systemDescription: "",
          },
          inputs: ["diagram_data"],
          outputs: ["findings_data"],
          status: "idle",
        } as any;
        break;

      case "analysis-stpa-sec":
        newNode = {
          id: nodeId,
          type: "analysis-stpa-sec",
          position,
          config: {
            modelId: "us.anthropic.claude-sonnet-4-20250514-v1:0",
            temperature: 0.7,
            promptTemplate: "stpa-sec-default",
            systemDescription: "",
          },
          inputs: ["diagram_data"],
          outputs: ["findings_data"],
          status: "idle",
        } as any;
        break;

      case "output-results":
        newNode = {
          id: nodeId,
          type: "output-results",
          position,
          config: {
            displayMode: "detailed",
            autoOpenValidation: true,
          },
          inputs: ["findings_data"],
        } as any;
        break;

      default:
        return;
    }

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeIds(new Set([nodeId]));
  }, []);

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<PipelineNode>) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId ? { ...node, ...updates } : node
        )
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setBoth(
        (prevNodes) => prevNodes.filter((node) => node.id !== nodeId),
        (prevConns) => prevConns.filter(
          (conn) => conn.from.nodeId !== nodeId && conn.to.nodeId !== nodeId
        )
      );
      setSelectedNodeIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
    },
    [setBoth]
  );

  const deleteSelectedNodes = useCallback(() => {
    const nodeIdsToDelete = Array.from(selectedNodeIds);
    setBoth(
      (prevNodes) => prevNodes.filter((node) => !nodeIdsToDelete.includes(node.id)),
      (prevConns) => prevConns.filter(
        (conn) => !nodeIdsToDelete.includes(conn.from.nodeId) && !nodeIdsToDelete.includes(conn.to.nodeId)
      )
    );
    setSelectedNodeIds(new Set());
  }, [selectedNodeIds, setBoth]);

  const selectNode = useCallback((nodeId: string | null, multiSelect?: boolean) => {
    if (!nodeId) {
      setSelectedNodeIds(new Set());
      return;
    }
    
    if (multiSelect) {
      setSelectedNodeIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(nodeId)) {
          newSet.delete(nodeId);
        } else {
          newSet.add(nodeId);
        }
        return newSet;
      });
    } else {
      setSelectedNodeIds(new Set([nodeId]));
    }
  }, []);

  const selectMultipleNodes = useCallback((nodeIds: string[]) => {
    setSelectedNodeIds(new Set(nodeIds));
  }, []);

  const selectAllNodes = useCallback(() => {
    setSelectedNodeIds(new Set(nodes.map(n => n.id)));
  }, [nodes]);

  const updateNodePosition = useCallback((nodeId: string, position: Point) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, position } : node))
    );
  }, [setNodes]);

  const updateMultipleNodePositions = useCallback((updates: Map<string, Point>) => {
    setNodes((prev) =>
      prev.map((node) => {
        const newPosition = updates.get(node.id);
        return newPosition ? { ...node, position: newPosition } : node;
      })
    );
  }, [setNodes]);

  const duplicateSelectedNodes = useCallback(() => {
    const nodesToDuplicate = nodes.filter(n => selectedNodeIds.has(n.id));
    const newNodes: PipelineNode[] = [];
    const idMap = new Map<string, string>();
    
    nodesToDuplicate.forEach(node => {
      const newId = generateNodeId();
      idMap.set(node.id, newId);
      newNodes.push({
        ...node,
        id: newId,
        position: { x: node.position.x + 50, y: node.position.y + 50 }
      });
    });
    
    setNodes(prev => [...prev, ...newNodes]);
    setSelectedNodeIds(new Set(newNodes.map(n => n.id)));
  }, [nodes, selectedNodeIds, setNodes]);

  const addConnection = useCallback(
    (
      from: { nodeId: string; output: string },
      to: { nodeId: string; input: string }
    ) => {
      const connectionId = generateConnectionId();
      const newConnection: Connection = {
        id: connectionId,
        from,
        to,
        isValid: validateConnection(from, to, nodes),
      };

      setConnections((prev) => {
        const existingToConnection = prev.find(
          (c) => c.to.nodeId === to.nodeId && c.to.input === to.input
        );
        if (existingToConnection) {
          return prev.map((c) =>
            c.id === existingToConnection.id ? newConnection : c
          );
        }
        return [...prev, newConnection];
      });
    },
    [nodes, setConnections]
  );

  const deleteConnection = useCallback((connectionId: string) => {
    setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));
    setSelectedConnectionId(null);
  }, [setConnections]);

  const selectConnection = useCallback((connectionId: string | null) => {
    setSelectedConnectionId(connectionId);
    if (connectionId) {
      setSelectedNodeIds(new Set());
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeIds(new Set());
    setSelectedConnectionId(null);
  }, []);

  // Handle keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return {
    nodes,
    connections,
    selectedNodeIds,
    selectedConnectionId,
    addNode,
    updateNode,
    deleteNode,
    deleteSelectedNodes,
    selectNode,
    selectMultipleNodes,
    selectAllNodes,
    duplicateSelectedNodes,
    addConnection,
    deleteConnection,
    selectConnection,
    updateNodePosition,
    updateMultipleNodePositions,
    clearSelection,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

function validateConnection(
  from: { nodeId: string; output: string },
  to: { nodeId: string; input: string },
  nodes: PipelineNode[]
): boolean {
  if (from.nodeId === to.nodeId) return false;

  const fromNode = nodes.find((n) => n.id === from.nodeId);
  const toNode = nodes.find((n) => n.id === to.nodeId);

  if (!fromNode || !toNode) return false;

  const outputType = from.output;
  const inputType = to.input;

  const validConnections: Record<string, string[]> = {
    diagram_data: ["diagram_data"],
    text_data: ["text_data"],
    findings_data: ["findings_data"],
  };

  return validConnections[outputType]?.includes(inputType) || false;
}
