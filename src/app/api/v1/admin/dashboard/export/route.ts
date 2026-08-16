import { requireAdmin } from "@/lib/auth";
import { handleError } from "@/lib/route-helpers";
import { computeDashboardStats, dashboardStatsCsv } from "@/lib/dashboard-stats";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const days = Math.min(90, Math.max(7, Number(url.searchParams.get("days")) || 30));
    const stats = await computeDashboardStats(days);
    const filename = `dashboard-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(dashboardStatsCsv(stats), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}