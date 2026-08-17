"use client";

import { useState } from "react";
import { Plus, Save, ChevronDown, ChevronUp, Trash2, Eye, Compass, Calendar, BookOpen, Layers, CheckSquare, Settings } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type {
  CurriculumTemplate,
  CurriculumPhase,
  CurriculumWeek,
  CurriculumTask,
  CurriculumResource,
  ValidationResult,
  VideoLessonStatus,
} from "@/lib/curriculum/types";
import {
  generateId,
  updateVersion,
  publishVersion,
  createNewVersionFromPublished,
} from "@/lib/curriculum";
import { recalculateDayNumbers, validateForPublish } from "@/lib/curriculum/validators";
import { DayEditor } from "./DayEditor";
import { DayTypeBadge } from "./DayTypeBadge";
import { VersionSelector } from "./VersionSelector";
import { PublishValidationPanel } from "./PublishValidationPanel";
import { TaskLibraryPicker } from "./TaskLibraryPicker";
import { ResourceLibraryPicker } from "./ResourceLibraryPicker";
import { useAlertModal } from "@/components/admin/ui/AlertModalProvider";

interface CurriculumBuilderProps {
  template: CurriculumTemplate;
  initialVersionId: string;
  programName: string;
  planName: string;
  onTemplateChange: () => void;
  onNavigatePreview: (templateId: string, versionId: string) => void;
}

