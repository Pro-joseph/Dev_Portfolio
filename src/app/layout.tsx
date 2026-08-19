import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { loadSiteSettings } from "@/lib/site-config";
import { normalizeLocale, linkedinUrl } from "@/lib/seo";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n";
import "font-awesome/css/font-awesome.min.css";
import "easymde/dist/easymde.min.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

async function currentLocale(): Promise<Locale> {
  try {
    const store = await cookies();
    const value = store.get("locale")?.value;
    return isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await loadSiteSettings(await currentLocale());
    const seo = settings.seo;
    const locale = normalizeLocale(await currentLocale());
    const authorUrl = linkedinUrl(seo?.linkedin);
    const cardImage = settings.og_image ?? settings.hero_image;
    const ogTitle = `${settings.site_title} | ${settings.author_name}`;

    return {
      title: {
        default: `${settings.site_title} | ${settings.author_name} — ${settings.author_role}`,
        template: `%s | ${settings.site_title}`,
      },
      description: settings.site_description,
      keywords: seo?.keywords || undefined,
      authors: seo?.author ? [{ name: seo.author, ...(authorUrl ? { url: authorUrl } : {}) }] : undefined,
      alternates: seo?.canonical ? { canonical: seo.canonical } : undefined,
      openGraph: {
        type: "website",
        locale,
        siteName: settings.site_title,
        title: ogTitle,
        description: settings.site_description,
        url: seo?.canonical || undefined,
        images: cardImage
          ? [
              {
                url: cardImage,
                width: 1200,
                height: 630,
                alt: `${settings.site_title} — ${settings.author_name}`,
              },
            ]
          : [],
      },
    };
  } catch {
    return {
      title: {
        default: "JosephLab | Youssef Jdira — Systems Architect",
        template: "%s | JosephLab",
      },
      description:
        "Full-stack developer with extensive experience in backend systems, databases, and software architecture. Building scalable, secure, and efficient solutions.",
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let locale: Locale = DEFAULT_LOCALE;
  let accent: string | null = null;
  try {
    const settings = await loadSiteSettings(await currentLocale());
    locale = await currentLocale();
    accent = settings.accent_color;
  } catch {
    locale = DEFAULT_LOCALE;
    accent = null;
  }

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${jetbrainsMono.variable} ${hanken.variable} antialiased`}
      style={accent ? ({ "--color-accent": accent } as React.CSSProperties) : undefined}
    >
      <body className="min-h-screen bg-surface font-sans text-primary overflow-x-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}