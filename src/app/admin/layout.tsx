"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken, subscribeToken } from "@/lib/api";
import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";

const subscribeNoop = () => () => {};
const getClientHydrated = () => true;
const getServerHydrated = () => false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    getClientHydrated,
    getServerHydrated
  );
  const token = useSyncExternalStore(subscribeToken, getToken, () => null);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/admin/login");
    }
  }, [hydrated, token, router]);

  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  if (!hydrated || !token) {
    return (
      <div className="h-screen w-full bg-[#f8fafc] flex items-center justify-center">
        <div className="w-9 h-9 rounded-lg bg-ink-900 text-white flex items-center justify-center animate-pulse">
          <span className="text-sm font-semibold">JL</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden flex bg-[#f8fafc] text-ink-900 font-sans antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
