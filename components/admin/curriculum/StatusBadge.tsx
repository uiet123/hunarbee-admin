"use client";

import { cn } from "@/lib/utils";
import type { TemplateStatus } from "@/lib/curriculum/types";

const STATUS_CONFIG: Record<TemplateStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-honey/15 text-honey-deep border-honey/25",
  },
  PUBLISHED: {
    label: "Published",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-slate/10 text-slate border-slate/20",
  },
};

interface StatusBadgeProps {
  status: TemplateStatus;
  isActive?: boolean;
  className?: string;
}

export function StatusBadge({ status, isActive, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        config.className,
        className
      )}
    >
      {isActive && status === "PUBLISHED" && (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      )}
      {config.label}
      {isActive && status === "PUBLISHED" && (
        <span className="ml-0.5 normal-case tracking-normal font-semibold">• Active</span>
      )}
    </span>
  );
}
