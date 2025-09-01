"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Badge,
  Button,
  ButtonGroup,
  FormField,
  Textarea,
  RadioGroup,
  Grid,
  Alert,
  StatusIndicator,
  ColumnLayout
} from '@cloudscape-design/components';
import { SecurityFinding, FindingValidation } from '@/types';

interface ValidationControlsProps {
  finding: SecurityFinding | null;
  validation: FindingValidation | null;
  onValidationUpdate: (validation: FindingValidation) => void;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high': return 'red';
    case 'medium': return 'severity-medium';
    case 'low': return 'blue';
    default: return 'grey';
  }
};

const getStatusType = (status: string): "success" | "error" | "warning" | "info" | "stopped" | "pending" | "in-progress" | "loading" => {
  switch (status) {
    case 'confirmed': return 'success';
    case 'false-positive': return 'error';
    case 'needs-review': return 'warning';
    case 'pending': return 'pending';
    default: return 'info';
  }
};

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
      <Container>
        <Box textAlign="center" padding={{ vertical: "xxl" }}>
          <Box fontSize="heading-l" color="text-status-inactive" margin={{ bottom: "m" }}>
            Select a finding to validate
          </Box>
          <Box color="text-body-secondary">
            Choose a security finding from the list to begin validation
          </Box>
        </Box>
      </Container>
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
        validatedBy: 'current-user',
        validatedAt: new Date().toISOString()
      });
    }
  };

  const handleRatingChange = (dimension: keyof FindingValidation, value: string) => {
    const numValue = parseInt(value);
    const updated = { ...localValidation, [dimension]: numValue };
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

  const ratingOptions = [
    { label: "1 - Poor", value: "1" },
    { label: "2 - Below Average", value: "2" },
    { label: "3 - Average", value: "3" },
    { label: "4 - Good", value: "4" },
    { label: "5 - Excellent", value: "5" }
  ];

  return (
    <SpaceBetween direction="vertical" size="l">
      <Container
        header={
          <Header
            variant="h3"
            info={<Badge color="grey">#{finding.id.slice(0, 8)}</Badge>}
          >
            Validate Finding
          </Header>
        }
      >
        <SpaceBetween direction="vertical" size="m">
          <Box>
            <SpaceBetween direction="horizontal" size="xs">
              <Badge color={getSeverityColor(finding.severity)}>
                {finding.severity.toUpperCase()}
              </Badge>
              <Box fontSize="heading-s">{finding.title}</Box>
            </SpaceBetween>
          </Box>
          
          <Box color="text-body-secondary">
            <ReactMarkdown>{finding.description}</ReactMarkdown>
          </Box>

          {finding.modelSource && (
            <ColumnLayout columns={2} variant="text-grid">
              <div>
                <Box color="text-label">Model Source</Box>
                <Box>{finding.modelSource}</Box>
              </div>
              {finding.cweId && (
                <div>
                  <Box color="text-label">CWE ID</Box>
                  <Box>CWE-{finding.cweId}</Box>
                </div>
              )}
            </ColumnLayout>
          )}
        </SpaceBetween>
      </Container>

      <Container
        header={<Header variant="h3">Validation Status</Header>}
      >
        <ButtonGroup>
          <Button
            variant={localValidation.status === 'confirmed' ? 'primary' : 'normal'}
            onClick={() => handleStatusChange('confirmed')}
            iconName="status-positive"
          >
            Confirmed
          </Button>
          <Button
            variant={localValidation.status === 'false-positive' ? 'primary' : 'normal'}
            onClick={() => handleStatusChange('false-positive')}
            iconName="status-negative"
          >
            False Positive
          </Button>
          <Button
            variant={localValidation.status === 'needs-review' ? 'primary' : 'normal'}
            onClick={() => handleStatusChange('needs-review')}
            iconName="status-warning"
          >
            Needs Review
          </Button>
          <Button
            variant={localValidation.status === 'pending' ? 'primary' : 'normal'}
            onClick={() => handleStatusChange('pending')}
            iconName="status-pending"
          >
            Pending
          </Button>
        </ButtonGroup>
      </Container>

      {localValidation.status !== 'pending' && (
        <>
          <Container
            header={<Header variant="h3">Quality Assessment</Header>}
          >
            <SpaceBetween direction="vertical" size="m">
              <FormField label="Accuracy">
                <RadioGroup
                  onChange={({ detail }) => handleRatingChange('accuracy', detail.value)}
                  value={String(localValidation.accuracy)}
                  items={ratingOptions}
                />
              </FormField>

              <FormField label="Completeness">
                <RadioGroup
                  onChange={({ detail }) => handleRatingChange('completeness', detail.value)}
                  value={String(localValidation.completeness)}
                  items={ratingOptions}
                />
              </FormField>

              <FormField label="Relevance">
                <RadioGroup
                  onChange={({ detail }) => handleRatingChange('relevance', detail.value)}
                  value={String(localValidation.relevance)}
                  items={ratingOptions}
                />
              </FormField>

              <FormField label="Actionability">
                <RadioGroup
                  onChange={({ detail }) => handleRatingChange('actionability', detail.value)}
                  value={String(localValidation.actionability)}
                  items={ratingOptions}
                />
              </FormField>
            </SpaceBetween>
          </Container>

          <Container
            header={<Header variant="h3">Notes & Comments</Header>}
          >
            <FormField>
              <Textarea
                onChange={({ detail }) => handleNotesChange(detail.value)}
                value={localValidation.notes || ''}
                placeholder="Add notes about this finding..."
                rows={5}
              />
            </FormField>
          </Container>
        </>
      )}
    </SpaceBetween>
  );
};