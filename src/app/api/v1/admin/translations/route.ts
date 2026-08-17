import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleError } from "@/lib/route-helpers";
import { json } from "@/lib/http";
import { crudDefs } from "@/lib/resource-crud";

export const dynamic = "force-dynamic";

const SLUG_RESOURCES = new Set(["projects", "pages", "skill_categories"]);
const KEY_RESOURCES = new Set(["certifications", "testimonials", "menu_items"]);

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);
    const resource = new URL(request.url).searchParams.get("resource") ?? "";
    const crud = crudDefs[resource];
    if (!crud || !crud.locales) return json({ data: [] });

    const slug = SLUG_RESOURCES.has(crud.resource) ? ", slug" : "";
    const key = KEY_RESOURCES.has(crud.resource) ? ", translation_key" : "";
    const rows = await query<Record<string, unknown>>(
      `SELECT id, locale${slug}${key} FROM ${crud.table}`
    );
    return json({ data: rows });
  } catch (e) {
    return handleError(e);
  }
}