import { unlink } from "node:fs/promises";
import path from "node:path";
import { queryOne, query } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json, notFound } from "@/lib/http";
import { handleError, parseId } from "@/lib/route-helpers";
import { deleteMediaFile, uploadRoot } from "@/lib/media-storage";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    await requireAdmin(request);
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (id === null) return notFound();

    const media = await queryOne(
      "SELECT * FROM media WHERE id = $1",
      [id]
    );
    if (!media) return notFound();

    if (media.disk === "supabase") {
      try {
        await deleteMediaFile(String(media.path));
      } catch {
        /* object already gone */
      }
    } else if (media.disk === "public") {
      const filePath = path.join(uploadRoot(), path.basename(String(media.path)));
      try {
        await unlink(filePath);
      } catch {
        /* file already gone */
      }
    }

    await query("DELETE FROM media WHERE id = $1", [id]);
    return json({ message: "Deleted." });
  } catch (e) {
    return handleError(e);
  }
}