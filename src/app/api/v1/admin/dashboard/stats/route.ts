import { requireAdmin } from "@/lib/auth";
import { json } from "@/lib/http";
import { handleError } from "@/lib/route-helpers";
import { computeDashboardStats } from "@/lib/dashboard-stats";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const days = Math.min(90, Math.max(7, Number(url.searchParams.get("days")) || 30));
    return json(await computeDashboardStats(days));
  } catch (e) {
    return handleError(e);
  }
}