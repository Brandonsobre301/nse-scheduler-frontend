
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
  desiredManPower?: number;
  efficiency?: number;           // 0–1
  targetDurationWeeks?: number;
}
  // Calculator inputs for project analysis
  export interface CalculatorInputs {
  totalManHours: number;
  desiredManPower: number;
  efficiency: number;           // 0–1
  targetDurationWeeks: number;
}

// Calculator outputs for project analysis
export interface CalculatorOutputs {
  duration: number;
  expendedHours: number;
  recommendedManpower: number;
}
export interface User {
  _id?: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}