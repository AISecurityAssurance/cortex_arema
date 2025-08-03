"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  AnalysisSession, 
  SecurityFinding, 
  FindingValidation,
  PromptTemplate 
} from '@/types';
import { SessionStorage } from '@/lib/storage/sessionStorage';
import { ValidationStorage } from '@/lib/storage/validationStorage';

export function useAnalysisSession(sessionId?: string) {
  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load session on mount or ID change
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      const loadedSession = SessionStorage.getSession(sessionId);
      if (loadedSession) {
        setSession(loadedSession);
      } else {
        setError('Session not found');
      }
    } catch (err) {
      setError('Failed to load session');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Create new session
  const createSession = useCallback((name: string) => {
    try {
      const newSession = SessionStorage.createSession(name);
      setSession(newSession);
      return newSession;
    } catch (err) {
      setError('Failed to create session');
      console.error(err);
      return null;
    }
  }, []);

  // Update session
  const updateSession = useCallback((updates: Partial<AnalysisSession>) => {
    if (!session) return;

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    SessionStorage.saveSession(updatedSession);
    setSession(updatedSession);
  }, [session]);

  // Update findings
  const updateFindings = useCallback((
    modelAResults: SecurityFinding[],
    modelBResults: SecurityFinding[]
  ) => {
    if (!session) return;

    SessionStorage.updateSessionFindings(session.id, modelAResults, modelBResults);
    
    const updatedSession = {
      ...session,
      modelAResults,
      modelBResults,
      progress: {
        ...session.progress,
        totalFindings: modelAResults.length + modelBResults.length
      }
    };
    
    setSession(updatedSession);
  }, [session]);

  // Save validation
  const saveValidation = useCallback((validation: FindingValidation) => {
    if (!session) return;

    ValidationStorage.saveValidation(session.id, validation);
    
    // Reload session to get updated validations and progress
    const reloadedSession = SessionStorage.getSession(session.id);
    if (reloadedSession) {
      setSession(reloadedSession);
    }
  }, [session]);

  // Get validation for a finding
  const getValidation = useCallback((findingId: string): FindingValidation | null => {
    if (!session) return null;
    return ValidationStorage.getValidation(session.id, findingId);
  }, [session]);

  // Update template
  const updateTemplate = useCallback((template: PromptTemplate) => {
    if (!session) return;
    updateSession({ promptTemplate: template });
  }, [session, updateSession]);

  // Update models
  const updateModels = useCallback((modelAId: string, modelBId: string) => {
    if (!session) return;
    updateSession({ modelAId, modelBId });
  }, [session, updateSession]);

  // Get validation statistics
  const getValidationStats = useCallback(() => {
    if (!session) return null;
    return ValidationStorage.getValidationStats(session.id);
  }, [session]);

  return {
    session,
    loading,
    error,
    createSession,
    updateSession,
    updateFindings,
    saveValidation,
    getValidation,
    updateTemplate,
    updateModels,
    getValidationStats
  };
}