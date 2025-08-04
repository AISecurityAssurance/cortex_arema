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

export function BaseNode({
  node,
  isSelected,
  executionState,
  isConnecting,
  connectionStart,
  hoveredPort,
  onMouseDown,
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
      "output-results": "Results View",
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
        return (node as any).config.fileName || "No file uploaded";
      case "input-text":
        return (node as any).config.systemName || "No system name";
      case "analysis-stride":
      case "analysis-stpa-sec":
        return `Model: ${
          (node as any).config.modelId?.split(".")[2] || "Not selected"
        }`;
      case "output-results":
        return `Mode: ${(node as any).config.displayMode}`;
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
    >
      <div className={`node-header ${nodeTypeClass}`}>
        <span className="node-title">{getNodeTitle()}</span>
        <button
          className="node-config-btn"
          onClick={(e) => e.stopPropagation()}
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
              connectionStart.nodeId !== node.id
                ? "connectable"
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
