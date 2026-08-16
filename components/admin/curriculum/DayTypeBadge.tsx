"use client";

import { cn } from "@/lib/utils";
import type { DayType } from "@/lib/curriculum/types";
import {
  Compass,
  BookOpen,
  ClipboardList,
  Rocket,
  MessageCircle,
  Upload,
  Award,
  Coffee,
} from "lucide-react";

const DAY_TYPE_CONFIG: Record<
  DayType,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  ORIENTATION: { label: "Orientation", color: "text-indigo-600", bgColor: "bg-indigo-500/10 border-indigo-500/20", icon: Compass },
  LEARNING: { label: "Learning", color: "text-blue-600", bgColor: "bg-blue-500/10 border-blue-500/20", icon: BookOpen },
  TASK: { label: "Task", color: "text-honey-deep", bgColor: "bg-honey/10 border-honey/20", icon: ClipboardList },
  PROJECT: { label: "Project", color: "text-purple-600", bgColor: "bg-purple-500/10 border-purple-500/20", icon: Rocket },
  MENTOR_REVIEW: { label: "Mentor Review", color: "text-teal-600", bgColor: "bg-teal-500/10 border-teal-500/20", icon: MessageCircle },
  SUBMISSION: { label: "Submission", color: "text-emerald-600", bgColor: "bg-emerald-500/10 border-emerald-500/20", icon: Upload },
  ASSESSMENT: { label: "Assessment", color: "text-orange-600", bgColor: "bg-orange-500/10 border-orange-500/20", icon: Award },
  BREAK: { label: "Break", color: "text-slate", bgColor: "bg-slate/10 border-slate/20", icon: Coffee },
};

export function getDayTypeConfig(type: DayType) {
  return DAY_TYPE_CONFIG[type] || DAY_TYPE_CONFIG.LEARNING;
}

interface DayTypeBadgeProps {
  type: DayType;
  className?: string;
  showIcon?: boolean;
}

export function DayTypeBadge({ type, className, showIcon = true }: DayTypeBadgeProps) {
  const config = getDayTypeConfig(type);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        config.bgColor,
        config.color,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  );
}
