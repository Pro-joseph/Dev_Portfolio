import { describe, expect, it } from "vitest";
import { en } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";

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
