"use client";

import { useState, useEffect } from "react";
import { Search, X, Plus } from "lucide-react";
import { getTaskLibrary } from "@/lib/curriculum";
import type { TaskLibraryItem, CurriculumTask } from "@/lib/curriculum/types";
import { generateId } from "@/lib/curriculum";

interface TaskLibraryPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (task: CurriculumTask) => void;
}

export function TaskLibraryPicker({ open, onClose, onSelect }: TaskLibraryPickerProps) {
  const [items, setItems] = useState<TaskLibraryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getTaskLibrary()
        .then(setItems)
        .finally(() => setLoading(false));
    }
  }, [open]);

  if (!open) return null;

  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (item: TaskLibraryItem) => {
    const task: CurriculumTask = {
      id: generateId("task"),
      order: 0,
      title: item.title,
      description: item.description,
      instructions: item.instructions,
      estimatedMinutes: item.estimatedMinutes,
      requiresSubmission: item.requiresSubmission,
      requiresMentorReview: item.requiresMentorReview,
      sourceLibraryId: item.id,
    };
    onSelect(task);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-navy/10 bg-surface-elevated shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-navy/5 px-5 py-4">
          <h3 className="text-sm font-bold text-navy">Add from Task Library</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate hover:bg-navy/5 hover:text-navy">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-navy/5">
          <div className="flex items-center gap-2 rounded-lg border border-navy/10 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-slate/60"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-[360px] overflow-y-auto portal-scrollbar px-3 py-2">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate">No tasks found.</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full text-left rounded-xl p-3 mb-1 transition hover:bg-honey/[0.06] hover:border-honey/20 border border-transparent group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy group-hover:text-honey-deep truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate line-clamp-2 mt-0.5">{item.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-medium text-navy/60">
                          {tag}
                        </span>
                      ))}
                      <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-medium text-navy/60">
                        {item.estimatedMinutes} min
                      </span>
                      {item.requiresSubmission && (
                        <span className="rounded-full bg-honey/10 px-2 py-0.5 text-[10px] font-medium text-honey-deep">
                          Submission
                        </span>
                      )}
                    </div>
                  </div>
                  <Plus className="h-4 w-4 shrink-0 text-slate group-hover:text-honey-deep mt-0.5" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
