"use client";

import { useState, useEffect } from "react";
import { X, Upload, ChevronRight, AlertTriangle, FileJson } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  getPrograms,
  getPlansForProgram,
  getTemplateForPlan,
  importTemplate,
} from "@/lib/curriculum";
import { validateImportJSON } from "@/lib/curriculum/validators";
import type { Program, InternshipPlan, ValidationResult } from "@/lib/curriculum/types";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: (templateId: string) => void;
}

export function ImportModal({ open, onClose, onImported }: ImportModalProps) {
  const [step, setStep] = useState(1);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [plans, setPlans] = useState<InternshipPlan[]>([]);
  const [planHasTemplate, setPlanHasTemplate] = useState<Record<string, boolean>>({});
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<InternshipPlan | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      getPrograms().then(setPrograms);
      setStep(1);
      setSelectedProgram(null);
      setSelectedPlan(null);
      setJsonInput("");
      setValidation(null);
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (selectedProgram) {
      getPlansForProgram(selectedProgram.id).then(async (loadedPlans) => {
        setPlans(loadedPlans);
        const checks: Record<string, boolean> = {};
        for (const plan of loadedPlans) {
          const existing = await getTemplateForPlan(plan.id);
          // Only block if the template has actual content (phases > 0)
          const latestVersion = existing?.versions?.[existing.versions.length - 1];
          checks[plan.id] = !!existing && !!latestVersion && latestVersion.phases.length > 0;
        }
        setPlanHasTemplate(checks);
      });
    }
  }, [selectedProgram]);

  const handleSelectPlan = (plan: InternshipPlan) => {
    if (planHasTemplate[plan.id]) return;
    setSelectedPlan(plan);
    setStep(2);
  };

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const result = validateImportJSON(parsed);
      setValidation(result);
      if (result.valid) setStep(3);
    } catch {
      setValidation({
        valid: false,
        errors: [{ path: "root", field: "json", message: "Invalid JSON syntax.", severity: "error" }],
        warnings: [],
        stats: { totalPhases: 0, totalWeeks: 0, totalDays: 0, totalTasks: 0, totalResources: 0, totalEstimatedMinutes: 0 },
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJsonInput(ev.target?.result as string);
      setValidation(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedPlan) return;
    setImporting(true);
    setError("");
    try {
      const result = await importTemplate(jsonInput, selectedPlan.id);
      if (result.template) {
        onImported(result.template.id);
      } else {
        setError("Import failed. Please check validation errors.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setImporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-navy/10 bg-surface-elevated shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-navy/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-600">
              <FileJson className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy">Import Curriculum JSON</h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate">
                <span className={cn("font-semibold", step >= 1 ? "text-blue-600" : "")}>Select Plan</span>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className={cn("font-semibold", step >= 2 ? "text-blue-600" : "")}>Upload</span>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className={cn("font-semibold", step >= 3 ? "text-blue-600" : "")}>Confirm</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate hover:bg-navy/5 hover:text-navy">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step 1: Select Plan */}
        {step === 1 && !selectedProgram && (
          <div className="p-4">
            <p className="text-xs font-semibold uppercase text-slate mb-3 px-1">Select a Program</p>
            <div className="space-y-1 max-h-56 overflow-y-auto portal-scrollbar">
              {programs.map((prog) => (
                <button
                  key={prog.id}
                  onClick={() => setSelectedProgram(prog)}
                  className="w-full flex items-center justify-between rounded-xl p-3 text-left transition hover:bg-blue-500/[0.06] group border border-transparent hover:border-blue-500/20"
                >
                  <p className="text-sm font-semibold text-navy group-hover:text-blue-600">{prog.name}</p>
                  <ChevronRight className="h-4 w-4 text-slate" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && selectedProgram && (
          <div className="p-4">
            <button onClick={() => setSelectedProgram(null)} className="text-xs text-blue-500 font-medium mb-3">← Programs</button>
            <p className="text-xs font-semibold uppercase text-slate mb-3 px-1">{selectedProgram.name} — Select Plan</p>
            <div className="space-y-1 max-h-56 overflow-y-auto portal-scrollbar">
              {plans.map((plan) => {
                const has = planHasTemplate[plan.id];
                return (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={has}
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl p-3 text-left transition border border-transparent",
                      has ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-500/[0.06] group hover:border-blue-500/20"
                    )}
                  >
                    <div>
                      <p className={cn("text-sm font-semibold", has ? "text-slate" : "text-navy")}>{plan.name}</p>
                      <p className="text-xs text-slate">{plan.durationDays} days</p>
                      {has && <p className="text-[10px] font-semibold text-red-400 mt-0.5">Curriculum exists</p>}
                    </div>
                    {!has && <ChevronRight className="h-4 w-4 text-slate" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Upload/Paste */}
        {step === 2 && (
          <div className="p-5 space-y-4">
            <button onClick={() => { setStep(1); setSelectedProgram(null); }} className="text-xs text-blue-500 font-medium">← Back</button>

            <div className="rounded-xl bg-navy/[0.03] p-3 text-sm">
              <p className="text-slate">Importing for: <span className="font-semibold text-navy">{selectedProgram?.name} — {selectedPlan?.name}</span> ({selectedPlan?.durationDays} days)</p>
            </div>

            <div>
              <label className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate">Paste JSON or Upload File</span>
                <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <Upload className="h-3 w-3" /> Upload
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); setValidation(null); }}
                placeholder='{"templateName": "...", "phases": [...]}'
                className="w-full min-h-[160px] rounded-lg border border-navy/10 bg-white px-3 py-2 text-xs font-mono text-navy outline-none focus:border-blue-500 resize-y"
              />
            </div>

            {validation && !validation.valid && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {validation.errors.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-2 rounded-lg bg-red-500/5 px-3 py-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-red-600"><b>{err.path}</b> {err.message}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button onClick={onClose} variant="secondary" size="sm">Cancel</Button>
              <Button onClick={handleValidate} size="sm" disabled={!jsonInput.trim()}>
                Validate & Preview
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Confirm */}
        {step === 3 && validation && (
          <div className="p-5 space-y-4">
            <button onClick={() => setStep(2)} className="text-xs text-blue-500 font-medium">← Back to Edit</button>

            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4">
              <p className="text-sm font-semibold text-emerald-700">✓ Validation Passed</p>
              <p className="text-xs text-emerald-600 mt-1">The JSON is valid and ready to import as a DRAFT template.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-navy/[0.03] p-3 text-center">
                <p className="text-lg font-bold text-navy">{validation.stats.totalPhases}</p>
                <p className="text-[10px] uppercase text-slate">Phases</p>
              </div>
              <div className="rounded-lg bg-navy/[0.03] p-3 text-center">
                <p className="text-lg font-bold text-navy">{validation.stats.totalDays}</p>
                <p className="text-[10px] uppercase text-slate">Days</p>
              </div>
              <div className="rounded-lg bg-navy/[0.03] p-3 text-center">
                <p className="text-lg font-bold text-navy">{validation.stats.totalTasks}</p>
                <p className="text-[10px] uppercase text-slate">Tasks</p>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <div className="flex justify-end gap-3">
              <Button onClick={onClose} variant="secondary" size="sm">Cancel</Button>
              <Button onClick={handleImport} size="sm" disabled={importing}>
                {importing ? "Importing..." : "Import as Draft"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
