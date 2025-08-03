import { FindingValidation } from '@/types';
import { SessionStorage } from './sessionStorage';

export class ValidationStorage {
  static saveValidation(sessionId: string, validation: FindingValidation): void {
    const session = SessionStorage.getSession(sessionId);
    if (!session) return;
    
    const existingIndex = session.validations.findIndex(
      v => v.findingId === validation.findingId
    );
    
    if (existingIndex >= 0) {
      session.validations[existingIndex] = validation;
    } else {
      session.validations.push(validation);
    }
    
    SessionStorage.saveSession(session);
    SessionStorage.updateSessionProgress(sessionId);
  }

  static getValidation(sessionId: string, findingId: string): FindingValidation | null {
    const session = SessionStorage.getSession(sessionId);
    if (!session) return null;
    
    return session.validations.find(v => v.findingId === findingId) || null;
  }

  static getAllValidations(sessionId: string): FindingValidation[] {
    const session = SessionStorage.getSession(sessionId);
    if (!session) return [];
    
    return session.validations;
  }

  static deleteValidation(sessionId: string, findingId: string): void {
    const session = SessionStorage.getSession(sessionId);
    if (!session) return;
    
    session.validations = session.validations.filter(
      v => v.findingId !== findingId
    );
    
    SessionStorage.saveSession(session);
    SessionStorage.updateSessionProgress(sessionId);
  }

  static getValidationStats(sessionId: string) {
    const validations = this.getAllValidations(sessionId);
    
    const stats = {
      total: validations.length,
      confirmed: validations.filter(v => v.status === 'confirmed').length,
      falsePositives: validations.filter(v => v.status === 'false-positive').length,
      needsReview: validations.filter(v => v.status === 'needs-review').length,
      pending: validations.filter(v => v.status === 'pending').length,
      averageScores: {
        accuracy: 0,
        completeness: 0,
        relevance: 0,
        actionability: 0
      }
    };
    
    if (validations.length > 0) {
      const scored = validations.filter(v => v.status !== 'pending');
      if (scored.length > 0) {
        stats.averageScores.accuracy = 
          scored.reduce((sum, v) => sum + v.accuracy, 0) / scored.length;
        stats.averageScores.completeness = 
          scored.reduce((sum, v) => sum + v.completeness, 0) / scored.length;
        stats.averageScores.relevance = 
          scored.reduce((sum, v) => sum + v.relevance, 0) / scored.length;
        stats.averageScores.actionability = 
          scored.reduce((sum, v) => sum + v.actionability, 0) / scored.length;
      }
    }
    
    return stats;
  }
}