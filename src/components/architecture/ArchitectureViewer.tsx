"use client";

import React, { useState, useRef } from 'react';
import { ThreatAnnotation } from '@/types';
import './ArchitectureViewer.css';

interface ArchitectureViewerProps {
  diagram?: File | string;
  threats: ThreatAnnotation[];
  onThreatClick: (threat: ThreatAnnotation) => void;
  selectedThreatId?: string;
}

export const ArchitectureViewer: React.FC<ArchitectureViewerProps> = ({
  diagram,
  threats,
  onThreatClick,
  selectedThreatId
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  React.useEffect(() => {
    if (typeof diagram === 'string') {
      setImageUrl(diagram);
    } else if (diagram instanceof File) {
      const url = URL.createObjectURL(diagram);
      setImageUrl(url);
    }
    
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [diagram]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'var(--color-severity-high)';
      case 'medium': return 'var(--color-severity-medium)';
      case 'low': return 'var(--color-severity-low)';
      default: return 'var(--color-text-secondary)';
    }
  };

  return (
    <div className="architecture-viewer">
      <div className="viewer-header">
        <h3 className="viewer-title">System Architecture</h3>
        <button
          className="upload-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2L4 6H6V10H10V6H12L8 2Z"/>
            <path d="M2 12H14V14H2V12Z"/>
          </svg>
          Upload Diagram
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      <div className="diagram-container">
        {imageUrl ? (
          <div className="diagram-wrapper">
            <img 
              src={imageUrl} 
              alt="System Architecture" 
              className="architecture-diagram"
            />
            {threats.map((threat) => (
              threat.position && (
                <div
                  key={threat.id}
                  className={`threat-marker ${selectedThreatId === threat.id ? 'selected' : ''}`}
                  style={{
                    left: `${threat.position.x}%`,
                    top: `${threat.position.y}%`,
                    '--marker-color': getSeverityColor(threat.severity)
                  } as React.CSSProperties}
                  onClick={() => onThreatClick(threat)}
                  title={threat.title}
                >
                  <span className="threat-ref">{threat.referenceId}</span>
                  <div className="threat-tooltip">
                    <strong>{threat.referenceId}: {threat.title}</strong>
                    <span className={`severity severity-${threat.severity}`}>
                      {threat.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="currentColor" opacity="0.2">
              <path d="M32 8L16 24V40C16 48 20 55 26 58L32 60L38 58C44 55 48 48 48 40V24L32 8Z"/>
            </svg>
            <p className="empty-text">No architecture diagram uploaded</p>
            <button
              className="empty-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Diagram
            </button>
          </div>
        )}
      </div>

      {threats.length > 0 && (
        <div className="threats-list">
          <h4 className="threats-title">Identified Threats</h4>
          <div className="threats-items">
            {threats.map((threat) => (
              <button
                key={threat.id}
                className={`threat-item ${selectedThreatId === threat.id ? 'selected' : ''}`}
                onClick={() => onThreatClick(threat)}
              >
                <span 
                  className="threat-indicator"
                  style={{ backgroundColor: getSeverityColor(threat.severity) }}
                />
                <span className="threat-ref-small">{threat.referenceId}</span>
                <span className="threat-name">{threat.title}</span>
                <span className={`threat-severity severity-${threat.severity}`}>
                  {threat.severity}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};