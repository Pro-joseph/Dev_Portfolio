import { queryOne, query } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, notFound } from "@/lib/http";
import { handleError, parseId } from "@/lib/route-helpers";
import { castRow as cast } from "@/lib/admin-crud";

export const dynamic = "force-dynamic";

export async function GET(
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
    return json({ data: cast("contact_messages", row) });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
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

    await query("DELETE FROM contact_messages WHERE id = $1", [id]);
    return json({ message: "Deleted." });
  } catch (e) {
    return handleError(e);
  }
}