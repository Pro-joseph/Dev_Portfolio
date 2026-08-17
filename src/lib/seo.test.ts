import { describe, it, expect } from "vitest";
import { normalizeLocale, linkedinUrl } from "@/lib/seo";

describe("normalizeLocale", () => {
  it("maps short codes to BCP-47", () => {
    expect(normalizeLocale("en")).toBe("en_US");
    expect(normalizeLocale("fr")).toBe("fr_FR");
  });

  it("passes through well-formed BCP-47 values", () => {
    expect(normalizeLocale("en_US")).toBe("en_US");
    expect(normalizeLocale("fr_FR")).toBe("fr_FR");
  });

  it("defaults to en_US for missing or malformed values", () => {
    expect(normalizeLocale(undefined)).toBe("en_US");
    expect(normalizeLocale(null)).toBe("en_US");
    expect(normalizeLocale("")).toBe("en_US");
    expect(normalizeLocale("xx_ZZ_1")).toBe("en_US");
  });
});

describe("linkedinUrl", () => {
  it("accepts a valid LinkedIn profile URL", () => {
    expect(linkedinUrl("https://www.linkedin.com/in/youssef-jdira-85b113167/")).toBe(
      "https://www.linkedin.com/in/youssef-jdira-85b113167/"
    );
    expect(linkedinUrl("  https://linkedin.com/in/john  ".trim())).toBe("https://linkedin.com/in/john");
  });

  it("returns undefined for empty or invalid values", () => {
    expect(linkedinUrl(undefined)).toBeUndefined();
    expect(linkedinUrl(null)).toBeUndefined();
    expect(linkedinUrl("")).toBeUndefined();
    expect(linkedinUrl("not a url")).toBeUndefined();
  });
});