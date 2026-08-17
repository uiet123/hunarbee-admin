import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { AlertModalProvider } from "@/components/admin/ui/AlertModalProvider";

export const metadata: Metadata = {
  title: "Admin Portal | Hunarbee",
  description: "Manage Hunarbee internship platform",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AlertModalProvider>
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <div className="lg:pl-[260px]">
          <AdminTopBar />
          <main className="min-h-[calc(100vh-73px)] px-5 py-6 sm:px-8 sm:py-8">
            {children}
          </main>
        </div>
      </div>
    </AlertModalProvider>
  );
}
