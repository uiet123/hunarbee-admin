"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit2, Tag, Clock, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getTaskLibraryAll,
  createTaskLibraryItem,
  updateTaskLibraryItem,
  archiveTaskLibraryItem,
} from "@/lib/curriculum";
import { useAlertModal } from "@/components/admin/ui/AlertModalProvider";
import type { TaskLibraryItem } from "@/lib/curriculum/types";

export default function TaskLibraryPage() {
  const [items, setItems] = useState<TaskLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("ALL");
  const { showAlert, showConfirm } = useAlertModal();

  // Modal State
  const [editingItem, setEditingItem] = useState<TaskLibraryItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [requiresSubmission, setRequiresSubmission] = useState(false);
  const [requiresMentorReview, setRequiresMentorReview] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState("");

  const loadItems = async () => {
    setLoading(true);
    try {
      const all = await getTaskLibraryAll();
      setItems(all.filter(item => !item.archived));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleOpenCreate = () => {
    setIsCreating(true);
    setEditingItem(null);
    setTitle("");
    setDescription("");
    setInstructions("");
    setEstimatedMinutes(30);
    setRequiresSubmission(false);
    setRequiresMentorReview(false);
    setTagsInput("");
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (item: TaskLibraryItem) => {
    setIsCreating(false);
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setInstructions(item.instructions);
    setEstimatedMinutes(item.estimatedMinutes);
    setRequiresSubmission(item.requiresSubmission);
    setRequiresMentorReview(item.requiresMentorReview);
    setTagsInput(item.tags.join(", "));
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !instructions.trim()) {
      setError("Please fill out all required fields.");
      return;
    }
    setError("");

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      estimatedMinutes,
      requiresSubmission,
      requiresMentorReview,
      tags,
    };

    try {
      if (isCreating) {
        await createTaskLibraryItem(payload);
      } else if (editingItem) {
        await updateTaskLibraryItem(editingItem.id, payload);
      }
      setShowModal(false);
      await loadItems();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleArchive = async (id: string) => {
    if (!(await showConfirm("Are you sure you want to archive this library task? It will not be visible for selection anymore."))) return;
    try {
      await archiveTaskLibraryItem(id);
      await loadItems();
    } catch (err) {
      await showAlert((err as Error).message, "Error", "error");
    }
  };

  // Extract all unique tags
  const allTags = Array.from(new Set(items.flatMap((i) => i.tags)));

  // Filter items
  const filtered = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag === "ALL" || item.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-navy">Task Library</h2>
          <p className="text-sm text-slate mt-1">Manage reusable curriculum tasks and activities.</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-navy text-white hover:bg-navy/90">
          <Plus className="mr-2 h-4 w-4" /> Add Task Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-navy/5 bg-navy/[0.02] p-4">
        <div className="w-full sm:w-auto flex flex-1 max-w-md items-center gap-2 rounded-xl border border-navy/10 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-slate" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search library..."
            className="w-full bg-transparent text-sm text-navy outline-none placeholder:text-slate/60"
          />
        </div>
        <div className="w-full sm:w-auto flex items-center">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs font-semibold text-navy outline-none"
          >
            <option value="ALL">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="p-12 text-center text-slate">Loading library tasks...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/20 p-12 text-center">
          <p className="text-slate">No tasks found in the library.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-navy/8 bg-surface-elevated/90 p-5 shadow-sm transition hover:border-honey/30 hover:shadow-md"
            >
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-navy">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-slate line-clamp-3 leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="rounded bg-navy/5 px-2 py-0.5 text-[10px] font-semibold text-navy/70 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {item.estimatedMinutes} mins
                  </span>
                  {item.requiresSubmission && (
                    <span className="rounded bg-honey/10 px-2 py-0.5 text-[10px] font-semibold text-honey-deep">
                      Submission Required
                    </span>
                  )}
                  {item.requiresMentorReview && (
                    <span className="rounded bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-600">
                      Mentor Review
                    </span>
                  )}
                </div>

                {item.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-blue-500/5 px-2 py-0.5 text-[9px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-0.5"
                      >
                        <Tag className="h-2 w-2" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-navy/5 pt-3">
                <p className="text-[9px] text-slate/50">
                  Created {new Date(item.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="rounded-lg p-2 text-slate transition hover:bg-navy/5 hover:text-navy"
                    title="Edit Task"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleArchive(item.id)}
                    className="rounded-lg p-2 text-slate transition hover:bg-red-500/10 hover:text-red-500"
                    title="Archive Task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-navy/10 bg-surface-elevated shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-navy/5 px-6 py-4">
              <h3 className="text-sm font-bold text-navy">
                {isCreating ? "Add Task to Library" : "Edit Library Task"}
              </h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-slate hover:bg-navy/5">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Form */}
            <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto portal-scrollbar">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Git Branching & Workflow"
                  className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task overview..."
                  className="w-full min-h-[72px] rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey resize-y"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate">
                  Instructions <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Step-by-step instructions..."
                  className="w-full min-h-[72px] rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate">Est. Minutes</label>
                  <input
                    type="number"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate">Tags (comma separated)</label>
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="react, logic, setup"
                    className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-center rounded-lg border border-navy/5 bg-navy/[0.02] p-3 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresSubmission}
                    onChange={(e) => setRequiresSubmission(e.target.checked)}
                    className="rounded accent-honey"
                  />
                  <span className="text-xs font-medium text-navy">Requires Submission</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresMentorReview}
                    onChange={(e) => setRequiresMentorReview(e.target.checked)}
                    className="rounded accent-honey"
                  />
                  <span className="text-xs font-medium text-navy">Mentor Review</span>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/5 px-3 py-2 text-xs text-red-500">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-navy/5 px-6 py-4">
              <Button onClick={() => setShowModal(false)} variant="secondary" size="sm">Cancel</Button>
              <Button onClick={handleSave} size="sm">
                {isCreating ? "Add Task" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
