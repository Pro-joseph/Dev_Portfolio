import Link from "next/link";
import type { MenuEntry } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import LangSwitch from "./LangSwitch";

interface NavProps {
  siteTitle?: string;
  authorName?: string;
  menu?: MenuEntry[];
  resumeUrl?: string | null;
  resumeFilename?: string | null;
  t: Dictionary;
  locale: string;
}

export default function Nav({
  siteTitle,
  authorName,
  menu = [],
  resumeUrl,
  resumeFilename,
  t,
  locale,
}: NavProps) {
  const brand = authorName || siteTitle || t.nav.brandFallback;
  const items = menu.length > 0 ? menu : DEFAULT_MENU(t);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-surface/85 backdrop-blur-md border-b border-line/70">
      <div className="flex items-center gap-2">
        <Link href={`/${locale}`} className="font-heading text-lg tracking-tight font-bold">
          {brand}
        </Link>
        <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
      </div>
      <div className="hidden md:flex gap-8 text-sm font-medium tracking-wider uppercase">
        {items.map((item) =>
          item.children && item.children.length > 0 ? (
            <div key={item.id} className="relative group">
              <NavLink href={item.url} openInNewTab={item.open_in_new_tab}>
                {item.label}
              </NavLink>
              <div className="absolute left-0 top-full pt-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all">
                <div className="bg-surface border border-line rounded-xl shadow-lg py-2 min-w-[160px]">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.id}
                      href={child.url}
                      openInNewTab={child.open_in_new_tab}
                      className="block px-4 py-2 hover:bg-elevated"
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <NavLink key={item.id} href={item.url} openInNewTab={item.open_in_new_tab}>
              {item.label}
            </NavLink>
          )
        )}
      </div>
      <div className="flex items-center gap-6">
        <LangSwitch ariaLabel={t.langSwitch.ariaLabel} />
        {resumeUrl ? (
          <a
            href={resumeUrl}
            download={resumeFilename || true}
            rel="noreferrer"
            className="group relative overflow-hidden bg-primary text-white px-6 py-2 rounded-full text-xs font-bold tracking-widest hover:bg-gray-800 transition-colors"
          >
            {t.nav.downloadResume}
          </a>
        ) : (
          <Link
            href={`/${locale}#contact`}
            className="group relative overflow-hidden bg-primary text-white px-6 py-2 rounded-full text-xs font-bold tracking-widest hover:bg-gray-800 transition-colors"
          >
            {t.nav.getInTouch}
          </Link>
        )}
      </div>
    </nav>
  );
}

const DEFAULT_MENU = (t: Dictionary): MenuEntry[] => [
  { id: -1, label: t.nav.projects, url: "#projects", open_in_new_tab: false, children: [] },
  { id: -2, label: t.nav.skills, url: "#skills", open_in_new_tab: false, children: [] },
  { id: -3, label: t.nav.contact, url: "/#contact", open_in_new_tab: false, children: [] },
];

function NavLink({
  href,
  openInNewTab,
  className = "relative nav-link",
  children,
}: {
  href: string | null;
  openInNewTab?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const target = openInNewTab ? "_blank" : undefined;
  const rel = openInNewTab ? "noreferrer" : undefined;
  if (!href) return <span className={className}>{children}</span>;
  if (href.startsWith("#")) {
    return (
      <a href={`/#${href.slice(1)}`} className={className}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} target={target} rel={rel} className={className}>
      {children}
    </a>
  );
}
