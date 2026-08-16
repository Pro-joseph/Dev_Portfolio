import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json } from "@/lib/http";
import { handleError } from "@/lib/route-helpers";
import { supabaseEnabled, getSupabase, bucketName } from "@/lib/media-storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);

    const dbStart = performance.now();
    await query("SELECT 1 AS ok");
    const dbLatency = Math.round((performance.now() - dbStart) * 10) / 10;

    let storageStatus: "ok" | "unconfigured" | "error" = "unconfigured";
    let storageLatency: number | null = null;
    if (supabaseEnabled()) {
      const storageStart = performance.now();
      try {
        const { error } = await getSupabase()
          .storage.from(bucketName())
          .list(undefined, { limit: 1 });
        if (error) throw error;
        storageStatus = "ok";
      } catch {
        storageStatus = "error";
      }
      storageLatency = Math.round((performance.now() - storageStart) * 10) / 10;
    }

    return json({
      ok: storageStatus !== "error",
      status: storageStatus === "error" ? "degraded" : "ok",
      db: { ok: true, latency_ms: dbLatency },
      storage: { status: storageStatus, latency_ms: storageLatency },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return handleError(e);
  }
}