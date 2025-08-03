"use client";

import React, { useState } from 'react';
import { SecurityFinding, ValidationStatus } from '@/types';
import { FindingCard } from './FindingCard';
import './ModelComparisonView.css';

interface ModelComparisonViewProps {
  modelAResults: SecurityFinding[];
  modelBResults: SecurityFinding[];
  selectedFinding?: string;
  onFindingSelect: (findingId: string) => void;
  modelAName?: string;
  modelBName?: string;
  validations?: Map<string, ValidationStatus>;
}

export const ModelComparisonView: React.FC<ModelComparisonViewProps> = ({
  modelAResults,
  modelBResults,
  selectedFinding,
  onFindingSelect,
  modelAName = 'Model A',
  modelBName = 'Model B',
  validations = new Map()
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filterFindings = (findings: SecurityFinding[]) => {
    return findings.filter(finding => {
      const severityMatch = filterSeverity === 'all' || finding.severity === filterSeverity;
      const status = validations.get(finding.id) || 'pending';
      const statusMatch = filterStatus === 'all' || status === filterStatus;
      return severityMatch && statusMatch;
    });
  };

  const filteredModelA = filterFindings(modelAResults);
  const filteredModelB = filterFindings(modelBResults);

  // Merge findings for unified view
  const unifiedFindings = [...modelAResults, ...modelBResults]
    .filter((finding, index, self) => 
      index === self.findIndex(f => f.title === finding.title)
    )
    .sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

  const filteredUnified = filterFindings(unifiedFindings);

  return (
    <div className="model-comparison-view">
      <div className="comparison-header">
        <h2 className="comparison-title">Security Analysis Results</h2>
        
        <div className="comparison-controls">
          <div className="filter-group">
            <label className="filter-label">Severity:</label>
            <select 
              className="filter-select"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Status:</label>
            <select 
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="confirmed">Confirmed</option>
              <option value="false-positive">False Positive</option>
              <option value="needs-review">Needs Review</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
              onClick={() => setViewMode('side-by-side')}
            >
              Side by Side
            </button>
            <button
              className={`toggle-btn ${viewMode === 'unified' ? 'active' : ''}`}
              onClick={() => setViewMode('unified')}
            >
              Unified
            </button>
          </div>
        </div>
      </div>


      <div className="comparison-content">
        {viewMode === 'side-by-side' ? (
          <div className="side-by-side-view">
            <div className="model-column">
              <div className="model-header">
                <h3 className="model-name">{modelAName}</h3>
                <span className="findings-count">
                  {filteredModelA.length} findings
                </span>
              </div>
              <div className="findings-list">
                {filteredModelA.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    validationStatus={validations.get(finding.id) || 'pending'}
                    severity={finding.severity}
                    isSelected={selectedFinding === finding.id}
                    onClick={() => onFindingSelect(finding.id)}
                    modelLabel={modelAName}
                  />
                ))}
                {filteredModelA.length === 0 && (
                  <div className="empty-findings">
                    No findings match the selected filters
                  </div>
                )}
              </div>
            </div>

            <div className="model-column">
              <div className="model-header">
                <h3 className="model-name">{modelBName}</h3>
                <span className="findings-count">
                  {filteredModelB.length} findings
                </span>
              </div>
              <div className="findings-list">
                {filteredModelB.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    validationStatus={validations.get(finding.id) || 'pending'}
                    severity={finding.severity}
                    isSelected={selectedFinding === finding.id}
                    onClick={() => onFindingSelect(finding.id)}
                    modelLabel={modelBName}
                  />
                ))}
                {filteredModelB.length === 0 && (
                  <div className="empty-findings">
                    No findings match the selected filters
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="unified-view">
            <div className="unified-header">
              <h3 className="unified-title">All Findings</h3>
              <span className="findings-count">
                {filteredUnified.length} unique findings
              </span>
            </div>
            <div className="unified-findings">
              {filteredUnified.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  validationStatus={validations.get(finding.id) || 'pending'}
                  severity={finding.severity}
                  isSelected={selectedFinding === finding.id}
                  onClick={() => onFindingSelect(finding.id)}
                />
              ))}
              {filteredUnified.length === 0 && (
                <div className="empty-findings">
                  No findings match the selected filters
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="comparison-stats">
        <div className="stat-item">
          <span className="stat-label">Total Findings:</span>
          <span className="stat-value">{modelAResults.length + modelBResults.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">High Severity:</span>
          <span className="stat-value stat-high">
            {[...modelAResults, ...modelBResults].filter(f => f.severity === 'high').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Validated:</span>
          <span className="stat-value stat-validated">
            {Array.from(validations.values()).filter(v => v !== 'pending').length}
          </span>
        </div>
      </div>
    </div>
  );
};