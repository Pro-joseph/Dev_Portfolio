"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n";
import { FaGlobe } from "react-icons/fa";

export default function LangSwitch({ ariaLabel }: { ariaLabel: string }) {
  const pathname = usePathname() ?? "/";
  const current = LOCALES.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  const other = current === "fr" ? "en" : "fr";
  const rest = current ? pathname.slice(current.length + 1) : pathname;

  return (
    <Link
      href={other === "en" ? `/en${rest}` : `/fr${rest}`}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-secondary hover:text-primary transition-colors"
    >
      <FaGlobe className="text-sm" />
      {LOCALE_NAMES[other]}
    </Link>
  );
}
