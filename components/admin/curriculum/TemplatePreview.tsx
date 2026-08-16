"use client";

import type { CurriculumTemplateVersion, CurriculumTemplate } from "@/lib/curriculum/types";
import { DayTypeBadge } from "./DayTypeBadge";
import { StatusBadge } from "./StatusBadge";

interface TemplatePreviewProps {
  template: CurriculumTemplate;
  version: CurriculumTemplateVersion;
  programName: string;
  planName: string;
}

export function TemplatePreview({ template, version, programName, planName }: TemplatePreviewProps) {
  let totalTasks = 0;
  let totalResources = 0;
  let totalMinutes = 0;
  let totalDays = 0;

  for (const phase of version.phases) {
    for (const week of phase.weeks) {
      totalDays += week.days.length;
      for (const day of week.days) {
        totalTasks += day.tasks.length;
        totalResources += day.resources.length;
        totalMinutes += day.estimatedMinutes;
        for (const task of day.tasks) totalMinutes += task.estimatedMinutes;
      }
    }
  }

  const durationLabel = template.durationDays >= 30
    ? `${Math.round(template.durationDays / 30)} Month${template.durationDays >= 60 ? "s" : ""} · ${template.durationDays} Days`
    : `${template.durationDays} Days`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-2xl border border-navy/10 bg-surface-elevated/90 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-navy">
              {template.templateName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate">{programName}</span>
              <span className="text-slate/30">·</span>
              <span className="text-sm text-slate">{planName}</span>
              <span className="text-slate/30">·</span>
              <span className="text-sm font-medium text-navy/70">{durationLabel}</span>
            </div>
            {template.description && (
              <p className="mt-3 text-sm text-slate">{template.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold text-navy">v{version.version}</span>
            <StatusBadge
              status={version.status}
              isActive={version.id === template.currentPublishedVersionId}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-navy/[0.03] p-3 text-center">
            <p className="text-lg font-bold text-navy">{version.phases.length}</p>
            <p className="text-[10px] font-medium uppercase text-slate">Phases</p>
          </div>
          <div className="rounded-lg bg-navy/[0.03] p-3 text-center">
            <p className="text-lg font-bold text-navy">{totalDays}</p>
            <p className="text-[10px] font-medium uppercase text-slate">Days</p>
          </div>
          <div className="rounded-lg bg-navy/[0.03] p-3 text-center">
            <p className="text-lg font-bold text-navy">{totalTasks}</p>
            <p className="text-[10px] font-medium uppercase text-slate">Tasks</p>
          </div>
          <div className="rounded-lg bg-navy/[0.03] p-3 text-center">
            <p className="text-lg font-bold text-navy">{Math.round(totalMinutes / 60)}h</p>
            <p className="text-[10px] font-medium uppercase text-slate">Est. Hours</p>
          </div>
        </div>
      </div>

      {/* Phases */}
      {version.phases
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((phase, pIdx) => (
          <div key={phase.id} className="rounded-2xl border border-navy/10 bg-surface-elevated/90 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-navy/[0.05] to-transparent px-5 py-4 border-b border-navy/5">
              <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
                Phase {pIdx + 1}: {phase.title}
              </h2>
              {phase.description && <p className="text-xs text-slate mt-1">{phase.description}</p>}
            </div>

            <div className="p-5 space-y-4">
              {phase.weeks
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((week, wIdx) => (
                  <div key={week.id} className="rounded-xl border border-navy/8 bg-white overflow-hidden">
                    <div className="bg-navy/[0.02] px-4 py-3 border-b border-navy/5">
                      <h3 className="text-sm font-semibold text-navy">
                        Week {wIdx + 1}: {week.title}
                      </h3>
                      {week.goal && <p className="text-xs text-slate mt-0.5 italic">{week.goal}</p>}
                    </div>

                    <div className="divide-y divide-navy/5">
                      {week.days
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((day) => (
                          <div key={day.id} className="px-4 py-4">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy text-white text-xs font-bold">
                                {day.dayNumber}
                              </span>
                              <h4 className="text-sm font-bold text-navy flex-1">{day.title}</h4>
                              <DayTypeBadge type={day.type} />
                              <span className="text-[10px] text-slate">{day.estimatedMinutes} min</span>
                            </div>

                            {day.description && (
                              <p className="text-xs text-slate mb-3">{day.description}</p>
                            )}

                            {day.objectives.length > 0 && (
                              <div className="mb-3">
                                <p className="text-[10px] font-bold uppercase text-slate mb-1">Objectives</p>
                                <ul className="space-y-1">
                                  {day.objectives.map((obj, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs text-navy">
                                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-honey shrink-0" />
                                      {obj}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {day.tasks.length > 0 && (
                              <div className="mb-3">
                                <p className="text-[10px] font-bold uppercase text-slate mb-2">Tasks ({day.tasks.length})</p>
                                <div className="space-y-2">
                                  {day.tasks.map((task) => (
                                    <div key={task.id} className="rounded-lg bg-navy/[0.02] p-3 border border-navy/5">
                                      <div className="flex items-start justify-between">
                                        <p className="text-xs font-semibold text-navy">{task.title}</p>
                                        <div className="flex gap-1">
                                          {task.requiresSubmission && (
                                            <span className="rounded-full bg-honey/10 px-1.5 py-0.5 text-[9px] font-bold text-honey-deep">Sub</span>
                                          )}
                                          {task.requiresMentorReview && (
                                            <span className="rounded-full bg-teal-500/10 px-1.5 py-0.5 text-[9px] font-bold text-teal-600">Review</span>
                                          )}
                                        </div>
                                      </div>
                                      {task.description && <p className="text-[11px] text-slate mt-1">{task.description}</p>}
                                      <p className="text-[10px] text-slate mt-1">{task.estimatedMinutes} min</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {day.resources.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold uppercase text-slate mb-2">Resources ({day.resources.length})</p>
                                <div className="flex flex-wrap gap-2">
                                  {day.resources.map((res) => (
                                    <a
                                      key={res.id}
                                      href={res.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/5 border border-blue-500/15 px-2 py-1.5 text-[11px] font-medium text-blue-600 hover:bg-blue-500/10 transition"
                                    >
                                      <span className="rounded bg-blue-500/10 px-1 py-0.5 text-[9px] font-bold uppercase">{res.type}</span>
                                      {res.title}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
}
