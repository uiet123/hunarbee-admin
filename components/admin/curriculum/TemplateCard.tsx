"use client";

import { Copy, Download, Eye, Edit2, Archive, Trash2, Plus, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CurriculumTemplate, Program, InternshipPlan } from "@/lib/curriculum/types";
import { StatusBadge } from "./StatusBadge";

interface TemplateCardProps {
  template: CurriculumTemplate;
  program?: Program;
  plan?: InternshipPlan;
  onEdit: (templateId: string, versionId: string) => void;
  onPreview: (templateId: string) => void;
  onDuplicate: (templateId: string) => void;
  onExport: (templateId: string) => void;
  onArchiveVersion: (templateId: string, versionId: string) => void;
  onDelete: (templateId: string) => void;
  onCreateNewVersion: (templateId: string) => void;
}

export function TemplateCard({
  template,
  program,
  plan,
  onEdit,
  onPreview,
  onDuplicate,
  onExport,
  onArchiveVersion,
  onDelete,
  onCreateNewVersion,
}: TemplateCardProps) {
  const sorted = [...template.versions].sort((a, b) => b.version - a.version);
  const latestVersion = sorted[0];
  const latestStatus = latestVersion?.status || "DRAFT";
  const isActivePublished = latestVersion?.id === template.currentPublishedVersionId;

  // Count stats from latest version
  let totalPhases = 0, totalWeeks = 0, totalDays = 0;
  if (latestVersion) {
    totalPhases = latestVersion.phases.length;
    for (const p of latestVersion.phases) {
      totalWeeks += p.weeks.length;
      for (const w of p.weeks) {
        totalDays += w.days.length;
      }
    }
  }

  const allDraft = template.versions.every((v) => v.status === "DRAFT");
  const durationLabel = template.durationDays >= 30
    ? `${Math.round(template.durationDays / 30)} Month${template.durationDays >= 60 ? "s" : ""} · ${template.durationDays} Days`
    : `${template.durationDays} Days`;

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-navy/8 bg-surface-elevated/90 p-5 shadow-sm transition-all hover:border-honey/30 hover:shadow-md">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-honey/20 to-honey/5 text-honey-deep">
            <Layers className="h-5 w-5" />
          </div>
          <StatusBadge status={latestStatus} isActive={isActivePublished} />
        </div>

        {/* Template name */}
        <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-navy leading-snug">
          {template.templateName}
        </h3>

        {/* Program & Plan */}
        <div className="mt-2 space-y-1">
          {program && (
            <p className="text-xs text-slate">
              <span className="font-medium text-navy/70">{program.name}</span>
            </p>
          )}
          {plan && (
            <p className="text-xs text-slate">{plan.name} · {durationLabel}</p>
          )}
        </div>

        {/* Stats */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-lg bg-navy/5 px-2 py-1 text-[10px] font-semibold text-navy/60">
            {totalPhases} phase{totalPhases !== 1 ? "s" : ""}
          </span>
          <span className="rounded-lg bg-navy/5 px-2 py-1 text-[10px] font-semibold text-navy/60">
            {totalWeeks} week{totalWeeks !== 1 ? "s" : ""}
          </span>
          <span className="rounded-lg bg-navy/5 px-2 py-1 text-[10px] font-semibold text-navy/60">
            {totalDays}/{template.durationDays} days
          </span>
          <span className="rounded-lg bg-navy/5 px-2 py-1 text-[10px] font-semibold text-navy/60">
            v{latestVersion?.version || 1}
          </span>
        </div>

        {/* Timestamp */}
        <p className="mt-2 text-[10px] text-slate/60">
          Updated {new Date(template.updatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-navy/5 pt-3">
        <div className="flex gap-1">
          {latestStatus === "DRAFT" && (
            <button
              onClick={() => onEdit(template.id, latestVersion.id)}
              className="rounded-lg p-2 text-slate transition hover:bg-navy/5 hover:text-navy"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onPreview(template.id)}
            className="rounded-lg p-2 text-slate transition hover:bg-navy/5 hover:text-navy"
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDuplicate(template.id)}
            className="rounded-lg p-2 text-slate transition hover:bg-navy/5 hover:text-navy"
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onExport(template.id)}
            className="rounded-lg p-2 text-slate transition hover:bg-navy/5 hover:text-navy"
            title="Export JSON"
          >
            <Download className="h-4 w-4" />
          </button>
          {latestStatus === "PUBLISHED" && !isActivePublished && (
            <button
              onClick={() => onArchiveVersion(template.id, latestVersion.id)}
              className="rounded-lg p-2 text-slate transition hover:bg-orange-500/10 hover:text-orange-500"
              title="Archive"
            >
              <Archive className="h-4 w-4" />
            </button>
          )}
          {latestStatus === "PUBLISHED" && isActivePublished && (
            <button
              disabled
              className="rounded-lg p-2 text-slate/30 cursor-not-allowed"
              title="Active curriculum cannot be archived. Publish a new version first."
            >
              <Archive className="h-4 w-4" />
            </button>
          )}
          {latestStatus === "PUBLISHED" && (
            <button
              onClick={() => onCreateNewVersion(template.id)}
              className="rounded-lg p-2 text-slate transition hover:bg-honey/10 hover:text-honey-deep"
              title="Create New Version"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
          {allDraft && (
            <button
              onClick={() => onDelete(template.id)}
              className="rounded-lg p-2 text-slate transition hover:bg-red-500/10 hover:text-red-500"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => onEdit(template.id, latestVersion?.id || "")}
          className="text-xs font-semibold text-honey hover:text-honey-deep"
        >
          {latestStatus === "DRAFT" ? "Edit →" : "View →"}
        </button>
      </div>
    </div>
  );
}
