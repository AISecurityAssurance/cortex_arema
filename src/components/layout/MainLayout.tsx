"use client";

import React from 'react';
import { AnalysisLayout } from './AnalysisLayout';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  showSidePanels?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  leftPanel,
  rightPanel,
  showSidePanels = true
}) => {
  return (
    <div className="main-layout">
      {showSidePanels ? (
        <AnalysisLayout
          leftPanel={leftPanel}
          centerPanel={children}
          rightPanel={rightPanel}
        />
      ) : (
        <div className="single-panel-view">
          {children}
        </div>
      )}
    </div>
  );
};