"use client";

import React, { useState } from "react";
import { PipelineCanvas } from "./components/PipelineCanvas";
import { NodeLibrary } from "./components/NodeLibrary";
import { ConfigPanel } from "./components/ConfigPanel";
import { ExecutionPanel } from "./components/ExecutionPanel";
import { usePipeline } from "./hooks/usePipeline";
import { usePipelineExecution } from "./hooks/usePipelineExecution";
import "./pipeline-editor.css";

export default function PipelineEditorPage() {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const {
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
  } = usePipeline();

  const {
    executionState,
    runPipeline,
    cancelExecution,
    getNodeExecutionState,
  } = usePipelineExecution();

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;

  const handleNodeDrop = (
    nodeType: string,
    position: { x: number; y: number }
  ) => {
    addNode(nodeType, position);
  };

  const handleRunPipeline = () => {
    runPipeline({ nodes, connections });
  };

  return (
    <div className="pipeline-editor">
      <header className="pipeline-header">
        <div className="header-left">
          <h1>Pipeline Editor</h1>
          <span className="pipeline-status">
            {executionState.status === "idle" && "Ready"}
            {executionState.status === "running" &&
              `Running... ${Math.round(executionState.totalProgress)}%`}
            {executionState.status === "complete" &&
              '✓ Complete - Click "View Results" on any node'}
            {executionState.status === "error" && "Error"}
          </span>
        </div>
        <div className="header-actions">
          <button
            className="btn-run"
            onClick={handleRunPipeline}
            disabled={executionState.status === "running"}
          >
            {executionState.status === "running"
              ? "Running..."
              : "Run Pipeline"}
          </button>
          {executionState.status === "running" && (
            <button className="btn-cancel" onClick={cancelExecution}>
              Cancel
            </button>
          )}
        </div>
      </header>

      <div className="pipeline-body">
        <NodeLibrary onNodeDrop={handleNodeDrop} />

        <PipelineCanvas
          nodes={nodes}
          connections={connections}
          selectedNodeId={selectedNodeId}
          executionStates={executionState.nodeStates}
          onNodeSelect={selectNode}
          onNodeMove={updateNodePosition}
          onNodeDelete={deleteNode}
          onConnectionCreate={addConnection}
          onConnectionDelete={deleteConnection}
          onCanvasClick={clearSelection}
        />

        {selectedNode && (
          <ConfigPanel
            node={selectedNode}
            onUpdateConfig={(config) => updateNode(selectedNode.id, { config })}
            onClose={() => selectNode(null)}
          />
        )}
      </div>

      <ExecutionPanel
        isCollapsed={isPanelCollapsed}
        onToggle={() => setIsPanelCollapsed(!isPanelCollapsed)}
        executionState={executionState}
      />
    </div>
  );
}
