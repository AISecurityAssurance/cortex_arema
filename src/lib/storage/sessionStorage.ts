import { AnalysisSession, SecurityFinding } from '@/types';

const STORAGE_KEY = 'cortex_security_sessions';

export class SessionStorage {
  static getAllSessions(): AnalysisSession[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    try {
      const sessions = JSON.parse(stored);
      return sessions.sort((a: AnalysisSession, b: AnalysisSession) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Error parsing sessions:', error);
      return [];
    }
  }

  static getSession(id: string): AnalysisSession | null {
    const sessions = this.getAllSessions();
    return sessions.find(s => s.id === id) || null;
  }

  static saveSession(session: AnalysisSession): void {
    if (typeof window === 'undefined') return;
    
    const sessions = this.getAllSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    const updatedSession = {
      ...session,
      updatedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = updatedSession;
    } else {
      sessions.push(updatedSession);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }

  static createSession(name: string): AnalysisSession {
    const now = new Date().toISOString();
    const session: AnalysisSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      promptTemplate: null,
      modelAId: '',
      modelBId: '',
      modelAResults: [],
      modelBResults: [],
      validations: [],
      progress: {
        totalFindings: 0,
        validatedFindings: 0,
        confirmedFindings: 0,
        falsePositives: 0
      },
      createdAt: now,
      updatedAt: now
    };
    
    this.saveSession(session);
    return session;
  }

  static deleteSession(id: string): void {
    if (typeof window === 'undefined') return;
    
    const sessions = this.getAllSessions();
    const filtered = sessions.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  static updateSessionFindings(
    sessionId: string, 
    modelA: SecurityFinding[], 
    modelB: SecurityFinding[]
  ): void {
    const session = this.getSession(sessionId);
    if (!session) return;
    
    session.modelAResults = modelA;
    session.modelBResults = modelB;
    session.progress.totalFindings = modelA.length + modelB.length;
    
    this.saveSession(session);
  }

  static updateSessionProgress(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;
    
    const validatedCount = session.validations.filter(v => v.status !== 'pending').length;
    const confirmedCount = session.validations.filter(v => v.status === 'confirmed').length;
    const falsePositiveCount = session.validations.filter(v => v.status === 'false-positive').length;
    
    session.progress = {
      totalFindings: session.modelAResults.length + session.modelBResults.length,
      validatedFindings: validatedCount,
      confirmedFindings: confirmedCount,
      falsePositives: falsePositiveCount
    };
    
    this.saveSession(session);
  }

  static exportSession(sessionId: string): string | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    
    return JSON.stringify(session, null, 2);
  }

  static importSession(jsonData: string): AnalysisSession | null {
    try {
      const session = JSON.parse(jsonData);
      // Generate new ID to avoid conflicts
      session.id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      session.updatedAt = new Date().toISOString();
      
      this.saveSession(session);
      return session;
    } catch (error) {
      console.error('Error importing session:', error);
      return null;
    }
  }
}