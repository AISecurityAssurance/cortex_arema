"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { PipelineNode, Connection, Point } from "../types/pipeline";
import { NodeExecutionState } from "../types/execution";
import { BaseNode } from "./nodes/BaseNode";
import { ConnectionLine } from "./ConnectionLine";
import { ResultsModal } from "./ResultsModal";
import { KeyboardShortcutsPopup } from "./KeyboardShortcutsPopup";

interface PipelineCanvasProps {
  nodes: PipelineNode[];
  connections: Connection[];
  selectedNodeIds: Set<string>;
  selectedConnectionId: string | null;
  executionStates: Map<string, NodeExecutionState>;
  onNodeSelect: (nodeId: string | null, multiSelect?: boolean) => void;
  onNodeMove: (nodeId: string, position: Point) => void;
  onMultipleNodeMove: (updates: Map<string, Point>) => void;
  onNodeDelete: (nodeId: string) => void;
  onDeleteSelectedNodes: () => void;
  onSelectAllNodes: () => void;
  onDuplicateSelectedNodes: () => void;
  onSelectMultipleNodes: (nodeIds: string[]) => void;
  onConnectionCreate: (from: { nodeId: string; output: string }, to: { nodeId: string; input: string }) => void;
  onConnectionDelete: (connectionId: string) => void;
  onConnectionSelect: (connectionId: string | null) => void;
  onCanvasClick: () => void;
}

interface SelectionBox {
  start: Point;
  end: Point;
}

