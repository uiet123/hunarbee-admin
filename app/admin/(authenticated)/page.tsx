"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FileText, IndianRupee, GraduationCap, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { fetchApi } from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalApplications: 0,
    activeInterns: 0,
    completedInternships: 0,
    totalRevenue: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, appsRes, paymentsRes] = await Promise.all([
          fetchApi("/admin/stats"),
          fetchApi("/admin/applications"),
          fetchApi("/admin/payments"),
        ]);
        
        setStats(statsRes.data);
        const successfulApps = appsRes.data.filter((app: any) => app.paymentStatus !== 'failed');
        setRecentApplications(successfulApps.slice(0, 5));
        setRecentPayments(paymentsRes.data.slice(0, 5));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const STATS = [
    { label: "Total Applications", value: stats.totalApplications.toString(), icon: FileText, color: "from-blue-500/20 to-blue-500/5", textColor: "text-blue-500" },
    { label: "Active Interns", value: stats.activeInterns.toString(), icon: Users, color: "from-honey/20 to-honey/5", textColor: "text-honey-deep" },
    { label: "Completed Internships", value: stats.completedInternships.toString(), icon: GraduationCap, color: "from-emerald-500/20 to-emerald-500/5", textColor: "text-emerald-500" },
    { label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "from-purple-500/20 to-purple-500/5", textColor: "text-purple-500" },
  ];

  if (loading) return <div className="p-8 text-center text-slate">Loading dashboard...</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {STATS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-5 shadow-sm transition hover:border-navy/15 hover:shadow-md">
              <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br", stat.color)}>
                <Icon className={cn("h-5 w-5", stat.textColor)} />
              </div>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-navy">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-slate mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Recent Applications</h2>
            <Link href="/admin/applications" className="text-xs font-semibold text-red-500 hover:text-red-600">
              View All &rarr;
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-navy/5 text-slate">
                <tr>
                  <th className="pb-3 font-semibold">Student</th>
                  <th className="pb-3 font-semibold">Program</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {recentApplications.map((app) => (
                  <tr key={app.id} className="transition-colors hover:bg-navy/[0.02]">
                    <td className="py-3">
                      <p className="font-medium text-navy">{app.studentName}</p>
                      <p className="text-xs text-slate">{app.email}</p>
                    </td>
                    <td className="py-3 text-slate">{app.programName || 'Unknown Program'}</td>
                    <td className="py-3 font-medium text-navy">₹{app.amount.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        app.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-600" : "bg-honey/15 text-honey-deep"
                      )}>
                        {app.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Recent Payments</h2>
            <Link href="/admin/payments" className="text-xs font-semibold text-red-500 hover:text-red-600">
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between border-b border-navy/5 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">₹{payment.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate">{new Date(payment.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-full bg-navy/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-navy/60">
                    {payment.method}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
