// ─── Curriculum Service ───
// Central data access layer. All curriculum data goes through here.
// Currently backed by localStorage; swap to API calls later without changing the UI.

import type {
  Program,
  InternshipPlan,
  CurriculumTemplate,
  CurriculumTemplateVersion,
  CurriculumPhase,
  CurriculumTask,
  CurriculumResource,
  TaskLibraryItem,
  ResourceLibraryItem,
  EnrollmentCurriculumSnapshot,
  ValidationResult,
} from './types';
import {
  MOCK_PROGRAMS,
  MOCK_PLANS,
  MOCK_TEMPLATES,
  MOCK_TASK_LIBRARY,
  MOCK_RESOURCE_LIBRARY,
} from './mock-data';
import { validateImportJSON, validateForPublish, recalculateDayNumbers } from './validators';

// ─── Persistence Helpers ───

const STORAGE_KEYS = {
  templates: 'hunarbee_curriculum_templates',
  taskLibrary: 'hunarbee_task_library',
  resourceLibrary: 'hunarbee_resource_library',
} as const;

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function getTemplatesStore(): CurriculumTemplate[] {
  return readStore(STORAGE_KEYS.templates, MOCK_TEMPLATES);
}

function setTemplatesStore(templates: CurriculumTemplate[]): void {
  writeStore(STORAGE_KEYS.templates, templates);
}

function getTaskLibraryStore(): TaskLibraryItem[] {
  return readStore(STORAGE_KEYS.taskLibrary, MOCK_TASK_LIBRARY);
}

function setTaskLibraryStore(items: TaskLibraryItem[]): void {
  writeStore(STORAGE_KEYS.taskLibrary, items);
}

function getResourceLibraryStore(): ResourceLibraryItem[] {
  return readStore(STORAGE_KEYS.resourceLibrary, MOCK_RESOURCE_LIBRARY);
}

function setResourceLibraryStore(items: ResourceLibraryItem[]): void {
  writeStore(STORAGE_KEYS.resourceLibrary, items);
}

// ─── ID Generation ───

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ─── Deep Clone ───

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Deep-clone phases with all-new IDs */
function clonePhasesWithNewIds(phases: CurriculumPhase[]): CurriculumPhase[] {
  return phases.map((phase) => ({
    ...phase,
    id: generateId('phase'),
    weeks: phase.weeks.map((week) => ({
      ...week,
      id: generateId('week'),
      days: week.days.map((day) => ({
        ...day,
        id: generateId('day'),
        tasks: day.tasks.map((task) => ({
          ...task,
          id: generateId('task'),
        })),
        resources: day.resources.map((res) => ({
          ...res,
          id: generateId('res'),
        })),
      })),
    })),
  }));
}

// ─── Program & Plan Access ───

export async function getPrograms(): Promise<Program[]> {
  return MOCK_PROGRAMS.filter((p) => p.status === 'active');
}

export async function getProgram(id: string): Promise<Program> {
  const prog = MOCK_PROGRAMS.find((p) => p.id === id);
  if (!prog) throw new Error(`Program not found: ${id}`);
  return prog;
}

export async function getPlansForProgram(programId: string): Promise<InternshipPlan[]> {
  return MOCK_PLANS.filter((p) => p.programId === programId && p.status === 'active');
}

export async function getPlan(planId: string): Promise<InternshipPlan> {
  const plan = MOCK_PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error(`Plan not found: ${planId}`);
  return plan;
}

// ─── Template Management ───

export async function getTemplates(): Promise<CurriculumTemplate[]> {
  return getTemplatesStore();
}

export async function getTemplate(id: string): Promise<CurriculumTemplate> {
  const templates = getTemplatesStore();
  const tmpl = templates.find((t) => t.id === id);
  if (!tmpl) throw new Error(`Template not found: ${id}`);
  return deepClone(tmpl);
}

export async function getTemplateForPlan(planId: string): Promise<CurriculumTemplate | null> {
  const templates = getTemplatesStore();
  return templates.find((t) => t.planId === planId) || null;
}

