"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { SecurityFinding, FindingValidation } from '@/types';
import { RatingScale } from './RatingScale';
import { StatusButtons } from './StatusButtons';
import { ValidationNotes } from './ValidationNotes';
import './ValidationControls.css';

interface ValidationControlsProps {
  finding: SecurityFinding | null;
  validation: FindingValidation | null;
  remediationValidations?: Map<string, FindingValidation>; // Map of remediation ID to validation
  onValidationUpdate: (validation: FindingValidation) => void;
  onRemediationValidationUpdate?: (validation: FindingValidation, remediationIndex: number) => void;
}

export const ValidationControls: React.FC<ValidationControlsProps> = ({
  finding,
  validation,
  remediationValidations = new Map(),
  onValidationUpdate,
  onRemediationValidationUpdate
}) => {
  const [localValidation, setLocalValidation] = useState<Partial<FindingValidation>>({
    status: validation?.status || 'pending',
    accuracy: validation?.accuracy || 3,
    completeness: validation?.completeness || 3,
    relevance: validation?.relevance || 3,
    actionability: validation?.actionability || 3,
    notes: validation?.notes || ''
  });

  // State for remediation validations (one for each remediation)
  const [localRemediationValidations, setLocalRemediationValidations] = useState<Map<number, Partial<FindingValidation>>>(
    new Map()
  );

  // Update local state when switching to a different finding
  useEffect(() => {
    setLocalValidation({
      status: validation?.status || 'pending',
      accuracy: validation?.accuracy || 3,
      completeness: validation?.completeness || 3,
      relevance: validation?.relevance || 3,
      actionability: validation?.actionability || 3,
      notes: validation?.notes || ''
    });

    // Initialize remediation validations from props
    if (finding?.mitigations) {
      const newRemediationValidations = new Map<number, Partial<FindingValidation>>();
      finding.mitigations.forEach((_, index) => {
        const remediationId = `${finding.id}-remediation-${index}`;
        const existingValidation = remediationValidations.get(remediationId);
        newRemediationValidations.set(index, {
          status: existingValidation?.status || 'pending',
          accuracy: existingValidation?.accuracy || 3,
          completeness: existingValidation?.completeness || 3,
          relevance: existingValidation?.relevance || 3,
          actionability: existingValidation?.actionability || 3,
          notes: existingValidation?.notes || ''
        });
      });
      setLocalRemediationValidations(newRemediationValidations);
    } else {
      setLocalRemediationValidations(new Map());
    }
  }, [finding?.id, remediationValidations]); // Reset when finding changes

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
    // If clicking the same status that's already selected, unselect it (set to pending)
    const newStatus = localValidation.status === status ? 'pending' : status;
    const updated = { ...localValidation, status: newStatus };
    setLocalValidation(updated);
    
    if (finding) {
      onValidationUpdate({
        findingId: finding.id,
        status: newStatus,
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
        {/* Debug: Show if mitigations exist */}
        {finding.mitigations && finding.mitigations.length > 0 && (
          <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.25rem' }}>
            <small style={{ color: '#10b981' }}>
              ✓ {finding.mitigations.length} mitigation(s) found
            </small>
          </div>
        )}
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

      {/* Remediation Validation Sections */}
      {finding.mitigations && finding.mitigations.length > 0 && (
        <>
          {finding.mitigations.map((remediation, index) => {
            const remediationValidation = localRemediationValidations.get(index);

            const handleRemediationStatusChange = (status: FindingValidation['status']) => {
              const newStatus = remediationValidation?.status === status ? 'pending' : status;
              const updated = new Map(localRemediationValidations);
              updated.set(index, { ...remediationValidation, status: newStatus });
              setLocalRemediationValidations(updated);

              if (onRemediationValidationUpdate) {
                onRemediationValidationUpdate({
                  findingId: `${finding.id}-remediation-${index}`,
                  status: newStatus,
                  accuracy: remediationValidation?.accuracy || 3,
                  completeness: remediationValidation?.completeness || 3,
                  relevance: remediationValidation?.relevance || 3,
                  actionability: remediationValidation?.actionability || 3,
                  notes: remediationValidation?.notes || '',
                  validatedBy: 'current-user',
                  validatedAt: new Date().toISOString()
                }, index);
              }
            };

            const handleRemediationRatingChange = (dimension: keyof FindingValidation, value: number) => {
              const updated = new Map(localRemediationValidations);
              updated.set(index, { ...remediationValidation, [dimension]: value });
              setLocalRemediationValidations(updated);

              if (onRemediationValidationUpdate && remediationValidation?.status && remediationValidation.status !== 'pending') {
                onRemediationValidationUpdate({
                  findingId: `${finding.id}-remediation-${index}`,
                  status: remediationValidation.status,
                  accuracy: dimension === 'accuracy' ? value : (remediationValidation?.accuracy || 3),
                  completeness: dimension === 'completeness' ? value : (remediationValidation?.completeness || 3),
                  relevance: dimension === 'relevance' ? value : (remediationValidation?.relevance || 3),
                  actionability: dimension === 'actionability' ? value : (remediationValidation?.actionability || 3),
                  notes: remediationValidation?.notes || '',
                  validatedBy: 'current-user',
                  validatedAt: new Date().toISOString()
                }, index);
              }
            };

            const handleRemediationNotesChange = (notes: string) => {
              const updated = new Map(localRemediationValidations);
              updated.set(index, { ...remediationValidation, notes });
              setLocalRemediationValidations(updated);

              if (onRemediationValidationUpdate && remediationValidation?.status && remediationValidation.status !== 'pending') {
                onRemediationValidationUpdate({
                  findingId: `${finding.id}-remediation-${index}`,
                  status: remediationValidation.status,
                  accuracy: remediationValidation?.accuracy || 3,
                  completeness: remediationValidation?.completeness || 3,
                  relevance: remediationValidation?.relevance || 3,
                  actionability: remediationValidation?.actionability || 3,
                  notes,
                  validatedBy: 'current-user',
                  validatedAt: new Date().toISOString()
                }, index);
              }
            };

            return (
              <div key={index} className="remediation-validation-section">
                <div className="validation-header">
                  <h3 className="validation-title">Validate Remediation {index + 1}</h3>
                </div>

                <div className="validation-finding">
                  <div className="finding-description">
                    <ReactMarkdown>{remediation}</ReactMarkdown>
                  </div>
                </div>

                <div className="validation-section">
                  <h4 className="section-title">Remediation Status</h4>
                  <StatusButtons
                    status={remediationValidation?.status as FindingValidation['status'] || 'pending'}
                    onChange={handleRemediationStatusChange}
                  />
                </div>

                {remediationValidation?.status && remediationValidation.status !== 'pending' && (
                  <>
                    <div className="validation-section">
                      <h4 className="section-title">Quality Assessment</h4>
                      <div className="rating-scales">
                        <RatingScale
                          label="Accuracy"
                          value={remediationValidation?.accuracy || 3}
                          onChange={(value) => handleRemediationRatingChange('accuracy', value)}
                          scale={5}
                        />
                        <RatingScale
                          label="Completeness"
                          value={remediationValidation?.completeness || 3}
                          onChange={(value) => handleRemediationRatingChange('completeness', value)}
                          scale={5}
                        />
                        <RatingScale
                          label="Relevance"
                          value={remediationValidation?.relevance || 3}
                          onChange={(value) => handleRemediationRatingChange('relevance', value)}
                          scale={5}
                        />
                        <RatingScale
                          label="Actionability"
                          value={remediationValidation?.actionability || 3}
                          onChange={(value) => handleRemediationRatingChange('actionability', value)}
                          scale={5}
                        />
                      </div>
                    </div>

                    <div className="validation-section">
                      <h4 className="section-title">Notes & Comments</h4>
                      <ValidationNotes
                        value={remediationValidation?.notes || ''}
                        onChange={handleRemediationNotesChange}
                        placeholder="Add notes about this remediation..."
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
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