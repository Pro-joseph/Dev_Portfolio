import { loadProjectBySlug, projectResource } from "@/lib/resources";
import { json, notFound } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await params;
  const locale = new URL(request.url).searchParams.get("locale") ?? undefined;
  const withRels = await loadProjectBySlug(slug, locale);
  if (!withRels) return notFound();
  return json({ data: projectResource(withRels) });
}
