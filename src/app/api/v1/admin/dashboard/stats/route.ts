import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { json } from "@/lib/http";
import { handleError } from "@/lib/route-helpers";
import { mediaUrl } from "@/lib/resources";
import { mediaQuotaBytes } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);

    const [
      totals,
      recent,
      skills,
      messages,
      resumes,
      media,
    ] = await Promise.all([
      query<{ total_views: number; total_projects: number; published_projects: number; draft_projects: number }>(
        `SELECT COALESCE(SUM(views_count),0)::int AS total_views,
                COUNT(*)::int AS total_projects,
                COALESCE(SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END),0)::int AS published_projects,
                COALESCE(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END),0)::int AS draft_projects
         FROM projects`
      ),
      query<{ id: number; title: string; slug: string; status: string; views_count: number; updated_at: string }>(
        `SELECT id, title, slug, status, views_count, updated_at
         FROM projects ORDER BY updated_at DESC LIMIT 5`
      ),
      query<{ n: number }>("SELECT COUNT(*)::int AS n FROM skills"),
      query<{ unread: number; total: number }>(
        `SELECT COALESCE(SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END),0)::int AS unread,
                COUNT(*)::int AS total FROM contact_messages`
      ),
      query<{ label: string; language: string; media_disk: string; media_path: string }>(
        `SELECT r.label, r.language, m.disk AS media_disk, m.path AS media_path
         FROM resumes r JOIN media m ON m.id = r.media_id
         WHERE r.is_active = true ORDER BY r.created_at DESC LIMIT 1`
      ),
      query<{ mime_type: string | null; size_kb: number | null }>(
        "SELECT mime_type, size_kb FROM media"
      ),
    ]);

    const t = totals[0];
    const m = messages[0];
    const projects = recent.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      views_count: p.views_count,
      updated_at: p.updated_at,
    }));

    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 29);
    start.setUTCHours(0, 0, 0, 0);
    const startIso = start.toISOString();

    const projectViews = await query<{ created_at: string; views_count: number }>(
      "SELECT created_at, views_count FROM projects WHERE created_at >= $1",
      [startIso]
    );

    const points: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      points[d.toISOString().slice(0, 10)] = 0;
    }
    for (const p of projectViews) {
      const key = String(p.created_at).slice(0, 10);
      if (key in points) points[key] += Number(p.views_count);
    }
    const viewsSeries = Object.entries(points).map(([date, views]) => ({ date, views }));

    const values = viewsSeries.map((p) => p.views);
    const firstHalf = values.slice(0, 15).reduce((a, b) => a + b, 0);
    const secondHalf = values.slice(15).reduce((a, b) => a + b, 0);
    let viewsDelta: string;
    if (firstHalf <= 0) viewsDelta = secondHalf > 0 ? "+100%" : "0%";
    else {
      const delta = ((secondHalf - firstHalf) / firstHalf) * 100;
      viewsDelta = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
    }

    const categories = { images: 0, documents: 0, video: 0, other: 0 };
    for (const item of media) {
      const mime = String(item.mime_type ?? "").toLowerCase();
      const size = Number(item.size_kb ?? 0) * 1024;
      if (mime.startsWith("image/")) categories.images += size;
      else if (["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(mime))
        categories.documents += size;
      else if (mime.startsWith("video/")) categories.video += size;
      else categories.other += size;
    }
    const usedBytes = categories.images + categories.documents + categories.video + categories.other;

    const activeResume = resumes[0]
      ? {
          label: resumes[0].label,
          language: resumes[0].language,
          url: mediaUrl({ disk: resumes[0].media_disk, path: resumes[0].media_path }),
        }
      : null;

    return json({
      total_views: Number(t?.total_views ?? 0),
      views_delta: viewsDelta,
      views_series: viewsSeries,
      total_projects: Number(t?.total_projects ?? 0),
      published_projects: Number(t?.published_projects ?? 0),
      draft_projects: Number(t?.draft_projects ?? 0),
      total_skills: Number(skills[0]?.n ?? 0),
      unread_messages: Number(m?.unread ?? 0),
      total_messages: Number(m?.total ?? 0),
      active_resume: activeResume,
      recent_projects: projects,
      media_storage: {
        used_bytes: usedBytes,
        quota_bytes: mediaQuotaBytes(),
        breakdown: categories,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}