export function PipelineCanvas({
  nodes,
  connections,
  selectedNodeIds,
  selectedConnectionId,
  executionStates,
  onNodeSelect,
  onNodeMove,
  onMultipleNodeMove,
  onNodeDelete,
  onDeleteSelectedNodes,
  onSelectAllNodes,
  onDuplicateSelectedNodes,
  onSelectMultipleNodes,
  onConnectionCreate,
  onConnectionDelete,
  onConnectionSelect,
  onCanvasClick,
}: PipelineCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewportTransform, setViewportTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [draggedNodeIds, setDraggedNodeIds] = useState<Set<string>>(new Set());
  const [dragOffsets, setDragOffsets] = useState<Map<string, Point>>(new Map());
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; output: string; position: Point } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredPort, setHoveredPort] = useState<{ nodeId: string; portType: 'input' | 'output'; portName: string } | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [resultsModalNode, setResultsModalNode] = useState<{ nodeId: string; nodeType: string } | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const keyPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const isMultiSelect = e.ctrlKey || e.metaKey;
    const isNodeSelected = selectedNodeIds.has(nodeId);
    
    if (isMultiSelect) {
      onNodeSelect(nodeId, true);
    } else if (!isNodeSelected) {
      onNodeSelect(nodeId, false);
    }
    
    // Set up dragging for all selected nodes
    const nodesToDrag = isNodeSelected ? selectedNodeIds : new Set([nodeId]);
    const offsets = new Map<string, Point>();
    
    nodesToDrag.forEach(id => {
      const node = nodes.find(n => n.id === id);
      if (node) {
        offsets.set(id, {
          x: (e.clientX - rect.left) / viewportTransform.scale - viewportTransform.x - node.position.x,
          y: (e.clientY - rect.top) / viewportTransform.scale - viewportTransform.y - node.position.y
        });
      }
    });
    
    setIsDraggingNode(true);
    setDraggedNodeIds(nodesToDrag);
    setDragOffsets(offsets);
  }, [nodes, viewportTransform, selectedNodeIds, onNodeSelect]);

  const handleNodeDoubleClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    // Double-click opens config panel - handled by parent through selection
    onNodeSelect(nodeId, false);
  }, [onNodeSelect]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewportTransform.x, y: e.clientY - viewportTransform.y });
      e.preventDefault();
    } else if (e.button === 0 && e.shiftKey) {
      // Start box selection
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const canvasX = (e.clientX - rect.left) / viewportTransform.scale - viewportTransform.x;
      const canvasY = (e.clientY - rect.top) / viewportTransform.scale - viewportTransform.y;
      
      setIsBoxSelecting(true);
      setSelectionBox({
        start: { x: canvasX, y: canvasY },
        end: { x: canvasX, y: canvasY }
      });
      e.preventDefault();
    } else if (e.button === 0) {
      onCanvasClick();
    }
  }, [viewportTransform, onCanvasClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = (e.clientX - rect.left) / viewportTransform.scale - viewportTransform.x;
    const canvasY = (e.clientY - rect.top) / viewportTransform.scale - viewportTransform.y;
    setMousePosition({ x: canvasX, y: canvasY });

    if (isDraggingNode && draggedNodeIds.size > 0) {
      const updates = new Map<string, Point>();
      
      draggedNodeIds.forEach(nodeId => {
        const offset = dragOffsets.get(nodeId);
        if (offset) {
          const newX = Math.round((canvasX - offset.x) / 20) * 20;
          const newY = Math.round((canvasY - offset.y) / 20) * 20;
          updates.set(nodeId, { x: newX, y: newY });
        }
      });
      
      if (updates.size > 0) {
        onMultipleNodeMove(updates);
      }
    } else if (isPanning) {
      setViewportTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
    } else if (isBoxSelecting && selectionBox) {
      setSelectionBox({
        ...selectionBox,
        end: { x: canvasX, y: canvasY }
      });
      
      // Find nodes within selection box
      const minX = Math.min(selectionBox.start.x, canvasX);
      const maxX = Math.max(selectionBox.start.x, canvasX);
      const minY = Math.min(selectionBox.start.y, canvasY);
      const maxY = Math.max(selectionBox.start.y, canvasY);
      
      const nodesInBox = nodes.filter(node => {
        const nodeRight = node.position.x + 200; // Approximate node width
        const nodeBottom = node.position.y + 100; // Approximate node height
        
        return node.position.x < maxX && nodeRight > minX &&
               node.position.y < maxY && nodeBottom > minY;
      });
      
      onSelectMultipleNodes(nodesInBox.map(n => n.id));
    }
  }, [isDraggingNode, draggedNodeIds, dragOffsets, isPanning, panStart, isBoxSelecting, selectionBox, viewportTransform, nodes, onNodeMove, onMultipleNodeMove, onSelectMultipleNodes]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingNode(false);
    setDraggedNodeIds(new Set());
    setDragOffsets(new Map());
    setIsPanning(false);
    setIsBoxSelecting(false);
    setSelectionBox(null);
    if (isConnecting) {
      setIsConnecting(false);
      setConnectionStart(null);
    }
  }, [isConnecting]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(viewportTransform.scale * delta, 0.5), 2);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleChange = newScale - viewportTransform.scale;
    const offsetX = -(mouseX / viewportTransform.scale) * scaleChange;
    const offsetY = -(mouseY / viewportTransform.scale) * scaleChange;

    setViewportTransform(prev => ({
      x: prev.x + offsetX,
      y: prev.y + offsetY,
      scale: newScale
    }));
  }, [viewportTransform]);

  const handlePortMouseDown = useCallback((e: React.MouseEvent, nodeId: string, portType: 'input' | 'output', portName: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (portType === 'output') {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      // Get the actual port element position from the event
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Get the port element
      const portElement = e.currentTarget as HTMLElement;
      const portRect = portElement.getBoundingClientRect();
      
      // Calculate port center position relative to canvas
      const portPosition = {
        x: (portRect.left + portRect.width / 2 - rect.left) / viewportTransform.scale - viewportTransform.x,
        y: (portRect.top + portRect.height / 2 - rect.top) / viewportTransform.scale - viewportTransform.y
      };

      setIsConnecting(true);
      setConnectionStart({
        nodeId,
        output: portName,
        position: portPosition
      });
    }
  }, [nodes, viewportTransform]);

  const handlePortMouseUp = useCallback((e: React.MouseEvent, nodeId: string, portType: 'input' | 'output', portName: string) => {
    e.stopPropagation();

    if (isConnecting && connectionStart && portType === 'input') {
      onConnectionCreate(
        { nodeId: connectionStart.nodeId, output: connectionStart.output },
        { nodeId, input: portName }
      );
    }
    setIsConnecting(false);
    setConnectionStart(null);
  }, [isConnecting, connectionStart, onConnectionCreate]);

  const handlePortMouseEnter = useCallback((nodeId: string, portType: 'input' | 'output', portName: string) => {
    setHoveredPort({ nodeId, portType, portName });
  }, []);

  const handlePortMouseLeave = useCallback(() => {
    setHoveredPort(null);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Show keyboard shortcuts popup when holding '?' or 'h'
    // Check this first before input field check
    if ((e.key === '?' || e.key.toLowerCase() === 'h') && !e.repeat) {
      // Don't show if typing in input fields
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement ||
          (e.target as HTMLElement).contentEditable === 'true') {
        return;
      }
      
      // Clear any existing timeout
      if (keyPressTimeoutRef.current) {
        clearTimeout(keyPressTimeoutRef.current);
        keyPressTimeoutRef.current = null;
      }
      setShowKeyboardShortcuts(true);
      e.preventDefault();
      return;
    }
    
    // Prevent shortcuts when typing in inputs or other editable elements
    if (e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement).contentEditable === 'true') {
      return;
    }
    
    // Only handle shortcuts if we're focused on the canvas area
    const isInCanvas = (e.target as HTMLElement).closest('.pipeline-canvas');
    if (!isInCanvas && !document.activeElement?.closest('.pipeline-canvas')) {
      // Allow Delete and Escape to work even when not directly on canvas
      if (e.key !== 'Delete' && e.key !== 'Backspace' && e.key !== 'Escape') {
        return;
      }
    }
    
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedConnectionId) {
        onConnectionDelete(selectedConnectionId);
      } else if (selectedNodeIds.size > 0) {
        onDeleteSelectedNodes();
      }
    } else if (e.key === 'Escape') {
      onCanvasClick();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      onSelectAllNodes();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      if (selectedNodeIds.size > 0) {
        onDuplicateSelectedNodes();
      }
    }
  }, [selectedNodeIds, selectedConnectionId, onDeleteSelectedNodes, onConnectionDelete, onCanvasClick, onSelectAllNodes, onDuplicateSelectedNodes]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    // Hide keyboard shortcuts popup when releasing '?' or 'h'
    if (e.key === '?' || e.key.toLowerCase() === 'h') {
      // Add a small delay to prevent flickering
      keyPressTimeoutRef.current = setTimeout(() => {
        setShowKeyboardShortcuts(false);
      }, 100);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (keyPressTimeoutRef.current) {
        clearTimeout(keyPressTimeoutRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div 
      ref={canvasRef}
      className="pipeline-canvas"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <div 
        className="canvas-viewport"
        style={{
          transform: `translate(${viewportTransform.x}px, ${viewportTransform.y}px) scale(${viewportTransform.scale})`
        }}
      >
        <svg className="connections-layer">
          {connections.map(connection => {
            const fromNode = nodes.find(n => n.id === connection.from.nodeId);
            const toNode = nodes.find(n => n.id === connection.to.nodeId);
            if (!fromNode || !toNode) return null;

            // Check if either connected node is running
            const isAnimated = 
              executionStates.get(connection.from.nodeId)?.status === 'running' ||
              executionStates.get(connection.to.nodeId)?.status === 'running';
            
            return (
              <ConnectionLine
                key={connection.id}
                from={{ x: fromNode.position.x + 200, y: fromNode.position.y + 100 }}
                to={{ x: toNode.position.x, y: toNode.position.y + 100 }}
                isValid={connection.isValid}
                isSelected={connection.id === selectedConnectionId}
                isAnimated={isAnimated}
                isHovered={connection.id === hoveredConnectionId}
                onClick={() => onConnectionSelect(connection.id)}
                onMouseEnter={() => setHoveredConnectionId(connection.id)}
                onMouseLeave={() => setHoveredConnectionId(null)}
              />
            );
          })}
          
          {isConnecting && connectionStart && (
            <ConnectionLine
              from={connectionStart.position}
              to={mousePosition}
              isValid={false}
              isTemporary
            />
          )}
        </svg>

        <div className="nodes-layer">
          {nodes.map(node => (
            <BaseNode
              key={node.id}
              node={node}
              isSelected={selectedNodeIds.has(node.id)}
              executionState={executionStates.get(node.id)}
              isConnecting={isConnecting}
              connectionStart={connectionStart}
              hoveredPort={hoveredPort}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
              onPortMouseDown={handlePortMouseDown}
              onPortMouseUp={handlePortMouseUp}
              onPortMouseEnter={handlePortMouseEnter}
              onPortMouseLeave={handlePortMouseLeave}
              onDelete={() => onNodeDelete(node.id)}
              onViewResults={() => setResultsModalNode({ nodeId: node.id, nodeType: node.type })}
            />
          ))}
        </div>
        
        {/* Selection Box */}
        {isBoxSelecting && selectionBox && (
          <div
            className="selection-box"
            style={{
              left: Math.min(selectionBox.start.x, selectionBox.end.x),
              top: Math.min(selectionBox.start.y, selectionBox.end.y),
              width: Math.abs(selectionBox.end.x - selectionBox.start.x),
              height: Math.abs(selectionBox.end.y - selectionBox.start.y),
            }}
          />
        )}
      </div>
      
      {resultsModalNode && (
        <ResultsModal
          nodeId={resultsModalNode.nodeId}
          nodeType={resultsModalNode.nodeType}
          executionState={executionStates.get(resultsModalNode.nodeId)}
          onClose={() => setResultsModalNode(null)}
        />
      )}
      
      {showKeyboardShortcuts && <KeyboardShortcutsPopup />}
    </div>
  );
}