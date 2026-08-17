"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit2, Play, Cpu, AlertTriangle, RefreshCw, Film, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getVideoLibraryAll,
  archiveVideoLesson,
  getTemplates,
} from "@/lib/curriculum/curriculum-service";
import { useAlertModal } from "@/components/admin/ui/AlertModalProvider";
import type { VideoLesson, VideoProvider, VideoLessonStatus } from "@/lib/curriculum/types";
import { VideoLessonModal } from "@/components/admin/curriculum/VideoLessonModal";

const PROVIDER_LABELS: Record<VideoProvider, string> = {
  YOUTUBE: "YouTube",
  SELF_HOSTED: "Self Hosted",
  GENERATED: "Generated",
};

const STATUS_BADGES: Record<VideoLessonStatus, { label: string; bg: string; text: string }> = {
  DRAFT: { label: "Draft", bg: "bg-slate-100 dark:bg-slate-900/50", text: "text-slate-600 dark:text-slate-400" },
  GENERATING: { label: "Generating", bg: "bg-honey/10 text-honey-deep animate-pulse", text: "text-honey-deep" },
  READY: { label: "Ready", bg: "bg-emerald-500/10", text: "text-emerald-600" },
  FAILED: { label: "Failed", bg: "bg-red-500/10", text: "text-red-600" },
  ARCHIVED: { label: "Archived", bg: "bg-slate-200", text: "text-slate-400" },
};

function getYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
  }
  return null;
}

