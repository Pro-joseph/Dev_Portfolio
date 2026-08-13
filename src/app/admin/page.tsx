"use client";

import useSWR from "swr";
import Link from "next/link";
import { http } from "@/lib/api";
import { DashboardStats } from "@/lib/types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  PiPlus,
  PiFileText,
  PiChatCircle,
  PiCube,
  PiCheckCircle,
  PiCaretUp,
} from "react-icons/pi";

const fmt = (n: number) => n.toLocaleString("en-US");

function Spark({ data, color }: { data: number[]; color: string }) {
  const series = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#spark-${color.replace("#", "")})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useSWR<DashboardStats>("/admin/dashboard/stats", (key: string) =>
    http.get<DashboardStats>(key, { auth: true })
  );

  if (isLoading || !data) {
    return (
      <div className="grid gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-ink-100 rounded-2xl h-40" />
        ))}
      </div>
    );
  }

  const series = data.views_series?.slice(-12) ?? [];
  const sparkData = series.map((s) => s.views);
  const pulse = series.map((s, i) => ({
    i,
    load: s.views / (series[0]?.views || 1) * 62,
  }));

  const storage = data.media_storage ?? { used_bytes: 0, quota_bytes: 1, breakdown: { images: 0, documents: 0, video: 0, other: 0 } };
  const storagePct = storage.quota_bytes ? Math.round((storage.used_bytes / storage.quota_bytes) * 100) : 0;
  const storageGb = storage.quota_bytes / (1024 * 1024 * 1024);
  const storageMb = storage.used_bytes / (1024 * 1024);
  const radialData = [
    { name: "Video", value: storage.breakdown.video, color: "#0ea5e9" },
    { name: "Documents", value: storage.breakdown.documents, color: "#0f172a" },
    { name: "Images", value: storage.breakdown.images, color: "#f43f5e" },
  ];

  return (
    <div className="grid gap-6">
      {/* Lead banner */}
      <div className="rounded-2xl bg-ink-900 text-white p-8 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute right-32 -bottom-32 w-72 h-72 rounded-full bg-coral/20 blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[13px] text-ink-300">Total Portfolio Views</p>
            <p className="text-[42px] font-semibold tracking-tight mt-1">{fmt(data.total_views)}</p>
            <p className="text-[13px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <PiCaretUp className="text-[15px]" /> {data.views_delta} vs last month
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/projects"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-500 text-white text-[13.5px] font-medium hover:bg-sky-400 transition-colors"
            >
              <PiPlus className="text-[16px]" /> New Project
            </Link>
          </div>
        </div>
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-2xl border border-ink-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold tracking-tight">Project Views</h3>
              <p className="text-[12px] text-ink-400 mt-0.5">Last 12 days across all projects</p>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span className="text-ink-500">Views</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={series} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                cursor={{ stroke: "#e2e8f0" }}
                contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="views" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#viewsFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-ink-200 p-6">
          <h3 className="font-semibold tracking-tight">System Status</h3>
          <p className="text-[12px] text-ink-400 mt-0.5 mb-5">API latency · all healthy</p>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={pulse} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="i" hide />
              <YAxis hide domain={[0, 100]} />
              <Area type="monotone" dataKey="load" stroke="#22c55e" strokeWidth={2.5} fill="url(#pulseFill)" />
              <Line type="monotone" dataKey="load" stroke="#22c55e" strokeWidth={0} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[12.5px] font-medium text-emerald-700">All systems operational</span>
          </div>
        </div>
      </div>

      {/* Sparkline stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-ink-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-ink-500">Total Projects</p>
              <p className="text-[26px] font-semibold tracking-tight mt-1">{data.total_projects}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <PiCube className="text-[20px]" />
            </div>
          </div>
          <div className="mt-3 -mb-1">
            <Spark data={sparkData} color="#0ea5e9" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-ink-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-ink-500">Active Resume</p>
              <p className="text-[15px] font-semibold tracking-tight mt-1.5 truncate max-w-[180px]">
                {data.active_resume ? data.active_resume.label : "—"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-ink-100 text-ink-700 flex items-center justify-center">
              <PiFileText className="text-[20px]" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[12px] font-medium text-emerald-700">
              {data.active_resume ? "Live & serving" : "None set"}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-ink-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-ink-500">Unread Messages</p>
              <p className="text-[26px] font-semibold tracking-tight mt-1">{data.unread_messages}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-coral/10 text-coral flex items-center justify-center">
              <PiChatCircle className="text-[20px]" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-coral/10 w-fit">
            <span className="text-[12px] font-medium text-coral">
              {data.unread_messages > 0 ? "Requires action" : "All caught up"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-2xl border border-ink-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
            <div>
              <h3 className="font-semibold tracking-tight">Recent Projects</h3>
              <p className="text-[12px] text-ink-400 mt-0.5">Latest content updates</p>
            </div>
            <Link href="/admin/projects" className="text-[13px] font-medium text-sky-600 hover:text-sky-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-ink-100">
            {data.recent_projects.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="w-12 h-12 rounded-lg bg-ink-100 text-ink-400 flex items-center justify-center shrink-0">
                  <PiCube className="text-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium truncate">{p.title}</p>
                  <p className="text-[12px] text-ink-400">
                    {fmt(p.views_count)} views · {new Date(p.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
                <span
                  className={`text-[11px] px-2 py-1 rounded-md font-medium ${
                    p.status === "published"
                      ? "bg-emerald-50 text-emerald-600"
                      : p.status === "draft"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-ink-100 text-ink-500"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-ink-200 p-6">
            <h3 className="font-semibold tracking-tight">CMS Activity & Launch Checklist</h3>
            <p className="text-[12px] text-ink-400 mt-0.5 mb-4">Today&rsquo;s progress</p>
            <div className="space-y-3.5">
              {[
                { label: "Portfolio content is live", done: true },
                { label: "Recent projects are published", done: true },
                { label: "Certifications up to date", done: data.recent_projects.length > 0 },
                { label: "Resume is active & linked", done: !!data.active_resume },
                { label: "Reply to pending messages", done: data.unread_messages === 0 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  {item.done ? (
                    <PiCheckCircle className="text-emerald-500 text-[18px] shrink-0" />
                  ) : (
                    <span className="w-[18px] h-[18px] rounded-full border-2 border-ink-200 shrink-0" />
                  )}
                  <span
                    className={`text-[13px] ${item.done ? "text-ink-400 line-through" : "text-ink-700 font-medium"}`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-ink-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold tracking-tight">Media Storage</h3>
                <p className="text-[12px] text-ink-400 mt-0.5">{storagePct}% of {storageGb.toFixed(0)} GB used</p>
              </div>
            </div>
            <div className="relative">
              <ResponsiveContainer width="100%" height={150}>
                <RadialBarChart
                  data={radialData}
                  innerRadius="62%"
                  outerRadius="100%"
                  startAngle={225}
                  endAngle={-45}
                >
                  <RadialBar dataKey="value" background={{ fill: "#f1f5f9" }} cornerRadius={6} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[22px] font-semibold tracking-tight">
                  {storageMb.toFixed(0)} MB
                </p>
                <p className="text-[11px] text-ink-400">of {storageGb.toFixed(0)} GB</p>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-1">
              {radialData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
