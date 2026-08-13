import { query } from "@/lib/db";
import { skillResource, type SkillRow } from "@/lib/resources";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const categories = await query<{
    id: number;
    name: string;
    slug: string;
    order_index: number;
  }>(
    "SELECT id, name, slug, order_index FROM skill_categories ORDER BY order_index"
  );

  const data = await Promise.all(
    categories.map(async (cat) => {
      const skills = await query<SkillRow>(
        "SELECT id, name, slug, icon, proficiency, order_index FROM skills WHERE skill_category_id = $1 AND is_visible = true ORDER BY order_index",
        [cat.id]
      );
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        order_index: cat.order_index,
        skills: skills.map(skillResource),
      };
    })
  );

  return json({ data });
}