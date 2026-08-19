"use client";

import { useState, useEffect } from "react";
import { Search, IndianRupee, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";

export function PaymentsView() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1 });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetchApi(`/admin/payments?page=${page}&limit=50`);
        setData(res.data);
        if (res.pagination) setPagination(res.pagination);
      } catch (err) {
        console.error("Failed to load payments", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [page]);
  
  const payments = data.filter(pay => 
    pay.id.toLowerCase().includes(search.toLowerCase()) || 
    (pay.email && pay.email.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-center text-slate">Loading payments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-3 py-2 text-sm shadow-sm">
            <Search className="h-4 w-4 text-slate" />
            <input 
              type="text" 
              placeholder="Search Payment ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none bg-transparent w-48" 
            />
          </div>
          <Button variant="secondary" className="border-navy/10 text-navy bg-surface-elevated h-9 hidden sm:flex">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-navy/8 bg-surface-elevated/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="w-full text-left text-sm whitespace-nowrap relative">
            <thead className="bg-slate-50 border-b border-navy/5 text-slate sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-semibold">Payment ID</th>
                <th className="px-6 py-4 font-semibold">Application ID</th>
                <th className="px-6 py-4 font-semibold">Program</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Method</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate">No payments found.</td>
                </tr>
              ) : (
                payments.map((pay) => (
                  <tr key={pay.id} className="transition-colors hover:bg-navy/[0.02]">
                    <td className="px-6 py-4 font-medium text-navy/70">{pay.id}</td>
                    <td className="px-6 py-4 text-slate font-mono text-xs">{pay.email}</td>
                    <td className="px-6 py-4 text-slate">{pay.programName || 'Unknown Program'}</td>
                    <td className="px-6 py-4 font-bold text-navy flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5" /> {pay.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-md bg-navy/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-navy/60">
                        {pay.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate">{new Date(pay.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                        pay.status === 'paid' || pay.status === 'successful' ? "bg-emerald-500/10 text-emerald-600" : 
                        pay.status === 'pending' ? "bg-honey/15 text-honey-deep" :
                        "bg-red-500/10 text-red-500"
                      )}>
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-t border-navy/5 bg-slate-50">
          <p className="text-sm text-slate">
            Page <span className="font-medium text-navy">{page}</span> of <span className="font-medium text-navy">{Math.max(1, pagination.totalPages)}</span>
            {" "}({pagination.totalCount} total)
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-white border border-navy/10 text-navy disabled:opacity-50 disabled:cursor-not-allowed hover:bg-navy/5 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              disabled={page >= Math.max(1, pagination.totalPages)}
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-white border border-navy/10 text-navy disabled:opacity-50 disabled:cursor-not-allowed hover:bg-navy/5 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
