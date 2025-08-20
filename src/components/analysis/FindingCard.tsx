"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { SecurityFinding, ValidationStatus } from '@/types';
import './FindingCard.css';

interface FindingCardProps {
  finding: SecurityFinding;
  validationStatus: ValidationStatus;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  validationStatus,
  isSelected,
  onClick,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (!compact) {
      setIsExpanded(!isExpanded);
    }
    onClick();
  };

  const getSeverityColor = () => {
    switch (finding.severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'confirmed': return '✓';
      case 'false-positive': return '✗';
      case 'needs-review': return '?';
      default: return null;
    }
  };

  if (compact) {
    return (
      <div 
        className={`finding-card-minimal ${isSelected ? 'selected' : ''}`}
        onClick={handleClick}
      >
        <div 
          className="severity-bar"
          style={{ backgroundColor: getSeverityColor() }}
        />
        <div className="finding-content">
          <div className="finding-header-minimal">
            <h4 className="finding-title-minimal">{finding.title}</h4>
            {validationStatus !== 'pending' && (
              <span className={`status-icon ${validationStatus}`}>
                {getStatusIcon()}
              </span>
            )}
          </div>
          <p className="finding-description-minimal">
            {finding.description.substring(0, 120)}...
          </p>
          <div className="finding-meta-minimal">
            <span className="meta-item">{finding.category}</span>
            {finding.confidence && (
              <span className="meta-item">{finding.confidence}% confidence</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`finding-card-full ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
      onClick={handleClick}
    >
      <div className="finding-header-full">
        <div 
          className="severity-indicator"
          style={{ backgroundColor: getSeverityColor() }}
        >
          {finding.severity[0].toUpperCase()}
        </div>
        <div className="finding-main-content">
          <div className="finding-title-row">
            <h3 className="finding-title-full">{finding.title}</h3>
            {validationStatus !== 'pending' && (
              <span className={`validation-badge ${validationStatus}`}>
                {getStatusIcon()} {validationStatus.replace('-', ' ')}
              </span>
            )}
          </div>
          <div className="finding-meta-full">
            <span>{finding.category}</span>
            {finding.cweId && <span>CWE-{finding.cweId}</span>}
            {finding.confidence && <span>{finding.confidence}%</span>}
          </div>
        </div>
      </div>

      {!isExpanded ? (
        <div className="finding-preview-full">
          <p>{finding.description.substring(0, 200)}...</p>
        </div>
      ) : (
        <div className="finding-expanded-content">
          <div className="section">
            <h4>Description</h4>
            <ReactMarkdown>{finding.description}</ReactMarkdown>
          </div>

          {finding.impact && (
            <div className="section">
              <h4>Impact</h4>
              <ReactMarkdown>{finding.impact}</ReactMarkdown>
            </div>
          )}

          {finding.mitigations && finding.mitigations.length > 0 && (
            <div className="section">
              <h4>Mitigations</h4>
              <ul className="mitigation-list">
                {finding.mitigations.map((mitigation, index) => (
                  <li key={index}>
                    <ReactMarkdown>{mitigation}</ReactMarkdown>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};