"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { useState } from "react";
import { BrandWordmark } from "@/components/shared/brand-wordmark";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@hunarbee.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      
      if (res.data.user.role !== "admin") {
        throw new Error("You do not have admin access.");
      }
      
      localStorage.setItem("admin_token", res.data.token);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-navy text-white">
      {/* Background patterns */}
      <div className="pointer-events-none absolute inset-0 honeycomb-bg opacity-15" />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(245,184,0,0.1), transparent)",
        }}
      />

      <div className="relative flex w-full flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo header */}
          <div className="mb-8 flex flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-xl shadow-red-500/20 ring-1 ring-white/10">
              <ShieldAlert className="h-8 w-8 text-white" />
            </div>
            <BrandWordmark onDark className="mb-2 text-2xl" />
            <p className="text-sm text-white/50">Admin Control Panel</p>
          </div>

          {/* Login Card */}
          <div className="rounded-[24px] border border-white/10 bg-surface-elevated/40 p-6 backdrop-blur-xl sm:p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-red-500/50 focus:bg-white/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-red-500/50 focus:bg-white/10"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-red-500 text-white hover:bg-red-600 font-bold"
              >
                {loading ? "Signing in..." : "Sign in to Admin"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
