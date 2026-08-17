import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import LangSwitch from "./LangSwitch";
import type { Dictionary } from "@/lib/i18n";

export default function SubNav({
  label = "Back to Portfolio",
  authorName = "Youssef Jdira",
  locale,
  t,
}: {
  label?: string;
  authorName?: string;
  locale: string;
  t: Dictionary;
}) {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-surface/80 backdrop-blur-md border-b border-line">
      <div className="flex items-center gap-2">
        <Link href={`/${locale}`} className="font-bold text-lg tracking-tight">
          {authorName}
        </Link>
        <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
      </div>
      <div className="flex items-center gap-6">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors"
        >
          <FaArrowLeft className="text-xs" /> {label}
        </Link>
        <LangSwitch ariaLabel={t.langSwitch.ariaLabel} />
      </div>
    </nav>
  );
}
