// ─── Curriculum Service ───
// Central data access layer. All curriculum data goes through API calls.
// Backed by the programs-service REST API.

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
  VideoLesson,
  VideoLessonStatus,
  LearningContent,
  TaskPrerequisite,
} from './types';
import { validateImportJSON, validateForPublish, recalculateDayNumbers } from './validators';
import { fetchApi } from '@/lib/api';

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
      days: week.days.map((day) => {
        const lcIdMap: Record<string, string> = {};
        const clonedLearningContent = (day.learningContent || []).map((lc) => {
          const newId = generateId('lc');
          lcIdMap[lc.id] = newId;
          return {
            ...lc,
            id: newId,
          };
        });

        const clonedTasks = day.tasks.map((task) => {
          const clonedPrerequisites = (task.prerequisites || []).map((prereq) => {
            const newTargetId = lcIdMap[prereq.targetId] || prereq.targetId;
            return {
              ...prereq,
              id: generateId('prereq'),
              targetId: newTargetId,
            };
          });
          return {
            ...task,
            id: generateId('task'),
            prerequisites: clonedPrerequisites,
          };
        });

        return {
          ...day,
          id: generateId('day'),
          learningContent: clonedLearningContent,
          tasks: clonedTasks,
          resources: day.resources.map((res) => ({
            ...res,
            id: generateId('res'),
          })),
        };
      }),
    })),
  }));
}

// ─── API Helpers ───

