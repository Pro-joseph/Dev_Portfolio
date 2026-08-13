import { query, queryOne } from "@/lib/db";
import { buildProject, projectResource, type ProjectRow } from "@/lib/resources";
import { json, notFound } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await params;
  const project = await queryOne<ProjectRow>(
    "SELECT * FROM projects WHERE slug = $1 AND status = 'published'",
    [slug]
  );
  if (!project) return notFound();

  await query("UPDATE projects SET views_count = views_count + 1 WHERE id = $1", [project.id]);

  const withRels = await buildProject(project);
  return json({ data: projectResource(withRels) });
}