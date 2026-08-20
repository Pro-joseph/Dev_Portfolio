"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { http } from "@/lib/api";
import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";
import { DashboardRangeProvider } from "@/components/admin/admin-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith("/admin/login");
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoginPage) return;
    let cancelled = false;
    http
      .get("/auth/me")
      .then(() => {
        if (!cancelled) setAuthed(true);
      })
      .catch(() => {
        if (!cancelled) setAuthed(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoginPage]);

  useEffect(() => {
    if (isLoginPage) return;
    if (authed === false) {
      router.replace("/admin/login");
    }
  }, [authed, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (authed === null || authed === false) {
    return (
      <div className="h-screen w-full bg-[#f8fafc] flex items-center justify-center">
        <div className="w-9 h-9 rounded-lg bg-ink-900 text-white flex items-center justify-center animate-pulse">
          <span className="text-sm font-semibold">JL</span>
        </div>
      </div>
    );
  }

  return (
    <DashboardRangeProvider>
      <div className="h-screen w-full overflow-hidden flex bg-[#f8fafc] text-ink-900 font-sans antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1400px] mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </DashboardRangeProvider>
  );
}
