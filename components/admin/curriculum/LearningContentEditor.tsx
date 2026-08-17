"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Video, FileText, Link2, BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LearningContent, LearningContentType, VideoLesson, CurriculumTask } from "@/lib/curriculum/types";
import { LEARNING_CONTENT_TYPES } from "@/lib/curriculum/types";
import { getVideoLibrary, generateId } from "@/lib/curriculum/curriculum-service";
import { useAlertModal } from "@/components/admin/ui/AlertModalProvider";
import { VideoLessonModal } from "./VideoLessonModal";

interface LearningContentEditorProps {
  learningContent: LearningContent[];
  tasks: CurriculumTask[];
  onChange: (updated: LearningContent[]) => void;
  readOnly?: boolean;
}

const TYPE_ICONS: Record<LearningContentType, React.ElementType> = {
  VIDEO: Video,
  ARTICLE: BookOpen,
  DOCUMENTATION: FileText,
  PDF: FileText,
};

const TYPE_LABELS: Record<LearningContentType, string> = {
  VIDEO: "Video",
  ARTICLE: "Article",
  DOCUMENTATION: "Docs",
  PDF: "PDF",
};

export function LearningContentEditor({
  learningContent = [],
  tasks = [],
  onChange,
  readOnly,
}: LearningContentEditorProps) {
  const [videoLessons, setVideoLessons] = useState<VideoLesson[]>([]);
  const [selectedVideoToEdit, setSelectedVideoToEdit] = useState<VideoLesson | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentLcForVideoSelection, setCurrentLcForVideoSelection] = useState<string | null>(null);
  const { showAlert } = useAlertModal();

  // Load video library for selection dropdown
  const loadVideos = async () => {
    try {
      const vids = await getVideoLibrary();
      setVideoLessons(vids);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const addLearningItem = (type: LearningContentType) => {
    const newItem: LearningContent = {
      id: generateId("lc"),
      order: learningContent.length + 1,
      type,
      title: "",
      description: "",
      url: "",
      isRequired: true,
      completionThreshold: type === "VIDEO" ? 90 : undefined,
    };
    onChange([...learningContent, newItem]);
  };

  const updateItem = (id: string, data: Partial<LearningContent>) => {
    const updated = learningContent.map((item) => {
      if (item.id !== id) return item;
      const updatedItem = { ...item, ...data };
      
      // If we selected a video lesson, pre-populate title and url from the video lesson details
      if (data.videoLessonId) {
        const vid = videoLessons.find((v) => v.id === data.videoLessonId);
        if (vid) {
          updatedItem.title = vid.title;
          updatedItem.description = vid.description;
          updatedItem.url = vid.videoUrl;
        }
      }
      return updatedItem;
    });
    onChange(updated);
  };

  const deleteItem = async (id: string) => {
    // Check if referenced by task prerequisites
    const referencingTasks: string[] = [];
    tasks.forEach((task) => {
      const prereqs = task.prerequisites || [];
      const isReferenced = prereqs.some((p) => p.targetId === id);
      if (isReferenced) {
        referencingTasks.push(task.title || `Task #${task.order}`);
      }
    });

    if (referencingTasks.length > 0) {
      await showAlert(
        `Cannot delete learning content: It is referenced as a prerequisite in Task: "${referencingTasks.join(
          '", "'
        )}". Please remove or update the prerequisite first.`,
        "Cannot Delete",
        "error"
      );
      return;
    }

    const filtered = learningContent.filter((item) => item.id !== id);
    // Recalculate orders
    const recalculated = filtered.map((item, index) => ({
      ...item,
      order: index + 1,
    }));
    onChange(recalculated);
  };

  const handleEditVideoDetails = (lc: LearningContent) => {
    if (!lc.videoLessonId) {
      // Create new video lesson first
      setSelectedVideoToEdit(null);
      setCurrentLcForVideoSelection(lc.id);
      setShowVideoModal(true);
    } else {
      const video = videoLessons.find((v) => v.id === lc.videoLessonId);
      if (video) {
        setSelectedVideoToEdit(video);
        setCurrentLcForVideoSelection(lc.id);
        setShowVideoModal(true);
      }
    }
  };

  const handleSaveVideoModal = (savedVideo: VideoLesson) => {
    loadVideos().then(() => {
      if (currentLcForVideoSelection) {
        updateItem(currentLcForVideoSelection, {
          videoLessonId: savedVideo.id,
          title: savedVideo.title,
          description: savedVideo.description,
          url: savedVideo.videoUrl,
        });
      }
      setShowVideoModal(false);
      setCurrentLcForVideoSelection(null);
    });
  };

  return (
    <div className="space-y-4">
      {/* List learning items */}
      <div className="space-y-2.5">
        {learningContent.length === 0 ? (
          <p className="text-xs text-slate italic py-2">No learning content added to this day yet.</p>
        ) : (
          learningContent.map((item) => {
            const Icon = TYPE_ICONS[item.type] || FileText;
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-navy/10 bg-white p-4 transition hover:border-navy/15 shadow-sm"
              >
                {/* Header info & type */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-bold text-navy uppercase tracking-wider">
                      {TYPE_LABELS[item.type]} Item
                    </span>
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="rounded-lg p-1.5 text-slate transition hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Form fields */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {item.type === "VIDEO" ? (
                    <div className="sm:col-span-2 flex items-end gap-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate">Select Video Lesson</label>
                        <select
                          value={item.videoLessonId || ""}
                          disabled={readOnly}
                          onChange={(e) => updateItem(item.id, { videoLessonId: e.target.value })}
                          className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-xs text-navy outline-none focus:border-honey"
                        >
                          <option value="">-- Choose Reusable Video --</option>
                          {videoLessons.map((v) => (
                            <option key={v.id} value={v.id}>{v.title} ({v.provider})</option>
                          ))}
                        </select>
                      </div>
                      {!readOnly && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditVideoDetails(item)}
                          className="h-9 px-3 text-xs flex items-center gap-1 shrink-0"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          {item.videoLessonId ? "Edit Video Asset" : "Create Asset"}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-bold uppercase text-slate">Title</label>
                      <input
                        value={item.title}
                        disabled={readOnly}
                        onChange={(e) => updateItem(item.id, { title: e.target.value })}
                        placeholder="e.g. useState Documentation Guide"
                        className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-xs text-navy outline-none focus:border-honey"
                      />
                    </div>
                  )}

                  {item.type !== "VIDEO" && (
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-bold uppercase text-slate">URL / Path</label>
                      <input
                        value={item.url}
                        disabled={readOnly}
                        onChange={(e) => updateItem(item.id, { url: e.target.value })}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-xs text-navy outline-none focus:border-honey"
                      />
                    </div>
                  )}

                  <div className={item.type === "VIDEO" ? "sm:col-span-1" : "sm:col-span-2"}>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate">Description</label>
                    <input
                      value={item.description}
                      disabled={readOnly}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      placeholder="Brief note on what this item covers..."
                      className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-xs text-navy outline-none focus:border-honey"
                    />
                  </div>

                  {item.type === "VIDEO" && (
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase text-slate">Completion Threshold (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={item.completionThreshold || 90}
                        disabled={readOnly}
                        onChange={(e) => updateItem(item.id, { completionThreshold: parseInt(e.target.value) || 90 })}
                        className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-xs text-navy outline-none focus:border-honey"
                      />
                    </div>
                  )}
                </div>

                {/* Day-specific attributes */}
                <div className="flex items-center gap-4 rounded-lg bg-navy/[0.02] p-2.5 text-xs border border-navy/5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-navy">
                    <input
                      type="checkbox"
                      checked={item.isRequired}
                      disabled={readOnly}
                      onChange={(e) => updateItem(item.id, { isRequired: e.target.checked })}
                      className="rounded accent-honey"
                    />
                    <span>Required for Task Unlock</span>
                  </label>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Buttons to add learning content */}
      {!readOnly && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-navy/5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => addLearningItem("VIDEO")}
            className="text-xs flex items-center gap-1 text-navy border-navy/20 hover:bg-navy/5"
          >
            <Plus className="h-3.5 w-3.5 text-honey" /> + Video Lesson
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => addLearningItem("ARTICLE")}
            className="text-xs flex items-center gap-1 text-navy border-navy/20 hover:bg-navy/5"
          >
            <Plus className="h-3.5 w-3.5 text-honey" /> + Article
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => addLearningItem("DOCUMENTATION")}
            className="text-xs flex items-center gap-1 text-navy border-navy/20 hover:bg-navy/5"
          >
            <Plus className="h-3.5 w-3.5 text-honey" /> + Documentation
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => addLearningItem("PDF")}
            className="text-xs flex items-center gap-1 text-navy border-navy/20 hover:bg-navy/5"
          >
            <Plus className="h-3.5 w-3.5 text-honey" /> + PDF Document
          </Button>
        </div>
      )}

      {/* Video Modal overlay for creating/editing reusable assets */}
      <VideoLessonModal
        open={showVideoModal}
        onClose={() => {
          setShowVideoModal(false);
          setCurrentLcForVideoSelection(null);
        }}
        videoLesson={selectedVideoToEdit}
        onSave={handleSaveVideoModal}
      />
    </div>
  );
}
