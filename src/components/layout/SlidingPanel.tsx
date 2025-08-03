"use client";

import React, { useState } from 'react';
import './SlidingPanel.css';

interface SlidingPanelProps {
  children: React.ReactNode;
  side?: 'left' | 'right';
  defaultCollapsed?: boolean;
  width?: string;
}

export const SlidingPanel: React.FC<SlidingPanelProps> = ({
  children,
  side = 'right',
  defaultCollapsed = false,
  width = '380px'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div 
      className={`sliding-panel sliding-panel-${side} ${isCollapsed ? 'collapsed' : ''}`}
      style={{ 
        width: isCollapsed ? '12px' : width,
        [side]: 0
      }}
    >
      <div 
        className="panel-handle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
      >
        <div className="handle-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      
      <div className="panel-content-wrapper">
        {children}
      </div>
    </div>
  );
};