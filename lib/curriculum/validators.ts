// ─── Curriculum Validators ───
// Import validation, publish validation, and day number utilities.

import type {
  CurriculumPhase,
  CurriculumTemplateVersion,
  DayType,
  ResourceType,
  ValidationError,
  ValidationResult,
} from './types';
import { DAY_TYPES, RESOURCE_TYPES } from './types';

// ─── Helpers ───

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function collectStats(phases: CurriculumPhase[]) {
  let totalWeeks = 0;
  let totalDays = 0;
  let totalTasks = 0;
  let totalResources = 0;
  let totalEstimatedMinutes = 0;

  for (const phase of phases) {
    totalWeeks += phase.weeks.length;
    for (const week of phase.weeks) {
      totalDays += week.days.length;
      for (const day of week.days) {
        totalTasks += day.tasks.length;
        totalResources += day.resources.length;
        totalEstimatedMinutes += day.estimatedMinutes || 0;
        for (const task of day.tasks) {
          totalEstimatedMinutes += task.estimatedMinutes || 0;
        }
      }
    }
  }

  return {
    totalPhases: phases.length,
    totalWeeks,
    totalDays,
    totalTasks,
    totalResources,
    totalEstimatedMinutes,
  };
}

// ─── Import Validation ───

/**
 * Validates imported JSON against the curriculum schema.
 * Returns human-readable errors with hierarchy paths.
 */
export function validateImportJSON(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({ path: 'root', field: 'data', message: 'Invalid JSON: expected an object.', severity: 'error' });
    return { valid: false, errors, warnings, stats: collectStats([]) };
  }

  const obj = data as Record<string, unknown>;

  // Top-level required fields
  if (!isNonEmptyString(obj.templateName)) {
    errors.push({ path: 'root', field: 'templateName', message: 'Template name is required.', severity: 'error' });
  }

  if (!Array.isArray(obj.phases)) {
    errors.push({ path: 'root', field: 'phases', message: 'Phases array is required.', severity: 'error' });
    return { valid: false, errors, warnings, stats: collectStats([]) };
  }

  const allIds = new Set<string>();
  const allDayNumbers: number[] = [];

  function checkDuplicateId(id: string, path: string) {
    if (!isNonEmptyString(id)) {
      errors.push({ path, field: 'id', message: 'is missing an id.', severity: 'error' });
      return;
    }
    if (allIds.has(id)) {
      errors.push({ path, field: 'id', message: `has duplicate id "${id}".`, severity: 'error' });
    }
    allIds.add(id);
  }

  const phases = obj.phases as unknown[];

  phases.forEach((phase: unknown, pIdx: number) => {
    const pPath = `Phase ${pIdx + 1}`;
    if (!phase || typeof phase !== 'object') {
      errors.push({ path: pPath, field: 'phase', message: 'is not a valid object.', severity: 'error' });
      return;
    }
    const p = phase as Record<string, unknown>;
    checkDuplicateId(p.id as string, pPath);

    if (!isNonEmptyString(p.title)) {
      errors.push({ path: pPath, field: 'title', message: 'is missing title.', severity: 'error' });
    }

    if (!Array.isArray(p.weeks)) {
      errors.push({ path: pPath, field: 'weeks', message: 'is missing weeks array.', severity: 'error' });
      return;
    }

    (p.weeks as unknown[]).forEach((week: unknown, wIdx: number) => {
      const wPath = `${pPath} → Week ${wIdx + 1}`;
      if (!week || typeof week !== 'object') {
        errors.push({ path: wPath, field: 'week', message: 'is not a valid object.', severity: 'error' });
        return;
      }
      const w = week as Record<string, unknown>;
      checkDuplicateId(w.id as string, wPath);

      if (!isNonEmptyString(w.title)) {
        errors.push({ path: wPath, field: 'title', message: 'is missing title.', severity: 'error' });
      }

      if (!Array.isArray(w.days)) {
        errors.push({ path: wPath, field: 'days', message: 'is missing days array.', severity: 'error' });
        return;
      }

      (w.days as unknown[]).forEach((day: unknown, dIdx: number) => {
        const dPath = `${wPath} → Day ${dIdx + 1}`;
        if (!day || typeof day !== 'object') {
          errors.push({ path: dPath, field: 'day', message: 'is not a valid object.', severity: 'error' });
          return;
        }
        const d = day as Record<string, unknown>;
        checkDuplicateId(d.id as string, dPath);

        if (!isNonEmptyString(d.title)) {
          errors.push({ path: dPath, field: 'title', message: 'is missing title.', severity: 'error' });
        }

        if (d.type && !DAY_TYPES.includes(d.type as DayType)) {
          errors.push({ path: dPath, field: 'type', message: `has invalid day type "${d.type}".`, severity: 'error' });
        }

        if (typeof d.dayNumber === 'number') {
          allDayNumbers.push(d.dayNumber);
        }

        // Validate tasks
        if (Array.isArray(d.tasks)) {
          (d.tasks as unknown[]).forEach((task: unknown, tIdx: number) => {
            const tPath = `${dPath} → Task ${tIdx + 1}`;
            if (!task || typeof task !== 'object') {
              errors.push({ path: tPath, field: 'task', message: 'is not a valid object.', severity: 'error' });
              return;
            }
            const t = task as Record<string, unknown>;
            checkDuplicateId(t.id as string, tPath);

            if (!isNonEmptyString(t.title)) {
              errors.push({ path: tPath, field: 'title', message: 'is missing title.', severity: 'error' });
            }
          });
        }

        // Validate resources
        if (Array.isArray(d.resources)) {
          (d.resources as unknown[]).forEach((res: unknown, rIdx: number) => {
            const rPath = `${dPath} → Resource ${rIdx + 1}`;
            if (!res || typeof res !== 'object') {
              errors.push({ path: rPath, field: 'resource', message: 'is not a valid object.', severity: 'error' });
              return;
            }
            const r = res as Record<string, unknown>;
            checkDuplicateId(r.id as string, rPath);

            if (!isNonEmptyString(r.title)) {
              errors.push({ path: rPath, field: 'title', message: 'is missing title.', severity: 'error' });
            }

            if (r.type && !RESOURCE_TYPES.includes(r.type as ResourceType)) {
              errors.push({ path: rPath, field: 'type', message: `has invalid resource type "${r.type}".`, severity: 'error' });
            }

            if (isNonEmptyString(r.url as string) && !isValidUrl(r.url as string)) {
              errors.push({ path: rPath, field: 'url', message: `has invalid URL "${r.url}".`, severity: 'error' });
            }
          });
        }
      });
    });
  });

  // Check for duplicate day numbers
  const dayNumCounts = new Map<number, number>();
  for (const dn of allDayNumbers) {
    dayNumCounts.set(dn, (dayNumCounts.get(dn) || 0) + 1);
  }
  for (const [dn, count] of dayNumCounts) {
    if (count > 1) {
      errors.push({ path: 'root', field: 'dayNumber', message: `Day number ${dn} appears ${count} times. Day numbers must be unique.`, severity: 'error' });
    }
  }

  const stats = collectStats(obj.phases as CurriculumPhase[]);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}