async function fetchTemplates(): Promise<CurriculumTemplate[]> {
  try {
    const res = await fetchApi<{ success: boolean; data: CurriculumTemplate[] }>('/programs/curriculum-templates');
    return res?.success && Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

async function saveTemplates(templates: CurriculumTemplate[]): Promise<void> {
  await fetchApi('/programs/curriculum-templates', {
    method: 'POST',
    body: JSON.stringify({ templates }),
  });
}

async function fetchLibrary<T>(endpoint: string): Promise<T[]> {
  try {
    const res = await fetchApi<{ success: boolean; data: T[] }>(`/programs/${endpoint}`);
    return res?.success && Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

async function saveLibrary<T>(endpoint: string, items: T[]): Promise<void> {
  await fetchApi(`/programs/${endpoint}`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

// ─── Program & Plan Access (from admin-service DB) ───

export async function getPrograms(): Promise<Program[]> {
  try {
    const res = await fetchApi<{ success: boolean; data: any[] }>('/admin/programs');
    if (res?.success && Array.isArray(res.data)) {
      return res.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        status: p.status === 'published' ? 'active' : p.status,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export async function getProgram(id: string): Promise<Program> {
  const programs = await getPrograms();
  const prog = programs.find((p) => p.id === id);
  if (!prog) throw new Error(`Program not found: ${id}`);
  return prog;
}

export async function getPlansForProgram(programId: string): Promise<InternshipPlan[]> {
  try {
    const res = await fetchApi<{ success: boolean; data: any[] }>('/admin/programs');
    if (res?.success && Array.isArray(res.data)) {
      const program = res.data.find((p: any) => p.id === programId);
      if (program && Array.isArray(program.plans)) {
        return program.plans.map((plan: any) => ({
          id: plan.id,
          programId: programId,
          name: plan.name,
          durationDays: plan.total_days || 30,
          price: plan.price || (plan.price_paise ? plan.price_paise / 100 : 0),
          status: plan.status === 'published' ? 'active' : (plan.status || 'active'),
        }));
      }
    }
    return [];
  } catch {
    return [];
  }
}

export async function getPlan(planId: string): Promise<InternshipPlan> {
  try {
    const res = await fetchApi<{ success: boolean; data: any[] }>('/admin/programs');
    if (res?.success && Array.isArray(res.data)) {
      for (const prog of res.data) {
        if (Array.isArray(prog.plans)) {
          const plan = prog.plans.find((p: any) => p.id === planId);
          if (plan) {
            return {
              id: plan.id,
              programId: prog.id,
              name: plan.name,
              durationDays: plan.total_days || 30,
              price: plan.price || (plan.price_paise ? plan.price_paise / 100 : 0),
              status: plan.status === 'published' ? 'active' : (plan.status || 'active'),
            };
          }
        }
      }
    }
  } catch {
    // fall through
  }
  throw new Error(`Plan not found: ${planId}`);
}

// ─── Template Management ───

export async function getTemplates(): Promise<CurriculumTemplate[]> {
  return fetchTemplates();
}

export async function getTemplate(id: string): Promise<CurriculumTemplate> {
  const templates = await fetchTemplates();
  const tmpl = templates.find((t) => t.id === id);
  if (!tmpl) throw new Error(`Template not found: ${id}`);
  return deepClone(tmpl);
}

export async function getTemplateForPlan(planId: string): Promise<CurriculumTemplate | null> {
  const templates = await fetchTemplates();
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

  const templates = await fetchTemplates();
  templates.push(template);
  await saveTemplates(templates);

  return deepClone(template);
}

export async function deleteTemplate(id: string): Promise<void> {
  const templates = await fetchTemplates();
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error(`Template not found: ${id}`);

  templates.splice(idx, 1);
  await saveTemplates(templates);
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
  const templates = await fetchTemplates();
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
  await saveTemplates(templates);

  return deepClone(ver);
}

export async function publishVersion(
  templateId: string,
  versionId: string,
): Promise<{ version: CurriculumTemplateVersion; validation: ValidationResult }> {
  const templates = await fetchTemplates();
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
  await saveTemplates(templates);

  return { version: deepClone(ver), validation };
}

export async function archiveVersion(
  templateId: string,
  versionId: string,
): Promise<CurriculumTemplateVersion> {
  const templates = await fetchTemplates();
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
  await saveTemplates(templates);

  return deepClone(ver);
}

export async function createNewVersionFromPublished(
  templateId: string,
  sourceVersionId: string,
): Promise<CurriculumTemplateVersion> {
  const templates = await fetchTemplates();
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
  await saveTemplates(templates);

  return deepClone(newVersion);
}

export async function deleteVersion(
  templateId: string,
  versionId: string,
): Promise<void> {
  const templates = await fetchTemplates();
  const tmpl = templates.find((t) => t.id === templateId);
  if (!tmpl) throw new Error(`Template not found: ${templateId}`);

  const ver = tmpl.versions.find((v) => v.id === versionId);
  if (!ver) throw new Error(`Version not found: ${versionId}`);

  if (ver.status !== 'DRAFT') {
    throw new Error('Only DRAFT versions can be deleted.');
  }

  tmpl.versions = tmpl.versions.filter((v) => v.id !== versionId);
  tmpl.updatedAt = new Date().toISOString();
  await saveTemplates(templates);
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

  const templates = await fetchTemplates();
  templates.push(newTemplate);
  await saveTemplates(templates);

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

  const templates = await fetchTemplates();
  templates.push(template);
  await saveTemplates(templates);

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
  const all = await fetchLibrary<TaskLibraryItem>('task-library');
  return all.filter((i) => !i.archived);
}

export async function getTaskLibraryAll(): Promise<TaskLibraryItem[]> {
  return fetchLibrary<TaskLibraryItem>('task-library');
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

  const items = await fetchLibrary<TaskLibraryItem>('task-library');
  items.push(item);
  await saveLibrary('task-library', items);

  return deepClone(item);
}

export async function updateTaskLibraryItem(
  id: string,
  data: Partial<Omit<TaskLibraryItem, 'id' | 'createdAt'>>,
): Promise<TaskLibraryItem> {
  const items = await fetchLibrary<TaskLibraryItem>('task-library');
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(`Task library item not found: ${id}`);

  items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
  await saveLibrary('task-library', items);

  return deepClone(items[idx]);
}

export async function archiveTaskLibraryItem(id: string): Promise<void> {
  await updateTaskLibraryItem(id, { archived: true });
}

export async function copyTaskToDay(libraryItemId: string): Promise<CurriculumTask> {
  const items = await fetchLibrary<TaskLibraryItem>('task-library');
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
  const all = await fetchLibrary<ResourceLibraryItem>('resource-library');
  return all.filter((i) => !i.archived);
}

export async function getResourceLibraryAll(): Promise<ResourceLibraryItem[]> {
  return fetchLibrary<ResourceLibraryItem>('resource-library');
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

  const items = await fetchLibrary<ResourceLibraryItem>('resource-library');
  items.push(item);
  await saveLibrary('resource-library', items);

  return deepClone(item);
}

export async function updateResourceLibraryItem(
  id: string,
  data: Partial<Omit<ResourceLibraryItem, 'id' | 'createdAt'>>,
): Promise<ResourceLibraryItem> {
  const items = await fetchLibrary<ResourceLibraryItem>('resource-library');
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(`Resource library item not found: ${id}`);

  items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
  await saveLibrary('resource-library', items);

  return deepClone(items[idx]);
}

export async function archiveResourceLibraryItem(id: string): Promise<void> {
  await updateResourceLibraryItem(id, { archived: true });
}

export async function copyResourceToDay(libraryItemId: string): Promise<CurriculumResource> {
  const items = await fetchLibrary<ResourceLibraryItem>('resource-library');
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

// ─── Video Library ───

export async function getVideoLibrary(): Promise<VideoLesson[]> {
  const all = await fetchLibrary<VideoLesson>('video-library');
  return all.filter((v) => v.status !== 'ARCHIVED');
}

export async function getVideoLibraryAll(): Promise<VideoLesson[]> {
  return fetchLibrary<VideoLesson>('video-library');
}

export async function getVideoLesson(id: string): Promise<VideoLesson> {
  const store = await fetchLibrary<VideoLesson>('video-library');
  const video = store.find((v) => v.id === id);
  if (!video) throw new Error(`Video lesson not found: ${id}`);
  return deepClone(video);
}

export async function createVideoLesson(data: Omit<VideoLesson, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: VideoLessonStatus }): Promise<VideoLesson> {
  const now = new Date().toISOString();
  const item: VideoLesson = {
    ...data,
    id: generateId('vles'),
    status: data.status || 'DRAFT',
    createdAt: now,
    updatedAt: now,
  };

  const store = await fetchLibrary<VideoLesson>('video-library');
  store.push(item);
  await saveLibrary('video-library', store);

  return deepClone(item);
}

export async function updateVideoLesson(
  id: string,
  data: Partial<Omit<VideoLesson, 'id' | 'createdAt'>>,
): Promise<VideoLesson> {
  const store = await fetchLibrary<VideoLesson>('video-library');
  const idx = store.findIndex((v) => v.id === id);
  if (idx === -1) throw new Error(`Video lesson not found: ${id}`);

  store[idx] = {
    ...store[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await saveLibrary('video-library', store);

  return deepClone(store[idx]);
}

export async function archiveVideoLesson(id: string): Promise<void> {
  await updateVideoLesson(id, { status: 'ARCHIVED' });
}
