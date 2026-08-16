"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit2, Tag, Link2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getResourceLibraryAll,
  createResourceLibraryItem,
  updateResourceLibraryItem,
  archiveResourceLibraryItem,
} from "@/lib/curriculum";
import type { ResourceLibraryItem, ResourceType } from "@/lib/curriculum/types";
import { RESOURCE_TYPES } from "@/lib/curriculum/types";

const TYPE_LABELS: Record<ResourceType, string> = {
  LINK: "Link",
  VIDEO: "Video",
  PDF: "PDF",
  ARTICLE: "Article",
  DOCUMENTATION: "Documentation",
};

export default function ResourceLibraryPage() {
  const [items, setItems] = useState<ResourceLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");

  // Modal State
  const [editingItem, setEditingItem] = useState<ResourceLibraryItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ResourceType>("LINK");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState("");

  const loadItems = async () => {
    setLoading(true);
    try {
      const all = await getResourceLibraryAll();
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
    setType("LINK");
    setUrl("");
    setDescription("");
    setTagsInput("");
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (item: ResourceLibraryItem) => {
    setIsCreating(false);
    setEditingItem(item);
    setTitle(item.title);
    setType(item.type);
    setUrl(item.url);
    setDescription(item.description);
    setTagsInput(item.tags.join(", "));
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !url.trim() || !description.trim()) {
      setError("Please fill out all required fields.");
      return;
    }
    // Simple URL validation
    try {
      new URL(url.trim());
    } catch {
      setError("Please enter a valid absolute URL (e.g. https://example.com).");
      return;
    }
    setError("");

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const payload = {
      title: title.trim(),
      type,
      url: url.trim(),
      description: description.trim(),
      tags,
    };

    try {
      if (isCreating) {
        await createResourceLibraryItem(payload);
      } else if (editingItem) {
        await updateResourceLibraryItem(editingItem.id, payload);
      }
      setShowModal(false);
      await loadItems();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this library resource? It will not be visible for selection anymore.")) return;
    try {
      await archiveResourceLibraryItem(id);
      await loadItems();
    } catch (err) {
      alert((err as Error).message);
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
    const matchesType = selectedType === "ALL" || item.type === selectedType;

    return matchesSearch && matchesTag && matchesType;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-navy">Resource Library</h2>
          <p className="text-sm text-slate mt-1">Manage reusable reference materials, documentations, and media.</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-navy text-white hover:bg-navy/90">
          <Plus className="mr-2 h-4 w-4" /> Add Resource Template
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
        <div className="w-full sm:w-auto flex flex-wrap gap-2 items-center">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs font-semibold text-navy outline-none"
          >
            <option value="ALL">All Types</option>
            {RESOURCE_TYPES.map((type) => (
              <option key={type} value={type}>{TYPE_LABELS[type]}</option>
            ))}
          </select>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs font-semibold text-navy outline-none"
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
        <div className="p-12 text-center text-slate">Loading library resources...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/20 p-12 text-center">
          <p className="text-slate">No resources found in the library.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-navy/8 bg-surface-elevated/90 p-5 shadow-sm transition hover:border-honey/30 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-navy line-clamp-1 flex-1">
                    {item.title}
                  </h3>
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-600 uppercase tracking-wider shrink-0">
                    {TYPE_LABELS[item.type]}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate line-clamp-3 leading-relaxed">
                  {item.description}
                </p>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500 hover:text-blue-600 truncate max-w-full"
                >
                  <Link2 className="h-3 w-3 shrink-0" /> {item.url}
                </a>

                {item.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
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
                    title="Edit Resource"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleArchive(item.id)}
                    className="rounded-lg p-2 text-slate transition hover:bg-red-500/10 hover:text-red-500"
                    title="Archive Resource"
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
                {isCreating ? "Add Resource to Library" : "Edit Library Resource"}
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
                  placeholder="e.g. MDN Flexbox Reference"
                  className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ResourceType)}
                    className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey"
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate">Tags (comma separated)</label>
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="html, css, layout"
                    className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate">
                  URL <span className="text-red-400">*</span>
                </label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g. https://developer.mozilla.org/..."
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
                  placeholder="Resource description..."
                  className="w-full min-h-[72px] rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey resize-y"
                />
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
                {isCreating ? "Add Resource" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