// ─── Publish Validation ───

/**
 * Strict validation before publishing a version.
 * Checks contiguous day numbers, completeness, and duration match.
 */
export function validateForPublish(
  version: CurriculumTemplateVersion,
  expectedDurationDays: number,
  planName?: string,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const { phases } = version;

  if (phases.length === 0) {
    errors.push({ path: 'root', field: 'phases', message: 'Template must have at least one phase.', severity: 'error' });
    return { valid: false, errors, warnings, stats: collectStats(phases) };
  }

  const allDayNumbers: number[] = [];
  let globalDayCounter = 0;

  // Sort phases by order for validation
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);

  sortedPhases.forEach((phase, pIdx) => {
    const pPath = `Phase ${pIdx + 1}: ${phase.title || '(untitled)'}`;

    if (!isNonEmptyString(phase.title)) {
      errors.push({ path: pPath, field: 'title', message: 'is missing title.', severity: 'error' });
    }

    if (phase.weeks.length === 0) {
      errors.push({ path: pPath, field: 'weeks', message: 'must have at least one week.', severity: 'error' });
      return;
    }

    const sortedWeeks = [...phase.weeks].sort((a, b) => a.order - b.order);

    sortedWeeks.forEach((week, wIdx) => {
      const wPath = `${pPath} → Week ${wIdx + 1}: ${week.title || '(untitled)'}`;

      if (!isNonEmptyString(week.title)) {
        errors.push({ path: wPath, field: 'title', message: 'is missing title.', severity: 'error' });
      }

      if (week.days.length === 0) {
        errors.push({ path: wPath, field: 'days', message: 'must have at least one day.', severity: 'error' });
        return;
      }

      const sortedDays = [...week.days].sort((a, b) => a.order - b.order);

      sortedDays.forEach((day, dIdx) => {
        globalDayCounter++;
        const dPath = `${wPath} → Day ${globalDayCounter}: ${day.title || '(untitled)'}`;

        if (!isNonEmptyString(day.title)) {
          errors.push({ path: dPath, field: 'title', message: 'is missing title.', severity: 'error' });
        }

        if (!day.type || !DAY_TYPES.includes(day.type)) {
          errors.push({ path: dPath, field: 'type', message: `has invalid or missing day type "${day.type}".`, severity: 'error' });
        }

        if (day.tasks.length === 0 && day.type !== 'BREAK') {
          errors.push({ path: dPath, field: 'tasks', message: 'must have at least one task (unless type is BREAK).', severity: 'error' });
        }

        if (day.objectives.length === 0) {
          warnings.push({ path: dPath, field: 'objectives', message: 'has no objectives defined.', severity: 'warning' });
        }

        allDayNumbers.push(day.dayNumber);

        // Validate each task
        day.tasks.forEach((task, tIdx) => {
          const tPath = `${dPath} → Task ${tIdx + 1}: ${task.title || '(untitled)'}`;

          if (!isNonEmptyString(task.title)) {
            errors.push({ path: tPath, field: 'title', message: 'is missing title.', severity: 'error' });
          }
          if (!isNonEmptyString(task.description)) {
            errors.push({ path: tPath, field: 'description', message: 'is missing description.', severity: 'error' });
          }
          if (!isNonEmptyString(task.instructions)) {
            errors.push({ path: tPath, field: 'instructions', message: 'is missing instructions.', severity: 'error' });
          }
        });

        // Validate each resource
        day.resources.forEach((res, rIdx) => {
          const rPath = `${dPath} → Resource ${rIdx + 1}: ${res.title || '(untitled)'}`;

          if (!isNonEmptyString(res.title)) {
            errors.push({ path: rPath, field: 'title', message: 'is missing title.', severity: 'error' });
          }
          if (!res.type || !RESOURCE_TYPES.includes(res.type)) {
            errors.push({ path: rPath, field: 'type', message: `has invalid resource type "${res.type}".`, severity: 'error' });
          }
          if (!isNonEmptyString(res.url)) {
            errors.push({ path: rPath, field: 'url', message: 'is missing URL.', severity: 'error' });
          } else if (!isValidUrl(res.url)) {
            errors.push({ path: rPath, field: 'url', message: `has invalid URL "${res.url}".`, severity: 'error' });
          }
        });
      });
    });
  });

  // Check unique IDs
  const allIds = new Set<string>();
  function walkIds(phases: CurriculumPhase[]) {
    for (const phase of phases) {
      if (allIds.has(phase.id)) {
        errors.push({ path: 'root', field: 'id', message: `Duplicate id "${phase.id}" found.`, severity: 'error' });
      }
      allIds.add(phase.id);
      for (const week of phase.weeks) {
        if (allIds.has(week.id)) {
          errors.push({ path: 'root', field: 'id', message: `Duplicate id "${week.id}" found.`, severity: 'error' });
        }
        allIds.add(week.id);
        for (const day of week.days) {
          if (allIds.has(day.id)) {
            errors.push({ path: 'root', field: 'id', message: `Duplicate id "${day.id}" found.`, severity: 'error' });
          }
          allIds.add(day.id);
          for (const task of day.tasks) {
            if (allIds.has(task.id)) {
              errors.push({ path: 'root', field: 'id', message: `Duplicate id "${task.id}" found.`, severity: 'error' });
            }
            allIds.add(task.id);
          }
          for (const res of day.resources) {
            if (allIds.has(res.id)) {
              errors.push({ path: 'root', field: 'id', message: `Duplicate id "${res.id}" found.`, severity: 'error' });
            }
            allIds.add(res.id);
          }
        }
      }
    }
  }
  walkIds(phases);

  // Check duplicate day numbers
  const dayNumCounts = new Map<number, number>();
  for (const dn of allDayNumbers) {
    dayNumCounts.set(dn, (dayNumCounts.get(dn) || 0) + 1);
  }
  for (const [dn, count] of dayNumCounts) {
    if (count > 1) {
      errors.push({ path: 'root', field: 'dayNumber', message: `Day number ${dn} appears ${count} times. Day numbers must be unique.`, severity: 'error' });
    }
  }

  // Check contiguous day numbers (1, 2, 3, ..., N)
  const sortedDayNums = [...allDayNumbers].sort((a, b) => a - b);
  for (let i = 0; i < sortedDayNums.length; i++) {
    const expected = i + 1;
    if (sortedDayNums[i] !== expected) {
      errors.push({
        path: 'root',
        field: 'dayNumber',
        message: `Day ${expected} is missing. Day numbers must be contiguous from 1 to ${sortedDayNums.length}.`,
        severity: 'error',
      });
      break; // Only report the first gap
    }
  }

  // Duration match
  const actualDayCount = allDayNumbers.length;
  if (actualDayCount !== expectedDurationDays) {
    const label = planName || 'Plan';
    errors.push({
      path: 'root',
      field: 'durationDays',
      message: `${label} requires ${expectedDurationDays} curriculum days, but this curriculum contains ${actualDayCount} days.`,
      severity: 'error',
    });
  }

  const stats = collectStats(phases);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}

// ─── Day Number Recalculation ───

/**
 * Walks phases → weeks → days (all sorted by `order`) and
 * assigns sequential dayNumber starting from 1.
 * Returns a new array — does not mutate the input.
 */
export function recalculateDayNumbers(phases: CurriculumPhase[]): CurriculumPhase[] {
  let dayCounter = 0;

  return phases
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((phase) => ({
      ...phase,
      weeks: phase.weeks
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((week) => ({
          ...week,
          days: week.days
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((day) => {
              dayCounter++;
              return { ...day, dayNumber: dayCounter };
            }),
        })),
    }));
}
