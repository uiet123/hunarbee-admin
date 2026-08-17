"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, CalendarDays, Users, IndianRupee, ArrowRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import { useAlertModal } from "@/components/admin/ui/AlertModalProvider";
import { AddPlanModal } from "@/components/admin/programs/AddPlanModal";

interface Plan {
  id: string;
  name: string;
  price: number;
  total_days: number;
  duration_months: number;
  status: string;
}

interface Program {
  id: string;
  name: string;
  description: string;
  status: string;
  plans: Plan[];
}

export default function ProgramDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const { showAlert } = useAlertModal();

  const loadProgram = () => {
    setLoading(true);
    fetchApi<{ success: boolean; data: Program[] }>("/admin/programs")
      .then(res => {
        if (res?.success) {
          const found = res.data.find(p => p.id === resolvedParams.id);
          if (found) setProgram(found);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProgram();
  }, [resolvedParams.id]);


  if (loading) return <div className="p-8 text-center text-slate">Loading program details...</div>;
  if (!program) return <div className="p-8 text-center text-red-500">Program not found</div>;

  const handleAddPlan = async (data: { name: string; price: number; duration_months: number; total_days: number }) => {
    try {
      await fetchApi(`/admin/programs/${program.id}/plans`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      setShowAddPlan(false);
      await showAlert("Plan created successfully.", "Success", "success");
      loadProgram();
    } catch (error) {
      await showAlert("Failed to create plan: " + (error as Error).message, "Error", "error");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/programs" className="flex h-10 w-10 items-center justify-center rounded-xl border border-navy/10 bg-surface text-navy hover:bg-navy/5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-navy">{program.name}</h2>
          <p className="text-sm text-slate">Manage plans and curriculum for this program.</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 border-b border-navy/10 pb-4">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-navy">Available Plans</h3>
        <Button onClick={() => setShowAddPlan(true)} className="bg-navy text-white hover:bg-navy/90 h-9">
          <Plus className="mr-2 h-4 w-4" /> Add Plan
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {program.plans.length === 0 && (
          <div className="col-span-2 rounded-2xl border border-dashed border-navy/20 bg-surface-elevated/50 p-8 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-slate/40 mb-3" />
            <h4 className="text-sm font-semibold text-navy">No Plans Yet</h4>
            <p className="text-xs text-slate mt-1 max-w-sm mx-auto">Create a duration plan (like 1 Month or 3 Months) to start adding curriculum.</p>
          </div>
        )}
        {program.plans.map((plan, idx) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group flex flex-col justify-between rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm transition-all hover:border-honey/30 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <span className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                  plan.status === "published" ? "bg-emerald-500/10 text-emerald-600" : "bg-honey/15 text-honey-deep"
                )}>
                  {plan.status}
                </span>
                <span className="text-lg font-bold text-navy">₹{plan.price}</span>
              </div>
              <h4 className="font-[family-name:var(--font-display)] text-xl font-bold text-navy">
                {plan.duration_months} Month{plan.duration_months > 1 ? 's' : ''}
              </h4>
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-navy/5 px-3 py-2">
                  <CalendarDays className="h-4 w-4 text-slate" />
                  <span className="text-xs font-semibold text-navy">{plan.total_days || 0} Days</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-navy/5 px-3 py-2">
                  <Users className="h-4 w-4 text-slate" />
                  <span className="text-xs font-semibold text-navy">0 Active</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-navy/5 pt-4">
              <Link
                href={`/admin/plans/${plan.id}`}
                className="flex items-center text-sm font-medium text-slate hover:text-navy"
              >
                <Settings className="mr-1.5 h-4 w-4" /> Settings
              </Link>
              <Link
                href={`/admin/curriculum/${plan.id}`}
                className="flex items-center rounded-xl bg-honey/10 px-4 py-2 text-sm font-semibold text-honey-deep hover:bg-honey/20 transition"
              >
                Curriculum <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {showAddPlan && (
        <AddPlanModal
          onClose={() => setShowAddPlan(false)}
          onSave={handleAddPlan}
        />
      )}
    </div>
  );
}
