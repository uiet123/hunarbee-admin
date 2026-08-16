"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTemplate, getProgram, getPlan } from "@/lib/curriculum";
import type { CurriculumTemplate } from "@/lib/curriculum/types";
import { CurriculumBuilder } from "@/components/admin/curriculum/CurriculumBuilder";

interface BuilderPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}

export default function CurriculumBuilderPage({ params, searchParams }: BuilderPageProps) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);

  const templateId = resolvedParams.id;
  const urlVersionId = resolvedSearchParams.version;

  const [template, setTemplate] = useState<CurriculumTemplate | null>(null);
  const [programName, setProgramName] = useState("");
  const [planName, setPlanName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError("");
    getTemplate(templateId)
      .then(async (tmpl) => {
        setTemplate(tmpl);

        // Fetch Program Name
        try {
          const prog = await getProgram(tmpl.programId);
          setProgramName(prog.name);
        } catch {
          setProgramName("Unknown Program");
        }

        // Fetch Plan Name
        try {
          const plan = await getPlan(tmpl.planId);
          setPlanName(plan.name);
        } catch {
          setPlanName("Unknown Plan");
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [templateId, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleNavigatePreview = (tmplId: string, verId: string) => {
    window.open(`/admin/curriculum-templates/${tmplId}/preview?version=${verId}`, "_blank");
  };

  if (loading) {
    return <div className="p-8 text-center text-slate">Loading curriculum builder...</div>;
  }

  if (error || !template) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500 font-semibold">{error || "Curriculum template not found."}</p>
        <Link
          href="/admin/curriculum-templates"
          className="inline-flex items-center gap-1 text-sm font-semibold text-honey hover:text-honey-deep"
        >
          <ArrowLeft className="h-4 w-4" /> Back to templates
        </Link>
      </div>
    );
  }

  // Determine initial version
  const targetVersionId = urlVersionId || template.currentPublishedVersionId || template.versions[0]?.id;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/admin/curriculum-templates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate hover:text-navy transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Templates
        </Link>
      </div>

      <CurriculumBuilder
        template={template}
        initialVersionId={targetVersionId}
        programName={programName}
        planName={planName}
        onTemplateChange={handleRefresh}
        onNavigatePreview={handleNavigatePreview}
      />
    </div>
  );
}
