"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Users, IndianRupee, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_months: number;
  total_days: number;
  status: string;
  program_id: string;
  curriculum?: any[]; // Keep any for now as we haven't typed curriculum fully
}

interface Program {
  id: string;
  plans: Plan[];
}

export default function PlanDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchApi<{ success: boolean; data: Program[] }>("/admin/programs")
      .then(res => {
        if (res?.success) {
          for (const prog of res.data) {
            const found = prog.plans.find(p => p.id === resolvedParams.id);
            if (found) {
              setPlan({ ...found, program_id: prog.id });
              break;
            }
          }
        }
      })
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) return <div className="p-8 text-center text-slate">Loading plan details...</div>;
  if (!plan) return <div className="p-8 text-center text-red-500">Plan not found</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/programs/${plan.program_id}`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-navy/10 bg-surface text-navy hover:bg-navy/5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-navy">{plan.name} Plan Configuration</h2>
          <p className="text-sm text-slate">Manage pricing, settings, and students for this plan.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-navy">Plan Details</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-navy/5 pb-3">
              <span className="text-sm text-slate">Price</span>
              <span className="font-semibold text-navy flex items-center"><IndianRupee className="h-3.5 w-3.5 mr-0.5" /> {plan.price}</span>
            </div>
            <div className="flex items-center justify-between border-b border-navy/5 pb-3">
              <span className="text-sm text-slate">Duration</span>
              <span className="font-semibold text-navy">{plan.duration_months} Months</span>
            </div>
            <div className="flex items-center justify-between border-b border-navy/5 pb-3">
              <span className="text-sm text-slate">Total Days</span>
              <span className="font-semibold text-navy">{plan.total_days} Days</span>
            </div>
            <div className="flex items-center justify-between border-b border-navy/5 pb-3">
              <span className="text-sm text-slate">Active Students</span>
              <span className="font-semibold text-navy">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate">Status</span>
              <span className="font-semibold text-emerald-600 capitalize">{plan.status}</span>
            </div>
          </div>
          <div className="mt-6">
            <Button className="w-full bg-navy text-white hover:bg-navy/90">
              Edit Details
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-navy/8 bg-navy p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-honey/20 text-honey">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">Curriculum Builder</h3>
            <p className="mt-2 text-sm text-white/60">
              Design the day-by-day learning path for students enrolled in this plan. Add tasks, assignments, and resources.
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm font-medium text-white/80">
              <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-honey" /> {plan.curriculum?.length || 0} Days Created</div>
            </div>
          </div>
          <Link href={`/admin/curriculum/${plan.id}`}>
            <Button className="mt-6 w-full bg-honey text-navy hover:bg-honey-deep font-bold">
              Manage Curriculum <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
