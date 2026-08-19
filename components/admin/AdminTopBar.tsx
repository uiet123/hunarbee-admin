"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

const ROUTE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/programs": "Internship Programs",
  "/admin/curriculum-templates": "Curriculum Templates",
  "/admin/task-library": "Task Library",
  "/admin/resource-library": "Resource Library",
  "/admin/directory": "Directory",
  "/admin/settings": "Settings",
};

export function AdminTopBar() {
  const pathname = usePathname();
  
  // Find a matching title even for nested routes
  let pageTitle = "Admin Portal";
  if (ROUTE_TITLES[pathname]) {
    pageTitle = ROUTE_TITLES[pathname];
  } else if (pathname.startsWith("/admin/programs/")) {
    pageTitle = "Program Details";
  } else if (pathname.startsWith("/admin/plans/")) {
    pageTitle = "Plan Details";
  } else if (pathname.startsWith("/admin/curriculum/")) {
    pageTitle = "Curriculum Builder";
  } else if (pathname.startsWith("/admin/curriculum-templates/")) {
    pageTitle = "Curriculum Builder";
  } else if (pathname.startsWith("/admin/students/")) {
    pageTitle = "Student Profile";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-navy/[0.06] bg-surface-elevated/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 py-4 sm:px-8">
        {/* Left — title */}
        <div className="ml-12 lg:ml-0">
          <p className="text-xs font-medium text-slate">
            Good day, <span className="text-navy font-semibold">Admin</span>
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-navy sm:text-2xl">
            {pageTitle}
          </h1>
        </div>

        {/* Right — search + notifications + avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-navy/8 bg-surface px-3 py-2 text-sm text-slate">
            <Search className="h-4 w-4 text-slate" />
            <input 
              type="text" 
              placeholder="Search students, apps..." 
              className="bg-transparent outline-none placeholder:text-slate/60 w-[200px]"
            />
          </div>

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-navy/8 bg-surface transition hover:border-honey/30 hover:shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px] text-slate" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-surface-elevated" />
          </button>

          <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-xs font-bold text-white shadow-sm">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
