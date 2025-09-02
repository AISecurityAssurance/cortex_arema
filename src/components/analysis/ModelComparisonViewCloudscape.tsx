"use client";

import React, { useState, useMemo } from 'react';
import { 
  Container,
  Header,
  SpaceBetween,
  Box,
  Grid,
  Cards,
  TextFilter,
  Select,
  Toggle,
  Badge,
  Button,
  StatusIndicator,
  ColumnLayout,
  ExpandableSection
} from '@cloudscape-design/components';
import { SecurityFinding, ValidationStatus } from '@/types';

interface ModelComparisonViewProps {
  modelAResults: SecurityFinding[];
  modelBResults: SecurityFinding[];
  selectedFinding?: string;
  onFindingSelect: (findingId: string) => void;
  modelAName?: string;
  modelBName?: string;
  validations?: Map<string, ValidationStatus>;
  onValidationUpdate?: (validation: any) => void;
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
  console.log("ModelComparisonView props:");
  console.log("modelAResults:", modelAResults);
  console.log("modelBResults:", modelBResults);
  console.log("Model A count:", modelAResults?.length);
  console.log("Model B count:", modelBResults?.length);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate statistics
  const stats = useMemo(() => {
    const allFindings = [...modelAResults, ...modelBResults];
    const highSeverity = allFindings.filter(f => f.severity === 'high').length;
    const mediumSeverity = allFindings.filter(f => f.severity === 'medium').length;
    const lowSeverity = allFindings.filter(f => f.severity === 'low').length;
    const validated = Array.from(validations.values()).filter(v => v !== 'pending').length;
    const confirmed = Array.from(validations.values()).filter(v => v === 'confirmed').length;
    
    return {
      total: allFindings.length,
      high: highSeverity,
      medium: mediumSeverity,
      low: lowSeverity,
      validated,
      confirmed,
      pending: allFindings.length - validated,
      modelA: modelAResults.length,
      modelB: modelBResults.length
    };
  }, [modelAResults, modelBResults, validations]);

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

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return 'red';
      case 'medium': return 'severity-medium';
      case 'low': return 'blue';
      default: return 'grey';
    }
  };

  const getStatusIcon = (status: ValidationStatus) => {
    switch(status) {
      case 'confirmed': return <StatusIndicator type="success">Confirmed</StatusIndicator>;
      case 'false-positive': return <StatusIndicator type="stopped">False Positive</StatusIndicator>;
      case 'needs-review': return <StatusIndicator type="warning">Needs Review</StatusIndicator>;
      default: return <StatusIndicator type="pending">Pending</StatusIndicator>;
    }
  };

  const renderFindingCard = (finding: SecurityFinding) => {
    const status = validations.get(finding.id) || 'pending';
    const isSelected = selectedFinding === finding.id;
    
    return (
      <Container
        key={finding.id}
        header={
          <Header
            variant="h3"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Badge color={getSeverityColor(finding.severity)}>
                  {finding.severity.toUpperCase()}
                </Badge>
                {getStatusIcon(status)}
              </SpaceBetween>
            }
          >
            {finding.title}
          </Header>
        }
        footer={
          <Box float="right">
            <Button 
              onClick={() => onFindingSelect(finding.id)}
              variant={isSelected ? "primary" : "normal"}
            >
              {isSelected ? "Selected" : "Select"}
            </Button>
          </Box>
        }
      >
        <SpaceBetween size="xs">
          <Box variant="p">{finding.description}</Box>
          {finding.category && (
            <Box>
              <Box variant="awsui-key-label">Category:</Box> {finding.category}
            </Box>
          )}
          {finding.cweId && (
            <Box>
              <Box variant="awsui-key-label">CWE:</Box> {finding.cweId}
            </Box>
          )}
          <Box fontSize="body-s" color="text-status-inactive">
            Source: {finding.modelSource}
          </Box>
        </SpaceBetween>
      </Container>
    );
  };

  return (
    <Grid
      gridDefinition={[
        { colspan: { default: 12, s: 3 } },
        { colspan: { default: 12, s: 9 } }
      ]}
    >
      {/* Sidebar Stats */}
      <Container
        header={<Header variant="h2">Analysis Overview</Header>}
      >
        <SpaceBetween size="l">
          <Box>
            <Box variant="awsui-key-label">Total Findings</Box>
            <Box fontSize="display-l" fontWeight="bold">{stats.total}</Box>
          </Box>
          
          <SpaceBetween size="xs">
            <Box>
              <StatusIndicator type="error">High: {stats.high}</StatusIndicator>
            </Box>
            <Box>
              <StatusIndicator type="warning">Medium: {stats.medium}</StatusIndicator>
            </Box>
            <Box>
              <StatusIndicator type="info">Low: {stats.low}</StatusIndicator>
            </Box>
          </SpaceBetween>

          <SpaceBetween size="xs">
            <Box variant="awsui-key-label">Validation Status</Box>
            <Box>✓ Confirmed: {stats.confirmed}</Box>
            <Box>⏳ Pending: {stats.pending}</Box>
            <Box>✓ Validated: {stats.validated}</Box>
          </SpaceBetween>

          <SpaceBetween size="xs">
            <Box variant="awsui-key-label">Model Results</Box>
            <Box>{modelAName}: {stats.modelA}</Box>
            <Box>{modelBName}: {stats.modelB}</Box>
          </SpaceBetween>
        </SpaceBetween>
      </Container>

      {/* Main Content */}
      <Container
        header={
          <Header
            variant="h2"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Toggle
                  checked={viewMode === 'unified'}
                  onChange={({ detail }) => setViewMode(detail.checked ? 'unified' : 'side-by-side')}
                >
                  Unified View
                </Toggle>
                <Select
                  selectedOption={{ value: filterSeverity, label: filterSeverity === 'all' ? 'All Severities' : filterSeverity }}
                  onChange={({ detail }) => setFilterSeverity(detail.selectedOption?.value || 'all')}
                  options={[
                    { value: 'all', label: 'All Severities' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' }
                  ]}
                />
                <Select
                  selectedOption={{ value: filterStatus, label: filterStatus === 'all' ? 'All Status' : filterStatus }}
                  onChange={({ detail }) => setFilterStatus(detail.selectedOption?.value || 'all')}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'false-positive', label: 'False Positive' },
                    { value: 'needs-review', label: 'Needs Review' },
                    { value: 'pending', label: 'Pending' }
                  ]}
                />
              </SpaceBetween>
            }
          >
            Security Findings
          </Header>
        }
      >
        <SpaceBetween size="m">
          <TextFilter
            filteringText={searchTerm}
            onChange={({ detail }) => setSearchTerm(detail.filteringText)}
            filteringPlaceholder="Search findings..."
            filteringAriaLabel="Filter findings"
          />

          {viewMode === 'side-by-side' ? (
            <ColumnLayout columns={2} variant="text-grid">
              <SpaceBetween size="m">
                <Header variant="h3">
                  {modelAName} ({filteredModelA.length})
                </Header>
                {filteredModelA.length === 0 ? (
                  <Box textAlign="center" color="text-status-inactive">
                    No findings match the current filters
                  </Box>
                ) : (
                  filteredModelA.map(finding => renderFindingCard(finding))
                )}
              </SpaceBetween>

              <SpaceBetween size="m">
                <Header variant="h3">
                  {modelBName} ({filteredModelB.length})
                </Header>
                {filteredModelB.length === 0 ? (
                  <Box textAlign="center" color="text-status-inactive">
                    No findings match the current filters
                  </Box>
                ) : (
                  filteredModelB.map(finding => renderFindingCard(finding))
                )}
              </SpaceBetween>
            </ColumnLayout>
          ) : (
            <SpaceBetween size="m">
              {filteredUnified.length === 0 ? (
                <Box textAlign="center" color="text-status-inactive">
                  No findings match the current filters
                </Box>
              ) : (
                filteredUnified.map(finding => renderFindingCard(finding))
              )}
            </SpaceBetween>
          )}
        </SpaceBetween>
      </Container>
    </Grid>
  );
};