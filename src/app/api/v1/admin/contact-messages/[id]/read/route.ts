import { queryOne, query } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, notFound } from "@/lib/http";
import { handleError, parseId } from "@/lib/route-helpers";
import { castRow as cast } from "@/lib/admin-crud";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await requireAdmin(request);
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (id === null) return notFound();

    const row = await queryOne("SELECT * FROM contact_messages WHERE id = $1", [id]);
    if (!row) return notFound();

    await query(
      "UPDATE contact_messages SET is_read = true, updated_at = $1 WHERE id = $2",
      [new Date().toISOString(), id]
    );
    const updated = await queryOne("SELECT * FROM contact_messages WHERE id = $1", [id]);
    return json({ data: cast("contact_messages", updated ?? {}) });
  } catch (e) {
    return handleError(e);
  }
}