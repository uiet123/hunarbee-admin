"use client";

import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CurriculumDay, CurriculumTask, CurriculumResource, DayType } from "@/lib/curriculum/types";
import { DAY_TYPES } from "@/lib/curriculum/types";
import { DayTypeBadge, getDayTypeConfig } from "./DayTypeBadge";
import { TaskEditor } from "./TaskEditor";
import { ResourceEditor } from "./ResourceEditor";
import { LearningContentEditor } from "./LearningContentEditor";
import { Button } from "@/components/ui/button";
import { generateId } from "@/lib/curriculum";

interface DayEditorProps {
  day: CurriculumDay;
  onChange: (updated: CurriculumDay) => void;
  onAddFromTaskLibrary: () => void;
  onAddFromResourceLibrary: () => void;
  readOnly?: boolean;
}

const DAY_TYPE_LABELS: Record<DayType, string> = {
  ORIENTATION: "Orientation",
  LEARNING: "Learning",
  TASK: "Task",
  PROJECT: "Project",
  MENTOR_REVIEW: "Mentor Review",
  SUBMISSION: "Submission",
  ASSESSMENT: "Assessment",
  BREAK: "Break",
};

export function DayEditor({
  day,
  onChange,
  onAddFromTaskLibrary,
  onAddFromResourceLibrary,
  readOnly,
}: DayEditorProps) {
  const config = getDayTypeConfig(day.type);

  // ─── Objective management ───
  const addObjective = () => {
    onChange({ ...day, objectives: [...day.objectives, ""] });
  };

  const updateObjective = (idx: number, value: string) => {
    const updated = [...day.objectives];
    updated[idx] = value;
    onChange({ ...day, objectives: updated });
  };

  const removeObjective = (idx: number) => {
    onChange({ ...day, objectives: day.objectives.filter((_, i) => i !== idx) });
  };

  // ─── Task management ───
  const addTask = () => {
    const newTask: CurriculumTask = {
      id: generateId("task"),
      order: day.tasks.length + 1,
      title: "",
      description: "",
      instructions: "",
      estimatedMinutes: 30,
      requiresSubmission: false,
      requiresMentorReview: false,
    };
    onChange({ ...day, tasks: [...day.tasks, newTask] });
  };

  const updateTask = (taskId: string, updated: CurriculumTask) => {
    onChange({
      ...day,
      tasks: day.tasks.map((t) => (t.id === taskId ? updated : t)),
    });
  };

  const deleteTask = (taskId: string) => {
    onChange({
      ...day,
      tasks: day.tasks
        .filter((t) => t.id !== taskId)
        .map((t, i) => ({ ...t, order: i + 1 })),
    });
  };

  const reorderTask = (taskId: string, direction: "up" | "down") => {
    const idx = day.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return;
    const newTasks = [...day.tasks];
    if (direction === "up" && idx > 0) {
      [newTasks[idx - 1], newTasks[idx]] = [newTasks[idx], newTasks[idx - 1]];
    } else if (direction === "down" && idx < newTasks.length - 1) {
      [newTasks[idx], newTasks[idx + 1]] = [newTasks[idx + 1], newTasks[idx]];
    }
    onChange({
      ...day,
      tasks: newTasks.map((t, i) => ({ ...t, order: i + 1 })),
    });
  };

  // ─── Resource management ───
  const addResource = () => {
    const newRes: CurriculumResource = {
      id: generateId("res"),
      order: day.resources.length + 1,
      title: "",
      type: "LINK",
      url: "",
      description: "",
    };
    onChange({ ...day, resources: [...day.resources, newRes] });
  };

  const updateResource = (resId: string, updated: CurriculumResource) => {
    onChange({
      ...day,
      resources: day.resources.map((r) => (r.id === resId ? updated : r)),
    });
  };

  const deleteResource = (resId: string) => {
    onChange({
      ...day,
      resources: day.resources
        .filter((r) => r.id !== resId)
        .map((r, i) => ({ ...r, order: i + 1 })),
    });
  };

  return (
    <div className="space-y-5">
      {/* Day settings */}
      <div className={cn("rounded-xl border p-4", config.bgColor)}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate">Title</label>
            <input
              value={day.title}
              onChange={(e) => onChange({ ...day, title: e.target.value })}
              disabled={readOnly}
              className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm font-medium text-navy outline-none focus:border-honey disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate">Type</label>
            <select
              value={day.type}
              onChange={(e) => onChange({ ...day, type: e.target.value as DayType })}
              disabled={readOnly}
              className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {DAY_TYPES.map((t) => (
                <option key={t} value={t}>{DAY_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate">Est. Mins</label>
            <input
              type="number"
              value={day.estimatedMinutes}
              onChange={(e) => onChange({ ...day, estimatedMinutes: parseInt(e.target.value) || 0 })}
              disabled={readOnly}
              className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-xs font-semibold uppercase text-slate">Description</label>
          <textarea
            value={day.description}
            onChange={(e) => onChange({ ...day, description: e.target.value })}
            disabled={readOnly}
            placeholder="What this day covers..."
            className="w-full min-h-[60px] rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey disabled:opacity-60 disabled:cursor-not-allowed resize-y"
          />
        </div>

        {/* Day number (read-only) + type badge */}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs font-semibold text-slate">
            Day #{day.dayNumber} <span className="font-normal">(auto-numbered)</span>
          </span>
          <DayTypeBadge type={day.type} />
        </div>
      </div>

      {/* Objectives */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h5 className="text-xs font-bold uppercase tracking-wider text-navy">Objectives</h5>
          {!readOnly && (
            <button onClick={addObjective} className="text-xs font-semibold text-honey hover:text-honey-deep flex items-center">
              <Plus className="mr-1 h-3 w-3" /> Add
            </button>
          )}
        </div>
        <div className="space-y-2">
          {day.objectives.length === 0 ? (
            <p className="text-xs text-slate italic">No objectives defined.</p>
          ) : (
            day.objectives.map((obj, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[10px] font-bold text-navy">
                  {idx + 1}
                </span>
                <input
                  value={obj}
                  onChange={(e) => updateObjective(idx, e.target.value)}
                  disabled={readOnly}
                  placeholder="Learning objective..."
                  className="flex-1 rounded-md border border-navy/10 bg-white px-2 py-1.5 text-xs text-navy outline-none focus:border-honey disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {!readOnly && (
                  <button onClick={() => removeObjective(idx)} className="text-slate hover:text-red-500 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Learning Content */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h5 className="text-xs font-bold uppercase tracking-wider text-navy">
            Learning Content <span className="font-normal text-slate">({(day.learningContent || []).length})</span>
          </h5>
        </div>
        <LearningContentEditor
          learningContent={day.learningContent || []}
          tasks={day.tasks}
          onChange={(updated) => onChange({ ...day, learningContent: updated })}
          readOnly={readOnly}
        />
      </div>

      {/* Tasks */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h5 className="text-xs font-bold uppercase tracking-wider text-navy">
            Tasks <span className="font-normal text-slate">({day.tasks.length})</span>
          </h5>
          {!readOnly && (
            <div className="flex gap-2">
              <button
                onClick={onAddFromTaskLibrary}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Plus className="mr-1 h-3 w-3" /> From Library
              </button>
              <Button onClick={addTask} size="sm" variant="secondary" className="h-7 text-xs px-2.5">
                <Plus className="mr-1 h-3 w-3" /> Add Task
              </Button>
            </div>
          )}
        </div>
        {day.tasks.length === 0 ? (
          <p className="text-xs text-slate italic py-2">No tasks defined for this day.</p>
        ) : (
          <div className="space-y-3">
            {day.tasks.map((task, tIdx) => (
              <TaskEditor
                key={task.id}
                task={task}
                index={tIdx}
                totalTasks={day.tasks.length}
                learningContent={day.learningContent || []}
                onChange={(updated) => updateTask(task.id, updated)}
                onDelete={() => deleteTask(task.id)}
                onReorder={(dir) => reorderTask(task.id, dir)}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </div>

      {/* Resources */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h5 className="text-xs font-bold uppercase tracking-wider text-navy">
            Resources <span className="font-normal text-slate">({day.resources.length})</span>
          </h5>
          {!readOnly && (
            <div className="flex gap-2">
              <button
                onClick={onAddFromResourceLibrary}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Plus className="mr-1 h-3 w-3" /> From Library
              </button>
              <button
                onClick={addResource}
                className="text-xs font-semibold text-honey hover:text-honey-deep flex items-center"
              >
                <Plus className="mr-1 h-3 w-3" /> Add Resource
              </button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {day.resources.length === 0 ? (
            <p className="text-xs text-slate italic">No resources defined.</p>
          ) : (
            day.resources.map((res) => (
              <ResourceEditor
                key={res.id}
                resource={res}
                onChange={(updated) => updateResource(res.id, updated)}
                onDelete={() => deleteResource(res.id)}
                readOnly={readOnly}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
