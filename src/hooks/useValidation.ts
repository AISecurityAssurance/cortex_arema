"use client";

import { useState, useCallback, useMemo } from 'react';
import { FindingValidation, ValidationStatus } from '@/types';

interface UseValidationProps {
  sessionId?: string;
  onValidationSave?: (validation: FindingValidation) => void;
}

export function useValidation({ sessionId, onValidationSave }: UseValidationProps = {}) {
  const [validations, setValidations] = useState<Map<string, FindingValidation>>(new Map());
  const [currentValidation, setCurrentValidation] = useState<FindingValidation | null>(null);

  // Add or update validation (remove if status is pending)
  const addValidation = useCallback((validation: FindingValidation) => {
    setValidations(prev => {
      const next = new Map(prev);
      // If status is pending, remove the validation entirely
      if (validation.status === 'pending') {
        next.delete(validation.findingId);
      } else {
        next.set(validation.findingId, validation);
      }
      return next;
    });

    if (onValidationSave) {
      onValidationSave(validation);
    }
  }, [onValidationSave]);

  // Get validation status for a finding
  const getStatus = useCallback((findingId: string): ValidationStatus => {
    const validation = validations.get(findingId);
    return validation?.status || 'pending';
  }, [validations]);

  // Set current validation for editing
  const selectValidation = useCallback((findingId: string) => {
    const validation = validations.get(findingId);
    setCurrentValidation(validation || null);
  }, [validations]);

  // Calculate progress
  const progress = useMemo(() => {
    const all = Array.from(validations.values());
    const total = all.length;
    const validated = all.filter(v => v.status !== 'pending').length;
    const confirmed = all.filter(v => v.status === 'confirmed').length;
    const falsePositives = all.filter(v => v.status === 'false-positive').length;
    const needsReview = all.filter(v => v.status === 'needs-review').length;

    return {
      totalFindings: total,
      validatedFindings: validated,
      confirmedFindings: confirmed,
      falsePositives,
      needsReview,
      percentComplete: total > 0 ? (validated / total) * 100 : 0
    };
  }, [validations]);

  // Get all validations as array
  const getAllValidations = useCallback(() => {
    return Array.from(validations.values());
  }, [validations]);

  // Clear all validations
  const clearValidations = useCallback(() => {
    setValidations(new Map());
    setCurrentValidation(null);
  }, []);

  // Batch update validations
  const setAllValidations = useCallback((newValidations: FindingValidation[]) => {
    const map = new Map<string, FindingValidation>();
    newValidations.forEach(v => map.set(v.findingId, v));
    setValidations(map);
  }, []);

  return {
    validations,
    currentValidation,
    progress,
    addValidation,
    getStatus,
    selectValidation,
    getAllValidations,
    clearValidations,
    setAllValidations
  };
}