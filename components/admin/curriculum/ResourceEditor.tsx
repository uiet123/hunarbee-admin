"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CurriculumResource, ResourceType } from "@/lib/curriculum/types";
import { RESOURCE_TYPES } from "@/lib/curriculum/types";

interface ResourceEditorProps {
  resource: CurriculumResource;
  onChange: (updated: CurriculumResource) => void;
  onDelete: () => void;
  readOnly?: boolean;
}

const TYPE_LABELS: Record<ResourceType, string> = {
  LINK: "Link",
  VIDEO: "Video",
  PDF: "PDF",
  ARTICLE: "Article",
  DOCUMENTATION: "Docs",
};

export function ResourceEditor({ resource, onChange, onDelete, readOnly }: ResourceEditorProps) {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-lg border border-navy/5 bg-surface p-2.5 transition hover:border-navy/10">
      <select
        value={resource.type}
        onChange={(e) => onChange({ ...resource, type: e.target.value as ResourceType })}
        disabled={readOnly}
        className="rounded-md border border-navy/10 bg-white px-2 py-1.5 text-xs font-medium text-navy outline-none focus:border-honey disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {RESOURCE_TYPES.map((t) => (
          <option key={t} value={t}>{TYPE_LABELS[t]}</option>
        ))}
      </select>
      <input
        value={resource.title}
        placeholder="Title"
        onChange={(e) => onChange({ ...resource, title: e.target.value })}
        disabled={readOnly}
        className="min-w-[120px] flex-1 rounded-md border border-navy/10 bg-white px-2 py-1.5 text-xs text-navy outline-none focus:border-honey disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <input
        value={resource.url}
        placeholder="URL"
        onChange={(e) => onChange({ ...resource, url: e.target.value })}
        disabled={readOnly}
        className="min-w-[120px] flex-[2] rounded-md border border-navy/10 bg-white px-2 py-1.5 text-xs text-navy outline-none focus:border-honey disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <input
        value={resource.description}
        placeholder="Description"
        onChange={(e) => onChange({ ...resource, description: e.target.value })}
        disabled={readOnly}
        className="hidden lg:block min-w-[120px] flex-[2] rounded-md border border-navy/10 bg-white px-2 py-1.5 text-xs text-navy outline-none focus:border-honey disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {resource.sourceLibraryId && (
        <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 uppercase tracking-wider whitespace-nowrap">
          Library
        </span>
      )}
      {!readOnly && (
        <button
          onClick={onDelete}
          className="shrink-0 rounded-md p-1.5 text-slate transition hover:bg-red-500/10 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
