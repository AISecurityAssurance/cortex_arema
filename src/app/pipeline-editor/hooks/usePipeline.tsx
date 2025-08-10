import { useState, useCallback } from "react";
import { PipelineNode, Connection, Point } from "../types/pipeline";

export function usePipeline() {
  const [nodes, setNodes] = useState<PipelineNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const generateNodeId = () =>
    `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const generateConnectionId = () =>
    `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    setSelectedNodeId(nodeId);
  }, []);

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<PipelineNode>) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId ? { ...node, ...updates } : node
        )
      );
    },
    []
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((node) => node.id !== nodeId));
      setConnections((prev) =>
        prev.filter(
          (conn) => conn.from.nodeId !== nodeId && conn.to.nodeId !== nodeId
        )
      );
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    },
    [selectedNodeId]
  );

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const updateNodePosition = useCallback((nodeId: string, position: Point) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, position } : node))
    );
  }, []);

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
    [nodes]
  );

  const deleteConnection = useCallback((connectionId: string) => {
    setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return {
    nodes,
    connections,
    selectedNodeId,
    addNode,
    updateNode,
    deleteNode,
    selectNode,
    addConnection,
    deleteConnection,
    updateNodePosition,
    clearSelection,
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
