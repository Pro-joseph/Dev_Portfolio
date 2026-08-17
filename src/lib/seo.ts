const SHORT_TO_FULL: Record<string, string> = {
  en: "en_US",
  fr: "fr_FR",
  de: "de_DE",
  es: "es_ES",
  it: "it_IT",
  pt: "pt_BR",
  nl: "nl_NL",
  ar: "ar_AE",
};

/** Normalizes a stored locale to a BCP-47 value suitable for og:locale. */
export function normalizeLocale(locale?: string | null): string {
  const raw = locale?.trim() || "";
  if (!raw) return "en_US";
  if (SHORT_TO_FULL[raw.toLowerCase()]) return SHORT_TO_FULL[raw.toLowerCase()];
  if (/^[a-z]{2}_[A-Z]{2}$/.test(raw)) return raw;
  return "en_US";
}

/** Validates a LinkedIn profile URL for the rel=author link. */
export function linkedinUrl(url?: string | null): string | undefined {
  const raw = url?.trim() || "";
  return /^https?:\/\/.+/i.test(raw) ? raw : undefined;
}