"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { http, clearToken } from "@/lib/api";
import { DashboardStats } from "@/lib/types";
import { getSiteSettings } from "@/lib/site-settings";
import AvatarPicker from "@/components/admin/AvatarPicker";
import {
  PiSquaresFourFill,
  PiCube,
  PiImage,
  PiMedal,
  PiFileText,
  PiBrowser,
  PiList,
  PiEnvelopeSimple,
  PiCertificate,
  PiChatsCircle,
  PiShareNetwork,
  PiGearSix,
  PiIdentificationBadge,
  PiSignOut,
  PiInfinity,
} from "react-icons/pi";

const NAV = [
  { href: "/admin", label: "Overview", icon: PiSquaresFourFill, exact: true },
  { href: "/admin/projects", label: "Projects", icon: PiCube },
  { href: "/admin/media", label: "Media", icon: PiImage },
  { href: "/admin/skills", label: "Skills", icon: PiMedal },
  { href: "/admin/resumes", label: "Resumes", icon: PiFileText },
  { href: "/admin/pages", label: "Pages", icon: PiBrowser },
  { href: "/admin/menu-items", label: "Menu", icon: PiList },
  { href: "/admin/messages", label: "Messages", icon: PiEnvelopeSimple },
  { href: "/admin/certifications", label: "Certifications", icon: PiCertificate },
  { href: "/admin/testimonials", label: "Testimonials", icon: PiChatsCircle },
  { href: "/admin/social-links", label: "Social Links", icon: PiShareNetwork },
  { href: "/admin/profile", label: "Profile", icon: PiIdentificationBadge },
  { href: "/admin/site-settings", label: "Settings", icon: PiGearSix },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: stats } = useSWR<DashboardStats>(
    "/admin/dashboard/stats",
    (key: string) => http.get<DashboardStats>(key, { auth: true })
  );
  const { data: site, mutate: mutateSite } = useSWR<{ settings: Record<string, unknown> }>(
    "/site",
    (key: string) => http.get<{ settings: Record<string, unknown> }>(key)
  );
  const siteSettings = getSiteSettings({ settings: site?.settings ?? {} });
  const brand = siteSettings.site_title;
  const initials = siteSettings.author_name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const logout = async () => {
    try {
      await http.post("/auth/logout", undefined, { auth: true });
    } catch {
      /* ignore */
    }
    clearToken();
    router.push("/admin/login");
  };

  return (
    <aside className="w-[260px] bg-white border-r border-ink-200 flex flex-col shrink-0 z-20">
      <div className="h-[72px] px-6 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-ink-900 flex items-center justify-center text-white">
          <PiInfinity className="text-xl" />
        </div>
        <span className="font-semibold text-[15px] tracking-tight">{brand}</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg relative transition-colors ${
                active
                  ? "bg-sky-50 text-ink-900 font-medium"
                  : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-500 rounded-r-md" />
              )}
              <item.icon className={`text-[18px] ${active ? "text-sky-600" : ""}`} />
              <span className="text-[13.5px]">{item.label}</span>
              {item.label === "Messages" && (stats?.unread_messages ?? 0) > 0 && (
                <span className="ml-auto bg-coral text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {stats?.unread_messages ?? 0}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-ink-200 shrink-0 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-ink-500 hover:bg-ink-50 hover:text-ink-900 transition-colors"
        >
          <PiBrowser className="text-[18px]" />
          <span className="text-[13.5px]">View site</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-ink-500 hover:bg-coral/10 hover:text-coral transition-colors"
        >
          <PiSignOut className="text-[18px]" />
          <span className="text-[13.5px]">Log out</span>
        </button>
        <div className="flex items-center gap-3 px-2 py-2 mt-1 rounded-lg">
          <AvatarPicker
            avatarUrl={siteSettings.author_avatar}
            initials={initials}
            onChanged={() => mutateSite()}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate">{siteSettings.author_name}</p>
            <p className="text-[11px] text-ink-400 truncate">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
