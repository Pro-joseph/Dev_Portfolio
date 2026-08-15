import { describe, it, expect } from "vitest";
import { query, nextId } from "./db";
import { saveMediaFile, deleteMediaFile } from "./media-storage";
import { GET as resumesActiveGet } from "@/app/api/v1/resumes/active/route";

const enabled = Boolean(
  process.env.DATABASE_URL?.trim() &&
    process.env.SMOKE_POSTGRES === "1" &&
    process.env.SUPABASE_URL?.trim() &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      process.env.SUPABASE_SECRET_KEY?.trim())
);

const PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n"
);

describe.skipIf(!enabled)("resume download", () => {
  it("uploads a PDF, exposes a downloadable URL, and cleans up", async () => {
    const rel = await saveMediaFile(PDF, `smoke-cv-${Date.now()}.pdf`);
    const now = new Date().toISOString();

    const mediaId = await nextId("media");
    await query(
      `INSERT INTO media (id, disk, path, filename, mime_type, size_kb, order_index, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $7)`,
      [mediaId, "supabase", rel, "smoke-cv.pdf", "application/pdf", 1, now]
    );

    const resumeId = await nextId("resumes");
    await query(
      `INSERT INTO resumes (id, label, language, media_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, $5, $5)`,
      [resumeId, "SMOKE CV", "En", mediaId, now]
    );

    try {
      const res = await resumesActiveGet();
      expect(res.status).toBe(200);
      const { data } = (await res.json()) as {
        data: { id: number; label: string; url: string };
      };
      expect(data.id).toBe(resumeId);
      expect(data.label).toBe("SMOKE CV");
      expect(data.url).toMatch(/^https:\/\/.+\.supabase\.co/);
      expect(data.url).toContain("?download=");

      const dl = await fetch(data.url);
      expect(dl.ok).toBe(true);
      const disposition = dl.headers.get("content-disposition") ?? "";
      expect(disposition.toLowerCase()).toContain("attachment");
      const bytes = Buffer.from(await dl.arrayBuffer());
      expect(bytes.equals(PDF)).toBe(true);
    } finally {
      await query("DELETE FROM resumes WHERE id = $1", [resumeId]);
      await query("DELETE FROM media WHERE id = $1", [mediaId]);
      await deleteMediaFile(rel);
    }
  }, 60_000);
});