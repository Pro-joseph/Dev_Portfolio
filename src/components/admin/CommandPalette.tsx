"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { http } from "@/lib/api";
import { Paginated } from "@/lib/types";
import {
  PiMagnifyingGlass,
  PiSpinnerGap,
  PiCube,
  PiFileText,
  PiImageSquare,
  PiEnvelope,
  PiX,
} from "react-icons/pi";

interface Result {
  group: "Projects" | "Pages" | "Media" | "Messages";
  label: string;
  sub?: string;
  href: string;
}

const GROUP_ICON: Record<Result["group"], React.ReactNode> = {
  Projects: <PiCube size={16} />,
  Pages: <PiFileText size={16} />,
  Media: <PiImageSquare size={16} />,
  Messages: <PiEnvelope size={16} />,
};

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    window.setTimeout(() => inputRef.current?.focus(), 10);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebounced(query);
      setActive(0);
    }, 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useSWR(
    debounced.trim() ? ["palette", debounced] : null,
    async () => {
      const q = encodeURIComponent(debounced.trim());
      const [projects, pages, media, messages] = await Promise.all([
        http.get<Paginated<Record<string, unknown>>>(`/admin/projects?search=${q}&per_page=5`, { auth: true }),
        http.get<Paginated<Record<string, unknown>>>(`/admin/pages?search=${q}&per_page=5`, { auth: true }),
        http.get<Paginated<Record<string, unknown>>>(`/admin/media?search=${q}&per_page=5`, { auth: true }),
        http.get<Paginated<Record<string, unknown>>>(`/admin/contact-messages?search=${q}&per_page=5`, { auth: true }),
      ]);
      const results: Result[] = [];
      for (const p of projects.data) {
        results.push({
          group: "Projects",
          label: String(p.title),
          sub: p.slug ? String(p.slug) : undefined,
          href: `/admin/projects?edit=${p.id}`,
        });
      }
      for (const p of pages.data) {
        results.push({
          group: "Pages",
          label: String(p.title),
          sub: p.slug ? String(p.slug) : undefined,
          href: `/admin/pages?edit=${p.id}`,
        });
      }
      for (const m of media.data) {
        results.push({
          group: "Media",
          label: String(m.filename),
          href: "/admin/media",
        });
      }
      for (const m of messages.data) {
        results.push({
          group: "Messages",
          label: String(m.subject ?? m.name),
          sub: m.email ? String(m.email) : undefined,
          href: "/admin/messages",
        });
      }
      return results;
    }
  );

  const results = data ?? [];
  const safeActive = results.length ? Math.min(active, results.length - 1) : 0;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (results.length ? (a + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter" && results[safeActive]) {
      e.preventDefault();
      go(results[safeActive].href);
    }
  };

  let lastGroup: string | null = null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink-900/40 backdrop-blur-sm px-6 pt-[12vh]">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-100">
          <PiMagnifyingGlass className="text-ink-400 text-[18px]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search projects, pages, media, messages…"
            className="flex-1 text-[14px] outline-none placeholder-ink-400"
          />
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition-colors">
            <PiX size={20} />
          </button>
        </div>

        <div className="max-h-[46vh] overflow-y-auto py-2">
          {!debounced.trim() ? (
            <p className="px-5 py-8 text-center text-[13px] text-ink-400">
              Type to search across projects, pages, media and messages.
            </p>
          ) : isLoading ? (
            <p className="px-5 py-8 text-center text-ink-400">
              <PiSpinnerGap className="animate-spin inline-block mr-2" size={16} />
              Searching…
            </p>
          ) : results.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-ink-400">
              No results for &ldquo;{debounced}&rdquo;
            </p>
          ) : (
            results.map((r, i) => {
              const showHeader = r.group !== lastGroup;
              lastGroup = r.group;
              return (
                <div key={`${r.group}-${r.label}-${i}`}>
                  {showHeader && (
                    <p className="px-5 pt-3 pb-1 text-[11px] uppercase tracking-wider text-ink-400 font-medium">
                      {r.group}
                    </p>
                  )}
                  <button
                    onClick={() => go(r.href)}
                    onMouseEnter={() => setActive(i)}
                    className={`w-full text-left flex items-center gap-3 px-5 py-2.5 transition-colors ${
                      safeActive === i ? "bg-sky-50 text-ink-900" : "text-ink-600"
                    }`}
                  >
                    <span className="text-ink-400 shrink-0">{GROUP_ICON[r.group]}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13.5px] font-medium truncate">{r.label}</span>
                      {r.sub && <span className="block text-[12px] text-ink-400 truncate">{r.sub}</span>}
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-2.5 border-t border-ink-100 text-[11px] text-ink-400 flex items-center gap-4">
          <span><kbd className="px-1 py-0.5 rounded border border-ink-200">↑</kbd> <kbd className="px-1 py-0.5 rounded border border-ink-200">↓</kbd> navigate</span>
          <span><kbd className="px-1 py-0.5 rounded border border-ink-200">↵</kbd> open</span>
          <span><kbd className="px-1 py-0.5 rounded border border-ink-200">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}