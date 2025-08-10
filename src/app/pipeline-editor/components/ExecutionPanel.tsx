"use client";

import React, { useMemo } from "react";
import { PipelineExecutionState } from "../types/execution";

interface ExecutionPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  executionState: PipelineExecutionState;
}

export function ExecutionPanel({ isCollapsed, onToggle, executionState }: ExecutionPanelProps) {
  const executionLogs = useMemo(() => {
    const logs: Array<{ timestamp: string; message: string; type: 'info' | 'success' | 'error' }> = [];

    if (executionState.status === 'idle') {
      return logs;
    }

    if (executionState.startTime) {
      logs.push({
        timestamp: new Date(executionState.startTime).toLocaleTimeString(),
        message: 'Pipeline execution started',
        type: 'info'
      });
    }

    executionState.nodeStates.forEach((state, nodeId) => {
      if (state.startTime) {
        const time = new Date(state.startTime).toLocaleTimeString();
        
        if (state.status === 'running') {
          logs.push({
            timestamp: time,
            message: `Executing node: ${nodeId}`,
            type: 'info'
          });
        } else if (state.status === 'complete') {
          logs.push({
            timestamp: time,
            message: `Node ${nodeId} completed in ${state.duration}ms`,
            type: 'success'
          });
        } else if (state.status === 'error') {
          logs.push({
            timestamp: time,
            message: `Node ${nodeId} failed: ${state.error}`,
            type: 'error'
          });
        }
      }
    });

    if (executionState.endTime) {
      const duration = executionState.endTime - (executionState.startTime || 0);
      logs.push({
        timestamp: new Date(executionState.endTime).toLocaleTimeString(),
        message: `Pipeline execution ${executionState.status === 'complete' ? 'completed' : 'failed'} in ${duration}ms`,
        type: executionState.status === 'complete' ? 'success' : 'error'
      });
    }

    return logs;
  }, [executionState]);

  return (
    <div className={`execution-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="execution-header" onClick={onToggle}>
        <div className="execution-title">
          Execution Log
          {executionState.status === 'running' && (
            <span style={{ marginLeft: '1rem', color: 'var(--node-running)' }}>
              Running... {Math.round(executionState.totalProgress)}%
            </span>
          )}
        </div>
        <button className="execution-toggle">
          {isCollapsed ? '▲' : '▼'}
        </button>
      </div>
      
      {!isCollapsed && (
        <div 
          className="execution-content"
          onWheel={(e) => {
            const element = e.currentTarget;
            const { scrollTop, scrollHeight, clientHeight } = element;
            const isAtTop = scrollTop === 0;
            const isAtBottom = scrollHeight - scrollTop <= clientHeight;
            
            // Prevent scrolling past boundaries
            if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
              e.preventDefault();
              return;
            }
            
            // Stop propagation to prevent page scroll
            e.stopPropagation();
          }}
        >
          {executionLogs.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              No execution logs yet. Run the pipeline to see logs.
            </div>
          ) : (
            <div className="execution-log">
              {executionLogs.map((log, index) => (
                <div key={index} className={`log-entry ${log.type}`}>
                  <span className="log-timestamp">{log.timestamp}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}