export default function VideoLibraryPage() {
  const [items, setItems] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [videoUsageMap, setVideoUsageMap] = useState<Record<string, string[]>>({});

  // Preview video state
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Modal State
  const [editingItem, setEditingItem] = useState<VideoLesson | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { showAlert, showConfirm } = useAlertModal();

  const loadData = async () => {
    setLoading(true);
    try {
      const allVideos = await getVideoLibraryAll();
      setItems(allVideos.filter((v) => v.status !== "ARCHIVED"));

      const templates = await getTemplates();
      const usageMap: Record<string, string[]> = {};
      for (const tmpl of templates) {
        for (const ver of tmpl.versions) {
          for (const phase of ver.phases) {
            for (const week of phase.weeks) {
              for (const day of week.days) {
                const contents = day.learningContent || [];
                for (const lc of contents) {
                  if (lc.type === "VIDEO" && lc.videoLessonId) {
                    if (!usageMap[lc.videoLessonId]) {
                      usageMap[lc.videoLessonId] = [];
                    }
                    const label = `${tmpl.templateName} (W${week.order}D${day.dayNumber})`;
                    if (!usageMap[lc.videoLessonId].includes(label)) {
                      usageMap[lc.videoLessonId].push(label);
                    }
                  }
                }
              }
            }
          }
        }
      }
      setVideoUsageMap(usageMap);
    } catch (err) {
      console.error("Failed to load video library:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item: VideoLesson) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSaveModal = (saved: VideoLesson) => {
    loadData();
  };

  const handleArchive = async (id: string) => {
    const usages = videoUsageMap[id] || [];
    if (usages.length > 0) {
      await showAlert(`Cannot archive this video. It is currently used in:\n${usages.join("\n")}`, "Cannot Archive", "error");
      return;
    }
    if (!(await showConfirm("Are you sure you want to archive this video lesson?"))) return;
    try {
      await archiveVideoLesson(id);
      await loadData();
    } catch (err) {
      await showAlert((err as Error).message, "Error", "error");
    }
  };

  const filtered = items.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = selectedProvider === "ALL" || v.provider === selectedProvider;
    const matchesStatus = selectedStatus === "ALL" || v.status === selectedStatus;
    return matchesSearch && matchesProvider && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-navy">Video Library</h2>
          <p className="text-sm text-slate mt-1">Manage, preview, and generate reusable video lessons for internship curriculum days.</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-navy text-white hover:bg-navy/90">
          <Plus className="mr-2 h-4 w-4" /> Create Video Lesson
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-navy/5 bg-navy/[0.02] p-4">
        <div className="w-full sm:w-auto flex flex-1 max-w-md items-center gap-2 rounded-xl border border-navy/10 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-slate" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos by title or script..."
            className="w-full bg-transparent text-sm text-navy outline-none placeholder:text-slate/60"
          />
        </div>
        <div className="w-full sm:w-auto flex flex-wrap gap-2 items-center">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs font-semibold text-navy outline-none cursor-pointer"
          >
            <option value="ALL">All Providers</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="SELF_HOSTED">Self Hosted</option>
            <option value="GENERATED">Generated</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs font-semibold text-navy outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="GENERATING">Generating</option>
            <option value="READY">Ready</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="p-12 text-center text-slate font-medium flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-honey" /> Loading video assets...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/20 p-12 text-center">
          <Film className="h-8 w-8 text-slate/40 mx-auto mb-2" />
          <p className="text-slate text-sm font-semibold">No video lessons found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const badge = STATUS_BADGES[item.status];
            const usages = videoUsageMap[item.id] || [];
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-navy/8 bg-white p-5 shadow-sm transition hover:border-honey/30 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-navy line-clamp-1 flex-1">
                       {item.title}
                    </h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0", badge.bg, badge.text)}>
                      {badge.label}
                    </span>
                  </div>

                  {item.thumbnailUrl ? (
                    <div className="relative group rounded-xl overflow-hidden aspect-video bg-slate-100 border border-navy/5 mb-3">
                      <img src={item.thumbnailUrl} alt={item.title} className="object-cover w-full h-full" />
                      <button
                        onClick={() => item.videoUrl && setPreviewVideoUrl(item.videoUrl)}
                        className="absolute inset-0 flex items-center justify-center bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-honey text-navy shadow-lg">
                          <Play className="h-5 w-5 fill-current pl-0.5" />
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-xl overflow-hidden aspect-video bg-navy/5 border border-navy/5 mb-3 text-slate">
                      <Film className="h-8 w-8 opacity-45" />
                    </div>
                  )}

                  <p className="text-xs text-slate line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold text-slate/70">
                    <span className="bg-navy/5 px-1.5 py-0.5 rounded">
                      {PROVIDER_LABELS[item.provider]}
                    </span>
                    <span>·</span>
                    <span>
                      {item.durationSeconds ? `${Math.round(item.durationSeconds / 60)} mins` : "Duration unset"}
                    </span>
                  </div>

                  {usages.length > 0 ? (
                    <div className="mt-4 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                        Active Curriculum Uses ({usages.length})
                      </span>
                      <ul className="text-[9px] text-slate/80 space-y-0.5 list-disc list-inside">
                        {usages.map((u, index) => (
                          <li key={index} className="truncate">{u}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="mt-4 text-[9px] font-medium text-slate/40 italic">
                      Not used in any active curriculum days.
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-navy/5 pt-3">
                  <span className="text-[8px] text-slate/50">
                    Updated {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="rounded-lg p-2 text-slate transition hover:bg-navy/5 hover:text-navy"
                      title="Edit / Generate script"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleArchive(item.id)}
                      className="rounded-lg p-2 text-slate transition hover:bg-red-500/10 hover:text-red-500"
                      title="Archive Video"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Preview Modal overlay */}
      {previewVideoUrl && (() => {
        const ytEmbed = getYoutubeEmbedUrl(previewVideoUrl);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setPreviewVideoUrl(null)} />
            <div className="relative z-10 w-full max-w-2xl bg-black rounded-2xl overflow-hidden aspect-video shadow-2xl flex items-center justify-center">
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md"
              >
                <X className="h-4 w-4" />
              </button>
              {ytEmbed ? (
                <iframe
                  src={ytEmbed}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={previewVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
        );
      })()}

      {/* Create / Edit Modal */}
      <VideoLessonModal
        open={showModal}
        onClose={() => setShowModal(false)}
        videoLesson={editingItem}
        onSave={handleSaveModal}
      />
    </div>
  );
}

function X({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
