import { query, queryOne } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, notFound, paginate } from "@/lib/http";
import { handleError, parseId } from "@/lib/route-helpers";
import { castRow as cast } from "@/lib/admin-crud";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const perPage = Math.max(1, Number(url.searchParams.get("per_page")) || 20);

    const totalRow = await queryOne<{ n: number }>(
      "SELECT COUNT(*)::int AS n FROM contact_messages"
    );
    const total = Number(totalRow?.n ?? 0);
    const rows = await query(
      "SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [perPage, (page - 1) * perPage]
    );

    const data = rows.map((r) => cast("contact_messages", r));
    return json(paginate({ page, perPage, total, data, url: request.url }));
  } catch (e) {
    return handleError(e);
  }
}