export function CurriculumBuilder({
  template,
  initialVersionId,
  programName,
  planName,
  onTemplateChange,
  onNavigatePreview,
}: CurriculumBuilderProps) {
  const [currentVersionId, setCurrentVersionId] = useState(initialVersionId);
  const [phases, setPhases] = useState<CurriculumPhase[]>(() => {
    const ver = template.versions.find((v) => v.id === initialVersionId);
    return ver ? recalculateDayNumbers(ver.phases) : [];
  });
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [taskPickerForDay, setTaskPickerForDay] = useState<string | null>(null);
  const [resourcePickerForDay, setResourcePickerForDay] = useState<string | null>(null);
  
  const { showAlert, showConfirm } = useAlertModal();

  const currentVersion = template.versions.find((v) => v.id === currentVersionId);
  const readOnly = currentVersion?.status !== "DRAFT";
  const isActivePublished = currentVersion?.id === template.currentPublishedVersionId;

  // Duration info
  const durationLabel = template.durationDays >= 30
    ? `${Math.round(template.durationDays / 30)} Month${template.durationDays >= 60 ? "s" : ""} · ${template.durationDays} Days`
    : `${template.durationDays} Days`;

  // Count current days
  let currentDayCount = 0;
  for (const p of phases) {
    for (const w of p.weeks) {
      currentDayCount += w.days.length;
    }
  }

  // ─── Phase operations ───
  const addPhase = () => {
    const newPhase: CurriculumPhase = {
      id: generateId("phase"),
      order: phases.length + 1,
      title: "",
      description: "",
      weeks: [],
    };
    const updated = recalculateDayNumbers([...phases, newPhase]);
    setPhases(updated);
  };

  const updatePhase = (phaseId: string, data: Partial<CurriculumPhase>) => {
    setPhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, ...data } : p))
    );
  };

  const deletePhase = async (phaseId: string) => {
    if (!(await showConfirm("Delete this phase and all its content?"))) return;
    const updated = recalculateDayNumbers(
      phases.filter((p) => p.id !== phaseId).map((p, i) => ({ ...p, order: i + 1 }))
    );
    setPhases(updated);
  };

  const reorderPhase = (phaseId: string, direction: "up" | "down") => {
    const idx = phases.findIndex((p) => p.id === phaseId);
    if (idx === -1) return;
    const newPhases = [...phases];
    if (direction === "up" && idx > 0) {
      [newPhases[idx - 1], newPhases[idx]] = [newPhases[idx], newPhases[idx - 1]];
    } else if (direction === "down" && idx < newPhases.length - 1) {
      [newPhases[idx], newPhases[idx + 1]] = [newPhases[idx + 1], newPhases[idx]];
    }
    const updated = recalculateDayNumbers(newPhases.map((p, i) => ({ ...p, order: i + 1 })));
    setPhases(updated);
  };

  // ─── Week operations ───
  const addWeek = (phaseId: string) => {
    setPhases((prev) => {
      const newPhases = prev.map((p) => {
        if (p.id === phaseId) {
          return {
            ...p,
            weeks: [...p.weeks, {
              id: generateId("week"),
              order: p.weeks.length + 1,
              title: "",
              goal: "",
              days: [],
            }],
          };
        }
        return p;
      });
      return recalculateDayNumbers(newPhases);
    });
  };

  const updateWeek = (phaseId: string, weekId: string, data: Partial<CurriculumWeek>) => {
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId
          ? { ...p, weeks: p.weeks.map((w) => (w.id === weekId ? { ...w, ...data } : w)) }
          : p
      )
    );
  };

  const deleteWeek = async (phaseId: string, weekId: string) => {
    if (!(await showConfirm("Delete this week and all its days?"))) return;
    setPhases((prev) => {
      const newPhases = prev.map((p) =>
        p.id === phaseId
          ? { ...p, weeks: p.weeks.filter((w) => w.id !== weekId).map((w, i) => ({ ...w, order: i + 1 })) }
          : p
      );
      return recalculateDayNumbers(newPhases);
    });
  };

  const reorderWeek = (phaseId: string, weekId: string, direction: "up" | "down") => {
    setPhases((prev) => {
      const newPhases = prev.map((p) => {
        if (p.id !== phaseId) return p;
        const idx = p.weeks.findIndex((w) => w.id === weekId);
        if (idx === -1) return p;
        const newWeeks = [...p.weeks];
        if (direction === "up" && idx > 0) {
          [newWeeks[idx - 1], newWeeks[idx]] = [newWeeks[idx], newWeeks[idx - 1]];
        } else if (direction === "down" && idx < newWeeks.length - 1) {
          [newWeeks[idx], newWeeks[idx + 1]] = [newWeeks[idx + 1], newWeeks[idx]];
        }
        return { ...p, weeks: newWeeks.map((w, i) => ({ ...w, order: i + 1 })) };
      });
      return recalculateDayNumbers(newPhases);
    });
  };

  // ─── Day operations ───
  const addDay = (phaseId: string, weekId: string) => {
    setPhases((prev) => {
      const newPhases = prev.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              weeks: p.weeks.map((w) =>
                w.id === weekId
                  ? {
                      ...w,
                      days: [...w.days, {
                        id: generateId("day"),
                        order: w.days.length + 1,
                        dayNumber: 0,
                        title: "",
                        type: "LEARNING" as const,
                        description: "",
                        estimatedMinutes: 120,
                        objectives: [],
                        tasks: [],
                        resources: [],
                      }],
                    }
                  : w
              ),
            }
          : p
      );
      return recalculateDayNumbers(newPhases);
    });
  };

  const updateDay = (phaseId: string, weekId: string, dayId: string, data: Partial<CurriculumPhase["weeks"][number]["days"][number]>) => {
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              weeks: p.weeks.map((w) =>
                w.id === weekId
                  ? {
                      ...w,
                      days: w.days.map((d) => (d.id === dayId ? { ...d, ...data } : d)),
                    }
                  : w
              ),
            }
          : p
      )
    );
  };

  const deleteDay = async (phaseId: string, weekId: string, dayId: string) => {
    const week = phases.find((p) => p.id === phaseId)?.weeks.find((w) => w.id === weekId);
    const day = week?.days.find((d) => d.id === dayId);
    
    if (day) {
      const lcIds = (day.learningContent || []).map((lc) => lc.id);
      const referencingTasks = day.tasks.filter((t) =>
        t.prerequisites?.some((p) => lcIds.includes(p.targetId))
      ).map((t) => t.title);

      if (referencingTasks.length > 0) {
        await showAlert(`Cannot delete this day: Deleting the day's learning content breaks prerequisites referenced inside tasks: "${referencingTasks.join('", "')}".`, "Cannot Delete", "error");
        return;
      }
    }

    if (!(await showConfirm("Are you sure you want to delete this day?"))) return;
    setPhases((prev) => {
      const newPhases = prev.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              weeks: p.weeks.map((w) =>
                w.id === weekId
                  ? {
                      ...w,
                      days: w.days.filter((d) => d.id !== dayId).map((d, i) => ({ ...d, order: i + 1 })),
                    }
                  : w
              ),
            }
          : p
      );
      return recalculateDayNumbers(newPhases);
    });
  };

  const reorderDay = (phaseId: string, weekId: string, dayId: string, direction: "up" | "down") => {
    setPhases((prev) => {
      const newPhases = prev.map((p) => {
        if (p.id !== phaseId) return p;
        return {
          ...p,
          weeks: p.weeks.map((w) => {
            if (w.id !== weekId) return w;
            const idx = w.days.findIndex((d) => d.id === dayId);
            if (idx === -1) return w;
            const newDays = [...w.days];
            if (direction === "up" && idx > 0) {
              [newDays[idx - 1], newDays[idx]] = [newDays[idx], newDays[idx - 1]];
            } else if (direction === "down" && idx < newDays.length - 1) {
              [newDays[idx], newDays[idx + 1]] = [newDays[idx + 1], newDays[idx]];
            }
            return { ...w, days: newDays.map((d, i) => ({ ...d, order: i + 1 })) };
          }),
        };
      });
      return recalculateDayNumbers(newPhases);
    });
  };

  // ─── Import from libraries ───
  const handleTaskFromLibrary = (dayId: string, taskItem: any) => {
    setPhases((prev) =>
      prev.map((p) => ({
        ...p,
        weeks: p.weeks.map((w) => ({
          ...w,
          days: w.days.map((d) => {
            if (d.id !== dayId) return d;

            const newTask: CurriculumTask = {
              id: generateId("task"),
              order: d.tasks.length + 1,
              title: taskItem.title,
              description: taskItem.description || "",
              instructions: taskItem.instructions || "",
              estimatedMinutes: taskItem.estimatedMinutes || 60,
              requiresSubmission: taskItem.requiresSubmission || false,
              requiresMentorReview: taskItem.requiresMentorReview || false,
              sourceLibraryId: taskItem.id,
              prerequisites: [],
            };

            return { ...d, tasks: [...d.tasks, newTask] };
          }),
        })),
      }))
    );
    setTaskPickerForDay(null);
  };

  const handleResourceFromLibrary = (dayId: string, resourceItem: any) => {
    setPhases((prev) =>
      prev.map((p) => ({
        ...p,
        weeks: p.weeks.map((w) => ({
          ...w,
          days: w.days.map((d) => {
            if (d.id !== dayId) return d;

            const newResource: CurriculumResource = {
              id: generateId("res"),
              order: d.resources.length + 1,
              title: resourceItem.title,
              type: resourceItem.type,
              url: resourceItem.url,
              description: resourceItem.description || "",
              sourceLibraryId: resourceItem.id,
            };

            return { ...d, resources: [...d.resources, newResource] };
          }),
        })),
      }))
    );
    setResourcePickerForDay(null);
  };

  // ─── Save & Publish version ───
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateVersion(template.id, currentVersionId, { phases });
      onTemplateChange();
      await showAlert("Curriculum saved successfully.", "Success", "success");
    } catch (err) {
      await showAlert((err as Error).message, "Error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentVersion) return;
    const result = validateForPublish(
      { ...currentVersion, phases },
      template.durationDays,
      planName
    );
    setValidationResult(result);
    setShowValidation(true);
  };

  const handleConfirmPublish = async () => {
    setPublishing(true);
    try {
      await publishVersion(template.id, currentVersionId);
      setShowValidation(false);
      const validation = validateForPublish({ ...currentVersion!, phases }, template.durationDays, planName);
      setValidationResult(validation);
      if (validation.valid) {
        await showAlert("Curriculum version published successfully.", "Success", "success");
        onTemplateChange();
        window.location.reload();
      }
    } catch (err) {
      await showAlert((err as Error).message, "Error", "error");
    } finally {
      setPublishing(false);
    }
  };

  const handleCreateNewVersion = async () => {
    try {
      const newVer = await createNewVersionFromPublished(template.id, currentVersionId);
      setCurrentVersionId(newVer.id);
      setPhases(recalculateDayNumbers(newVer.phases));
      onTemplateChange();
    } catch (err) {
      await showAlert((err as Error).message, "Error", "error");
    }
  };

  const handleSelectVersion = (versionId: string) => {
    const ver = template.versions.find((v) => v.id === versionId);
    if (ver) {
      setCurrentVersionId(versionId);
      setPhases(recalculateDayNumbers(ver.phases));
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Sticky header */}
      <div className="sticky top-[73px] z-20 -mx-5 sm:-mx-8 bg-background/95 backdrop-blur-sm px-5 sm:px-8 py-4 border-b border-navy/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-navy truncate">
                {template.templateName}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-slate">{programName}</span>
                <span className="text-slate/30">·</span>
                <span className="text-xs text-slate">{planName}</span>
                <span className="text-slate/30">·</span>
                <span className="text-xs font-medium text-navy/70">{durationLabel}</span>
                <span className="text-slate/30">·</span>
                <span className={cn(
                  "text-xs font-semibold",
                  currentDayCount === template.durationDays ? "text-emerald-600" : "text-red-500"
                )}>
                  {currentDayCount}/{template.durationDays} days configured
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <VersionSelector
              versions={template.versions}
              currentVersionId={currentVersionId}
              activePublishedVersionId={template.currentPublishedVersionId}
              onSelectVersion={handleSelectVersion}
              onCreateNewVersion={currentVersion?.status === "PUBLISHED" ? handleCreateNewVersion : undefined}
            />
            {!readOnly && (
              <>
                <Button onClick={handleSave} variant="secondary" size="sm" disabled={saving}>
                  <Save className="mr-1.5 h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button onClick={handlePublish} size="sm">
                  Publish
                </Button>
              </>
            )}
            <Button
              onClick={() => onNavigatePreview(template.id, currentVersionId)}
              variant="ghost"
              size="sm"
            >
              <Eye className="mr-1.5 h-4 w-4" />
              Preview
            </Button>
          </div>
        </div>

        {readOnly && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
            <Eye className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-medium text-blue-600">
              {currentVersion?.status === "PUBLISHED"
                ? "This is a published version (read-only). Create a new version to make changes."
                : "This is an archived version (read-only)."}
            </span>
          </div>
        )}
      </div>

      {/* Onboarding Designer Banner Guide */}
      <div className="rounded-2xl border border-blue-500/10 bg-gradient-to-r from-blue-500/[0.03] to-transparent p-5 flex items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
          <Compass className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Curriculum Hierarchy Guide</h4>
          <p className="text-xs text-slate leading-relaxed">
            Organize content using the three levels: **Phases** (broad structural segments) ➔ **Weeks** (milestone periods) ➔ **Days** (individual daily lectures and assignments). Click any header to expand and configure.
          </p>
        </div>
      </div>

      {/* Phase list */}
      {phases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/20 p-12 text-center">
          <p className="text-slate mb-4">No phases added yet. Start building your curriculum.</p>
          {!readOnly && (
            <Button onClick={addPhase} variant="secondary">
              <Plus className="mr-2 h-4 w-4" /> Add First Phase
            </Button>
          )}
        </div>
      ) : (
        <Accordion.Root type="multiple" className="space-y-6">
          {phases.map((phase, pIdx) => {
            let phaseDaysCount = 0;
            let phaseTasksCount = 0;
            phase.weeks.forEach((w) => {
              phaseDaysCount += w.days.length;
              w.days.forEach((d) => {
                phaseTasksCount += d.tasks.length;
              });
            });

            return (
              <Accordion.Item
                key={phase.id}
                value={phase.id}
                className="rounded-2xl border-t-4 border-t-navy border border-navy/10 bg-slate-50/50 shadow-sm overflow-hidden"
              >
                {/* Phase header */}
                <div className="flex items-center justify-between border-b border-navy/5 bg-navy/[0.02] px-4 py-3.5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {!readOnly && (
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <button onClick={() => reorderPhase(phase.id, "up")} disabled={pIdx === 0} className="text-slate hover:text-navy disabled:opacity-30 p-0.5">
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => reorderPhase(phase.id, "down")} disabled={pIdx === phases.length - 1} className="text-slate hover:text-navy disabled:opacity-30 p-0.5">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <Accordion.Header className="flex-1 min-w-0">
                      <Accordion.Trigger className="flex flex-1 items-center gap-3 text-left w-full [&[data-state=open]>svg]:rotate-180">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-white text-xs font-extrabold shadow-sm">
                          P{pIdx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          {readOnly ? (
                            <p className="font-bold text-navy truncate text-sm">{phase.title || "(Untitled Phase)"}</p>
                          ) : (
                            <input
                              value={phase.title}
                              placeholder="Define Phase Name (e.g. Phase 1: Web Development Basics)"
                              onChange={(e) => updatePhase(phase.id, { title: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full font-bold text-navy bg-transparent outline-none border-b border-transparent focus:border-navy/20 px-1 py-0.5 text-sm"
                            />
                          )}
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate font-medium">
                            <span className="flex items-center gap-0.5"><Layers className="h-2.5 w-2.5" /> {phase.weeks.length} Weeks</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" /> {phaseDaysCount} Days</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5"><CheckSquare className="h-2.5 w-2.5" /> {phaseTasksCount} Tasks</span>
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate transition-transform duration-200 shrink-0" />
                      </Accordion.Trigger>
                    </Accordion.Header>
                  </div>
                  {!readOnly && (
                    <button onClick={() => deletePhase(phase.id)} className="ml-2 p-2 text-slate hover:text-red-500 hover:bg-red-500/10 rounded-lg transition shrink-0" title="Delete Phase">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Phase content */}
                <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  <div className="p-4 sm:p-5 space-y-4">
                    {!readOnly && (
                      <div className="mb-2">
                        <label className="text-[10px] font-bold uppercase text-slate tracking-wider block mb-1">Phase Focus & Description</label>
                        <textarea
                          value={phase.description}
                          placeholder="Describe the main focus and key targets for this phase..."
                          onChange={(e) => updatePhase(phase.id, { description: e.target.value })}
                          className="w-full min-h-[50px] rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs text-navy outline-none focus:border-honey resize-y"
                        />
                      </div>
                    )}
                    {readOnly && phase.description && (
                      <p className="text-xs text-slate bg-white border border-navy/5 rounded-xl p-3 mb-2">{phase.description}</p>
                    )}

                    {/* Weeks inside phase */}
                    {phase.weeks.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-navy/15 bg-white p-8 text-center text-xs text-slate">
                        No weeks added to this phase yet.
                        {!readOnly && (
                          <button onClick={() => addWeek(phase.id)} className="ml-2 text-honey font-bold hover:text-honey-deep underline">
                            + Add Week
                          </button>
                        )}
                      </div>
                    ) : (
                      <Accordion.Root type="multiple" className="space-y-4">
                        {phase.weeks.map((week, wIdx) => {
                          let weekTasksCount = 0;
                          week.days.forEach((d) => {
                            weekTasksCount += d.tasks.length;
                          });

                          return (
                            <Accordion.Item
                              key={week.id}
                              value={week.id}
                              className="rounded-xl border-l-4 border-l-honey border border-navy/8 bg-white shadow-sm overflow-hidden"
                            >
                              {/* Week header */}
                              <div className="flex items-center justify-between border-b border-navy/5 bg-navy/[0.01] px-3.5 py-3">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {!readOnly && (
                                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                                      <button onClick={() => reorderWeek(phase.id, week.id, "up")} disabled={wIdx === 0} className="text-slate hover:text-navy disabled:opacity-30 p-0.5">
                                        <ChevronUp className="h-3 w-3" />
                                      </button>
                                      <button onClick={() => reorderWeek(phase.id, week.id, "down")} disabled={wIdx === phase.weeks.length - 1} className="text-slate hover:text-navy disabled:opacity-30 p-0.5">
                                        <ChevronDown className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                  <Accordion.Header className="flex-1 min-w-0">
                                    <Accordion.Trigger className="flex flex-1 items-center gap-3 text-left w-full [&[data-state=open]>svg]:rotate-180">
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-honey/15 border border-honey text-honey-deep text-[10px] font-extrabold">
                                        W{wIdx + 1}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        {readOnly ? (
                                          <p className="text-sm font-bold text-navy truncate">{week.title || "(Untitled Week)"}</p>
                                        ) : (
                                          <input
                                            value={week.title}
                                            placeholder="Define Week Theme (e.g. Week 1: Flexbox Layouts)"
                                            onChange={(e) => updateWeek(phase.id, week.id, { title: e.target.value })}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full text-sm font-bold text-navy bg-transparent outline-none border-b border-transparent focus:border-honey/30 px-1 py-0.5"
                                          />
                                        )}
                                        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate font-medium">
                                          <span>{week.days.length} Days</span>
                                          <span>·</span>
                                          <span>{weekTasksCount} Tasks</span>
                                        </div>
                                      </div>
                                      <ChevronDown className="h-3.5 w-3.5 text-slate transition-transform duration-200 shrink-0" />
                                    </Accordion.Trigger>
                                  </Accordion.Header>
                                </div>
                                {!readOnly && (
                                  <button onClick={() => deleteWeek(phase.id, week.id)} className="ml-2 p-1.5 text-slate hover:text-red-500 hover:bg-red-500/10 rounded-lg transition shrink-0" title="Delete Week">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Week content */}
                              <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                                <div className="p-4 space-y-4">
                                  {!readOnly && (
                                    <div>
                                      <label className="text-[9px] font-bold uppercase text-slate tracking-wider block mb-1">Week Goal / Milestone</label>
                                      <input
                                        value={week.goal}
                                        placeholder="What should the student achieve by the end of this week?"
                                        onChange={(e) => updateWeek(phase.id, week.id, { goal: e.target.value })}
                                        className="w-full rounded-xl border border-navy/10 bg-navy/[0.01] px-3 py-2 text-xs text-navy outline-none focus:border-honey"
                                      />
                                    </div>
                                  )}
                                  {readOnly && week.goal && (
                                    <p className="text-xs text-slate italic bg-navy/[0.01] border border-navy/5 p-2.5 rounded-lg">
                                      Goal: {week.goal}
                                    </p>
                                  )}

                                  {/* Days inside week */}
                                  <div className="space-y-3">
                                    <span className="text-[10px] font-extrabold uppercase text-slate tracking-wider block">Days Curriculum Timeline</span>
                                    
                                    {week.days.length === 0 ? (
                                      <div className="rounded-xl border border-dashed border-navy/10 bg-navy/[0.01] p-6 text-center text-xs text-slate">
                                        No days added to this week yet.
                                        {!readOnly && (
                                          <button onClick={() => addDay(phase.id, week.id)} className="ml-2 text-honey font-bold hover:text-honey-deep underline">
                                            + Add Day
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <Accordion.Root type="multiple" className="space-y-2.5">
                                        {week.days.map((day, dIdx) => (
                                          <Accordion.Item
                                            key={day.id}
                                            value={day.id}
                                            className="rounded-xl border border-navy/5 bg-navy/[0.01] overflow-hidden"
                                          >
                                            {/* Day header */}
                                            <div className="flex items-center justify-between px-3 py-2 bg-white">
                                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {!readOnly && (
                                                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                                                    <button onClick={() => reorderDay(phase.id, week.id, day.id, "up")} disabled={dIdx === 0} className="text-slate hover:text-navy disabled:opacity-30 p-0.5">
                                                      <ChevronUp className="h-2.5 w-2.5" />
                                                    </button>
                                                    <button onClick={() => reorderDay(phase.id, week.id, day.id, "down")} disabled={dIdx === week.days.length - 1} className="text-slate hover:text-navy disabled:opacity-30 p-0.5">
                                                      <ChevronDown className="h-2.5 w-2.5" />
                                                    </button>
                                                  </div>
                                                )}
                                                <Accordion.Header className="flex-1 min-w-0">
                                                  <Accordion.Trigger className="flex flex-1 items-center gap-2.5 text-left w-full [&[data-state=open]>svg]:rotate-180">
                                                    <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg bg-navy text-white text-[10px] font-extrabold shadow-sm">
                                                      D{day.dayNumber}
                                                    </span>
                                                    <span className="text-xs font-semibold text-navy truncate flex-1">
                                                      {day.title || `Day ${day.dayNumber} (Untitled)`}
                                                    </span>
                                                    <DayTypeBadge type={day.type} className="shrink-0 scale-90" />
                                                    <span className="text-[9px] text-slate font-medium bg-navy/5 px-2 py-0.5 rounded shrink-0">
                                                      {day.tasks.length} tasks
                                                    </span>
                                                    <ChevronDown className="h-3 w-3 text-slate transition-transform duration-200 shrink-0" />
                                                  </Accordion.Trigger>
                                                </Accordion.Header>
                                              </div>
                                              {!readOnly && (
                                                <button onClick={() => deleteDay(phase.id, week.id, day.id)} className="ml-2 p-1.5 text-slate hover:text-red-500 hover:bg-red-500/10 rounded transition shrink-0" title="Delete Day">
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                              )}
                                            </div>

                                            {/* Day content */}
                                            <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                                              <div className="px-3.5 pb-3.5 pt-2 bg-white">
                                                <DayEditor
                                                  day={day}
                                                  onChange={(updated) => updateDay(phase.id, week.id, day.id, updated)}
                                                  onAddFromTaskLibrary={() => setTaskPickerForDay(day.id)}
                                                  onAddFromResourceLibrary={() => setResourcePickerForDay(day.id)}
                                                  readOnly={readOnly}
                                                />
                                              </div>
                                            </Accordion.Content>
                                          </Accordion.Item>
                                        ))}
                                      </Accordion.Root>
                                    )}

                                    {!readOnly && week.days.length > 0 && (
                                      <button
                                        onClick={() => addDay(phase.id, week.id)}
                                        className="w-full rounded-xl border border-dashed border-navy/10 py-2.5 text-xs font-bold text-slate bg-navy/[0.01] hover:border-honey/30 hover:text-honey-deep transition flex items-center justify-center gap-1"
                                      >
                                        <Plus className="h-3.5 w-3.5 text-honey" /> Add Day to Week
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </Accordion.Content>
                            </Accordion.Item>
                          );
                        })}
                      </Accordion.Root>
                    )}

                    {!readOnly && phase.weeks.length > 0 && (
                      <button
                        onClick={() => addWeek(phase.id)}
                        className="w-full rounded-xl border border-dashed border-navy/10 py-2.5 text-xs font-bold text-slate bg-navy/[0.01] hover:border-honey/30 hover:text-honey-deep transition flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5 text-honey" /> Add Week to Phase
                      </button>
                    )}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            );
          })}
        </Accordion.Root>
      )}

      {/* Add Phase button */}
      {!readOnly && phases.length > 0 && (
        <button
          onClick={addPhase}
          className="w-full rounded-2xl border-2 border-dashed border-navy/10 py-4 text-sm font-bold text-slate hover:border-honey/40 hover:text-honey-deep transition flex items-center justify-center gap-1"
        >
          <Plus className="h-4 w-4 text-honey" /> Add Phase
        </button>
      )}

      {/* Library pickers */}
      <TaskLibraryPicker
        open={!!taskPickerForDay}
        onClose={() => setTaskPickerForDay(null)}
        onSelect={(task) => {
          if (taskPickerForDay) handleTaskFromLibrary(taskPickerForDay, task);
        }}
      />
      <ResourceLibraryPicker
        open={!!resourcePickerForDay}
        onClose={() => setResourcePickerForDay(null)}
        onSelect={(resource) => {
          if (resourcePickerForDay) handleResourceFromLibrary(resourcePickerForDay, resource);
        }}
      />

      {/* Publish validation panel */}
      {showValidation && (
        <PublishValidationPanel
          validation={validationResult}
          onClose={() => setShowValidation(false)}
          onConfirmPublish={handleConfirmPublish}
          publishing={publishing}
        />
      )}
    </div>
  );
}
