"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { http } from "@/lib/api";
import { User, DashboardStats } from "@/lib/types";
import { useDashboardRange, DashboardRange } from "@/components/admin/admin-context";
import CommandPalette from "@/components/admin/CommandPalette";
import {
  PiMagnifyingGlass,
  PiCalendarBlank,
  PiExport,
  PiBell,
  PiCaretDown,
} from "react-icons/pi";

const RANGES: { value: DashboardRange; label: string }[] = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

export default function Topbar() {
  const router = useRouter();
  const { range, setRange } = useDashboardRange();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data } = useSWR<User>("/auth/me", (key: string) =>
    http.get<{ data: User }>(key, { auth: true }).then((r) => r.data)
  );

  const { data: stats } = useSWR<DashboardStats>(
    "/admin/dashboard/stats",
    (key: string) => http.get<DashboardStats>(key, { auth: true })
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const unread = stats?.unread_messages ?? 0;

  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const blob = await http.download(`/admin/dashboard/export?days=${range}`, {
        auth: true,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard-stats-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      /* download failed */
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <header className="h-[72px] bg-white border-b border-ink-200 px-8 flex items-center justify-between shrink-0 z-10">
        <div className="relative w-[360px]">
          <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-[17px]" />
          <input
            type="text"
            readOnly
            onClick={() => setPaletteOpen(true)}
            placeholder="Search projects, media…"
            className="w-full pl-10 pr-16 py-2 bg-ink-50 border border-transparent focus:border-sky-200 focus:bg-white rounded-lg text-[13px] outline-none transition-all placeholder-ink-400 cursor-pointer"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-ink-200 bg-white">
            <kbd className="text-[10px] font-medium text-ink-400">⌘</kbd>
            <kbd className="text-[10px] font-medium text-ink-400">K</kbd>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setRangeOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 bg-ink-50 border border-ink-200 rounded-lg text-[13px] font-medium text-ink-600 hover:bg-ink-100 transition-colors"
            >
              <PiCalendarBlank className="text-[15px]" />
              {RANGES.find((r) => r.value === range)?.label ?? "Last 30 days"}
              <PiCaretDown className="text-[13px]" />
            </button>
            {rangeOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setRangeOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white rounded-xl border border-ink-200 shadow-lg py-1">
                  {RANGES.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => {
                        setRange(r.value);
                        setRangeOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[13px] transition-colors ${
                        range === r.value
                          ? "bg-sky-50 text-sky-700 font-medium"
                          : "text-ink-600 hover:bg-ink-50"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={exportCsv}
            disabled={exporting}
            className="flex items-center gap-2 px-3.5 py-2 bg-ink-100 border border-ink-200 rounded-lg text-[13px] font-medium text-ink-700 hover:bg-ink-200 transition-colors disabled:opacity-50"
          >
            <PiExport className="text-[15px]" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>

          <button
            onClick={() => router.push("/admin/messages")}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-ink-500 hover:bg-ink-50 transition-colors"
          >
            <PiBell className="text-[19px]" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-coral text-white text-[9.5px] font-semibold rounded-full flex items-center justify-center ring-2 ring-white">
                {unread}
              </span>
            )}
          </button>

          <div className="w-9 h-9 rounded-full bg-ink-900 text-white flex items-center justify-center font-semibold text-sm">
            {(data?.name ?? "YJ")
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        </div>
      </header>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </>
  );
}