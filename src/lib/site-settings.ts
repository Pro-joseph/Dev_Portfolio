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
  announcement_enabled: boolean;
  seo: { twitter?: string; locale?: string } | null;
}

export function getSiteSettings(site: { settings: Record<string, unknown> }): SiteSettings {
  const s = site.settings;
  return {
    site_title: (s.site_title as string) ?? "JosephLab",
    site_tagline:
      (s.site_tagline as string) ?? "Engineering robust digital systems from the database up",
    site_description:
      (s.site_description as string) ??
      "Full-stack developer with extensive experience in backend systems, databases, and software architecture.",
    author_name: (s.author_name as string) ?? "Youssef Jdira",
    author_role: (s.author_role as string) ?? "Systems Architect",
    contact_email: (s.contact_email as string) ?? null,
    accent_color: (s.accent_color as string) ?? null,
    hero_image: (s.hero_image as string) ?? null,
    author_avatar: (s.author_avatar as string) ?? null,
    announcement_enabled: Boolean(s.announcement_enabled),
    seo: (s.seo as { twitter?: string; locale?: string } | null) ?? null,
  };
}