export async function createTemplate(data: {
  templateName: string;
  programId: string;
  planId: string;
  description: string;
}): Promise<CurriculumTemplate> {
  const plan = await getPlan(data.planId);
  const existing = await getTemplateForPlan(data.planId);
  if (existing) {
    throw new Error(`Plan "${plan.name}" already has a curriculum template. Each plan can have at most one template.`);
  }

  const now = new Date().toISOString();
  const templateId = generateId('tmpl');
  const versionId = generateId('ver');

  const template: CurriculumTemplate = {
    id: templateId,
    templateName: data.templateName,
    programId: data.programId,
    planId: data.planId,
    durationDays: plan.durationDays,
    description: data.description,
    createdAt: now,
    updatedAt: now,
    currentPublishedVersionId: null,
    versions: [
      {
        id: versionId,
        templateId,
        version: 1,
        status: 'DRAFT',
        phases: [],
        createdAt: now,
        updatedAt: now,
        publishedAt: null,
      },
    ],
  };

  const templates = getTemplatesStore();
  templates.push(template);
  setTemplatesStore(templates);

  return deepClone(template);
}

export async function deleteTemplate(id: string): Promise<void> {
  const templates = getTemplatesStore();
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error(`Template not found: ${id}`);

  const tmpl = templates[idx];
  const hasNonDraft = tmpl.versions.some((v) => v.status !== 'DRAFT');
  if (hasNonDraft) {
    throw new Error('Cannot delete template that has published or archived versions.');
  }

  templates.splice(idx, 1);
  setTemplatesStore(templates);
}

// ─── Version Management ───

export async function getVersion(
  templateId: string,
  versionId: string,
): Promise<CurriculumTemplateVersion> {
  const tmpl = await getTemplate(templateId);
  const ver = tmpl.versions.find((v) => v.id === versionId);
  if (!ver) throw new Error(`Version not found: ${versionId}`);
  return deepClone(ver);
}

export async function updateVersion(
  templateId: string,
  versionId: string,
  data: Partial<Pick<CurriculumTemplateVersion, 'phases'>>,
): Promise<CurriculumTemplateVersion> {
  const templates = getTemplatesStore();
  const tmpl = templates.find((t) => t.id === templateId);
  if (!tmpl) throw new Error(`Template not found: ${templateId}`);

  const ver = tmpl.versions.find((v) => v.id === versionId);
  if (!ver) throw new Error(`Version not found: ${versionId}`);

  if (ver.status !== 'DRAFT') {
    throw new Error('Only DRAFT versions can be edited.');
  }

  if (data.phases) {
    ver.phases = recalculateDayNumbers(data.phases);
  }

  ver.updatedAt = new Date().toISOString();
  tmpl.updatedAt = ver.updatedAt;
  setTemplatesStore(templates);

  return deepClone(ver);
}

export async function publishVersion(
  templateId: string,
  versionId: string,
): Promise<{ version: CurriculumTemplateVersion; validation: ValidationResult }> {
  const templates = getTemplatesStore();
  const tmpl = templates.find((t) => t.id === templateId);
  if (!tmpl) throw new Error(`Template not found: ${templateId}`);

  const ver = tmpl.versions.find((v) => v.id === versionId);
  if (!ver) throw new Error(`Version not found: ${versionId}`);

  if (ver.status !== 'DRAFT') {
    throw new Error('Only DRAFT versions can be published.');
  }

  // Look up the plan name for error messages
  let planName: string | undefined;
  try {
    const plan = await getPlan(tmpl.planId);
    planName = plan.name;
  } catch {
    // Plan not found — use generic label
  }

  const validation = validateForPublish(ver, tmpl.durationDays, planName);

  if (!validation.valid) {
    return { version: deepClone(ver), validation };
  }

  const now = new Date().toISOString();
  ver.status = 'PUBLISHED';
  ver.publishedAt = now;
  ver.updatedAt = now;
  tmpl.currentPublishedVersionId = ver.id;
  tmpl.updatedAt = now;
  setTemplatesStore(templates);

  return { version: deepClone(ver), validation };
}

