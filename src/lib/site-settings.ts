export interface SeoSettings {
  linkedin?: string;
  locale?: string;
  author?: string;
  keywords?: string;
  canonical?: string;
}

export interface SiteSettings {
  site_title: string;
  site_tagline: string;
  site_description: string;
  author_name: string;
  author_role: string;
  contact_email: string | null;
  accent_color: string | null;
  hero_image: string | null;
  author_avatar: string | null;
  og_image: string | null;
  announcement_enabled: boolean;
  seo: SeoSettings | null;
}

export function getSiteSettings(
  site: { settings: Record<string, unknown> },
  locale?: string
): SiteSettings {
  const s = site.settings;
  const fr = locale === "fr";
  const localized = (
    value: string | null,
    fallback: string,
    frKey?: string
  ): string => {
    if (fr && frKey) return (s[frKey] as string) ?? (value ?? fallback);
    return value ?? fallback;
  };
  return {
    site_title: localized(s.site_title as string, "JosephLab", "site_title_fr"),
    site_tagline: localized(
      s.site_tagline as string,
      "Engineering robust digital systems from the database up",
      "site_tagline_fr"
    ),
    site_description: localized(
      s.site_description as string,
      "Full-stack developer with extensive experience in backend systems, databases, and software architecture.",
      "site_description_fr"
    ),
    author_name: (s.author_name as string) ?? "Youssef Jdira",
    author_role: localized(
      s.author_role as string,
      "Systems Architect",
      "author_role_fr"
    ),
    contact_email: (s.contact_email as string) ?? null,
    accent_color: (s.accent_color as string) ?? null,
    hero_image: (s.hero_image as string) ?? null,
    author_avatar: (s.author_avatar as string) ?? null,
    og_image: (s.og_image as string) ?? null,
    announcement_enabled: Boolean(s.announcement_enabled),
    seo: (s.seo as SeoSettings | null) ?? null,
  };
}