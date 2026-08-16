"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, MoreVertical, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api";

export default function ApplicationsList() {
  const [filter, setFilter] = useState("all");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchApi("/admin/applications");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load applications", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  
  const applications = data.filter(app => {
    if (filter === "all") return true;
    if (filter === "pending") return app.paymentStatus === "pending";
    if (filter === "paid") return app.paymentStatus === "paid";
    if (filter === "enrolled") return app.status === "enrolled";
    if (filter === "cancelled") return app.status === "cancelled";
    return true;
  });

  if (loading) return <div className="p-8 text-center text-slate">Loading applications...</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-navy">Internship Applications</h2>
          <p className="text-sm text-slate mt-1">Review and manage student applications and payment statuses.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-3 py-2 text-sm shadow-sm">
            <Search className="h-4 w-4 text-slate" />
            <input type="text" placeholder="Search name or ID..." className="outline-none bg-transparent w-40" />
          </div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-navy/10 bg-white px-3 py-2 text-sm outline-none shadow-sm cursor-pointer hover:border-navy/20"
          >
            <option value="all">All Applications</option>
            <option value="pending">Payment Pending</option>
            <option value="paid">Payment Successful</option>
            <option value="enrolled">Enrolled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-navy/8 bg-surface-elevated/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-navy/[0.02] border-b border-navy/5 text-slate">
              <tr>
                <th className="px-6 py-4 font-semibold">Application ID</th>
                <th className="px-6 py-4 font-semibold">Student</th>
                <th className="px-6 py-4 font-semibold">Program</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Payment Status</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate">No applications found matching the filter.</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="transition-colors hover:bg-navy/[0.02]">
                    <td className="px-6 py-4 font-medium text-navy/70">{app.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy">{app.studentName}</p>
                      <p className="text-xs text-slate">{app.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate">{app.programName || 'Unknown Program'}</td>
                    <td className="px-6 py-4 font-medium text-navy">{app.currency} {app.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                        app.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-600" : 
                        app.paymentStatus === 'failed' ? "bg-red-500/10 text-red-500" :
                        "bg-honey/15 text-honey-deep"
                      )}>
                        {app.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                        app.status === 'enrolled' ? "bg-blue-500/10 text-blue-600" : 
                        app.status === 'cancelled' ? "bg-slate/10 text-slate" :
                        "bg-honey/15 text-honey-deep"
                      )}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate hover:text-navy hover:bg-navy/5 rounded-lg transition" title="View Details">
                        <Eye className="h-4 w-4" />
                      </button>
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