export async function archiveVersion(
  templateId: string,
  versionId: string,
): Promise<CurriculumTemplateVersion> {
  const templates = getTemplatesStore();
  const tmpl = templates.find((t) => t.id === templateId);
  if (!tmpl) throw new Error(`Template not found: ${templateId}`);

  const ver = tmpl.versions.find((v) => v.id === versionId);
  if (!ver) throw new Error(`Version not found: ${versionId}`);

  if (ver.status !== 'PUBLISHED') {
    throw new Error('Only PUBLISHED versions can be archived.');
  }

  if (ver.id === tmpl.currentPublishedVersionId) {
    throw new Error('This is the active curriculum version. Publish another version before archiving this one.');
  }

  ver.status = 'ARCHIVED';
  ver.updatedAt = new Date().toISOString();
  tmpl.updatedAt = ver.updatedAt;
  setTemplatesStore(templates);

  return deepClone(ver);
}

export async function createNewVersionFromPublished(
  templateId: string,
  sourceVersionId: string,
): Promise<CurriculumTemplateVersion> {
  const templates = getTemplatesStore();
  const tmpl = templates.find((t) => t.id === templateId);
  if (!tmpl) throw new Error(`Template not found: ${templateId}`);

  const source = tmpl.versions.find((v) => v.id === sourceVersionId);
  if (!source) throw new Error(`Version not found: ${sourceVersionId}`);

  if (source.status !== 'PUBLISHED') {
    throw new Error('Can only create a new version from a PUBLISHED version.');
  }

  const maxVersion = Math.max(...tmpl.versions.map((v) => v.version));
  const now = new Date().toISOString();
  const newVersionId = generateId('ver');

  const newVersion: CurriculumTemplateVersion = {
    id: newVersionId,
    templateId,
    version: maxVersion + 1,
    status: 'DRAFT',
    phases: clonePhasesWithNewIds(source.phases),
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };

  tmpl.versions.push(newVersion);
  tmpl.updatedAt = now;
  setTemplatesStore(templates);

  return deepClone(newVersion);
}

export async function deleteVersion(
  templateId: string,
  versionId: string,
): Promise<void> {
  const templates = getTemplatesStore();
  const tmpl = templates.find((t) => t.id === templateId);
  if (!tmpl) throw new Error(`Template not found: ${templateId}`);

  const ver = tmpl.versions.find((v) => v.id === versionId);
  if (!ver) throw new Error(`Version not found: ${versionId}`);

  if (ver.status !== 'DRAFT') {
    throw new Error('Only DRAFT versions can be deleted.');
  }

  tmpl.versions = tmpl.versions.filter((v) => v.id !== versionId);
  tmpl.updatedAt = new Date().toISOString();
  setTemplatesStore(templates);
}

// ─── Duplication ───

export async function duplicateTemplate(
  id: string,
  targetPlanId: string,
): Promise<CurriculumTemplate> {
  const source = await getTemplate(id);
  const targetPlan = await getPlan(targetPlanId);

  const existingForPlan = await getTemplateForPlan(targetPlanId);
  if (existingForPlan) {
    throw new Error(`Plan "${targetPlan.name}" already has a curriculum template.`);
  }

  // Use the latest version (prefer draft, then latest published)
  const latestVersion =
    source.versions.find((v) => v.status === 'DRAFT') ||
    source.versions
      .filter((v) => v.status === 'PUBLISHED')
      .sort((a, b) => b.version - a.version)[0] ||
    source.versions[0];

  if (!latestVersion) {
    throw new Error('Source template has no versions to duplicate.');
  }

  const now = new Date().toISOString();
  const newTemplateId = generateId('tmpl');
  const newVersionId = generateId('ver');

  const newTemplate: CurriculumTemplate = {
    id: newTemplateId,
    templateName: `${source.templateName} (Copy)`,
    programId: targetPlan.programId,
    planId: targetPlanId,
    durationDays: targetPlan.durationDays,
    description: source.description,
    createdAt: now,
    updatedAt: now,
    currentPublishedVersionId: null,
    versions: [
      {
        id: newVersionId,
        templateId: newTemplateId,
        version: 1,
        status: 'DRAFT',
        phases: clonePhasesWithNewIds(latestVersion.phases),
        createdAt: now,
        updatedAt: now,
        publishedAt: null,
      },
    ],
  };

  const templates = getTemplatesStore();
  templates.push(newTemplate);
  setTemplatesStore(templates);

  return deepClone(newTemplate);
}

