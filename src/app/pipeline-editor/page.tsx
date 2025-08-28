"use client";

import React, { useState, useRef } from "react";
import { PipelineCanvas } from "./components/PipelineCanvas";
import { NodeLibrary } from "./components/NodeLibrary";
import { ConfigPanel } from "./components/ConfigPanel";
import { ExecutionPanel } from "./components/ExecutionPanel";
import { SaveReportDialog } from "./components/SaveReportDialog";
import { ShareLinkModal } from "./components/ShareLinkModal";
import { usePipeline } from "./hooks/usePipeline";
import { usePipelineExecution } from "./hooks/usePipelineExecution";
import { ReportGenerator } from "./utils/reportGenerator";
import { reportService } from "@/lib/api/reportService";
import domtoimage from "dom-to-image-more";
import { Download } from "lucide-react";
import "./pipeline-editor.css";

export default function PipelineEditorPage() {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<{
    shareUrl: string;
    reportId: string;
    expiresAt: string;
    reportName: string;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Detect platform
  React.useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);
  
  const modKey = isMac ? 'Cmd' : 'Ctrl';

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
    autoLayout,
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

  const handleSaveReport = async (
    metadata: {
      name: string;
      description?: string;
      tags?: string[];
      analyst?: string;
    },
    action: 'download' | 'share'
  ) => {
    // Validate that we have execution results to save
    if (!executionState || executionState.status !== "complete") {
      console.error("No completed execution to save");
      return;
    }
    
    try {
      // Capture the pipeline canvas as an image
      let canvasImage = "";
      const canvasElement = document.querySelector(".pipeline-canvas") as HTMLElement;
      if (canvasElement) {
        try {
          const dataUrl = await domtoimage.toPng(canvasElement, {
            bgcolor: "#ffffff",
            quality: 0.95,
            width: canvasElement.scrollWidth,
            height: canvasElement.scrollHeight,
          });
          canvasImage = dataUrl;
        } catch (error) {
          console.error("Failed to capture canvas:", error);
        }
      }

      // Generate the report
      const reportData = {
        metadata: {
          ...metadata,
          generatedAt: new Date().toISOString(),
        },
        pipeline: {
          id: `pipeline_${Date.now()}`,
          name: metadata.name,
          nodes,
          connections,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        executionState,
        canvasImage,
      };

      const isShared = action === 'share';
      const htmlContent = ReportGenerator.generateHTML(reportData, isShared);

      if (action === 'download') {
        // Download the report
        const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${metadata.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Share the report via link
        try {
          const response = await reportService.uploadReport(htmlContent, metadata);
          setShareData({
            shareUrl: response.share_url,
            reportId: response.report_id,
            expiresAt: response.expires_at,
            reportName: metadata.name
          });
          setShowShareModal(true);
        } catch (error) {
          console.error("Failed to share report:", error);
          alert("Failed to create share link. Please try downloading instead.");
        }
      }
    } catch (error) {
      console.error("Failed to save report:", error);
    }
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
            title={`Undo (${modKey}+Z)`}
          >
            ↶
          </button>
          <button
            className="btn-redo"
            onClick={redo}
            disabled={!canRedo}
            title={`Redo (${modKey}+Shift+Z)`}
          >
            ↷
          </button>
          <div className="header-separator" />
          <button
            className="btn-auto-layout"
            onClick={autoLayout}
            disabled={nodes.length === 0}
            title="Auto-arrange nodes"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="4" height="4" />
              <rect x="11" y="1" width="4" height="4" />
              <rect x="6" y="11" width="4" height="4" />
              <path d="M3 5v2h2v2h2V7h2v2h2V7h2V5" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
            Auto Layout
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
          {executionState.status === "complete" && (
            <button
              className="btn-save"
              onClick={() => setShowSaveDialog(true)}
              title="Save execution report"
            >
              <Download size={16} />
              Save Report
            </button>
          )}
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
        onNodeClick={(nodeId) => {
          // Select the node and scroll it into view
          selectNode(nodeId);
          // Could also add canvas pan/zoom to center on the node
        }}
      />
      
      {/* Keyboard Shortcuts Help Hint */}
      <div className="shortcut-help-hint">
        Hold <kbd>H</kbd> or <kbd>?</kbd> for keyboard shortcuts
      </div>

      {/* Save Report Dialog */}
      <SaveReportDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveReport}
      />
      
      {/* Share Link Modal */}
      {showShareModal && shareData && (
        <ShareLinkModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setShareData(null);
          }}
          shareUrl={shareData.shareUrl}
          reportId={shareData.reportId}
          expiresAt={shareData.expiresAt}
          reportName={shareData.reportName}
        />
      )}
    </div>
  );
}
