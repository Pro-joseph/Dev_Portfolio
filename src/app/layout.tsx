import type { Metadata } from "next";
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { loadSiteSettings } from "@/lib/site-config";
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

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await loadSiteSettings();
    return {
      title: {
        default: `${settings.site_title} | ${settings.author_name} — ${settings.author_role}`,
        template: `%s | ${settings.site_title}`,
      },
      description: settings.site_description,
      openGraph: {
        type: "website",
        locale: settings.seo?.locale ?? "en_US",
        siteName: settings.site_title,
        title: `${settings.site_title} | ${settings.author_name}`,
        description: settings.site_description,
        images: settings.hero_image ? [{ url: settings.hero_image }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${settings.site_title} | ${settings.author_name}`,
        description: settings.site_description,
        images: settings.hero_image ? [settings.hero_image] : [],
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
  let accent: string | null = null;
  try {
    const settings = await loadSiteSettings();
    accent = settings.accent_color;
  } catch {
    accent = null;
  }

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${hanken.variable} antialiased`}
      style={accent ? ({ "--color-accent": accent } as React.CSSProperties) : undefined}
    >
      <body className="min-h-screen bg-surface font-sans text-primary overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}