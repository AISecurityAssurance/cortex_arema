"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { PipelineNode, Connection, Point } from "../types/pipeline";
import { NodeExecutionState } from "../types/execution";
import { BaseNode } from "./nodes/BaseNode";
import { ConnectionLine } from "./ConnectionLine";
import { ResultsModal } from "./ResultsModal";

interface PipelineCanvasProps {
  nodes: PipelineNode[];
  connections: Connection[];
  selectedNodeId: string | null;
  executionStates: Map<string, NodeExecutionState>;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeMove: (nodeId: string, position: Point) => void;
  onNodeDelete: (nodeId: string) => void;
  onConnectionCreate: (from: { nodeId: string; output: string }, to: { nodeId: string; input: string }) => void;
  onConnectionDelete: (connectionId: string) => void;
  onCanvasClick: () => void;
}

export function PipelineCanvas({
  nodes,
  connections,
  selectedNodeId,
  executionStates,
  onNodeSelect,
  onNodeMove,
  onNodeDelete,
  onConnectionCreate,
  onConnectionDelete,
  onCanvasClick,
}: PipelineCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewportTransform, setViewportTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; output: string; position: Point } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredPort, setHoveredPort] = useState<{ nodeId: string; portType: 'input' | 'output'; portName: string } | null>(null);
  const [resultsModalNode, setResultsModalNode] = useState<{ nodeId: string; nodeType: string } | null>(null);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDraggingNode(true);
    setDraggedNodeId(nodeId);
    setDragOffset({
      x: (e.clientX - rect.left) / viewportTransform.scale - viewportTransform.x - node.position.x,
      y: (e.clientY - rect.top) / viewportTransform.scale - viewportTransform.y - node.position.y
    });
    onNodeSelect(nodeId);
  }, [nodes, viewportTransform, onNodeSelect]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewportTransform.x, y: e.clientY - viewportTransform.y });
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

    if (isDraggingNode && draggedNodeId) {
      const newX = Math.round((canvasX - dragOffset.x) / 20) * 20;
      const newY = Math.round((canvasY - dragOffset.y) / 20) * 20;
      onNodeMove(draggedNodeId, { x: newX, y: newY });
    } else if (isPanning) {
      setViewportTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
    }
  }, [isDraggingNode, draggedNodeId, dragOffset, isPanning, panStart, viewportTransform, onNodeMove]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingNode(false);
    setDraggedNodeId(null);
    setIsPanning(false);
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

      setIsConnecting(true);
      setConnectionStart({
        nodeId,
        output: portName,
        position: node.position
      });
    }
  }, [nodes]);

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
    if (e.key === 'Delete' && selectedNodeId) {
      onNodeDelete(selectedNodeId);
    }
  }, [selectedNodeId, onNodeDelete]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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

            return (
              <ConnectionLine
                key={connection.id}
                from={{ x: fromNode.position.x + 200, y: fromNode.position.y + 50 }}
                to={{ x: toNode.position.x, y: toNode.position.y + 50 }}
                isValid={connection.isValid}
                onClick={() => onConnectionDelete(connection.id)}
              />
            );
          })}
          
          {isConnecting && connectionStart && (
            <ConnectionLine
              from={{ x: connectionStart.position.x + 200, y: connectionStart.position.y + 50 }}
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
              isSelected={node.id === selectedNodeId}
              executionState={executionStates.get(node.id)}
              isConnecting={isConnecting}
              connectionStart={connectionStart}
              hoveredPort={hoveredPort}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onPortMouseDown={handlePortMouseDown}
              onPortMouseUp={handlePortMouseUp}
              onPortMouseEnter={handlePortMouseEnter}
              onPortMouseLeave={handlePortMouseLeave}
              onDelete={() => onNodeDelete(node.id)}
              onViewResults={() => setResultsModalNode({ nodeId: node.id, nodeType: node.type })}
            />
          ))}
        </div>
      </div>
      
      {resultsModalNode && (
        <ResultsModal
          nodeId={resultsModalNode.nodeId}
          nodeType={resultsModalNode.nodeType}
          executionState={executionStates.get(resultsModalNode.nodeId)}
          onClose={() => setResultsModalNode(null)}
        />
      )}
    </div>
  );
}