import { NodeResult } from './results';

export interface NodeExecutionState {
  nodeId: string;
  status: "idle" | "waiting" | "running" | "complete" | "error";
  progress?: number;
  startTime?: number;
  duration?: number;
  error?: string;
  results?: NodeResult;
}

export interface PipelineExecutionState {
  pipelineId: string;
  status: "idle" | "validating" | "running" | "complete" | "error";
  nodeStates: Map<string, NodeExecutionState>;
  startTime?: number;
  endTime?: number;
  totalProgress: number;
  currentNodeId?: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  nodeId?: string;
  connectionId?: string;
  message: string;
  type:
    | "missing_connection"
    | "invalid_connection"
    | "missing_config"
    | "circular_dependency";
}

export interface ValidationWarning {
  nodeId?: string;
  message: string;
  type: "unused_output" | "high_temperature" | "missing_optional_config";
}

export interface ExecutionResult {
  nodeId: string;
  success: boolean;
  data?: NodeResult;
  error?: string;
  duration: number;
}
