"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  getPrograms,
  getPlansForProgram,
  getTemplateForPlan,
  createTemplate,
} from "@/lib/curriculum";
import type { Program, InternshipPlan } from "@/lib/curriculum/types";

interface CreateTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (templateId: string) => void;
}

export function CreateTemplateModal({ open, onClose, onCreated }: CreateTemplateModalProps) {
  const [step, setStep] = useState(1);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [plans, setPlans] = useState<InternshipPlan[]>([]);
  const [planHasTemplate, setPlanHasTemplate] = useState<Record<string, boolean>>({});
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<InternshipPlan | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Load programs
  useEffect(() => {
    if (open) {
      getPrograms().then(setPrograms);
      setStep(1);
      setSelectedProgram(null);
      setSelectedPlan(null);
      setTemplateName("");
      setDescription("");
      setError("");
    }
  }, [open]);

  // Load plans when program selected
  useEffect(() => {
    if (selectedProgram) {
      getPlansForProgram(selectedProgram.id).then(async (loadedPlans) => {
        setPlans(loadedPlans);
        // Check which plans already have templates (1:1 enforcement)
        const checks: Record<string, boolean> = {};
        for (const plan of loadedPlans) {
          const existing = await getTemplateForPlan(plan.id);
          checks[plan.id] = !!existing;
        }
        setPlanHasTemplate(checks);
      });
    }
  }, [selectedProgram]);

  const handleSelectProgram = (program: Program) => {
    setSelectedProgram(program);
    setSelectedPlan(null);
    setStep(2);
  };

  const handleSelectPlan = (plan: InternshipPlan) => {
    if (planHasTemplate[plan.id]) return;
    setSelectedPlan(plan);
    setTemplateName(`${selectedProgram?.name} — ${plan.name}`);
    setStep(3);
  };

  const handleCreate = async () => {
    if (!selectedProgram || !selectedPlan || !templateName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const tmpl = await createTemplate({
        templateName: templateName.trim(),
        programId: selectedProgram.id,
        planId: selectedPlan.id,
        description: description.trim(),
      });
      onCreated(tmpl.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  const durationLabel = selectedPlan
    ? selectedPlan.durationDays >= 30
      ? `${Math.round(selectedPlan.durationDays / 30)} Month${selectedPlan.durationDays >= 60 ? "s" : ""} · ${selectedPlan.durationDays} Days`
      : `${selectedPlan.durationDays} Days`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-navy/10 bg-surface-elevated shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-navy/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-honey/20 to-honey/5 text-honey-deep">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy">Create Curriculum Template</h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate">
                <span className={cn("font-semibold", step >= 1 ? "text-honey-deep" : "")}>Program</span>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className={cn("font-semibold", step >= 2 ? "text-honey-deep" : "")}>Plan</span>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className={cn("font-semibold", step >= 3 ? "text-honey-deep" : "")}>Details</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate hover:bg-navy/5 hover:text-navy">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step 1: Select Program */}
        {step === 1 && (
          <div className="p-4">
            <p className="text-xs font-semibold uppercase text-slate mb-3 px-1">Select a Program</p>
            <div className="space-y-1 max-h-64 overflow-y-auto portal-scrollbar">
              {programs.map((prog) => (
                <button
                  key={prog.id}
                  onClick={() => handleSelectProgram(prog)}
                  className="w-full flex items-center justify-between rounded-xl p-3 text-left transition hover:bg-honey/[0.06] group border border-transparent hover:border-honey/20"
                >
                  <div>
                    <p className="text-sm font-semibold text-navy group-hover:text-honey-deep">{prog.name}</p>
                    <p className="text-xs text-slate line-clamp-1">{prog.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate group-hover:text-honey-deep shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Plan */}
        {step === 2 && (
          <div className="p-4">
            <button onClick={() => setStep(1)} className="text-xs text-honey hover:text-honey-deep font-medium mb-3 flex items-center">
              ← Back to Programs
            </button>
            <p className="text-xs font-semibold uppercase text-slate mb-1 px-1">
              {selectedProgram?.name}
            </p>
            <p className="text-xs text-slate mb-3 px-1">Select an Internship Plan</p>
            <div className="space-y-1 max-h-64 overflow-y-auto portal-scrollbar">
              {plans.map((plan) => {
                const hasTemplate = planHasTemplate[plan.id];
                return (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={hasTemplate}
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl p-3 text-left transition border border-transparent",
                      hasTemplate
                        ? "opacity-50 cursor-not-allowed bg-navy/[0.02]"
                        : "hover:bg-honey/[0.06] group hover:border-honey/20"
                    )}
                  >
                    <div>
                      <p className={cn("text-sm font-semibold", hasTemplate ? "text-slate" : "text-navy group-hover:text-honey-deep")}>
                        {plan.name}
                      </p>
                      <p className="text-xs text-slate">{plan.durationDays} days</p>
                      {hasTemplate && (
                        <p className="text-[10px] font-semibold text-red-400 mt-0.5">Curriculum exists</p>
                      )}
                    </div>
                    {!hasTemplate && <ChevronRight className="h-4 w-4 text-slate group-hover:text-honey-deep shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Details & Confirm */}
        {step === 3 && selectedProgram && selectedPlan && (
          <div className="p-6 space-y-4">
            <button onClick={() => setStep(2)} className="text-xs text-honey hover:text-honey-deep font-medium mb-1 flex items-center">
              ← Back to Plans
            </button>

            {/* Read-only summary */}
            <div className="rounded-xl bg-navy/[0.03] p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate">Program</span>
                <span className="font-semibold text-navy">{selectedProgram.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate">Plan</span>
                <span className="font-semibold text-navy">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate">Duration</span>
                <span className="font-semibold text-navy">{durationLabel}</span>
              </div>
            </div>

            {/* Editable fields */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate">
                Template Name <span className="text-red-400">*</span>
              </label>
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                className="w-full min-h-[60px] rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-honey resize-y"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={onClose} variant="secondary" size="sm">Cancel</Button>
              <Button
                onClick={handleCreate}
                size="sm"
                disabled={!templateName.trim() || creating}
              >
                {creating ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
