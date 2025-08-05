"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { SecurityFinding, FindingValidation } from '@/types';
import { RatingScale } from './RatingScale';
import { StatusButtons } from './StatusButtons';
import { ValidationNotes } from './ValidationNotes';
import './ValidationControls.css';

interface ValidationControlsProps {
  finding: SecurityFinding | null;
  validation: FindingValidation | null;
  onValidationUpdate: (validation: FindingValidation) => void;
}

export const ValidationControls: React.FC<ValidationControlsProps> = ({
  finding,
  validation,
  onValidationUpdate
}) => {
  const [localValidation, setLocalValidation] = useState<Partial<FindingValidation>>({
    status: validation?.status || 'pending',
    accuracy: validation?.accuracy || 3,
    completeness: validation?.completeness || 3,
    relevance: validation?.relevance || 3,
    actionability: validation?.actionability || 3,
    notes: validation?.notes || ''
  });

  if (!finding) {
    return (
      <div className="validation-controls empty">
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor" opacity="0.2">
            <path d="M24 4C12.95 4 4 12.95 4 24C4 35.05 12.95 44 24 44C35.05 44 44 35.05 44 24C44 12.95 35.05 4 24 4ZM24 40C15.18 40 8 32.82 8 24C8 15.18 15.18 8 24 8C32.82 8 40 15.18 40 24C40 32.82 32.82 40 24 40Z"/>
            <path d="M22 14H26V26H22V14ZM22 30H26V34H22V30Z"/>
          </svg>
          <p className="empty-text">Select a finding to validate</p>
        </div>
      </div>
    );
  }

  const handleStatusChange = (status: FindingValidation['status']) => {
    const updated = { ...localValidation, status };
    setLocalValidation(updated);
    
    if (finding) {
      onValidationUpdate({
        findingId: finding.id,
        status,
        accuracy: updated.accuracy || 3,
        completeness: updated.completeness || 3,
        relevance: updated.relevance || 3,
        actionability: updated.actionability || 3,
        notes: updated.notes || '',
        validatedBy: 'current-user', // TODO: Get from auth context
        validatedAt: new Date().toISOString()
      });
    }
  };

  const handleRatingChange = (dimension: keyof FindingValidation, value: number) => {
    const updated = { ...localValidation, [dimension]: value };
    setLocalValidation(updated);
    
    if (finding && localValidation.status && localValidation.status !== 'pending') {
      onValidationUpdate({
        findingId: finding.id,
        status: localValidation.status,
        accuracy: updated.accuracy || 3,
        completeness: updated.completeness || 3,
        relevance: updated.relevance || 3,
        actionability: updated.actionability || 3,
        notes: updated.notes || '',
        validatedBy: 'current-user',
        validatedAt: new Date().toISOString()
      });
    }
  };

  const handleNotesChange = (notes: string) => {
    const updated = { ...localValidation, notes };
    setLocalValidation(updated);
    
    if (finding && localValidation.status && localValidation.status !== 'pending') {
      onValidationUpdate({
        findingId: finding.id,
        status: localValidation.status,
        accuracy: updated.accuracy || 3,
        completeness: updated.completeness || 3,
        relevance: updated.relevance || 3,
        actionability: updated.actionability || 3,
        notes,
        validatedBy: 'current-user',
        validatedAt: new Date().toISOString()
      });
    }
  };

  return (
    <div className="validation-controls">
      <div className="validation-header">
        <h3 className="validation-title">Validate Finding</h3>
        <span className="finding-id">#{finding.id.slice(0, 8)}</span>
      </div>

      <div className="validation-finding">
        <div className="finding-summary">
          <span className={`severity-badge severity-${finding.severity}`}>
            {finding.severity.toUpperCase()}
          </span>
          <h4 className="finding-title">{finding.title}</h4>
        </div>
        <div className="finding-description">
          <ReactMarkdown>{finding.description}</ReactMarkdown>
        </div>
      </div>

      <div className="validation-section">
        <h4 className="section-title">Validation Status</h4>
        <StatusButtons
          status={localValidation.status as FindingValidation['status']}
          onChange={handleStatusChange}
        />
      </div>

      {localValidation.status !== 'pending' && (
        <>
          <div className="validation-section">
            <h4 className="section-title">Quality Assessment</h4>
            <div className="rating-scales">
              <RatingScale
                label="Accuracy"
                value={localValidation.accuracy || 3}
                onChange={(value) => handleRatingChange('accuracy', value)}
                scale={5}
              />
              <RatingScale
                label="Completeness"
                value={localValidation.completeness || 3}
                onChange={(value) => handleRatingChange('completeness', value)}
                scale={5}
              />
              <RatingScale
                label="Relevance"
                value={localValidation.relevance || 3}
                onChange={(value) => handleRatingChange('relevance', value)}
                scale={5}
              />
              <RatingScale
                label="Actionability"
                value={localValidation.actionability || 3}
                onChange={(value) => handleRatingChange('actionability', value)}
                scale={5}
              />
            </div>
          </div>

          <div className="validation-section">
            <h4 className="section-title">Notes & Comments</h4>
            <ValidationNotes
              value={localValidation.notes || ''}
              onChange={handleNotesChange}
              placeholder="Add notes about this finding..."
            />
          </div>
        </>
      )}

      <div className="validation-footer">
        <div className="validation-meta">
          <span className="meta-label">Model:</span>
          <span className="meta-value">{finding.modelSource}</span>
        </div>
        {finding.cweId && (
          <div className="validation-meta">
            <span className="meta-label">CWE:</span>
            <span className="meta-value">CWE-{finding.cweId}</span>
          </div>
        )}
      </div>
    </div>
  );
};