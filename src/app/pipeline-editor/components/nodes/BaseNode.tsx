"use client";

import React from "react";
import { PipelineNode } from "../../types/pipeline";
import { NodeExecutionState } from "../../types/execution";

interface BaseNodeProps {
  node: PipelineNode;
  isSelected: boolean;
  executionState?: NodeExecutionState;
  isConnecting?: boolean;
  connectionStart?: { nodeId: string; output: string; position: any } | null;
  hoveredPort?: {
    nodeId: string;
    portType: "input" | "output";
    portName: string;
  } | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onPortMouseDown: (
    e: React.MouseEvent,
    nodeId: string,
    portType: "input" | "output",
    portName: string
  ) => void;
  onPortMouseUp: (
    e: React.MouseEvent,
    nodeId: string,
    portType: "input" | "output",
    portName: string
  ) => void;
  onPortMouseEnter: (
    nodeId: string,
    portType: "input" | "output",
    portName: string
  ) => void;
  onPortMouseLeave: () => void;
  onDelete: () => void;
  onViewResults?: () => void;
}

// Model display name mapping
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  // Bedrock Models
  "us.anthropic.claude-opus-4-20250514-v1:0": "Claude Opus",
  "us.anthropic.claude-sonnet-4-20250514-v1:0": "Claude Sonnet",
  "us.anthropic.claude-3-5-sonnet-20241022-v2:0": "Claude 3.5 Sonnet",
  "us.amazon.nova-pro-v1:0": "Nova Pro",
  "us.amazon.nova-lite-v1:0": "Nova Lite",
  "us.meta.llama3-2-11b-instruct-v1:0": "Llama 3.2 11B",
  "us.mistral.pixtral-large-2502-v1:0": "Pixtral Large",
  // Ollama Models
  "ollama:llava": "Llava",
  "ollama:llama3.2": "Llama 3.2",
  "ollama:llama3.2-vision": "Llama 3.2 Vision",
  "ollama:qwen2.5": "Qwen 2.5",
  // Azure OpenAI Models
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-4-vision-preview": "GPT-4 Vision",
  "gpt-4-turbo": "GPT-4 Turbo",
  "gpt-3.5-turbo": "GPT-3.5 Turbo",
  "o1-preview": "O1 Preview",
  "o1-mini": "O1 Mini",
};

// Helper function to get model display name
function getModelDisplayName(modelId: string | undefined): string {
  if (!modelId) return "Not selected";
  return MODEL_DISPLAY_NAMES[modelId] || modelId;
}

// Helper function to check if connection is valid
function isValidConnection(output: string, input: string): boolean {
  // Define valid connection types
  const validConnections: Record<string, string[]> = {
    'diagram_data': ['diagram_data'],
    'text_data': ['text_data', 'diagram_data'], // Text can connect to either
    'findings_data': ['findings_data'],
  };
  
  return validConnections[output]?.includes(input) || false;
}

