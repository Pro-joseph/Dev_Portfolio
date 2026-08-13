"use client";

import useSWR from "swr";
import { http } from "@/lib/api";
import { User } from "@/lib/types";
import { PiMagnifyingGlass, PiCalendarBlank, PiExport, PiBell, PiCaretDown } from "react-icons/pi";

export default function Topbar() {
  const { data } = useSWR<User>("/auth/me", (key: string) =>
    http.get<{ data: User }>(key, { auth: true }).then((r) => r.data)
  );

  return (
    <header className="h-[72px] bg-white border-b border-ink-200 px-8 flex items-center justify-between shrink-0 z-10">
      <div className="relative w-[360px]">
        <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-[17px]" />
        <input
          type="text"
          placeholder="Search projects, media…"
          className="w-full pl-10 pr-16 py-2 bg-ink-50 border border-transparent focus:border-sky-200 focus:bg-white rounded-lg text-[13px] outline-none transition-all placeholder-ink-400"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-ink-200 bg-white">
          <kbd className="text-[10px] font-medium text-ink-400">⌘</kbd>
          <kbd className="text-[10px] font-medium text-ink-400">K</kbd>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-3 py-2 bg-ink-50 border border-ink-200 rounded-lg text-[13px] font-medium text-ink-600 hover:bg-ink-100 transition-colors">
          <PiCalendarBlank className="text-[15px]" /> Last 30 days
          <PiCaretDown className="text-[13px]" />
        </button>
        <button className="flex items-center gap-2 px-3.5 py-2 bg-ink-100 border border-ink-200 rounded-lg text-[13px] font-medium text-ink-700 hover:bg-ink-200 transition-colors">
          <PiExport className="text-[15px]" /> Export CSV
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-500 hover:bg-ink-50 transition-colors relative">
          <PiBell className="text-[19px]" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-coral rounded-full ring-2 ring-white" />
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
  );
}
