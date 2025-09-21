"use client";

import React, { useState, useMemo } from 'react';
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
  hideSidebar?: boolean;
}

interface SidebarProps {
  modelAResults: SecurityFinding[];
  modelBResults: SecurityFinding[];
  modelAName?: string;
  modelBName?: string;
  validations?: Map<string, ValidationStatus>;
}

const Sidebar: React.FC<SidebarProps> = ({
  modelAResults,
  modelBResults,
  modelAName = 'Model A',
  modelBName = 'Model B',
  validations = new Map()
}) => {
  // Calculate statistics
  const stats = useMemo(() => {
    const allFindings = [...modelAResults, ...modelBResults];
    const highSeverity = allFindings.filter(f => f.severity === 'high').length;
    const mediumSeverity = allFindings.filter(f => f.severity === 'medium').length;
    const lowSeverity = allFindings.filter(f => f.severity === 'low').length;
    const validated = Array.from(validations.values()).filter(v => v !== 'pending').length;
    const confirmed = Array.from(validations.values()).filter(v => v === 'confirmed').length;

    const unifiedFindings = (() => {
      const merged = [...modelAResults, ...modelBResults];
      const uniqueMap = new Map<string, SecurityFinding>();

      merged.forEach(finding => {
        const key = finding.title;
        if (!uniqueMap.has(key) || finding.severity === 'high') {
          uniqueMap.set(key, finding);
        }
      });

      return Array.from(uniqueMap.values());
    })();

    return {
      total: allFindings.length,
      high: highSeverity,
      medium: mediumSeverity,
      low: lowSeverity,
      validated,
      confirmed,
      pending: allFindings.length - validated,
      modelA: modelAResults.length,
      modelB: modelBResults.length,
      uniqueIssues: unifiedFindings.length
    };
  }, [modelAResults, modelBResults, validations]);

  return (
    <div className="sidebar-content">
      <div className="stats-section">
        <div className="stat-group">
          <div className="stat-header">{stats.total}</div>
          <div className="stat-label">Total Findings</div>
          <div className="stat-details">
            <div className="stat-line">
              <span className="stat-indicator high"></span>
              <span className="stat-text">{stats.high} High</span>
            </div>
            <div className="stat-line">
              <span className="stat-indicator medium"></span>
              <span className="stat-text">{stats.medium} Medium</span>
            </div>
            <div className="stat-line">
              <span className="stat-indicator low"></span>
              <span className="stat-text">{stats.low} Low</span>
            </div>
          </div>
        </div>

        <div className="stat-group">
          <div className="stat-header">{stats.validated}</div>
          <div className="stat-label">Validated</div>
          <div className="stat-details">
            <div className="stat-line">
              <span className="stat-check">✓</span>
              <span className="stat-text">{stats.confirmed} Confirmed</span>
            </div>
            <div className="stat-line">
              <span className="stat-pending">○</span>
              <span className="stat-text">{stats.pending} Pending</span>
            </div>
          </div>
        </div>

        <div className="stat-group">
          <div className="stat-header">{stats.uniqueIssues}</div>
          <div className="stat-label">Unique Issues</div>
          <div className="stat-details">
            <div className="stat-line">
              <span className="stat-text">{stats.modelA} {modelAName}</span>
            </div>
            <div className="stat-line">
              <span className="stat-text">{stats.modelB} {modelBName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModelComparisonView: React.FC<ModelComparisonViewProps> & {
  Sidebar: React.FC<SidebarProps>;
} = ({
  modelAResults,
  modelBResults,
  selectedFinding,
  onFindingSelect,
  modelAName = 'Model A',
  modelBName = 'Model B',
  validations = new Map(),
  hideSidebar = false
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter findings
  const filterFindings = (findings: SecurityFinding[]) => {
    return findings.filter(finding => {
      const severityMatch = filterSeverity === 'all' || finding.severity === filterSeverity;
      const status = validations.get(finding.id) || 'pending';
      const statusMatch = filterStatus === 'all' || status === filterStatus;
      const searchMatch = searchTerm === '' ||
        finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.description.toLowerCase().includes(searchTerm.toLowerCase());

      return severityMatch && statusMatch && searchMatch;
    });
  };

  const filteredModelA = filterFindings(modelAResults);
  const filteredModelB = filterFindings(modelBResults);

  // Unified view
  const unifiedFindings = useMemo(() => {
    const merged = [...modelAResults, ...modelBResults];
    const uniqueMap = new Map<string, SecurityFinding>();

    merged.forEach(finding => {
      const key = finding.title;
      if (!uniqueMap.has(key) || finding.severity === 'high') {
        uniqueMap.set(key, finding);
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [modelAResults, modelBResults]);

  const filteredUnified = filterFindings(unifiedFindings);

  return (
    <div className={`analysis-container ${hideSidebar ? 'no-sidebar' : ''}`}>
      {/* Only show embedded sidebar if not hidden */}
      {!hideSidebar && (
        <div className="analysis-sidebar">
          <Sidebar
            modelAResults={modelAResults}
            modelBResults={modelBResults}
            modelAName={modelAName}
            modelBName={modelBName}
            validations={validations}
          />

          {/* Clean Filters */}
          <div className="filter-section">
            <input
              type="text"
              placeholder="Search findings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <div className="filter-row">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="false-positive">False Positive</option>
                <option value="needs-review">Needs Review</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="view-mode-section">
            <button
              className={`view-mode-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
              onClick={() => setViewMode('side-by-side')}
            >
              Side by Side
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'unified' ? 'active' : ''}`}
              onClick={() => setViewMode('unified')}
            >
              Unified
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="analysis-content">
        {/* Findings Display */}
        <div className="findings-container">
          {viewMode === 'side-by-side' ? (
            <div className="side-by-side-layout">
              <div className="model-section">
                <div className="model-header">
                  <h3 className="model-title">{modelAName}</h3>
                  <span className="model-count">{filteredModelA.length} of {modelAResults.length} findings</span>
                </div>
                <div className="findings-list">
                  {filteredModelA.map((finding) => (
                    <FindingCard
                      key={finding.id}
                      finding={finding}
                      validationStatus={validations.get(finding.id) || 'pending'}
                      isSelected={selectedFinding === finding.id}
                      onClick={() => onFindingSelect(finding.id)}
                      compact
                    />
                  ))}
                  {filteredModelA.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-icon">○</div>
                      <p>No findings match your filters</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="model-section">
                <div className="model-header">
                  <h3 className="model-title">{modelBName}</h3>
                  <span className="model-count">{filteredModelB.length} of {modelBResults.length} findings</span>
                </div>
                <div className="findings-list">
                  {filteredModelB.map((finding) => (
                    <FindingCard
                      key={finding.id}
                      finding={finding}
                      validationStatus={validations.get(finding.id) || 'pending'}
                      isSelected={selectedFinding === finding.id}
                      onClick={() => onFindingSelect(finding.id)}
                      compact
                    />
                  ))}
                  {filteredModelB.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-icon">○</div>
                      <p>No findings match your filters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="unified-layout">
              <div className="model-header">
                <h3 className="model-title">All Findings</h3>
                <span className="model-count">{filteredUnified.length} unique findings</span>
              </div>
              <div className="findings-grid">
                {filteredUnified.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    validationStatus={validations.get(finding.id) || 'pending'}
                    isSelected={selectedFinding === finding.id}
                    onClick={() => onFindingSelect(finding.id)}
                    compact
                  />
                ))}
                {filteredUnified.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">○</div>
                    <p>No findings match your filters</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Attach Sidebar as a static property
ModelComparisonView.Sidebar = Sidebar;