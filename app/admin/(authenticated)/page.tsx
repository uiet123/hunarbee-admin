"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FileText, IndianRupee, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState("all");
  const [stats, setStats] = useState({
    totalApplications: 0,
    activeInterns: 0,
    completedInternships: 0,
    totalRevenue: 0,
  });
  
  const [analyticsData, setAnalyticsData] = useState<{
    revenueData: any[];
    applicationsData: any[];
    programPopularity: any[];
    paymentStatus: any[];
    occupations: any[];
    planPopularity: any[];
    geographicData: any[];
    batchLoads: any[];
    completionRates: any[];
    smsStats: { smsType: string, status: string, count: number }[];
    failedSms: { id: string, phone: string, smsType: string, errorMessage: string, createdAt: string, fullName: string, email: string }[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [smsSearchQuery, setSmsSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsRes, analyticsRes] = await Promise.all([
          fetchApi(`/admin/stats?range=${dateRange}`),
          fetchApi(`/admin/analytics?range=${dateRange}`),
        ]);
        
        setStats(statsRes.data);
        setAnalyticsData(analyticsRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [dateRange]);

  const STATS = [
    { label: "Total Applications", value: stats.totalApplications.toString(), icon: FileText, color: "from-blue-500/20 to-blue-500/5", textColor: "text-blue-500" },
    { label: "Active Interns", value: stats.activeInterns.toString(), icon: Users, color: "from-honey/20 to-honey/5", textColor: "text-honey-deep" },
    { label: "Completed Internships", value: stats.completedInternships.toString(), icon: GraduationCap, color: "from-emerald-500/20 to-emerald-500/5", textColor: "text-emerald-500" },
    { label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "from-purple-500/20 to-purple-500/5", textColor: "text-purple-500" },
  ];

  const PIE_COLORS = ['#f5b800', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'];
  const STATUS_COLORS: Record<string, string> = { paid: '#10b981', created: '#f5b800', failed: '#ef4444', active: '#3b82f6', completed: '#10b981', cancelled: '#ef4444' };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Overview</h1>
          <p className="text-sm text-slate">Key metrics and analytics for your platform</p>
        </div>
        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          disabled={loading}
          className="cursor-pointer rounded-lg border border-navy/10 bg-white px-4 py-2 text-sm font-medium text-navy shadow-sm outline-none transition hover:border-navy/20 focus:border-honey-deep focus:ring-1 focus:ring-honey-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="all">All Time</option>
          <option value="90">Last 90 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="7">Last 7 Days</option>
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate">Loading analytics...</div>
      ) : (
        <>
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

      {analyticsData && (
        <div className="space-y-6">
          {/* TIER 1: Full Width Time-Series */}
          <div className="grid gap-6 grid-cols-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm flex flex-col"
            >
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Revenue Over Time</h2>
                <p className="text-xs text-slate mt-1">Total revenue generated per month</p>
              </div>
              <div className="h-64 w-full flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `₹${val > 0 ? val/1000 + 'k' : 0}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm flex flex-col"
            >
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Applications Volume</h2>
                <p className="text-xs text-slate mt-1">Number of applications per month</p>
              </div>
              <div className="h-64 w-full flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.applicationsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                      formatter={(value: number) => [value, 'Applications']}
                    />
                    <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* TIER 2: 3-Column Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm"
            >
              <div className="mb-4 text-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Program Popularity</h2>
              </div>
              {analyticsData.programPopularity.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analyticsData.programPopularity} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                          {analyticsData.programPopularity.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-2">
                    {analyticsData.programPopularity.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>{entry.name}</span>
                        <span className="font-bold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className="py-8 text-center text-xs text-slate">No data</div>}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm"
            >
              <div className="mb-4 text-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Plan Duration Popularity</h2>
              </div>
              {analyticsData.planPopularity.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analyticsData.planPopularity} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                          {analyticsData.planPopularity.map((e, i) => <Cell key={i} fill={PIE_COLORS[(i+2) % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-2">
                    {analyticsData.planPopularity.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[(index+2) % PIE_COLORS.length] }}></span>{entry.name}</span>
                        <span className="font-bold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className="py-8 text-center text-xs text-slate">No data</div>}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm"
            >
              <div className="mb-4 text-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Occupations</h2>
              </div>
              {analyticsData.occupations.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analyticsData.occupations} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                          {analyticsData.occupations.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-2">
                    {analyticsData.occupations.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 capitalize"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>{entry.name}</span>
                        <span className="font-bold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className="py-8 text-center text-xs text-slate">No data</div>}
            </motion.div>
          </div>

          {/* TIER 3: 3-Column Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm"
            >
              <div className="mb-4 text-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Payment Conversions</h2>
              </div>
              {analyticsData.paymentStatus.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analyticsData.paymentStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                          {analyticsData.paymentStatus.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.name.toLowerCase()] || '#94a3b8'} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-2">
                    {analyticsData.paymentStatus.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 capitalize"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name.toLowerCase()] || '#94a3b8' }}></span>{entry.name}</span>
                        <span className="font-bold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className="py-8 text-center text-xs text-slate">No data</div>}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm"
            >
              <div className="mb-4 text-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Completion Rates</h2>
              </div>
              {analyticsData.completionRates.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analyticsData.completionRates} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                          {analyticsData.completionRates.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.name.toLowerCase()] || '#94a3b8'} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-2">
                    {analyticsData.completionRates.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 capitalize"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name.toLowerCase()] || '#94a3b8' }}></span>{entry.name}</span>
                        <span className="font-bold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className="py-8 text-center text-xs text-slate">No data</div>}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm"
            >
              <div className="mb-4 text-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Top Locations</h2>
              </div>
              {analyticsData.geographicData.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analyticsData.geographicData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                          {analyticsData.geographicData.map((e, i) => <Cell key={i} fill={PIE_COLORS[(i+3) % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-2">
                    {analyticsData.geographicData.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 uppercase font-semibold text-slate"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[(index+3) % PIE_COLORS.length] }}></span>{entry.name}</span>
                        <span className="font-bold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className="py-8 text-center text-xs text-slate">No data</div>}
            </motion.div>
          </div>

          {/* TIER 4: Full Width Timeline */}
          <div className="grid gap-6 grid-cols-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm flex flex-col"
            >
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Upcoming Batch Loads</h2>
                <p className="text-xs text-slate mt-1">Number of enrolled students by start date</p>
              </div>
              <div className="h-48 w-full flex-grow">
                {analyticsData.batchLoads.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.batchLoads} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                        formatter={(value: number) => [value, 'Students']}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="py-12 text-center text-slate">No upcoming batches data.</div>}
              </div>
            </motion.div>
          </div>

          {/* TIER 5: SMS Tracking */}
          <div className="mt-12 pt-8 border-t border-navy/10">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-navy">SMS Dispatch Tracking</h2>
              <p className="text-sm text-slate">Monitor the deliverability of automated system messages.</p>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm flex flex-col items-center"
              >
                <div className="mb-4 text-center">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Enrollment SMS</h2>
                </div>
                {(analyticsData.smsStats || []).filter(s => s.smsType === 'enrollment').length > 0 ? (
                  <div className="flex w-full justify-between items-center px-8">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-emerald-500">{(analyticsData.smsStats || []).find(s => s.smsType === 'enrollment' && s.status === 'sent')?.count || 0}</p>
                      <p className="text-xs uppercase tracking-wider text-slate mt-1">Sent</p>
                    </div>
                    <div className="h-12 w-px bg-navy/10"></div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-500">{(analyticsData.smsStats || []).find(s => s.smsType === 'enrollment' && s.status === 'failed')?.count || 0}</p>
                      <p className="text-xs uppercase tracking-wider text-slate mt-1">Failed</p>
                    </div>
                  </div>
                ) : <div className="py-4 text-center text-xs text-slate">No data</div>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="rounded-2xl border border-navy/8 bg-surface-elevated/90 p-6 shadow-sm flex flex-col items-center"
              >
                <div className="mb-4 text-center">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Certificate SMS</h2>
                </div>
                {(analyticsData.smsStats || []).filter(s => s.smsType === 'certificate').length > 0 ? (
                  <div className="flex w-full justify-between items-center px-8">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-emerald-500">{(analyticsData.smsStats || []).find(s => s.smsType === 'certificate' && s.status === 'sent')?.count || 0}</p>
                      <p className="text-xs uppercase tracking-wider text-slate mt-1">Sent</p>
                    </div>
                    <div className="h-12 w-px bg-navy/10"></div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-500">{(analyticsData.smsStats || []).find(s => s.smsType === 'certificate' && s.status === 'failed')?.count || 0}</p>
                      <p className="text-xs uppercase tracking-wider text-slate mt-1">Failed</p>
                    </div>
                  </div>
                ) : <div className="py-4 text-center text-xs text-slate">No data</div>}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="rounded-2xl border border-navy/8 bg-surface-elevated/90 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-navy/10 flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-navy">Failed SMS Details</h3>
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={smsSearchQuery}
                  onChange={(e) => setSmsSearchQuery(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </div>
              <div className="overflow-y-auto overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-sm text-slate relative">
                  <thead className="bg-slate-50 text-xs uppercase text-slate border-b border-navy/10 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 font-medium">Student Name</th>
                      <th className="px-6 py-4 font-medium">Phone Number</th>
                      <th className="px-6 py-4 font-medium">SMS Type</th>
                      <th className="px-6 py-4 font-medium">Error Reason</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/5">
                    {(() => {
                      const filteredSms = (analyticsData.failedSms || []).filter(sms => 
                        sms.email.toLowerCase().includes(smsSearchQuery.toLowerCase())
                      );
                      
                      return filteredSms.length > 0 ? (
                        filteredSms.map((sms) => (
                          <tr key={sms.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-navy">{sms.fullName}</div>
                              <div className="text-xs text-slate">{sms.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-navy">{sms.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap capitalize">
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                                {sms.smsType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-red-500 font-medium">{sms.errorMessage || 'Unknown Error'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate">{new Date(sms.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate">
                            {smsSearchQuery ? "No matching SMS messages found." : "No failed SMS messages! Excellent."}
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
