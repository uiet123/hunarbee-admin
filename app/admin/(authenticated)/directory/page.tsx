"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ApplicationsView } from "@/components/admin/directory/ApplicationsView";
import { StudentsView } from "@/components/admin/directory/StudentsView";
import { PaymentsView } from "@/components/admin/directory/PaymentsView";
import { cn } from "@/lib/utils";

type TabType = "applications" | "students" | "payments";

export default function DirectoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("applications");

  const tabs = [
    { id: "applications", label: "Applications", description: "Review and manage student applications and payment statuses." },
    { id: "students", label: "Enrolled Students", description: "Manage active and past students across all programs." },
    { id: "payments", label: "Payments History", description: "Track all internship fee transactions." }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-navy">Directory</h2>
        <p className="text-sm text-slate mt-1">{currentTab?.description}</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 w-full max-w-md">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "relative flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none",
              activeTab === tab.id
                ? "text-navy"
                : "text-slate hover:text-navy/70"
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab-directory"
                className="absolute inset-0 rounded-lg bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="mt-8">
        {activeTab === "applications" && <ApplicationsView />}
        {activeTab === "students" && <StudentsView />}
        {activeTab === "payments" && <PaymentsView />}
      </div>
    </div>
  );
}
