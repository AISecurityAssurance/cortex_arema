"use client";

import React, { useState } from "react";
import { NODE_CATEGORIES } from "../types/pipeline";

interface NodeLibraryProps {
  onNodeDrop: (nodeType: string, position: { x: number; y: number }) => void;
}

export function NodeLibrary({ onNodeDrop }: NodeLibraryProps) {
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    setDraggedNodeType(nodeType);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('nodeType', nodeType);
  };

  const handleDragEnd = () => {
    setDraggedNodeType(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    if (nodeType) {
      const rect = e.currentTarget.getBoundingClientRect();
      const position = {
        x: e.clientX - rect.left - 240,
        y: e.clientY - rect.top
      };
      onNodeDrop(nodeType, position);
    }
  };

  React.useEffect(() => {
    const canvas = document.querySelector('.pipeline-canvas');
    if (canvas) {
      canvas.addEventListener('dragover', handleDragOver as any);
      canvas.addEventListener('drop', handleDrop as any);
      return () => {
        canvas.removeEventListener('dragover', handleDragOver as any);
        canvas.removeEventListener('drop', handleDrop as any);
      };
    }
  }, []);

  return (
    <div className="node-library">
      <h3 style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.9)' }}>
        Node Library
      </h3>
      
      <div style={{ 
        padding: '0.75rem', 
        background: 'rgba(59, 130, 246, 0.1)', 
        borderRadius: '0.25rem', 
        marginBottom: '1rem',
        fontSize: '0.75rem',
        lineHeight: '1.5',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <strong style={{ color: '#3b82f6' }}>How to Connect:</strong>
        <ol style={{ margin: '0.5rem 0 0 1.2rem', padding: 0 }}>
          <li>Drag nodes from below to canvas</li>
          <li><strong>Click & drag</strong> from an <span style={{ color: '#f59e0b' }}>output port</span> (right side)</li>
          <li>Release on an <span style={{ color: '#4ade80' }}>input port</span> (left side)</li>
        </ol>
        <div style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.6)' }}>
          Ports will glow when hovering!
        </div>
      </div>
      
      {NODE_CATEGORIES.map(category => (
        <div key={category.name} className="node-category">
          <div className="category-header">
            <span className="node-icon">{category.icon}</span>
            <span>{category.name}</span>
          </div>
          
          {category.nodes.map(node => (
            <div
              key={node.type}
              className={`node-template ${draggedNodeType === node.type ? 'dragging' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, node.type)}
              onDragEnd={handleDragEnd}
            >
              <span className="node-icon">{node.icon}</span>
              <div className="node-info">
                <div className="node-name">{node.name}</div>
                <div className="node-description">{node.description}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}