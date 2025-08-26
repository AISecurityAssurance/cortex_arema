"use client";

import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { NodeExecutionState } from "../types/execution";
import { DiagramResult, TextResult, FindingsResult } from "../types/results";
import "./ResultsModal.css";

interface ResultsModalProps {
  nodeId: string;
  nodeType: string;
  executionState?: NodeExecutionState;
  onClose: () => void;
}

export function ResultsModal({ nodeId, nodeType, executionState, onClose }: ResultsModalProps) {
  const [showRawResponse, setShowRawResponse] = React.useState(false);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const scrollY = window.scrollY;

    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      // Restore original styles
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      
      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!executionState || !executionState.results) {
    return null;
  }

  const renderResults = () => {
    const { results } = executionState;

    if (nodeType === 'input-diagram' && results?.type === 'diagram') {
      const diagramResults = results as DiagramResult;
      return (
        <div>
          <h4>Uploaded Diagram</h4>
          <p>File: {diagramResults.data.fileName || 'Unknown'}</p>
          <p>Type: {diagramResults.data.mimeType || 'image'}</p>
          <p>Analysis: {diagramResults.data.analysis || 'No analysis available'}</p>
        </div>
      );
    }

    if (nodeType === 'input-text' && results?.type === 'text') {
      const textResults = results as TextResult;
      return (
        <div>
          <h4>Text Input Data</h4>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.25rem', marginTop: '0.5rem' }}>
            <p><strong>System Name:</strong> {textResults.data.systemName}</p>
            <p><strong>Description:</strong> {textResults.data.description}</p>
            <p><strong>Context:</strong> {textResults.data.context}</p>
          </div>
        </div>
      );
    }

    if ((nodeType === 'analysis-stride' || nodeType === 'analysis-stpa-sec') && results?.type === 'findings') {
      const findingsResults = results as FindingsResult;
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4>Security Findings ({findingsResults.data.length} found)</h4>
            {findingsResults.rawResponse && (
              <button
                onClick={() => setShowRawResponse(!showRawResponse)}
                style={{
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid #3b82f6',
                  borderRadius: '0.25rem',
                  color: '#3b82f6',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                {showRawResponse ? 'Show Findings' : 'Show Raw Response'}
              </button>
            )}
          </div>
          
          {showRawResponse && findingsResults.rawResponse ? (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '1rem',
              borderRadius: '0.25rem',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <h5 style={{ marginBottom: '0.5rem', color: '#3b82f6' }}>Raw Model Response:</h5>
              <div className="results-modal-markdown" style={{
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.9)',
                lineHeight: '1.6'
              }}>
                <ReactMarkdown>{findingsResults.rawResponse}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '1rem' }}>
              {findingsResults.data.length > 0 ? (
                findingsResults.data.map((finding, index) => (
                  <div key={finding.id || index} style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '1rem',
                    borderRadius: '0.25rem',
                    marginBottom: '1rem',
                    borderLeft: `4px solid ${
                      finding.severity === 'high' ? '#ef4444' :
                      finding.severity === 'medium' ? '#f59e0b' : '#4ade80'
                    }`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>{finding.title}</strong>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: finding.severity === 'high' ? '#ef4444' :
                                   finding.severity === 'medium' ? '#f59e0b' : '#4ade80',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase'
                      }}>
                        {finding.severity}
                      </span>
                    </div>
                    <div className="results-modal-markdown" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
                      <ReactMarkdown>{finding.description}</ReactMarkdown>
                    </div>
                    {finding.mitigations && finding.mitigations.length > 0 && (
                      <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Mitigations:</strong>
                        <ul style={{ margin: '0.25rem 0 0 1.5rem', padding: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                          {finding.mitigations.map((mitigation: string, idx: number) => (
                            <li key={idx} className="results-modal-markdown mitigation-item">
                              <ReactMarkdown>{mitigation}</ReactMarkdown>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                      <span>Category: {finding.category}</span>
                      {finding.cweId && <span> • CWE-{finding.cweId}</span>}
                      {finding.confidence && <span> • Confidence: {finding.confidence}%</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  padding: '1rem',
                  borderRadius: '0.25rem',
                  color: '#f87171'
                }}>
                  No structured findings could be extracted. Check the raw response for details.
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Default JSON view for unknown types
    return (
      <div>
        <h4>Raw Results</h4>
        <pre style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '1rem',
          borderRadius: '0.25rem',
          overflow: 'auto',
          maxHeight: '400px',
          fontSize: '0.75rem'
        }}>
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div 
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
        >
          ×
        </button>

        <h3 style={{ marginBottom: '1rem', color: '#fff' }}>
          Node Results: {nodeId}
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <span style={{
            padding: '0.25rem 0.5rem',
            background: executionState.status === 'complete' ? '#10b981' :
                       executionState.status === 'error' ? '#ef4444' : '#3b82f6',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            textTransform: 'uppercase'
          }}>
            {executionState.status}
          </span>
          {executionState.duration && (
            <span style={{ marginLeft: '1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
              Executed in {executionState.duration}ms
            </span>
          )}
        </div>

        {executionState.error ? (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            padding: '1rem',
            borderRadius: '0.25rem',
            color: '#ef4444'
          }}>
            <strong>Error:</strong> {executionState.error}
          </div>
        ) : (
          renderResults()
        )}
      </div>
    </div>
  );
}