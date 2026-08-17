import { en } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";
import type { Dictionary } from "./types";

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, fr };

/** Countries whose visitors are auto-served the French locale. */
export const FRENCH_COUNTRIES = ["FR", "MA"];

/**
 * Picks the locale to serve based on the visitor's ISO-3166-1 country code
 * (Vercel's `x-vercel-ip-country`). Unknown IPs (missing, `XX`, `T1`) fall
 * back to the default locale.
 */
export function geoDefaultLocale(country: string | undefined | null): Locale {
  const code = (country ?? "").trim().toUpperCase();
  if (code && FRENCH_COUNTRIES.includes(code)) return "fr";
  return DEFAULT_LOCALE;
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "fr";
}

export function getDictionary(locale: string | undefined | null): Dictionary {
  return DICTIONARIES[isLocale(locale) ? locale : DEFAULT_LOCALE];
}

export type { Dictionary };
