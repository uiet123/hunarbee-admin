"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, GraduationCap, ArrowRight, Settings2, Eye, EyeOff, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import { useAlertModal } from "@/components/admin/ui/AlertModalProvider";
import { CreateProgramModal } from "@/components/admin/programs/CreateProgramModal";

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface Program {
  id: string;
  name: string;
  description: string;
  status: "published" | "draft" | "archived";
  plans: Plan[];
}

export default function ProgramsList() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { showAlert, showConfirm } = useAlertModal();

  const loadPrograms = () => {
    setLoading(true);
    fetchApi<{ success: boolean; data: Program[] }>("/admin/programs")
      .then(res => {
        if (res?.success) setPrograms(res.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    
    // Optimistic update
    setPrograms(programs.map(p => 
      p.id === id ? { ...p, status: newStatus } : p
    ));

    await fetchApi(`/admin/programs/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const deleteProgram = async (id: string, name: string) => {
    if (!(await showConfirm(`Are you sure you want to permanently delete the program "${name}"? This action cannot be undone and will delete all associated plans and curriculum data.`))) return;
    
    try {
      await fetchApi(`/admin/programs/${id}`, { method: "DELETE" });
      setPrograms(programs.filter(p => p.id !== id));
      await showAlert("Program deleted successfully.", "Success", "success");
    } catch (error) {
      await showAlert("Failed to delete program: " + (error as Error).message, "Error", "error");
    }
  };

  const handleCreateProgram = async (data: { name: string; description: string; duration: string; mode: string; highlights: string[] }) => {
    try {
      await fetchApi("/admin/programs", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setShowCreateModal(false);
      await showAlert("Program created successfully.", "Success", "success");
      loadPrograms();
    } catch (error) {
      await showAlert("Failed to create program: " + (error as Error).message, "Error", "error");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate">Loading programs...</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-navy">Internship Programs</h2>
          <p className="text-sm text-slate mt-1">Manage and create internship tracks and their plans.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-navy text-white hover:bg-navy/90">
          <Plus className="mr-2 h-4 w-4" /> Create Program
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((program, idx) => (
          <motion.div
            key={program.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group flex flex-col justify-between rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm transition-all hover:border-honey/30 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-honey/20 to-honey/5 text-honey-deep">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                    program.status === "published" ? "bg-emerald-500/10 text-emerald-600" :
                    program.status === "archived" ? "bg-slate/10 text-slate" : "bg-honey/15 text-honey-deep"
                  )}>
                    {program.status}
                  </span>
                </div>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-navy">
                {program.name}
              </h3>
              <p className="mt-2 text-sm text-slate line-clamp-2">
                {program.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {program.plans.length > 0 ? (
                  program.plans.map(plan => (
                    <span key={plan.id} className="rounded-lg bg-navy/5 px-2 py-1 text-xs font-semibold text-navy/70">
                      {plan.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate italic">No plans created yet</span>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-navy/5 pt-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleStatus(program.id, program.status)}
                  className="rounded-lg p-2 text-slate transition hover:bg-navy/5 hover:text-navy"
                  title={program.status === "published" ? "Unpublish" : "Publish"}
                >
                  {program.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button 
                  onClick={() => deleteProgram(program.id, program.name)}
                  className="rounded-lg p-2 text-slate transition hover:bg-red-500/10 hover:text-red-500" 
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Link
                href={`/admin/programs/${program.id}`}
                className="flex items-center text-sm font-semibold text-honey hover:text-honey-deep"
              >
                Manage <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {showCreateModal && (
        <CreateProgramModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateProgram}
        />
      )}
    </div>
  );
}
