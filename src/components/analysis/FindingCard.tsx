"use client";

import React from 'react';
import { SecurityFinding, ValidationStatus } from '@/types';
import './FindingCard.css';

interface FindingCardProps {
  finding: SecurityFinding;
  validationStatus: ValidationStatus;
  severity: 'high' | 'medium' | 'low';
  isSelected: boolean;
  onClick: () => void;
  modelLabel?: string;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  validationStatus,
  severity,
  isSelected,
  onClick,
  modelLabel
}) => {
  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'confirmed':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1C4.13 1 1 4.13 1 8C1 11.87 4.13 15 8 15C11.87 15 15 11.87 15 8C15 4.13 11.87 1 8 1ZM6.5 11.5L3 8L4.06 6.94L6.5 9.38L11.44 4.44L12.5 5.5L6.5 11.5Z"/>
          </svg>
        );
      case 'false-positive':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1C4.13 1 1 4.13 1 8C1 11.87 4.13 15 8 15C11.87 15 15 11.87 15 8C15 4.13 11.87 1 8 1ZM11 10L10 11L8 9L6 11L5 10L7 8L5 6L6 5L8 7L10 5L11 6L9 8L11 10Z"/>
          </svg>
        );
      case 'needs-review':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1C4.13 1 1 4.13 1 8C1 11.87 4.13 15 8 15C11.87 15 15 11.87 15 8C15 4.13 11.87 1 8 1ZM8 13C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11C8.55 11 9 11.45 9 12C9 12.55 8.55 13 8 13ZM9 9H7V4H9V9Z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusClass = () => {
    switch (validationStatus) {
      case 'confirmed': return 'status-confirmed';
      case 'false-positive': return 'status-false-positive';
      case 'needs-review': return 'status-needs-review';
      default: return 'status-pending';
    }
  };

  return (
    <article 
      className={`finding-card ${isSelected ? 'selected' : ''} ${getStatusClass()}`}
      onClick={onClick}
    >
      <div className="finding-header">
        <div className="finding-meta">
          <span className={`severity-badge severity-${severity}`}>
            {severity.toUpperCase()}
          </span>
          <span className="finding-category">{finding.category}</span>
          {finding.cweId && (
            <span className="finding-cwe">CWE-{finding.cweId}</span>
          )}
        </div>
        <div className="finding-status">
          {validationStatus !== 'pending' && (
            <span className={`status-icon ${getStatusClass()}`}>
              {getStatusIcon()}
            </span>
          )}
        </div>
      </div>

      <h4 className="finding-title">{finding.title}</h4>
      
      <p className="finding-description">{finding.description}</p>

      {finding.confidence && (
        <div className="finding-confidence">
          <span className="confidence-label">Confidence:</span>
          <div className="confidence-bar">
            <div 
              className="confidence-fill"
              style={{ width: `${finding.confidence}%` }}
            />
          </div>
          <span className="confidence-value">{finding.confidence}%</span>
        </div>
      )}

      {finding.mitigations && finding.mitigations.length > 0 && (
        <div className="finding-mitigations">
          <span className="mitigations-label">Mitigations:</span>
          <ul className="mitigations-list">
            {finding.mitigations.slice(0, 2).map((mitigation, index) => (
              <li key={index} className="mitigation-item">{mitigation}</li>
            ))}
            {finding.mitigations.length > 2 && (
              <li className="mitigation-more">
                +{finding.mitigations.length - 2} more
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="finding-footer">
        <span className="finding-source">
          {modelLabel || finding.modelSource}
        </span>
        <span className="finding-id">#{finding.id.slice(0, 8)}</span>
      </div>
    </article>
  );
};