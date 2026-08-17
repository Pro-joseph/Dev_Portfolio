import { describe, it, expect } from "vitest";
import { normalizeLocale, twitterHandle } from "@/lib/seo";

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

describe("twitterHandle", () => {
  it("strips the leading @", () => {
    expect(twitterHandle("@josephlab")).toBe("josephlab");
  });

  it("returns undefined for empty values", () => {
    expect(twitterHandle(undefined)).toBeUndefined();
    expect(twitterHandle("")).toBeUndefined();
    expect(twitterHandle("@")).toBeUndefined();
  });
});