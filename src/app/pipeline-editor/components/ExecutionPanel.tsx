"use client";

import React, { useMemo, useState, useCallback } from "react";
import { PipelineExecutionState } from "../types/execution";

interface ExecutionPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  executionState: PipelineExecutionState;
  onNodeClick?: (nodeId: string) => void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  nodeId?: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  details?: string;
  duration?: number;
  expandable?: boolean;
}

export function ExecutionPanel({ 
  isCollapsed, 
  onToggle, 
  executionState,
  onNodeClick 
}: ExecutionPanelProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'errors' | 'success'>('all');

  const toggleExpanded = useCallback((logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  }, []);

  const executionLogs = useMemo(() => {
    const logs: LogEntry[] = [];
    let logIndex = 0;

    if (executionState.status === 'idle') {
      return logs;
    }

    // Pipeline start
    if (executionState.startTime) {
      logs.push({
        id: `log_${logIndex++}`,
        timestamp: new Date(executionState.startTime).toLocaleTimeString(),
        message: 'Pipeline execution started',
        type: 'info'
      });
    }

    // Node execution logs
    const nodeOrder: string[] = [];
    executionState.nodeStates.forEach((state, nodeId) => {
      if (state.startTime) {
        nodeOrder.push(nodeId);
      }
    });

    // Sort nodes by start time
    nodeOrder.sort((a, b) => {
      const aTime = executionState.nodeStates.get(a)?.startTime || 0;
      const bTime = executionState.nodeStates.get(b)?.startTime || 0;
      return aTime - bTime;
    });

    nodeOrder.forEach((nodeId) => {
      const state = executionState.nodeStates.get(nodeId);
      if (!state || !state.startTime) return;

      const time = new Date(state.startTime).toLocaleTimeString();
      const nodeName = getNodeDisplayName(nodeId);
      
      if (state.status === 'running') {
        logs.push({
          id: `log_${logIndex++}`,
          timestamp: time,
          nodeId,
          message: `Executing ${nodeName}`,
          type: 'info'
        });
      } else if (state.status === 'complete') {
        const duration = state.duration || 0;
        
        logs.push({
          id: `log_${logIndex++}`,
          timestamp: time,
          nodeId,
          message: `✓ ${nodeName} completed`,
          type: 'success',
          duration,
          details: state.results ? formatResultsSummary(state.results) : undefined,
          expandable: !!state.results
        });
      } else if (state.status === 'error') {
        const errorMessage = state.error || 'Unknown error';
        const shortError = getShortErrorMessage(errorMessage);
        
        logs.push({
          id: `log_${logIndex++}`,
          timestamp: time,
          nodeId,
          message: `✗ ${nodeName} failed: ${shortError}`,
          type: 'error',
          duration: state.duration,
          details: errorMessage,
          expandable: true // Always allow expanding errors to see full details
        });
      } else if (state.status === 'waiting') {
        logs.push({
          id: `log_${logIndex++}`,
          timestamp: time,
          nodeId,
          message: `${nodeName} waiting for inputs`,
          type: 'info'
        });
      }
    });

    // Pipeline completion/failure
    if (executionState.endTime) {
      const duration = executionState.endTime - (executionState.startTime || 0);
      const durationStr = formatDuration(duration);
      
      if (executionState.status === 'complete') {
        logs.push({
          id: `log_${logIndex++}`,
          timestamp: new Date(executionState.endTime).toLocaleTimeString(),
          message: `✓ Pipeline completed successfully in ${durationStr}`,
          type: 'success'
        });
      } else if (executionState.status === 'error') {
        logs.push({
          id: `log_${logIndex++}`,
          timestamp: new Date(executionState.endTime).toLocaleTimeString(),
          message: `✗ Pipeline failed after ${durationStr}`,
          type: 'error',
          details: executionState.error,
          expandable: !!executionState.error
        });
      }
    }

    return logs;
  }, [executionState]);

  // Filter logs based on selected filter
  const filteredLogs = useMemo(() => {
    if (filter === 'all') return executionLogs;
    if (filter === 'errors') return executionLogs.filter(log => log.type === 'error');
    if (filter === 'success') return executionLogs.filter(log => log.type === 'success');
    return executionLogs;
  }, [executionLogs, filter]);

  // Helper functions
  function getNodeDisplayName(nodeId: string): string {
    // Extract node type from ID and make it readable
    if (nodeId.includes('stride')) return 'STRIDE Analysis';
    if (nodeId.includes('stpa')) return 'STPA-SEC Analysis';
    if (nodeId.includes('diagram')) return 'Architecture Diagram';
    if (nodeId.includes('text')) return 'Text Input';
    return nodeId;
  }

  function getShortErrorMessage(error: string): string {
    // For multi-line errors, show first line
    const lines = error.split('\n');
    const firstLine = lines[0];
    
    // If it's a multi-line error, indicate there's more
    if (lines.length > 1) {
      if (firstLine.length > 80) {
        return firstLine.substring(0, 80) + '... (see details)';
      }
      return firstLine + ' (see details)';
    }
    
    // For single line errors, truncate if too long
    if (firstLine.length > 100) {
      return firstLine.substring(0, 100) + '...';
    }
    return firstLine;
  }

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  function formatResultsSummary(results: any): string {
    if (!results) return '';
    
    if (results.type === 'findings' && results.data) {
      const count = Array.isArray(results.data) ? results.data.length : 0;
      return `Found ${count} security ${count === 1 ? 'finding' : 'findings'}`;
    }
    
    if (results.type === 'diagram') {
      return 'Diagram processed successfully';
    }
    
    if (results.type === 'text') {
      return 'Text input processed';
    }
    
    return JSON.stringify(results).substring(0, 100);
  }

  const hasErrors = executionLogs.some(log => log.type === 'error');

  return (
    <div className={`execution-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="execution-header" onClick={onToggle}>
        <div className="execution-title">
          <span>Execution Log</span>
          {executionState.status === 'running' && (
            <span style={{ marginLeft: '1rem', color: 'var(--node-running)' }}>
              Running... {Math.round(executionState.totalProgress)}%
            </span>
          )}
          {executionState.status === 'error' && (
            <span style={{ marginLeft: '1rem', color: '#ef4444' }}>
              ⚠️ Failed
            </span>
          )}
          {executionState.status === 'complete' && (
            <span style={{ marginLeft: '1rem', color: '#10b981' }}>
              ✓ Complete
            </span>
          )}
        </div>
        <button className="execution-toggle">
          {isCollapsed ? '▲' : '▼'}
        </button>
      </div>
      
      {!isCollapsed && (
        <>
          {/* Filter buttons */}
          {executionLogs.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '0.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); setFilter('all'); }}
                style={{
                  padding: '0.25rem 0.75rem',
                  background: filter === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '0.25rem',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                All ({executionLogs.length})
              </button>
              {hasErrors && (
                <button
                  onClick={(e) => { e.stopPropagation(); setFilter('errors'); }}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: filter === 'errors' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '0.25rem',
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Errors ({executionLogs.filter(l => l.type === 'error').length})
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setFilter('success'); }}
                style={{
                  padding: '0.25rem 0.75rem',
                  background: filter === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '0.25rem',
                  color: '#10b981',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Success ({executionLogs.filter(l => l.type === 'success').length})
              </button>
            </div>
          )}

          <div 
            className="execution-content"
            onWheel={(e) => {
              const element = e.currentTarget;
              const { scrollTop, scrollHeight, clientHeight } = element;
              const isAtTop = scrollTop === 0;
              const isAtBottom = scrollHeight - scrollTop <= clientHeight;
              
              if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                e.preventDefault();
                return;
              }
              
              e.stopPropagation();
            }}
          >
            {filteredLogs.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                {executionLogs.length === 0 
                  ? 'No execution logs yet. Run the pipeline to see logs.'
                  : 'No logs match the selected filter.'}
              </div>
            ) : (
              <div className="execution-log">
                {filteredLogs.map((log) => (
                  <div key={log.id} className={`log-entry ${log.type}`}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span className="log-timestamp">{log.timestamp}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="log-message">{log.message}</span>
                          {log.duration && (
                            <span style={{ 
                              fontSize: '0.7rem', 
                              opacity: 0.7,
                              padding: '0.125rem 0.375rem',
                              background: 'rgba(255,255,255,0.05)',
                              borderRadius: '0.25rem'
                            }}>
                              {formatDuration(log.duration)}
                            </span>
                          )}
                          {log.nodeId && onNodeClick && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNodeClick(log.nodeId!);
                              }}
                              style={{
                                padding: '0.125rem 0.375rem',
                                background: 'rgba(59, 130, 246, 0.2)',
                                border: '1px solid rgba(59, 130, 246, 0.4)',
                                borderRadius: '0.25rem',
                                color: '#3b82f6',
                                fontSize: '0.7rem',
                                cursor: 'pointer'
                              }}
                              title="Jump to node"
                            >
                              →
                            </button>
                          )}
                          {log.expandable && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(log.id);
                              }}
                              style={{
                                padding: '0.125rem 0.375rem',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '0.25rem',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '0.7rem',
                                cursor: 'pointer'
                              }}
                            >
                              {expandedLogs.has(log.id) ? '▼' : '▶'} Details
                            </button>
                          )}
                        </div>
                        
                        {/* Expanded details */}
                        {log.details && expandedLogs.has(log.id) && (
                          <div style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '0.25rem',
                            fontSize: '0.8rem',
                            fontFamily: 'monospace',
                            position: 'relative'
                          }}>
                            <pre style={{ 
                              margin: 0, 
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word'
                            }}>
                              {log.details}
                            </pre>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(log.details!);
                              }}
                              style={{
                                position: 'absolute',
                                top: '0.25rem',
                                right: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '0.25rem',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '0.7rem',
                                cursor: 'pointer'
                              }}
                              title="Copy to clipboard"
                            >
                              Copy
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}