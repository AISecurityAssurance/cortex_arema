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
  } = usePipeline();

  const {
    executionState,
    runPipeline,
    cancelExecution,
    getNodeExecutionState,
  } = usePipelineExecution();

  const selectedNode = selectedNodeIds.size === 1
    ? nodes.find((n) => selectedNodeIds.has(n.id))
    : null;
    
  const handleOpenConfig = (nodeId: string) => {
    selectNode(nodeId);
  };

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
            className="btn-undo"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            className="btn-redo"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷
          </button>
          <div className="header-separator" />
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
          selectedNodeIds={selectedNodeIds}
          selectedConnectionId={selectedConnectionId}
          executionStates={executionState.nodeStates}
          onNodeSelect={selectNode}
          onNodeMove={updateNodePosition}
          onMultipleNodeMove={updateMultipleNodePositions}
          onNodeDelete={deleteNode}
          onDeleteSelectedNodes={deleteSelectedNodes}
          onSelectAllNodes={selectAllNodes}
          onDuplicateSelectedNodes={duplicateSelectedNodes}
          onSelectMultipleNodes={selectMultipleNodes}
          onConnectionCreate={addConnection}
          onConnectionDelete={deleteConnection}
          onConnectionSelect={selectConnection}
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
      
      {/* Keyboard Shortcuts Help */}
      <div className="shortcut-hint">
        <div><kbd>Shift</kbd> + Drag: Box select</div>
        <div><kbd>Ctrl</kbd> + Click: Multi-select</div>
        <div><kbd>Double Click</kbd>: Open config</div>
        <div><kbd>Delete</kbd>: Delete selected</div>
        <div><kbd>Ctrl</kbd> + <kbd>A</kbd>: Select all</div>
        <div><kbd>Ctrl</kbd> + <kbd>D</kbd>: Duplicate</div>
        <div><kbd>Ctrl</kbd> + <kbd>Z</kbd>: Undo</div>
        <div><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd>: Redo</div>
        <div><kbd>Esc</kbd>: Clear selection</div>
        <div><kbd>Alt</kbd> + Drag: Pan canvas</div>
      </div>
    </div>
  );
}
