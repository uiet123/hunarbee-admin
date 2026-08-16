"use client";

import { useState, useCallback } from "react";
import { Plus, Save, ChevronDown, ChevronUp, Trash2, Eye } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type {
  CurriculumTemplate,
  CurriculumTemplateVersion,
  CurriculumPhase,
  CurriculumWeek,
  CurriculumDay,
  CurriculumTask,
  CurriculumResource,
  ValidationResult,
} from "@/lib/curriculum/types";
import {
  generateId,
  updateVersion,
  publishVersion,
  createNewVersionFromPublished,
} from "@/lib/curriculum";
import { recalculateDayNumbers } from "@/lib/curriculum/validators";
import { DayEditor } from "./DayEditor";
import { DayTypeBadge } from "./DayTypeBadge";
import { VersionSelector } from "./VersionSelector";
import { PublishValidationPanel } from "./PublishValidationPanel";
import { TaskLibraryPicker } from "./TaskLibraryPicker";
import { ResourceLibraryPicker } from "./ResourceLibraryPicker";

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

  const deletePhase = (phaseId: string) => {
    if (!confirm("Delete this phase and all its content?")) return;
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

  const deleteWeek = (phaseId: string, weekId: string) => {
    if (!confirm("Delete this week and all its days?")) return;
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

  const updateDay = (phaseId: string, weekId: string, dayId: string, updatedDay: CurriculumDay) => {
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              weeks: p.weeks.map((w) =>
                w.id === weekId
                  ? { ...w, days: w.days.map((d) => (d.id === dayId ? updatedDay : d)) }
                  : w
              ),
            }
          : p
      )
    );
  };

  const deleteDay = (phaseId: string, weekId: string, dayId: string) => {
    if (!confirm("Delete this day and all its tasks?")) return;
    setPhases((prev) => {
      const newPhases = prev.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              weeks: p.weeks.map((w) =>
                w.id === weekId
                  ? { ...w, days: w.days.filter((d) => d.id !== dayId).map((d, i) => ({ ...d, order: i + 1 })) }
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

  // ─── Library picker handlers ───
  const handleTaskFromLibrary = (dayId: string, task: CurriculumTask) => {
    setPhases((prev) => {
      const newPhases = prev.map((p) => ({
        ...p,
        weeks: p.weeks.map((w) => ({
          ...w,
          days: w.days.map((d) => {
            if (d.id !== dayId) return d;
            return {
              ...d,
              tasks: [...d.tasks, { ...task, order: d.tasks.length + 1 }],
            };
          }),
        })),
      }));
      return newPhases;
    });
  };

  const handleResourceFromLibrary = (dayId: string, resource: CurriculumResource) => {
    setPhases((prev) => {
      const newPhases = prev.map((p) => ({
        ...p,
        weeks: p.weeks.map((w) => ({
          ...w,
          days: w.days.map((d) => {
            if (d.id !== dayId) return d;
            return {
              ...d,
              resources: [...d.resources, { ...resource, order: d.resources.length + 1 }],
            };
          }),
        })),
      }));
      return newPhases;
    });
  };

  // ─── Save ───
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateVersion(template.id, currentVersionId, { phases });
      onTemplateChange();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Publish ───
  const handlePublish = async () => {
    // First save
    try {
      await updateVersion(template.id, currentVersionId, { phases });
    } catch (err) {
      alert((err as Error).message);
      return;
    }

    const result = await publishVersion(template.id, currentVersionId);
    setValidationResult(result.validation);
    setShowValidation(true);
  };

  const handleConfirmPublish = () => {
    // publishVersion already published it if validation passed
    setShowValidation(false);
    onTemplateChange();
  };

  // ─── Create New Version ───
  const handleCreateNewVersion = async () => {
    try {
      const newVer = await createNewVersionFromPublished(template.id, currentVersionId);
      setCurrentVersionId(newVer.id);
      setPhases(recalculateDayNumbers(newVer.phases));
      onTemplateChange();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // ─── Switch Version ───
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
                  {currentDayCount}/{template.durationDays} days
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
        <Accordion.Root type="multiple" className="space-y-4">
          {phases.map((phase, pIdx) => (
            <Accordion.Item
              key={phase.id}
              value={phase.id}
              className="rounded-2xl border border-navy/10 bg-surface-elevated/90 shadow-sm overflow-hidden"
            >
              {/* Phase header */}
              <div className="flex items-center justify-between border-b border-navy/5 bg-gradient-to-r from-navy/[0.04] to-transparent px-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {!readOnly && (
                    <div className="flex flex-col items-center gap-0.5">
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
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy text-white text-xs font-bold">
                        P{pIdx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        {readOnly ? (
                          <p className="font-bold text-navy truncate">{phase.title || "(Untitled Phase)"}</p>
                        ) : (
                          <input
                            value={phase.title}
                            placeholder="Phase title..."
                            onChange={(e) => updatePhase(phase.id, { title: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full font-bold text-navy bg-transparent outline-none border-b border-transparent focus:border-honey"
                          />
                        )}
                        <p className="text-xs text-slate mt-0.5">{phase.weeks.length} week{phase.weeks.length !== 1 ? "s" : ""}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate transition-transform duration-200 shrink-0" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                </div>
                {!readOnly && (
                  <button onClick={() => deletePhase(phase.id)} className="ml-2 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Phase content */}
              <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                <div className="p-4 sm:p-5 space-y-4">
                  {!readOnly && (
                    <div className="mb-2">
                      <textarea
                        value={phase.description}
                        placeholder="Phase description..."
                        onChange={(e) => updatePhase(phase.id, { description: e.target.value })}
                        className="w-full min-h-[40px] rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey resize-y"
                      />
                    </div>
                  )}
                  {readOnly && phase.description && (
                    <p className="text-sm text-slate mb-2">{phase.description}</p>
                  )}

                  {/* Weeks inside phase */}
                  {phase.weeks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-navy/15 p-6 text-center text-sm text-slate">
                      No weeks yet.
                      {!readOnly && (
                        <button onClick={() => addWeek(phase.id)} className="ml-2 text-honey font-semibold hover:text-honey-deep">
                          Add Week
                        </button>
                      )}
                    </div>
                  ) : (
                    <Accordion.Root type="multiple" className="space-y-3">
                      {phase.weeks.map((week, wIdx) => (
                        <Accordion.Item
                          key={week.id}
                          value={week.id}
                          className="rounded-xl border border-navy/8 bg-white overflow-hidden"
                        >
                          {/* Week header */}
                          <div className="flex items-center justify-between border-b border-navy/5 bg-navy/[0.02] px-3 py-2.5">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {!readOnly && (
                                <div className="flex flex-col items-center gap-0.5">
                                  <button onClick={() => reorderWeek(phase.id, week.id, "up")} disabled={wIdx === 0} className="text-slate hover:text-navy disabled:opacity-30 p-0.5">
                                    <ChevronUp className="h-3 w-3" />
                                  </button>
                                  <button onClick={() => reorderWeek(phase.id, week.id, "down")} disabled={wIdx === phase.weeks.length - 1} className="text-slate hover:text-navy disabled:opacity-30 p-0.5">
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                              <Accordion.Header className="flex-1 min-w-0">
                                <Accordion.Trigger className="flex flex-1 items-center gap-2 text-left w-full [&[data-state=open]>svg]:rotate-180">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-honey/20 text-honey-deep text-[10px] font-bold">
                                    W{wIdx + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    {readOnly ? (
                                      <p className="text-sm font-semibold text-navy truncate">{week.title || "(Untitled Week)"}</p>
                                    ) : (
                                      <input
                                        value={week.title}
                                        placeholder="Week title..."
                                        onChange={(e) => updateWeek(phase.id, week.id, { title: e.target.value })}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full text-sm font-semibold text-navy bg-transparent outline-none border-b border-transparent focus:border-honey"
                                      />
                                    )}
                                    <p className="text-[11px] text-slate">{week.days.length} day{week.days.length !== 1 ? "s" : ""}</p>
                                  </div>
                                  <ChevronDown className="h-3.5 w-3.5 text-slate transition-transform duration-200 shrink-0" />
                                </Accordion.Trigger>
                              </Accordion.Header>
                            </div>
                            {!readOnly && (
                              <button onClick={() => deleteWeek(phase.id, week.id)} className="ml-2 p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition shrink-0">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Week content */}
                          <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                            <div className="p-3 sm:p-4 space-y-3">
                              {!readOnly && (
                                <input
                                  value={week.goal}
                                  placeholder="Week goal..."
                                  onChange={(e) => updateWeek(phase.id, week.id, { goal: e.target.value })}
                                  className="w-full rounded-lg border border-navy/10 bg-navy/[0.02] px-3 py-2 text-xs text-navy outline-none focus:border-honey"
                                />
                              )}
                              {readOnly && week.goal && (
                                <p className="text-xs text-slate italic">{week.goal}</p>
                              )}

                              {/* Days inside week */}
                              {week.days.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-navy/10 p-4 text-center text-xs text-slate">
                                  No days yet.
                                  {!readOnly && (
                                    <button onClick={() => addDay(phase.id, week.id)} className="ml-2 text-honey font-semibold hover:text-honey-deep">
                                      Add Day
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <Accordion.Root type="multiple" className="space-y-2">
                                  {week.days.map((day, dIdx) => (
                                    <Accordion.Item
                                      key={day.id}
                                      value={day.id}
                                      className="rounded-lg border border-navy/8 bg-surface-elevated/50 overflow-hidden"
                                    >
                                      {/* Day header */}
                                      <div className="flex items-center justify-between px-3 py-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          {!readOnly && (
                                            <div className="flex flex-col items-center gap-0.5">
                                              <button onClick={() => reorderDay(phase.id, week.id, day.id, "up")} disabled={dIdx === 0} className="text-slate hover:text-navy disabled:opacity-30 p-0.5">
                                                <ChevronUp className="h-2.5 w-2.5" />
                                              </button>
                                              <button onClick={() => reorderDay(phase.id, week.id, day.id, "down")} disabled={dIdx === week.days.length - 1} className="text-slate hover:text-navy disabled:opacity-30 p-0.5">
                                                <ChevronDown className="h-2.5 w-2.5" />
                                              </button>
                                            </div>
                                          )}
                                          <Accordion.Header className="flex-1 min-w-0">
                                            <Accordion.Trigger className="flex flex-1 items-center gap-2 text-left w-full [&[data-state=open]>svg]:rotate-180">
                                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-navy text-white text-[10px] font-bold">
                                                {day.dayNumber}
                                              </span>
                                              <span className="text-sm font-medium text-navy truncate flex-1">
                                                {day.title || "(Untitled Day)"}
                                              </span>
                                              <DayTypeBadge type={day.type} className="shrink-0" />
                                              <span className="text-[10px] text-slate shrink-0">{day.tasks.length} tasks</span>
                                              <ChevronDown className="h-3 w-3 text-slate transition-transform duration-200 shrink-0" />
                                            </Accordion.Trigger>
                                          </Accordion.Header>
                                        </div>
                                        {!readOnly && (
                                          <button onClick={() => deleteDay(phase.id, week.id, day.id)} className="ml-2 p-1 text-red-400 hover:bg-red-500/10 rounded transition shrink-0">
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        )}
                                      </div>

                                      {/* Day content */}
                                      <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                                        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
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
                                  className="w-full rounded-lg border border-dashed border-navy/10 py-2 text-xs font-semibold text-slate hover:border-honey/30 hover:text-honey-deep transition"
                                >
                                  <Plus className="inline h-3 w-3 mr-1" /> Add Day
                                </button>
                              )}
                            </div>
                          </Accordion.Content>
                        </Accordion.Item>
                      ))}
                    </Accordion.Root>
                  )}

                  {!readOnly && phase.weeks.length > 0 && (
                    <button
                      onClick={() => addWeek(phase.id)}
                      className="w-full rounded-lg border border-dashed border-navy/10 py-2 text-xs font-semibold text-slate hover:border-honey/30 hover:text-honey-deep transition"
                    >
                      <Plus className="inline h-3 w-3 mr-1" /> Add Week
                    </button>
                  )}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      )}

      {/* Add Phase button */}
      {!readOnly && phases.length > 0 && (
        <button
          onClick={addPhase}
          className="w-full rounded-2xl border-2 border-dashed border-navy/10 py-4 text-sm font-semibold text-slate hover:border-honey/30 hover:text-honey-deep transition"
        >
          <Plus className="inline h-4 w-4 mr-2" /> Add Phase
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
