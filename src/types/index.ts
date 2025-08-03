export interface SecurityFinding {
  id: string
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  category: string // STRIDE category or STPA-SEC element
  modelSource: string
  confidence?: number
  cweId?: string
  mitigations?: string[]
  createdAt: string
}

export interface FindingValidation {
  findingId: string
  status: 'confirmed' | 'false-positive' | 'needs-review' | 'pending'
  accuracy: number // 1-5 scale
  completeness: number // 1-5 scale
  relevance: number // 1-5 scale
  actionability: number // 1-5 scale
  notes: string
  validatedBy: string
  validatedAt: string
}

export interface AnalysisSession {
  id: string
  name: string
  promptTemplate: PromptTemplate | null
  architectureDiagram?: string
  modelAId: string
  modelBId: string
  modelAResults: SecurityFinding[]
  modelBResults: SecurityFinding[]
  validations: FindingValidation[]
  progress: {
    totalFindings: number
    validatedFindings: number
    confirmedFindings: number
    falsePositives: number
  }
  createdAt: string
  updatedAt: string
}

export interface ThreatAnnotation {
  id: string
  referenceId: string // T1, T2, etc.
  title: string
  severity: 'high' | 'medium' | 'low'
  position?: { x: number, y: number } // For diagram overlay
  linkedFindings: string[] // Finding IDs
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  template: string
  variables: string[]
  analysisType: 'stride' | 'stpa-sec' | 'custom'
  expectedOutputFormat: 'structured' | 'freeform'
  version: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  // New fields for validation
  validationCriteria?: ValidationCriteria[]
  sampleFindings?: SecurityFinding[]
}

export interface ValidationCriteria {
  category: string
  description: string
  weight: number // For scoring
}

export type ValidationStatus = 'confirmed' | 'false-positive' | 'needs-review' | 'pending'

export interface ValidationProgress {
  totalFindings: number
  validatedFindings: number
  confirmedFindings: number
  falsePositives: number
  needsReview: number
  percentComplete: number
}

export interface ModelPerformance {
  modelId: string
  totalFindings: number
  confirmedFindings: number
  falsePositives: number
  accuracy: number
  completeness: number
  relevance: number
  actionability: number
}

export interface ComplianceReport {
  standards: ComplianceStandard[]
  coverage: number
  mappedFindings: number
  totalFindings: number
}

export interface ComplianceStandard {
  name: string
  version: string
  requirements: ComplianceRequirement[]
}

export interface ComplianceRequirement {
  id: string
  title: string
  description: string
  mappedFindings: SecurityFinding[]
}

export interface CategorizedFindings {
  byCategory: Map<string, SecurityFinding[]>
  bySeverity: Map<string, SecurityFinding[]>
  byModel: Map<string, SecurityFinding[]>
}

export interface ValidationResult {
  isValid: boolean
  score: number
  feedback: string[]
}

export interface ProcessedPrompt {
  template: PromptTemplate
  resolvedPrompt: string
  expectedFindings: number
  validationCriteria: ValidationCriteria[]
}