// ─── Import / Export ───

export async function importTemplate(
  json: string,
  planId: string,
): Promise<{ template: CurriculumTemplate | null; validation: ValidationResult }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      template: null,
      validation: {
        valid: false,
        errors: [{ path: 'root', field: 'json', message: 'Invalid JSON format.', severity: 'error' }],
        warnings: [],
        stats: { totalPhases: 0, totalWeeks: 0, totalDays: 0, totalTasks: 0, totalResources: 0, totalEstimatedMinutes: 0 },
      },
    };
  }

  const validation = validateImportJSON(parsed);

  if (!validation.valid) {
    return { template: null, validation };
  }

  const plan = await getPlan(planId);
  const existingForPlan = await getTemplateForPlan(planId);
  if (existingForPlan) {
    throw new Error(`Plan "${plan.name}" already has a curriculum template.`);
  }

  const obj = parsed as Record<string, unknown>;
  const now = new Date().toISOString();
  const templateId = generateId('tmpl');
  const versionId = generateId('ver');

  // Build phases from imported data with new IDs
  const importedPhases = (obj.phases as CurriculumPhase[]) || [];
  const phasesWithNewIds = clonePhasesWithNewIds(importedPhases);
  const recalculated = recalculateDayNumbers(phasesWithNewIds);

  const template: CurriculumTemplate = {
    id: templateId,
    templateName: (obj.templateName as string) || `Imported Curriculum`,
    programId: plan.programId,
    planId,
    durationDays: plan.durationDays,
    description: (obj.description as string) || '',
    createdAt: now,
    updatedAt: now,
    currentPublishedVersionId: null,
    versions: [
      {
        id: versionId,
        templateId,
        version: 1,
        status: 'DRAFT',
        phases: recalculated,
        createdAt: now,
        updatedAt: now,
        publishedAt: null,
      },
    ],
  };

  const templates = getTemplatesStore();
  templates.push(template);
  setTemplatesStore(templates);

  return { template: deepClone(template), validation };
}

export async function exportVersion(
  templateId: string,
  versionId: string,
): Promise<string> {
  const tmpl = await getTemplate(templateId);
  const ver = tmpl.versions.find((v) => v.id === versionId);
  if (!ver) throw new Error(`Version not found: ${versionId}`);

  const exportObj = {
    templateName: tmpl.templateName,
    description: tmpl.description,
    durationDays: tmpl.durationDays,
    version: ver.version,
    phases: ver.phases,
  };

  return JSON.stringify(exportObj, null, 2);
}

// ─── Enrollment Snapshot (future-ready, stubbed) ───

export async function createEnrollmentSnapshot(
  enrollmentId: string,
  planId: string,
): Promise<EnrollmentCurriculumSnapshot> {
  const tmpl = await getTemplateForPlan(planId);
  if (!tmpl) throw new Error(`No curriculum template found for plan: ${planId}`);
  if (!tmpl.currentPublishedVersionId) {
    throw new Error('No published version available for this template.');
  }

  const ver = tmpl.versions.find((v) => v.id === tmpl.currentPublishedVersionId);
  if (!ver) throw new Error('Published version not found.');

  const snapshot: EnrollmentCurriculumSnapshot = {
    id: generateId('snap'),
    enrollmentId,
    templateId: tmpl.id,
    versionId: ver.id,
    versionNumber: ver.version,
    planId: tmpl.planId,
    programId: tmpl.programId,
    snapshotData: deepClone(ver),
    createdAt: new Date().toISOString(),
  };

  return snapshot;
}

