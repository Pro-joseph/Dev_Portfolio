import { randomBytes } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { query, nextId } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, validationError, paginate } from "@/lib/http";
import { handleError } from "@/lib/route-helpers";
import { mediaRowWithUrl } from "@/lib/admin-crud";

export const dynamic = "force-dynamic";

const ALLOWED_MIME = /^(image\/(jpeg|png|gif|webp|svg\+xml)|image\/svg|application\/pdf|video\/mp4)$/;

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const perPage = Math.max(1, Number(url.searchParams.get("per_page")) || 24);

    const totalRow = await query<{ n: number }>(
      "SELECT COUNT(*)::int AS n FROM media"
    );
    const total = Number(totalRow[0]?.n ?? 0);
    const rows = await query(
      "SELECT * FROM media ORDER BY id DESC LIMIT $1 OFFSET $2",
      [perPage, (page - 1) * perPage]
    );

    const data = rows.map(mediaRowWithUrl);
    return json(paginate({ page, perPage, total, data, url: request.url }));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return validationError({ file: ["The file field is required."] });
    }

    const mime = file.type || "application/octet-stream";
    if (!ALLOWED_MIME.test(mime)) {
      return validationError({ file: ["The file must be a file of type: jpg, jpeg, png, gif, webp, svg, pdf, mp4."] });
    }
    if (file.size > 10 * 1024 * 1024) {
      return validationError({ file: ["The file must not be greater than 10240 kilobytes."] });
    }

    const ext = path.extname(file.name) || (mime === "application/pdf" ? ".pdf" : "");
    const storedName = `${randomBytes(16).toString("hex")}${ext}`;
    const relativePath = `uploads/${storedName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await mkdir(path.join(process.cwd(), "public", "uploads"), { recursive: true });
    await writeFile(path.join(process.cwd(), "public", "uploads", storedName), buffer);

    const collection = (form.get("collection") as string) || null;
    const altText = (form.get("alt_text") as string) || null;
    const mediableType = (form.get("mediable_type") as string) || null;
    const mediableIdRaw = form.get("mediable_id");
    const mediableId = mediableIdRaw ? Number(mediableIdRaw) : null;

    const id = await nextId("media");
    const now = new Date().toISOString();

    await query(
      `INSERT INTO media (id, disk, path, filename, mime_type, size_kb, alt_text, collection, mediable_type, mediable_id, order_index, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, $11)`,
      [
        id,
        "public",
        relativePath,
        file.name,
        mime,
        Math.max(1, Math.round(file.size / 1024)),
        altText,
        collection,
        mediableType,
        mediableId,
        now,
      ]
    );

    const row = await query("SELECT * FROM media WHERE id = $1", [id]);
    return json({ data: mediaRowWithUrl(row[0]) }, 201);
  } catch (e) {
    return handleError(e);
  }
}