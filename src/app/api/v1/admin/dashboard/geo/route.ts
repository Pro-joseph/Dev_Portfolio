import { query } from "@/lib/db";
import { json } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { handleError } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export interface GeoStats {
  total: number;
  countries: { name: string; count: number }[];
  cities: { name: string; country: string | null; count: number }[];
  series: { date: string; visits: number }[];
  recent: {
    path: string;
    locale: string | null;
    country: string | null;
    city: string | null;
    created_at: string;
  }[];
}

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const days = Math.min(90, Math.max(7, Number(url.searchParams.get("days")) || 30));

    const start = new Date();
    start.setUTCDate(start.getUTCDate() - (days - 1));
    start.setUTCHours(0, 0, 0, 0);
    const since = start.toISOString();

    const [totals, countries, cities, byDay, recent] = await Promise.all([
      query<{ n: number }>(
        "SELECT COUNT(*)::int AS n FROM visit_logs WHERE created_at >= $1",
        [since]
      ),
      query<{ name: string | null; count: number }>(
        `SELECT COALESCE(country, 'Unknown') AS name, COUNT(*)::int AS count
         FROM visit_logs WHERE created_at >= $1
         GROUP BY country ORDER BY count DESC LIMIT 10`,
        [since]
      ),
      query<{ name: string | null; country: string | null; count: number }>(
        `SELECT COALESCE(city, 'Unknown') AS name, country, COUNT(*)::int AS count
         FROM visit_logs WHERE created_at >= $1
         GROUP BY city, country ORDER BY count DESC LIMIT 10`,
        [since]
      ),
      query<{ created_at: string }>(
        "SELECT created_at FROM visit_logs WHERE created_at >= $1",
        [since]
      ),
      query<{
        path: string;
        locale: string | null;
        country: string | null;
        city: string | null;
        created_at: string;
      }>(
        `SELECT path, locale, country, city, created_at FROM visit_logs
         ORDER BY created_at DESC LIMIT 15`
      ),
    ]);

    const points: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      points[d.toISOString().slice(0, 10)] = 0;
    }
    for (const row of byDay) {
      const key = String(row.created_at).slice(0, 10);
      if (key in points) points[key] += 1;
    }

    const stats: GeoStats = {
      total: Number(totals[0]?.n ?? 0),
      countries: countries.map((c) => ({ name: String(c.name), count: Number(c.count) })),
      cities: cities.map((c) => ({
        name: String(c.name),
        country: c.country,
        count: Number(c.count),
      })),
      series: Object.entries(points).map(([date, visits]) => ({ date, visits })),
      recent: recent.map((r) => ({
        path: r.path,
        locale: r.locale,
        country: r.country,
        city: r.city,
        created_at: r.created_at,
      })),
    };

    return json(stats);
  } catch (e) {
    return handleError(e);
  }
}