// ─── Task Library ───

export async function getTaskLibrary(): Promise<TaskLibraryItem[]> {
  return getTaskLibraryStore().filter((i) => !i.archived);
}

export async function getTaskLibraryAll(): Promise<TaskLibraryItem[]> {
  return getTaskLibraryStore();
}

export async function createTaskLibraryItem(data: Omit<TaskLibraryItem, 'id' | 'createdAt' | 'updatedAt' | 'archived'>): Promise<TaskLibraryItem> {
  const now = new Date().toISOString();
  const item: TaskLibraryItem = {
    ...data,
    id: generateId('tlib'),
    createdAt: now,
    updatedAt: now,
    archived: false,
  };

  const items = getTaskLibraryStore();
  items.push(item);
  setTaskLibraryStore(items);

  return deepClone(item);
}

export async function updateTaskLibraryItem(
  id: string,
  data: Partial<Omit<TaskLibraryItem, 'id' | 'createdAt'>>,
): Promise<TaskLibraryItem> {
  const items = getTaskLibraryStore();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(`Task library item not found: ${id}`);

  items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
  setTaskLibraryStore(items);

  return deepClone(items[idx]);
}

export async function archiveTaskLibraryItem(id: string): Promise<void> {
  await updateTaskLibraryItem(id, { archived: true });
}

export async function copyTaskToDay(libraryItemId: string): Promise<CurriculumTask> {
  const items = getTaskLibraryStore();
  const item = items.find((i) => i.id === libraryItemId);
  if (!item) throw new Error(`Task library item not found: ${libraryItemId}`);

  return {
    id: generateId('task'),
    order: 0, // Caller should set the correct order
    title: item.title,
    description: item.description,
    instructions: item.instructions,
    estimatedMinutes: item.estimatedMinutes,
    requiresSubmission: item.requiresSubmission,
    requiresMentorReview: item.requiresMentorReview,
    sourceLibraryId: item.id,
  };
}

// ─── Resource Library ───

export async function getResourceLibrary(): Promise<ResourceLibraryItem[]> {
  return getResourceLibraryStore().filter((i) => !i.archived);
}

export async function getResourceLibraryAll(): Promise<ResourceLibraryItem[]> {
  return getResourceLibraryStore();
}

export async function createResourceLibraryItem(data: Omit<ResourceLibraryItem, 'id' | 'createdAt' | 'updatedAt' | 'archived'>): Promise<ResourceLibraryItem> {
  const now = new Date().toISOString();
  const item: ResourceLibraryItem = {
    ...data,
    id: generateId('rlib'),
    createdAt: now,
    updatedAt: now,
    archived: false,
  };

  const items = getResourceLibraryStore();
  items.push(item);
  setResourceLibraryStore(items);

  return deepClone(item);
}

export async function updateResourceLibraryItem(
  id: string,
  data: Partial<Omit<ResourceLibraryItem, 'id' | 'createdAt'>>,
): Promise<ResourceLibraryItem> {
  const items = getResourceLibraryStore();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(`Resource library item not found: ${id}`);

  items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
  setResourceLibraryStore(items);

  return deepClone(items[idx]);
}

export async function archiveResourceLibraryItem(id: string): Promise<void> {
  await updateResourceLibraryItem(id, { archived: true });
}

export async function copyResourceToDay(libraryItemId: string): Promise<CurriculumResource> {
  const items = getResourceLibraryStore();
  const item = items.find((i) => i.id === libraryItemId);
  if (!item) throw new Error(`Resource library item not found: ${libraryItemId}`);

  return {
    id: generateId('res'),
    order: 0, // Caller should set the correct order
    title: item.title,
    type: item.type,
    url: item.url,
    description: item.description,
    sourceLibraryId: item.id,
  };
}
