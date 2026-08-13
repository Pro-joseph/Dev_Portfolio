import { query, queryOne } from "@/lib/db";
import { testimonialResource, type TestimonialRow, type MediaRow } from "@/lib/resources";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const testimonials = await query<TestimonialRow>(
    "SELECT * FROM testimonials WHERE is_visible = true ORDER BY order_index"
  );

  const data = await Promise.all(
    testimonials.map(async (t) => {
      const avatar = await queryOne<MediaRow>(
        "SELECT * FROM media WHERE id = $1",
        [t.avatar_media_id]
      );
      return testimonialResource({ ...t, avatar });
    })
  );

  return json({ data });
}