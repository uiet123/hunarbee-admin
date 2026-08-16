"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";

export default function StudentsList() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchApi("/admin/students");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load students", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  
  const students = data.filter(stu => 
    stu.name.toLowerCase().includes(search.toLowerCase()) || 
    stu.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-slate">Loading students...</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-navy">Students</h2>
          <p className="text-sm text-slate mt-1">Manage active and past students across all programs.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-3 py-2 text-sm shadow-sm">
            <Search className="h-4 w-4 text-slate" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none bg-transparent w-48" 
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-navy/8 bg-surface-elevated/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-navy/[0.02] border-b border-navy/5 text-slate">
              <tr>
                <th className="px-6 py-4 font-semibold">Student ID</th>
                <th className="px-6 py-4 font-semibold">Name & Contact</th>
                <th className="px-6 py-4 font-semibold">Program</th>
                <th className="px-6 py-4 font-semibold">Duration</th>
                <th className="px-6 py-4 font-semibold">Progress</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate">No students found.</td>
                </tr>
              ) : (
                students.map((stu) => (
                  <tr key={stu.id} className="transition-colors hover:bg-navy/[0.02]">
                    <td className="px-6 py-4 font-medium text-navy/70">{stu.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy">{stu.name}</p>
                      <p className="text-xs text-slate">{stu.email}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-navy">{stu.programName || 'Unknown Program'}</td>
                    <td className="px-6 py-4 text-slate">{stu.planName || 'Unknown Plan'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-navy/5 overflow-hidden">
                          <div className="h-full bg-honey" style={{ width: `0%` }} />
                        </div>
                        <span className="text-xs font-semibold text-navy">0%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                        stu.status === 'active' ? "bg-blue-500/10 text-blue-600" : 
                        stu.status === 'completed' ? "bg-emerald-500/10 text-emerald-600" :
                        "bg-red-500/10 text-red-500"
                      )}>
                        {stu.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/students/${stu.id}`}>
                        <Button variant="secondary" size="sm" className="h-8 border-navy/10 text-xs">
                          View <ExternalLink className="ml-1.5 h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
