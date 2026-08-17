"use client";

import { Trash2, ChevronDown, ChevronUp, Plus, AlertCircle } from "lucide-react";
import type { CurriculumTask, LearningContent, TaskPrerequisite, TaskPrerequisiteType } from "@/lib/curriculum/types";
import { TASK_PREREQUISITE_TYPES } from "@/lib/curriculum/types";
import { generateId } from "@/lib/curriculum/curriculum-service";
import { Button } from "@/components/ui/button";

interface TaskEditorProps {
  task: CurriculumTask;
  index: number;
  totalTasks: number;
  learningContent: LearningContent[];
  onChange: (updated: CurriculumTask) => void;
  onDelete: () => void;
  onReorder: (direction: "up" | "down") => void;
  readOnly?: boolean;
}

const PREREQUISITE_LABELS: Record<TaskPrerequisiteType, string> = {
  REQUIRED_LEARNING_CONTENT: "Required Content Completed",
  VIDEO_COMPLETED: "Specific Video Completed",
  READING_COMPLETED: "Reading Completed (Future)",
  QUIZ_PASSED: "Quiz Passed (Future)",
  PREVIOUS_TASK_COMPLETED: "Previous Task Completed (Future)",
};

export function TaskEditor({
  task,
  index,
  totalTasks,
  learningContent = [],
  onChange,
  onDelete,
  onReorder,
  readOnly,
}: TaskEditorProps) {

  // Prerequisite Management
  const addPrerequisite = () => {
    const defaultType: TaskPrerequisiteType = "REQUIRED_LEARNING_CONTENT";
    const possibleTargets = learningContent.filter((lc) => lc.isRequired);
    const defaultTargetId = possibleTargets[0]?.id || learningContent[0]?.id || "";

    const newPrereq: TaskPrerequisite = {
      id: generateId("prereq"),
      type: defaultType,
      targetId: defaultTargetId,
    };

    onChange({
      ...task,
      prerequisites: [...(task.prerequisites || []), newPrereq],
    });
  };

  const updatePrerequisite = (prereqId: string, data: Partial<TaskPrerequisite>) => {
    onChange({
      ...task,
      prerequisites: (task.prerequisites || []).map((p) => {
        if (p.id !== prereqId) return p;
        const updated = { ...p, ...data };
        
        if (data.type) {
          const type = data.type;
          if (type === "REQUIRED_LEARNING_CONTENT") {
            const valid = learningContent.find((lc) => lc.id === updated.targetId && lc.isRequired);
            if (!valid) {
              const firstRequired = learningContent.find((lc) => lc.isRequired);
              updated.targetId = firstRequired?.id || "";
            }
          } else if (type === "VIDEO_COMPLETED") {
            const valid = learningContent.find((lc) => lc.id === updated.targetId && lc.type === "VIDEO");
            if (!valid) {
              const firstVideo = learningContent.find((lc) => lc.type === "VIDEO");
              updated.targetId = firstVideo?.id || "";
            }
          }
        }
        return updated;
      }),
    });
  };

  const deletePrerequisite = (prereqId: string) => {
    onChange({
      ...task,
      prerequisites: (task.prerequisites || []).filter((p) => p.id !== prereqId),
    });
  };

  const getPrerequisiteValidationError = (prereq: TaskPrerequisite): string | null => {
    const target = learningContent.find((lc) => lc.id === prereq.targetId);
    if (!target) {
      return "Selected target content does not exist on this day.";
    }
    if (prereq.type === "REQUIRED_LEARNING_CONTENT" && !target.isRequired) {
      return "Prerequisite requires the target content to have 'Required for Task Unlock' checked.";
    }
    if (prereq.type === "VIDEO_COMPLETED" && target.type !== "VIDEO") {
      return "VIDEO_COMPLETED prerequisite can only target Video lessons.";
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-navy/10 bg-white p-4 transition hover:border-navy/15 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          {!readOnly && (
            <div className="flex flex-col items-center gap-0.5">
              <button
                type="button"
                onClick={() => onReorder("up")}
                disabled={index === 0}
                className="text-slate hover:text-navy disabled:opacity-30 p-0.5"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onReorder("down")}
                disabled={index === totalTasks - 1}
                className="text-slate hover:text-navy disabled:opacity-30 p-0.5"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <input
            value={task.title}
            placeholder="Task title"
            onChange={(e) => onChange({ ...task, title: e.target.value })}
            disabled={readOnly}
            className="flex-1 bg-transparent text-sm font-bold text-navy outline-none border-b border-transparent focus:border-honey px-1 py-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex items-center gap-2">
          {task.sourceLibraryId && (
            <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 uppercase tracking-wider">
              Library
            </span>
          )}
          {!readOnly && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md p-1.5 text-slate transition hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate">
            Description
          </label>
          <textarea
            value={task.description}
            placeholder="What this task is about..."
            onChange={(e) => onChange({ ...task, description: e.target.value })}
            disabled={readOnly}
            className="w-full min-h-[72px] rounded-lg border border-navy/10 bg-navy/[0.02] px-3 py-2 text-sm text-navy outline-none focus:border-honey disabled:opacity-60 disabled:cursor-not-allowed resize-y"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate">
            Instructions
          </label>
          <textarea
            value={task.instructions}
            placeholder="Step-by-step instructions..."
            onChange={(e) => onChange({ ...task, instructions: e.target.value })}
            disabled={readOnly}
            className="w-full min-h-[72px] rounded-lg border border-navy/10 bg-navy/[0.02] px-3 py-2 text-sm text-navy outline-none focus:border-honey disabled:opacity-60 disabled:cursor-not-allowed resize-y"
          />
        </div>
      </div>

      {/* Prerequisites Section */}
      <div className="mb-4 space-y-3 border-t border-navy/5 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-slate tracking-wider">Task Unlock Prerequisites</span>
          {!readOnly && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addPrerequisite}
              className="h-6 px-2.5 text-[10px]"
            >
              <Plus className="mr-1 h-3 w-3" /> Add Unlock Condition
            </Button>
          )}
        </div>

        {!(task.prerequisites && task.prerequisites.length > 0) ? (
          <p className="text-[10px] text-slate/50 italic">No prerequisites configured. Task unlocks immediately when day opens.</p>
        ) : (
          <div className="space-y-2">
            {task.prerequisites.map((prereq) => {
              const validationError = getPrerequisiteValidationError(prereq);
              const isUnsupported = !["REQUIRED_LEARNING_CONTENT", "VIDEO_COMPLETED"].includes(prereq.type);

              // Filter targets depending on type
              const targets = learningContent.filter((lc) => {
                if (prereq.type === "REQUIRED_LEARNING_CONTENT") return lc.isRequired;
                if (prereq.type === "VIDEO_COMPLETED") return lc.type === "VIDEO";
                return true;
              });

              return (
                <div key={prereq.id} className="p-3 rounded-lg border border-navy/5 bg-navy/[0.01] space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex-1 min-w-[140px]">
                      <select
                        value={prereq.type}
                        disabled={readOnly}
                        onChange={(e) => updatePrerequisite(prereq.id, { type: e.target.value as TaskPrerequisiteType })}
                        className="w-full rounded-md border border-navy/10 bg-white px-2 py-1 text-xs text-navy outline-none focus:border-honey"
                      >
                        {TASK_PREREQUISITE_TYPES.map((t) => (
                          <option key={t} value={t}>{PREREQUISITE_LABELS[t]}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-[2] min-w-[200px]">
                      <select
                        value={prereq.targetId}
                        disabled={readOnly}
                        onChange={(e) => updatePrerequisite(prereq.id, { targetId: e.target.value })}
                        className="w-full rounded-md border border-navy/10 bg-white px-2 py-1 text-xs text-navy outline-none focus:border-honey"
                      >
                        <option value="">-- Choose Target Content --</option>
                        {targets.map((lc) => (
                          <option key={lc.id} value={lc.id}>
                            {lc.title || `[${lc.type}] (Untitled)`} {lc.isRequired ? "(Required)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => deletePrerequisite(prereq.id)}
                        className="rounded-md p-1 text-slate hover:bg-red-500/10 hover:text-red-500 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {validationError && (
                    <div className="flex items-center gap-1.5 text-[9px] text-red-500 font-semibold bg-red-500/5 px-2 py-1 rounded">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {isUnsupported && !validationError && (
                    <div className="flex items-center gap-1.5 text-[9px] text-amber-600 font-semibold bg-amber-500/5 px-2 py-1 rounded">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>⚠️ Unsupported prerequisite in this phase (will remain locked).</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-navy/5 bg-navy/[0.02] p-3 text-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase text-slate">Est. mins</label>
          <input
            type="number"
            value={task.estimatedMinutes}
            onChange={(e) => onChange({ ...task, estimatedMinutes: parseInt(e.target.value) || 0 })}
            disabled={readOnly}
            className="w-16 rounded-md border border-navy/10 bg-white px-2 py-1 text-xs text-navy outline-none focus:border-honey disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={task.requiresSubmission}
            onChange={(e) => onChange({ ...task, requiresSubmission: e.target.checked })}
            disabled={readOnly}
            className="rounded accent-honey"
          />
          <span className="text-xs font-medium text-navy">Requires Submission</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={task.requiresMentorReview}
            onChange={(e) => onChange({ ...task, requiresMentorReview: e.target.checked })}
            disabled={readOnly}
            className="rounded accent-honey"
          />
          <span className="text-xs font-medium text-navy">Mentor Review</span>
        </label>
      </div>
    </div>
  );
}
