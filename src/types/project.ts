
// src/types/project.ts
export interface TeamMember {
  _id?: string;
  name: string;
  role: string;
}

export type ProjectStatus = 'Awaiting Schedule' | 'No Schedule' | 'On Track' | 'Over Budget'| 'CONFIRMED'|'SCHEDULED'| 'CONFLICT';

export interface Phase {
  _id?: string;
  name: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  status?: ProjectStatus;
  progress?: number; // 0–100
  assignees?: string[];
  assignedTo?: string[]; // frontend uses this in some places
  milestones?: { name: string; date: string }[];
}
// Main project interface
export interface Project {
  _id: string;
  name: string;
  manager?: string;
  projectNumber?: string;
  status?: ProjectStatus;
  progress?: number;
  deadline?: string; // ISO
  scope?: string;
  team?: TeamMember[];
  phases?: Phase[];

  totalManHours?: number;
  desiredManpower?: number;        // matches backend schema (lowercase p)
  efficiency?: number;           // 0–2 (can exceed 1.0 for under-budget projects)
  targetDurationWeeks?: number;

  // AI inference context fields
  projectType?: string;
}

// ---------------------------------------------------------------------------
// Estimation Engine — request / response types
// ---------------------------------------------------------------------------

export interface EstimationInputs {
  totalManHours: number;
  desiredManpower?: number;
  targetDurationWeeks?: number;
  assumedEfficiency?: number;    // omit to let AI infer
  projectType?: string;
  supervisor?: string;
  jobName?: string;
}

export interface EstimationRequest {
  projectId: string;
  calculationMode: 'duration' | 'manpower';
  inputs: EstimationInputs;
}

export interface EstimationEvidenceItem {
  jobNumber: string;
  jobName: string;
  actualEfficiency: number;
  similarityScore: number;
}

export interface EstimationOutputs {
  realisticDurationWeeks?: number | null;
  totalExpendedHours?: number | null;
  recommendedManpower?: number | null;
  calculatedEfficiency: number;
  efficiencySource: 'provided' | 'agent_inferred' | 'fallback_default';
  warnings: string[];
  inferenceMatchCount?: number | null;
  inferenceConfidence?: number | null;
  inferenceEvidence?: EstimationEvidenceItem[] | null;
}

export interface EstimationResponse {
  status: 'success';
  projectId: string;
  calculationMode: 'duration' | 'manpower';
  outputs: EstimationOutputs;
}
  // Calculator inputs for project analysis
  export interface CalculatorInputs {
  totalManHours: number;
  desiredManpower: number;
  efficiency: number;
  targetDurationWeeks: number;
}

// Calculator outputs for project analysis
export interface CalculatorOutputs {
  duration: number;
  expendedHours: number;
  recommendedManpower: number;
}
export interface AuthUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

