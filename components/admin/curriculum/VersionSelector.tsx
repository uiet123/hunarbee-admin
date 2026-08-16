"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { CurriculumTemplateVersion } from "@/lib/curriculum/types";
import { StatusBadge } from "./StatusBadge";

interface VersionSelectorProps {
  versions: CurriculumTemplateVersion[];
  currentVersionId: string;
  activePublishedVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
  onCreateNewVersion?: () => void;
}

export function VersionSelector({
  versions,
  currentVersionId,
  activePublishedVersionId,
  onSelectVersion,
  onCreateNewVersion,
}: VersionSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sorted = [...versions].sort((a, b) => b.version - a.version);
  const current = sorted.find((v) => v.id === currentVersionId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-3 py-2 text-sm font-medium text-navy transition hover:border-honey/30 hover:shadow-sm"
      >
        <span>v{current?.version || "?"}</span>
        <StatusBadge
          status={current?.status || "DRAFT"}
          isActive={current?.id === activePublishedVersionId}
        />
        <ChevronDown className={cn("h-4 w-4 text-slate transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-72 rounded-xl border border-navy/10 bg-surface-elevated shadow-xl overflow-hidden">
          <div className="py-1 max-h-64 overflow-y-auto portal-scrollbar">
            {sorted.map((v) => {
              const isActive = v.id === activePublishedVersionId;
              const isSelected = v.id === currentVersionId;
              return (
                <button
                  key={v.id}
                  onClick={() => { onSelectVersion(v.id); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-left transition hover:bg-honey/[0.06]",
                    isSelected && "bg-honey/[0.08]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-navy">v{v.version}</span>
                    <StatusBadge status={v.status} isActive={isActive} />
                  </div>
                  <div className="text-right">
                    {v.publishedAt && (
                      <p className="text-[10px] text-slate">
                        {new Date(v.publishedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {onCreateNewVersion && current?.status === "PUBLISHED" && (
            <div className="border-t border-navy/5 p-2">
              <button
                onClick={() => { onCreateNewVersion(); setOpen(false); }}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-honey hover:bg-honey/[0.06] transition"
              >
                <Plus className="h-4 w-4" />
                Create New Version
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
