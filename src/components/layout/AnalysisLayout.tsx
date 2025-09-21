"use client";

import React from 'react';
import './AnalysisLayout.css';

interface AnalysisLayoutProps {
  leftPanel?: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel?: React.ReactNode;
  leftPanelWidth?: string;
  rightPanelWidth?: string;
}

export const AnalysisLayout: React.FC<AnalysisLayoutProps> = ({
  leftPanel,
  centerPanel,
  rightPanel,
  leftPanelWidth = 'var(--panel-left-width)',
  rightPanelWidth = 'var(--panel-right-width)'
}) => {

  return (
    <div className="analysis-layout">
      {leftPanel && (
        <aside
          className="panel-left"
        >
          {leftPanel}
        </aside>
      )}

      <main className="panel-center">
        {centerPanel}
      </main>

      {rightPanel && (
        <aside 
          className="panel-right"
          style={{ width: rightPanelWidth }}
        >
          {rightPanel}
        </aside>
      )}
    </div>
  );
};