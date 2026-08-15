import { describe, it, expect } from "vitest";
import {
  supabaseEnabled,
  saveMediaFile,
  mediaPublicUrl,
  deleteMediaFile,
} from "./media-storage";

const enabled = Boolean(
  process.env.SUPABASE_URL?.trim() &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      process.env.SUPABASE_SECRET_KEY?.trim())
);

describe.skipIf(!enabled)("supabase storage", () => {
  it("uploads, serves publicly, and deletes", async () => {
    expect(supabaseEnabled()).toBe(true);
    const name = `smoke-test-${Date.now()}.png`;
    const rel = await saveMediaFile(Buffer.from("test"), name);
    expect(rel).toContain(name);

    const url = mediaPublicUrl(rel);
    expect(url).toMatch(/^https:\/\/.+\.supabase\.co/);

    const res = await fetch(url!);
    expect(res.ok).toBe(true);
    expect(await res.text()).toBe("test");

    await deleteMediaFile(rel);
  }, 30_000);
});