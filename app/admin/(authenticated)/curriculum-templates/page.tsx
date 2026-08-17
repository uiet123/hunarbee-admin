"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Download, FileJson, Copy, Layers, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import {
  getTemplates,
  getPrograms,
  getPlan,
  getPlansForProgram,
  getTemplateForPlan,
  archiveVersion,
  deleteTemplate,
  createNewVersionFromPublished,
  duplicateTemplate,
  exportVersion,
} from "@/lib/curriculum";
import { useAlertModal } from "@/components/admin/ui/AlertModalProvider";
import type { CurriculumTemplate, Program, InternshipPlan } from "@/lib/curriculum/types";
import { TemplateCard } from "@/components/admin/curriculum/TemplateCard";
import { CreateTemplateModal } from "@/components/admin/curriculum/CreateTemplateModal";
import { ImportModal } from "@/components/admin/curriculum/ImportModal";

export default function CurriculumTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CurriculumTemplate[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [plans, setPlans] = useState<Record<string, InternshipPlan>>({});
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Duplication target plan selection state
  const [duplicateTargetTemplateId, setDuplicateTargetTemplateId] = useState<string | null>(null);
  const [duplicatePrograms, setDuplicatePrograms] = useState<Program[]>([]);
  const [duplicatePlans, setDuplicatePlans] = useState<InternshipPlan[]>([]);
  const [selectedProgId, setSelectedProgId] = useState("");
  const [planHasTemplate, setPlanHasTemplate] = useState<Record<string, boolean>>({});
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [duplicating, setDuplicating] = useState(false);
  const [dupError, setDupError] = useState("");

  // Filters state
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const { showAlert, showConfirm } = useAlertModal();

  const loadData = async () => {
    setLoading(true);
    try {
      const allTemplates = await getTemplates();
      const allPrograms = await getPrograms();
      
      setTemplates(allTemplates);
      setPrograms(allPrograms);

      // Load all plan details for templates
      const planCache: Record<string, InternshipPlan> = {};
      for (const tmpl of allTemplates) {
        if (!planCache[tmpl.planId]) {
          try {
            const planDetails = await getPlan(tmpl.planId);
            planCache[tmpl.planId] = planDetails;
          } catch {
            // Plan not found or deleted
          }
        }
      }
      setPlans(planCache);
    } catch (err) {
      console.error("Failed to load curriculum templates data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle duplication program changes
  useEffect(() => {
    if (selectedProgId) {
      getPlansForProgram(selectedProgId).then(async (loadedPlans) => {
        setDuplicatePlans(loadedPlans);
        const checks: Record<string, boolean> = {};
        for (const p of loadedPlans) {
          const existing = await getTemplateForPlan(p.id);
          checks[p.id] = !!existing;
        }
        setPlanHasTemplate(checks);
        setSelectedPlanId("");
      });
    } else {
      setDuplicatePlans([]);
    }
  }, [selectedProgId]);

  const handleEdit = (templateId: string, versionId: string) => {
    router.push(`/admin/curriculum-templates/${templateId}?version=${versionId}`);
  };

  const handlePreview = (templateId: string) => {
    router.push(`/admin/curriculum-templates/${templateId}/preview`);
  };

  const handleExport = async (templateId: string) => {
    try {
      const tmpl = templates.find((t) => t.id === templateId);
      if (!tmpl) return;
      const sorted = [...tmpl.versions].sort((a, b) => b.version - a.version);
      const latestVersion = sorted[0];
      if (!latestVersion) return;

      const dataStr = await exportVersion(templateId, latestVersion.id);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${tmpl.templateName.replace(/\s+/g, "_")}_v${latestVersion.version}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      await showAlert("Failed to export template: " + (err as Error).message, "Export Failed", "error");
    }
  };

  const handleArchive = async (templateId: string, versionId: string) => {
    if (!(await showConfirm("Are you sure you want to archive this version? It will become permanently read-only."))) return;
    try {
      await archiveVersion(templateId, versionId);
      await loadData();
    } catch (err) {
      await showAlert((err as Error).message, "Error", "error");
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!(await showConfirm("Are you sure you want to delete this curriculum template? This will delete all versions permanently."))) return;
    try {
      await deleteTemplate(templateId);
      await loadData();
    } catch (err) {
      await showAlert((err as Error).message, "Error", "error");
    }
  };

  const handleCreateNewVersion = async (templateId: string) => {
    try {
      const tmpl = templates.find((t) => t.id === templateId);
      if (!tmpl) return;
      const published = tmpl.versions.find((v) => v.id === tmpl.currentPublishedVersionId);
      if (!published) return;

      const newVer = await createNewVersionFromPublished(templateId, published.id);
      router.push(`/admin/curriculum-templates/${templateId}?version=${newVer.id}`);
    } catch (err) {
      await showAlert((err as Error).message, "Error", "error");
    }
  };

  const handleDuplicateInitiate = async (templateId: string) => {
    setDuplicateTargetTemplateId(templateId);
    setSelectedProgId("");
    setSelectedPlanId("");
    setDuplicatePlans([]);
    setDupError("");
    const allProgs = await getPrograms();
    setDuplicatePrograms(allProgs);
  };

  const handleDuplicateConfirm = async () => {
    if (!duplicateTargetTemplateId || !selectedPlanId) return;
    setDuplicating(true);
    setDupError("");
    try {
      const copy = await duplicateTemplate(duplicateTargetTemplateId, selectedPlanId);
      setDuplicateTargetTemplateId(null);
      router.push(`/admin/curriculum-templates/${copy.id}`);
    } catch (err) {
      setDupError((err as Error).message);
    } finally {
      setDuplicating(false);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter((tmpl) => {
    // Search query
    if (searchQuery && !tmpl.templateName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Program filter
    if (selectedProgramFilter !== "ALL" && tmpl.programId !== selectedProgramFilter) {
      return false;
    }
    // Status filter
    if (selectedStatusFilter !== "ALL") {
      const latest = [...tmpl.versions].sort((a, b) => b.version - a.version)[0];
      if (latest?.status !== selectedStatusFilter) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-navy">Curriculum Templates</h2>
          <p className="text-sm text-slate mt-1">Manage, version, and import data-driven curricula for student plans.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setShowImportModal(true)} variant="secondary" className="border border-navy/10 bg-white">
            <FileJson className="mr-2 h-4 w-4" /> Import JSON
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="bg-navy text-white hover:bg-navy/90">
            <Plus className="mr-2 h-4 w-4" /> Create Template
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-navy/5 bg-navy/[0.02] p-4">
        <div className="w-full sm:w-auto flex flex-1 max-w-md items-center gap-2 rounded-xl border border-navy/10 bg-white px-3 py-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full bg-transparent text-sm text-navy outline-none placeholder:text-slate/60"
          />
        </div>
        <div className="w-full sm:w-auto flex flex-wrap gap-2 items-center">
          <select
            value={selectedProgramFilter}
            onChange={(e) => setSelectedProgramFilter(e.target.value)}
            className="rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs font-semibold text-navy outline-none"
          >
            <option value="ALL">All Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs font-semibold text-navy outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate">Loading templates...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/20 p-12 text-center">
          <p className="text-slate">No curriculum templates found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <TemplateCard
                template={template}
                program={programs.find((p) => p.id === template.programId)}
                plan={plans[template.planId]}
                onEdit={handleEdit}
                onPreview={handlePreview}
                onDuplicate={handleDuplicateInitiate}
                onExport={handleExport}
                onArchiveVersion={handleArchive}
                onDelete={handleDelete}
                onCreateNewVersion={handleCreateNewVersion}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateTemplateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(id) => {
          setShowCreateModal(false);
          router.push(`/admin/curriculum-templates/${id}`);
        }}
      />

      {/* Import Modal */}
      <ImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={(id) => {
          setShowImportModal(false);
          router.push(`/admin/curriculum-templates/${id}`);
        }}
      />

      {/* Duplicate Select Target Plan Modal */}
      {duplicateTargetTemplateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDuplicateTargetTemplateId(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-navy/10 bg-surface-elevated shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-navy/5 px-6 py-4">
              <div className="flex items-center gap-2 text-navy">
                <Copy className="h-5 w-5 text-honey-deep" />
                <h3 className="text-sm font-bold">Select Target Plan to Duplicate</h3>
              </div>
              <button onClick={() => setDuplicateTargetTemplateId(null)} className="rounded-lg p-1.5 text-slate hover:bg-navy/5">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Program Selector */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate">Program</label>
                <select
                  value={selectedProgId}
                  onChange={(e) => setSelectedProgId(e.target.value)}
                  className="w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none"
                >
                  <option value="">-- Select Program --</option>
                  {duplicatePrograms.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Plan Selector */}
              {selectedProgId && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate">Internship Plan</label>
                  <div className="space-y-1 max-h-48 overflow-y-auto portal-scrollbar">
                    {duplicatePlans.map((plan) => {
                      const has = planHasTemplate[plan.id];
                      return (
                        <button
                          key={plan.id}
                          onClick={() => has ? null : setSelectedPlanId(plan.id)}
                          disabled={has}
                          className={cn(
                            "w-full flex items-center justify-between rounded-lg p-2.5 text-left text-xs border transition",
                            has
                              ? "opacity-50 cursor-not-allowed bg-navy/[0.02] border-transparent"
                              : selectedPlanId === plan.id
                                ? "bg-honey/10 border-honey text-honey-deep font-semibold"
                                : "hover:bg-navy/[0.03] border-navy/5"
                          )}
                        >
                          <div>
                            <p className="font-semibold text-navy">{plan.name}</p>
                            <p className="text-[10px] text-slate">{plan.durationDays} days</p>
                            {has && <p className="text-[9px] font-semibold text-red-400 mt-0.5">Curriculum exists</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {dupError && <p className="text-xs text-red-500 font-semibold">{dupError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <Button onClick={() => setDuplicateTargetTemplateId(null)} variant="secondary" size="sm">Cancel</Button>
                <Button
                  onClick={handleDuplicateConfirm}
                  size="sm"
                  disabled={!selectedPlanId || duplicating}
                >
                  {duplicating ? "Duplicating..." : "Confirm Copy"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
