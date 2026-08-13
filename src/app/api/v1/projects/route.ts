import { query } from "@/lib/db";
import { buildProjectList, projectListResource, type ProjectRow } from "@/lib/resources";
import { resourceCollectionResponse, paginate } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const featured = url.searchParams.get("featured") === "true" ||
    url.searchParams.get("featured") === "1";
  const search = url.searchParams.get("search")?.trim() ?? "";
  const perPage = Math.max(1, Number(url.searchParams.get("per_page")) || 12);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

  const conditions: string[] = ["status = 'published'"];
  const params: unknown[] = [];

  if (featured) {
    params.push(true);
    conditions.push(`is_featured = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(title ILIKE $${params.length} OR summary ILIKE $${params.length})`
    );
  }

  const where = conditions.join(" AND ");
  const totalRow = await query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM projects WHERE ${where}`,
    params
  );
  const total = Number(totalRow[0]?.n ?? 0);

  const rows = await query<ProjectRow>(
    `SELECT * FROM projects WHERE ${where}
     ORDER BY is_featured DESC, order_index ASC, id ASC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, perPage, (page - 1) * perPage]
  );

  const projects = await buildProjectList(rows);
  const data = projects.map(projectListResource);

  const paginator = paginate({ page, perPage, total, data, url: request.url });
  return resourceCollectionResponse(paginator);
}