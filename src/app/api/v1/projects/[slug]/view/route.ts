import { query } from "@/lib/db";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await params;
  await query(
    "UPDATE projects SET views_count = views_count + 1 WHERE slug = $1 AND status = 'published'",
    [slug]
  );
  return json({ message: "ok" });
}