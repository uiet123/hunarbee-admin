"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, UserCircle, CalendarDays, CheckCircle2, IndianRupee, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  date: string;
  method: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  duration_id: string;
  programName?: string;
  planName?: string;
  progressPercent: number;
  payments: Payment[];
}

export default function StudentDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<{ success: boolean; data: Student }>(`/admin/students/${resolvedParams.id}`)
      .then(res => {
        if (res?.success) setStudent(res.data);
      })
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) return <div className="p-8 text-center text-slate">Loading student details...</div>;
  if (!student) return <div className="p-8 text-center text-red-500">Student not found</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/students" className="flex h-10 w-10 items-center justify-center rounded-xl border border-navy/10 bg-surface text-navy hover:bg-navy/5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-navy">{student.name}</h2>
          <p className="text-sm text-slate">Student Profile & Internship Details</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-honey to-honey-deep text-2xl font-bold text-navy shadow-lg mb-4">
              {student.name.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="font-bold text-navy text-lg">{student.name}</h3>
            <p className="text-sm text-slate">{student.id}</p>
            
            <div className="mt-4 pt-4 border-t border-navy/5 space-y-3 text-left">
              <div>
                <p className="text-xs font-semibold uppercase text-slate">Email</p>
                <p className="text-sm font-medium text-navy">{student.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate">Phone</p>
                <p className="text-sm font-medium text-navy">{student.phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate">Status</p>
                <span className={cn(
                  "mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                  student.status === 'active' ? "bg-blue-500/10 text-blue-600" : 
                  student.status === 'completed' ? "bg-emerald-500/10 text-emerald-600" :
                  "bg-red-500/10 text-red-500"
                )}>
                  {student.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-navy uppercase tracking-wider text-sm flex items-center"><BookOpen className="mr-2 h-4 w-4 text-honey" /> Internship Progress</h3>
            
            <div className="mb-6 bg-navy/5 rounded-xl p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-semibold text-navy">Overall Completion</span>
                <span className="font-bold text-honey-deep">{student.progressPercent}%</span>
              </div>
              <div className="h-3 w-full bg-navy/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-honey to-honey-deep" style={{ width: `${student.progressPercent}%` }} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white border border-navy/5 p-4 rounded-xl">
                <BookOpen className="h-8 w-8 text-slate/40" />
                <div>
                  <p className="text-xs font-semibold uppercase text-slate">Program</p>
                  <p className="text-sm font-bold text-navy">{student.programName || 'Unknown Program'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white border border-navy/5 p-4 rounded-xl">
                <CalendarDays className="h-8 w-8 text-slate/40" />
                <div>
                  <p className="text-xs font-semibold uppercase text-slate">Duration</p>
                  <p className="text-sm font-bold text-navy">{student.planName || 'Unknown Plan'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white border border-navy/5 p-4 rounded-xl sm:col-span-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
                <div>
                  <p className="text-xs font-semibold uppercase text-slate">Tasks Done</p>
                  <p className="text-sm font-bold text-navy">12 / 45</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-navy uppercase tracking-wider text-sm flex items-center"><IndianRupee className="mr-2 h-4 w-4 text-honey" /> Payment Information</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-navy/[0.02] border-b border-navy/5 text-slate">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Payment ID</th>
                    <th className="py-2 px-3 font-semibold">Amount</th>
                    <th className="py-2 px-3 font-semibold">Date</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {student.payments?.map(payment => (
                    <tr key={payment.id} className="border-b border-navy/5 last:border-0">
                      <td className="py-3 px-3 font-medium text-navy">{payment.id.split('-')[0]}</td>
                      <td className="py-3 px-3 font-semibold text-navy">₹{payment.amount}</td>
                      <td className="py-3 px-3 text-slate">{new Date(payment.date).toLocaleDateString()}</td>
                      <td className="py-3 px-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          payment.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-600" :
                          payment.paymentStatus === 'failed' ? "bg-red-500/10 text-red-600" :
                          "bg-honey/10 text-honey-deep"
                        )}>
                          {payment.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!student.payments?.length && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate text-sm">No payment history found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
