import { queryOne } from "@/lib/db";
import { pageResource, type PageRow } from "@/lib/resources";
import { json, notFound } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await params;
  const page = await queryOne<PageRow>(
    "SELECT * FROM pages WHERE slug = $1 AND is_published = true",
    [slug]
  );
  if (!page) return notFound();

  let content: unknown[] | null = null;
  if (typeof page.content === "string") {
    try {
      content = JSON.parse(page.content);
    } catch {
      content = null;
    }
  } else {
    content = page.content as unknown[] | null;
  }

  return json({ data: pageResource({ ...page, content }) });
}