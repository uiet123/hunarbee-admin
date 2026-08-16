"use client";

import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { CurriculumTask } from "@/lib/curriculum/types";

interface TaskEditorProps {
  task: CurriculumTask;
  index: number;
  totalTasks: number;
  onChange: (updated: CurriculumTask) => void;
  onDelete: () => void;
  onReorder: (direction: "up" | "down") => void;
  readOnly?: boolean;
}

export function TaskEditor({
  task,
  index,
  totalTasks,
  onChange,
  onDelete,
  onReorder,
  readOnly,
}: TaskEditorProps) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white p-4 transition hover:border-navy/15">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          {!readOnly && (
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={() => onReorder("up")}
                disabled={index === 0}
                className="text-slate hover:text-navy disabled:opacity-30 p-0.5"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
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
