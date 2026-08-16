"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTemplate, getProgram, getPlan } from "@/lib/curriculum";
import type { CurriculumTemplate, CurriculumTemplateVersion } from "@/lib/curriculum/types";
import { TemplatePreview } from "@/components/admin/curriculum/TemplatePreview";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}

export default function CurriculumPreviewPage({ params, searchParams }: PreviewPageProps) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);

  const templateId = resolvedParams.id;
  const urlVersionId = resolvedSearchParams.version;

  const [template, setTemplate] = useState<CurriculumTemplate | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [programName, setProgramName] = useState("");
  const [planName, setPlanName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        // Set initial selected version
        const targetVerId = urlVersionId || tmpl.currentPublishedVersionId || tmpl.versions[0]?.id || "";
        setSelectedVersionId(targetVerId);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [templateId, urlVersionId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate">Loading preview...</div>;
  }

  if (error || !template) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500 font-semibold">{error || "Template not found."}</p>
        <Link href="/admin/curriculum-templates" className="inline-flex items-center gap-1 text-sm font-semibold text-honey hover:text-honey-deep">
          <ArrowLeft className="h-4 w-4" /> Back to templates
        </Link>
      </div>
    );
  }

  const currentVersion = template.versions.find((v) => v.id === selectedVersionId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back button & version picker & print action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy/5 pb-4 print:hidden">
        <div>
          <Link
            href={`/admin/curriculum-templates/${template.id}?version=${selectedVersionId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate hover:text-navy transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Builder
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase text-slate">Preview version:</label>
          <select
            value={selectedVersionId}
            onChange={(e) => setSelectedVersionId(e.target.value)}
            className="rounded-xl border border-navy/10 bg-white px-3 py-1.5 text-xs font-semibold text-navy outline-none"
          >
            {template.versions
              .slice()
              .sort((a, b) => b.version - a.version)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version} ({v.status})
                </option>
              ))}
          </select>
          <Button onClick={handlePrint} variant="secondary" size="sm">
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {currentVersion ? (
        <TemplatePreview
          template={template}
          version={currentVersion}
          programName={programName}
          planName={planName}
        />
      ) : (
        <div className="p-12 text-center text-slate">No version selected or available.</div>
      )}
    </div>
  );
}
