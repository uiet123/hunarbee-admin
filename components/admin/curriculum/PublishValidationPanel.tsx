"use client";

import { X, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationResult } from "@/lib/curriculum/types";
import { Button } from "@/components/ui/button";

interface PublishValidationPanelProps {
  validation: ValidationResult | null;
  onClose: () => void;
  onConfirmPublish: () => void;
  publishing?: boolean;
}

export function PublishValidationPanel({
  validation,
  onClose,
  onConfirmPublish,
  publishing,
}: PublishValidationPanelProps) {
  if (!validation) return null;

  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-navy/10 bg-surface-elevated shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-navy/5 px-6 py-4">
          <h3 className="text-base font-bold text-navy">
            {hasErrors ? "Publish Validation Failed" : "Ready to Publish"}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate hover:bg-navy/5 hover:text-navy">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 border-b border-navy/5 px-6 py-4">
          <div className="rounded-lg bg-navy/[0.03] p-3 text-center">
            <p className="text-lg font-bold text-navy">{validation.stats.totalDays}</p>
            <p className="text-[10px] font-medium uppercase text-slate">Days</p>
          </div>
          <div className="rounded-lg bg-navy/[0.03] p-3 text-center">
            <p className="text-lg font-bold text-navy">{validation.stats.totalTasks}</p>
            <p className="text-[10px] font-medium uppercase text-slate">Tasks</p>
          </div>
          <div className="rounded-lg bg-navy/[0.03] p-3 text-center">
            <p className="text-lg font-bold text-navy">{Math.round(validation.stats.totalEstimatedMinutes / 60)}h</p>
            <p className="text-[10px] font-medium uppercase text-slate">Est. Hours</p>
          </div>
        </div>

        {/* Errors */}
        {hasErrors && (
          <div className="px-6 py-4 border-b border-navy/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h4 className="text-xs font-bold uppercase text-red-500 tracking-wider">
                Errors ({validation.errors.length})
              </h4>
            </div>
            <div className="max-h-48 overflow-y-auto portal-scrollbar space-y-2">
              {validation.errors.map((err, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-lg bg-red-500/5 px-3 py-2 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-navy">{err.path}</span>
                    <span className="text-red-600"> {err.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {hasWarnings && (
          <div className="px-6 py-4 border-b border-navy/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-honey-deep" />
              <h4 className="text-xs font-bold uppercase text-honey-deep tracking-wider">
                Warnings ({validation.warnings.length})
              </h4>
            </div>
            <div className="max-h-32 overflow-y-auto portal-scrollbar space-y-2">
              {validation.warnings.map((warn, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-lg bg-honey/5 px-3 py-2 text-xs">
                  <AlertCircle className="h-3.5 w-3.5 text-honey-deep shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-navy">{warn.path}</span>
                    <span className="text-honey-deep"> {warn.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success message */}
        {!hasErrors && (
          <div className="px-6 py-4 border-b border-navy/5">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700">All validations passed!</p>
                <p className="text-xs text-emerald-600 mt-0.5">This curriculum is ready to be published.</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <Button onClick={onClose} variant="secondary" size="sm">
            {hasErrors ? "Fix Errors" : "Cancel"}
          </Button>
          {!hasErrors && (
            <Button onClick={onConfirmPublish} size="sm" disabled={publishing}>
              {publishing ? "Publishing..." : "Confirm Publish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