export function BaseNode({
  node,
  isSelected,
  executionState,
  isConnecting,
  connectionStart,
  hoveredPort,
  onMouseDown,
  onDoubleClick,
  onPortMouseDown,
  onPortMouseUp,
  onPortMouseEnter,
  onPortMouseLeave,
  onDelete,
  onViewResults,
}: BaseNodeProps) {
  const getNodeTypeClass = () => {
    if (node.type.startsWith("input-")) return "input";
    if (node.type.startsWith("analysis-")) return "analysis";
    if (node.type.startsWith("output-")) return "output";
    return "";
  };

  const getNodeTitle = () => {
    const titles: Record<string, string> = {
      "input-diagram": "Architecture Diagram",
      "input-text": "Text Input",
      "analysis-stride": "STRIDE Analysis",
      "analysis-stpa-sec": "STPA-SEC Analysis",
    };
    return titles[node.type] || node.type;
  };

  const getNodeStatus = () => {
    if (executionState) {
      return executionState.status;
    }
    if ("status" in node) {
      return node.status;
    }
    return "idle";
  };

  const getNodeDescription = () => {
    switch (node.type) {
      case "input-diagram":
        const hasFile = (node as any).config.file || (node as any).config.fileName;
        return (
          <>
            <div>{(node as any).config.fileName || "No file uploaded"}</div>
            {!hasFile && (
              <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                ⚠️ Diagram upload required
              </div>
            )}
          </>
        );
      case "input-text":
        return (node as any).config.systemName || "No system name";
      case "analysis-stride":
      case "analysis-stpa-sec":
        const modelId = (node as any).config.modelId;
        const modelName = getModelDisplayName(modelId);
        const hasSystemDesc = (node as any).config.systemDescription && 
                              (node as any).config.systemDescription.trim() !== '';
        return (
          <>
            <div>Model: {modelName}</div>
            {!hasSystemDesc && (
              <div style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                ⚠️ System description required
              </div>
            )}
          </>
        );
      default:
        return "";
    }
  };

  const nodeTypeClass = getNodeTypeClass();
  const nodeStatus = getNodeStatus();

  return (
    <div
      className={`pipeline-node ${isSelected ? "selected" : ""} ${nodeStatus}`}
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      <div className={`node-header ${nodeTypeClass}`}>
        <span className="node-title">{getNodeTitle()}</span>
        <button
          className="node-config-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDoubleClick?.(e);
          }}
        >
          ⚙
        </button>
      </div>

      <div className="node-body">
        <div>{getNodeDescription()}</div>
        {executionState && executionState.status === "waiting" && (
          <div
            className="node-status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "rgba(59, 130, 246, 0.8)",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "currentColor",
                opacity: 0.5,
              }}
            />
            <span>Waiting...</span>
          </div>
        )}
        {executionState && executionState.status === "running" && (
          <>
            <div
              className="node-status"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "0.25rem",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#3b82f6",
                    animation: "pulse 1.4s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#3b82f6",
                    animation: "pulse 1.4s ease-in-out 0.2s infinite",
                  }}
                />
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#3b82f6",
                    animation: "pulse 1.4s ease-in-out 0.4s infinite",
                  }}
                />
              </div>
              <span>Processing...</span>
            </div>
            <style jsx>{`
              @keyframes pulse {
                0%,
                60%,
                100% {
                  opacity: 0.3;
                  transform: scale(0.8);
                }
                30% {
                  opacity: 1;
                  transform: scale(1.2);
                }
              }
            `}</style>
          </>
        )}
        {executionState && executionState.status === "complete" && (
          <>
            <div className="node-status">Complete</div>
            {executionState.results && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewResults?.();
                }}
                style={{
                  marginTop: "0.5rem",
                  padding: "0.25rem 0.5rem",
                  background: "#10b981",
                  border: "none",
                  borderRadius: "0.25rem",
                  color: "white",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                View Results
              </button>
            )}
          </>
        )}
        {executionState && executionState.status === "error" && (
          <div className="node-status">Error: {executionState.error}</div>
        )}
      </div>

      <div className="node-ports">
        {"inputs" in node && (
          <div
            className={`port input ${
              isConnecting &&
              connectionStart &&
              connectionStart.nodeId !== node.id &&
              isValidConnection(connectionStart.output, (node as any).inputs[0])
                ? "valid-target"
                : isConnecting && connectionStart && connectionStart.nodeId !== node.id
                ? "invalid-target"
                : ""
            } ${
              hoveredPort?.nodeId === node.id &&
              hoveredPort?.portType === "input"
                ? "hovered"
                : ""
            }`}
            onMouseDown={(e) =>
              onPortMouseDown(e, node.id, "input", (node as any).inputs[0])
            }
            onMouseUp={(e) =>
              onPortMouseUp(e, node.id, "input", (node as any).inputs[0])
            }
            onMouseEnter={() =>
              onPortMouseEnter(node.id, "input", (node as any).inputs[0])
            }
            onMouseLeave={onPortMouseLeave}
            title="Drag from an output port to connect here"
          />
        )}
        {"outputs" in node && (
          <div
            className={`port output ${
              hoveredPort?.nodeId === node.id &&
              hoveredPort?.portType === "output"
                ? "hovered"
                : ""
            }`}
            onMouseDown={(e) =>
              onPortMouseDown(e, node.id, "output", (node as any).outputs[0])
            }
            onMouseUp={(e) =>
              onPortMouseUp(e, node.id, "output", (node as any).outputs[0])
            }
            onMouseEnter={() =>
              onPortMouseEnter(node.id, "output", (node as any).outputs[0])
            }
            onMouseLeave={onPortMouseLeave}
            title="Drag to an input port to connect"
          />
        )}
      </div>
    </div>
  );
}
