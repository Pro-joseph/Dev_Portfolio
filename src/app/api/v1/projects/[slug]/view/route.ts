import { query } from "@/lib/db";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await params;
  const locale = new URL(request.url).searchParams.get("locale") || "en";
  await query(
    "UPDATE projects SET views_count = views_count + 1 WHERE slug = $1 AND status = 'published' AND locale = $2",
    [slug, locale]
  );
  return json({ message: "ok" });
}