"use client";

import { useState, useEffect } from "react";
import { X, Play, AlertTriangle, Cpu, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VideoLesson, VideoProvider } from "@/lib/curriculum/types";
import { VIDEO_PROVIDERS } from "@/lib/curriculum/types";
import { videoGeneratorService } from "@/lib/video-generation/mock-video-generator";
import { updateVideoLesson, createVideoLesson, getVideoLesson } from "@/lib/curriculum/curriculum-service";

interface VideoLessonModalProps {
  open: boolean;
  onClose: () => void;
  videoLesson: VideoLesson | null; // Null if creating
  onSave: (saved: VideoLesson) => void;
}

const PROVIDER_LABELS: Record<VideoProvider, string> = {
  YOUTUBE: "YouTube",
  SELF_HOSTED: "Self Hosted",
  GENERATED: "Generated (AI Mock)",
};

export function VideoLessonModal({
  open,
  onClose,
  videoLesson,
  onSave,
}: VideoLessonModalProps) {
  const isCreating = !videoLesson;

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState<VideoProvider>("YOUTUBE");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [script, setScript] = useState("");

  // Generation status state
  const [status, setStatus] = useState<VideoLesson["status"]>("DRAFT");
  const [jobProgress, setJobProgress] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Load video if editing
  useEffect(() => {
    if (videoLesson) {
      setTitle(videoLesson.title);
      setDescription(videoLesson.description);
      setProvider(videoLesson.provider);
      setVideoUrl(videoLesson.videoUrl || "");
      setThumbnailUrl(videoLesson.thumbnailUrl || "");
      setDurationSeconds(videoLesson.durationSeconds || 0);
      setScript(videoLesson.script || "");
      setStatus(videoLesson.status || "DRAFT");
    } else {
      setTitle("");
      setDescription("");
      setProvider("YOUTUBE");
      setVideoUrl("");
      setThumbnailUrl("");
      setDurationSeconds(0);
      setScript("");
      setStatus("DRAFT");
    }
    setError("");
    setJobProgress("");
    setGenerating(false);
  }, [videoLesson, open]);

  // Generate / Polling logic
  const handleGenerate = async (currentVideo: VideoLesson) => {
    if (provider !== "GENERATED") return;
    if (!script.trim()) {
      setError("A script is required to generate a video.");
      return;
    }

    setGenerating(true);
    setError("");
    setJobProgress("Initializing generation job...");

    try {
      // Trigger generation
      const job = await videoGeneratorService.generateVideo({
        videoLessonId: currentVideo.id,
        script: script.trim(),
      });

      // Poll status
      const pollInterval = setInterval(async () => {
        try {
          const statusUpdate = await videoGeneratorService.getGenerationStatus(job.id);
          setJobProgress(statusUpdate.progressMessage);
          setStatus(statusUpdate.status);

          if (statusUpdate.status === "READY") {
            clearInterval(pollInterval);
            setGenerating(false);
            setJobProgress("Generation complete!");
            
            // Reload and fetch the updated video lesson
            const updatedVideo = await getVideoLesson(currentVideo.id);
            if (updatedVideo) {
              setVideoUrl(updatedVideo.videoUrl);
              setThumbnailUrl(updatedVideo.thumbnailUrl);
              setDurationSeconds(updatedVideo.durationSeconds);
              onSave(updatedVideo);
            }
          } else if (statusUpdate.status === "FAILED") {
            clearInterval(pollInterval);
            setGenerating(false);
            setError(statusUpdate.progressMessage || "Mock generation pipeline failed.");
            
            // Reload updated status
            const updatedVideo = await getVideoLesson(currentVideo.id);
            if (updatedVideo) {
              onSave(updatedVideo);
            }
          }
        } catch (pollErr) {
          clearInterval(pollInterval);
          setGenerating(false);
          setError("Failed to fetch polling updates.");
        }
      }, 800);
    } catch (genErr) {
      setGenerating(false);
      setError((genErr as Error).message);
    }
  };

  const handleSave = async (autoTriggerGen = false) => {
    if (!title.trim() || !description.trim()) {
      setError("Please fill in Title and Description.");
      return;
    }

    if (provider !== "GENERATED" && !videoUrl.trim()) {
      setError("Please specify a Video URL.");
      return;
    }

    setError("");

    const payload = {
      title: title.trim(),
      description: description.trim(),
      provider,
      videoUrl: videoUrl.trim(),
      thumbnailUrl: thumbnailUrl.trim(),
      durationSeconds: Number(durationSeconds) || 0,
      script: script.trim(),
    };

    try {
      let saved: VideoLesson;
      if (isCreating) {
        saved = await createVideoLesson(payload);
      } else {
        saved = await updateVideoLesson(videoLesson.id, payload);
      }
      onSave(saved);

      if (autoTriggerGen && provider === "GENERATED") {
        await handleGenerate(saved);
      } else {
        onClose();
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !generating && onClose()} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-navy/10 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-navy/5 px-6 py-4 bg-surface-elevated/40">
          <div>
            <h3 className="text-sm font-bold text-navy">
              {isCreating ? "Create Video Lesson" : "Edit Video Lesson"}
            </h3>
            <p className="text-[10px] text-slate/70 mt-0.5">Define video lesson configuration for curriculum reuse.</p>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            className="rounded-lg p-1.5 text-slate hover:bg-navy/5 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 portal-scrollbar">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/5 border border-red-500/10 px-4 py-3 text-xs text-red-500 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {generating && (
            <div className="rounded-xl border border-honey/20 bg-honey/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-honey-deep flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating Local Video Asset...
                </span>
                <span className="text-[10px] text-honey-deep/80">Processing Script</span>
              </div>
              <p className="text-xs text-slate/80 italic font-medium">Current Status: {jobProgress}</p>
              {/* Progress animation slider */}
              <div className="h-1.5 w-full rounded-full bg-honey/10 overflow-hidden">
                <div className="h-full bg-honey-deep rounded-full animate-[loading-bar_4s_ease-in-out_infinite]" style={{ width: "60%" }} />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate">Title</label>
              <input
                value={title}
                disabled={generating}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. useState Hook Guide"
                className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate">Provider</label>
              <select
                value={provider}
                disabled={generating}
                onChange={(e) => {
                  setProvider(e.target.value as VideoProvider);
                  if (e.target.value === "GENERATED") {
                    setVideoUrl("");
                  }
                }}
                className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey disabled:opacity-50"
              >
                {VIDEO_PROVIDERS.map((p) => (
                  <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate">Description</label>
            <textarea
              value={description}
              disabled={generating}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What students learn from watching this lesson..."
              className="w-full min-h-[60px] rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey disabled:opacity-50 resize-y"
            />
          </div>

          {provider !== "GENERATED" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate">Video URL</label>
                <input
                  value={videoUrl}
                  disabled={generating}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                  className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey disabled:opacity-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate">Duration (seconds)</label>
                  <input
                    type="number"
                    value={durationSeconds}
                    disabled={generating}
                    onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate">Thumbnail URL (optional)</label>
                  <input
                    value={thumbnailUrl}
                    disabled={generating}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4 rounded-xl border border-navy/5 bg-navy/[0.01]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-honey" /> Mock TTS Script Configuration
                </span>
                <span className={cn(
                  "rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                  status === "READY" && "bg-emerald-500/10 text-emerald-600",
                  status === "GENERATING" && "bg-honey/10 text-honey-deep animate-pulse",
                  status === "FAILED" && "bg-red-500/10 text-red-500",
                  status === "DRAFT" && "bg-slate-500/10 text-slate"
                )}>
                  Pipeline: {status}
                </span>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate">Lesson Script Text</label>
                <textarea
                  value={script}
                  disabled={generating}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Write the full voiceover script for the lesson. Submitting 'fail' triggers mock compilation failure."
                  className="w-full min-h-[120px] rounded-lg border border-navy/10 bg-white px-3 py-2 text-xs text-navy outline-none focus:border-honey disabled:opacity-50 font-mono resize-y"
                />
              </div>

              {/* Generated video details preview */}
              {status === "READY" && videoUrl && (
                <div className="rounded-lg border border-navy/5 bg-white p-3 space-y-2">
                  <p className="text-[10px] text-slate uppercase font-semibold">Generated Outputs</p>
                  <p className="text-xs text-navy truncate font-medium flex items-center gap-1.5">
                    <Play className="h-3 w-3 text-emerald-500" /> {videoUrl}
                  </p>
                  
                  {/* Playable Video Player */}
                  <div className="rounded-xl overflow-hidden aspect-video bg-black border border-navy/5 mt-2">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full"
                    />
                  </div>

                  <p className="text-xs text-slate">Simulated Duration: {durationSeconds} seconds</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-navy/5 px-6 py-4 bg-surface-elevated/40">
          <div className="text-[10px] text-slate/50">
            {!isCreating && `Created: ${new Date(videoLesson.createdAt).toLocaleDateString()}`}
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              size="sm"
              disabled={generating}
            >
              Cancel
            </Button>

            {provider === "GENERATED" && !isCreating && (
              <Button
                onClick={() => handleGenerate(videoLesson)}
                disabled={generating || !script.trim()}
                variant="secondary"
                size="sm"
                className="border-honey hover:bg-honey/10 text-honey-deep font-semibold"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                {status === "FAILED" ? "Retry Generation" : "Generate Video"}
              </Button>
            )}

            <Button
              onClick={() => handleSave(isCreating && provider === "GENERATED")}
              disabled={generating}
              size="sm"
            >
              {isCreating
                ? (provider === "GENERATED" ? "Create & Generate" : "Create Lesson")
                : "Save Metadata"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
