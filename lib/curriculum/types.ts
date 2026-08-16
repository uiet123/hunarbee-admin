// ─── Curriculum Template Management System ───
// All types for the data-driven, versioned curriculum template architecture.
// No student-specific fields (completed, submitted, score, etc.) belong here.

// ─── Enums / Unions ───

/** Visual/functional day categories */
export type DayType =
  | 'ORIENTATION'
  | 'LEARNING'
  | 'TASK'
  | 'PROJECT'
  | 'MENTOR_REVIEW'
  | 'SUBMISSION'
  | 'ASSESSMENT'
  | 'BREAK';

export const DAY_TYPES: DayType[] = [
  'ORIENTATION',
  'LEARNING',
  'TASK',
  'PROJECT',
  'MENTOR_REVIEW',
  'SUBMISSION',
  'ASSESSMENT',
  'BREAK',
];

/** Resource format types */
export type ResourceType = 'LINK' | 'VIDEO' | 'PDF' | 'ARTICLE' | 'DOCUMENTATION';

export const RESOURCE_TYPES: ResourceType[] = [
  'LINK',
  'VIDEO',
  'PDF',
  'ARTICLE',
  'DOCUMENTATION',
];

/** Template lifecycle states */
export type TemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// ─── Program & Plan (data-driven entities, NOT hard-coded enums) ───

/** Data-driven Program entity — loaded from API/mock, never hard-coded as an enum */
export interface Program {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
}

/** Internship Plan — belongs to a Program, provides duration */
export interface InternshipPlan {
  id: string;
  programId: string;
  name: string;
  durationDays: number;
  price: number;
  status: 'active' | 'archived';
}

// ─── Core Template & Versioning ───

/** Top-level container — groups all versions of a curriculum */
export interface CurriculumTemplate {
  id: string;
  templateName: string;
  programId: string;
  planId: string;
  durationDays: number;       // DERIVED from InternshipPlan.durationDays — read-only
  description: string;
  createdAt: string;
  updatedAt: string;
  versions: CurriculumTemplateVersion[];
  currentPublishedVersionId: string | null;
}

/** A specific version — the versioned, immutable unit */
export interface CurriculumTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  status: TemplateStatus;
  phases: CurriculumPhase[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// ─── Hierarchy ───

export interface CurriculumPhase {
  id: string;
  order: number;
  title: string;
  description: string;
  weeks: CurriculumWeek[];
}

export interface CurriculumWeek {
  id: string;
  order: number;
  title: string;
  goal: string;
  days: CurriculumDay[];
}

export interface CurriculumDay {
  id: string;
  order: number;
  dayNumber: number;           // DERIVED — auto-calculated from global position
  title: string;
  type: DayType;
  description: string;
  estimatedMinutes: number;
  objectives: string[];
  tasks: CurriculumTask[];
  resources: CurriculumResource[];
}

export interface CurriculumTask {
  id: string;
  order: number;
  title: string;
  description: string;
  instructions: string;
  estimatedMinutes: number;
  requiresSubmission: boolean;
  requiresMentorReview: boolean;
  sourceLibraryId?: string;
}

export interface CurriculumResource {
  id: string;
  order: number;
  title: string;
  type: ResourceType;
  url: string;
  description: string;
  sourceLibraryId?: string;
}

// ─── Libraries ───

export interface TaskLibraryItem {
  id: string;
  title: string;
  description: string;
  instructions: string;
  estimatedMinutes: number;
  requiresSubmission: boolean;
  requiresMentorReview: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface ResourceLibraryItem {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

// ─── Enrollment Snapshot (future-ready) ───

export interface EnrollmentCurriculumSnapshot {
  id: string;
  enrollmentId: string;
  templateId: string;
  versionId: string;
  versionNumber: number;
  planId: string;
  programId: string;
  snapshotData: CurriculumTemplateVersion;
  createdAt: string;
}

// ─── Validation ───

export interface ValidationError {
  path: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  stats: {
    totalPhases: number;
    totalWeeks: number;
    totalDays: number;
    totalTasks: number;
    totalResources: number;
    totalEstimatedMinutes: number;
  };
}
