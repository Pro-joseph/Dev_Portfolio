import { query, queryOne } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, paginate } from "@/lib/http";
import { handleError } from "@/lib/route-helpers";
import { castRow as cast } from "@/lib/admin-crud";
import { PAGE_SIZE_ADMIN } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const perPage = Math.max(1, Number(url.searchParams.get("per_page")) || PAGE_SIZE_ADMIN);
    const search = url.searchParams.get("search")?.trim() ?? "";

    const where = search
      ? " WHERE name ILIKE $1 OR subject ILIKE $1 OR email ILIKE $1"
      : "";
    const params: unknown[] = search ? [`%${search}%`] : [];

    const totalRow = await queryOne<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM contact_messages${where}`,
      params
    );
    const total = Number(totalRow?.n ?? 0);
    const rows = await query(
      `SELECT * FROM contact_messages${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, perPage, (page - 1) * perPage]
    );

    const data = rows.map((r) => cast("contact_messages", r));
    return json(paginate({ page, perPage, total, data, url: request.url }));
  } catch (e) {
    return handleError(e);
  }
}