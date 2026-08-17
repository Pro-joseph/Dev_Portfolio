import { describe, expect, it } from "vitest";
import { en } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";
import { geoDefaultLocale } from "./index";

function collectKeys(obj: unknown, prefix = ""): string[] {
  const keys: string[] = [];
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object") keys.push(...collectKeys(v, p));
      else keys.push(p);
    }
  }
  return keys.sort();
}

describe("i18n dictionaries", () => {
  it("fr has exactly the same keys as en", () => {
    expect(collectKeys(fr)).toEqual(collectKeys(en));
  });
});

describe("geoDefaultLocale", () => {
  it("maps France and Morocco to French", () => {
    expect(geoDefaultLocale("FR")).toBe("fr");
    expect(geoDefaultLocale("fr")).toBe("fr");
    expect(geoDefaultLocale("MA")).toBe("fr");
  });

  it("maps English-speaking and other countries to English", () => {
    for (const code of ["US", "GB", "AE", "CA", "DE", "DZ", "TN"]) {
      expect(geoDefaultLocale(code)).toBe("en");
    }
  });

  it("falls back to English for unknown values", () => {
    expect(geoDefaultLocale(undefined)).toBe("en");
    expect(geoDefaultLocale(null)).toBe("en");
    expect(geoDefaultLocale("")).toBe("en");
    expect(geoDefaultLocale("XX")).toBe("en");
    expect(geoDefaultLocale("T1")).toBe("en");
  });
});
