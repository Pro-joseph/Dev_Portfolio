import { query, nextId } from "./db";
import { type Crud } from "./admin-crud";
import {
  projectsValidator,
  pagesValidator,
  skillsValidator,
  skillCategoriesValidator,
  resumesValidator,
  socialLinksValidator,
  menuItemsValidator,
  siteSettingsValidator,
  certificationsValidator,
  testimonialsValidator,
} from "./resource-validators";
import type { Validator } from "./validators";
import { PROJECT_MORPH } from "./enums";

function withValidator(
  validator: Validator,
  fields: string[],
  virtuals: string[] = []
): Crud["prepare"] {
  return (payload) => {
    const result = validator(payload);
    if (!result.ok) return result;
    const data: Record<string, unknown> = {};
    for (const f of [...fields, ...virtuals])
      if (f in result.data) data[f] = result.data[f];
    return { ok: true, data };
  };
}

const PROJECT_FIELDS = [
  "title",
  "slug",
  "status",
  "locale",
  "summary",
  "description",
  "is_featured",
  "client",
  "role_on_project",
  "started_on",
  "completed_on",
  "order_index",
  "views_count",
];

async function applyProjectRelations(id: number, payload: Record<string, unknown>): Promise<void> {
  if ("skill_ids" in payload) {
    const skillIds = (payload.skill_ids as number[] | undefined) ?? [];
    await query("DELETE FROM project_skill WHERE project_id = $1", [id]);
    for (const sid of skillIds) {
      await query(
        "INSERT INTO project_skill (project_id, skill_id) VALUES ($1, $2)",
        [id, Number(sid)]
      );
    }
  }

  if ("media_ids" in payload) {
    const mediaIds = (payload.media_ids as number[] | undefined) ?? [];
    await query(
      `UPDATE media SET mediable_type = NULL, mediable_id = NULL, collection = NULL
       WHERE mediable_type = $1 AND mediable_id = $2`,
      [PROJECT_MORPH, id]
    );
    for (const [index, mid] of mediaIds.entries()) {
      await query(
        `UPDATE media SET mediable_type = $1, mediable_id = $2, collection = $3, order_index = $4 WHERE id = $5`,
        [PROJECT_MORPH, id, index === 0 ? "cover" : "gallery", index, Number(mid)]
      );
    }
  }

  if ("links" in payload) {
    const links = (payload.links as { id?: number; label: string; url: string; type?: string }[] | undefined) ?? [];
    await query("DELETE FROM project_links WHERE project_id = $1", [id]);
    for (const [index, link] of links.entries()) {
      const linkId = await nextId("project_links");
      await query(
        `INSERT INTO project_links (id, project_id, label, url, type, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [linkId, id, link.label, link.url, link.type ?? "other", index]
      );
    }
  }
}

export const crudDefs: Record<string, Crud> = {
  projects: {
    table: "projects",
    resource: "projects",
    locales: true,
    searchable: ["title", "slug", "summary", "client"],
    hasSlug: true,
    slugSource: "title",
    prepare: withValidator(projectsValidator, PROJECT_FIELDS, [
      "skill_ids",
      "media_ids",
      "links",
    ]),
    virtualFields: ["skill_ids", "media_ids", "links"],
    afterInsert: (id, payload) => applyProjectRelations(id, payload),
    afterUpdate: (id, payload) => applyProjectRelations(id, payload),
  },
  pages: {
    table: "pages",
    resource: "pages",
    locales: true,
    searchable: ["title", "slug"],
    hasSlug: true,
    slugSource: "title",
    prepare: withValidator(pagesValidator, [
      "title",
      "slug",
      "locale",
      "content",
      "meta_title",
      "meta_description",
      "order_index",
      "is_published",
    ]),
  },
  skills: {
    table: "skills",
    resource: "skills",
    searchable: ["name", "slug"],
    hasSlug: true,
    slugSource: "name",
    prepare: withValidator(skillsValidator, [
      "name",
      "slug",
      "skill_category_id",
      "icon",
      "order_index",
      "is_visible",
    ]),
  },
  "skill-categories": {
    table: "skill_categories",
    resource: "skill_categories",
    locales: true,
    searchable: ["name", "slug"],
    hasSlug: true,
    slugSource: "name",
    prepare: withValidator(skillCategoriesValidator, ["name", "slug", "locale", "order_index"]),
  },
  resumes: {
    table: "resumes",
    resource: "resumes",
    searchable: ["label", "language"],
    prepare: withValidator(resumesValidator, ["label", "language", "media_id", "is_active"]),
  },
  "social-links": {
    table: "social_links",
    resource: "social_links",
    searchable: ["platform", "url"],
    prepare: withValidator(socialLinksValidator, [
      "platform",
      "url",
      "icon",
      "order_index",
      "is_visible",
    ]),
  },
  "menu-items": {
    table: "menu_items",
    resource: "menu_items",
    locales: true,
    searchable: ["label", "external_url"],
    prepare: withValidator(menuItemsValidator, [
      "label",
      "locale",
      "translation_key",
      "parent_id",
      "page_id",
      "external_url",
      "order_index",
      "open_in_new_tab",
      "is_visible",
    ]),
  },
  "site-settings": {
    table: "site_settings",
    resource: "site_settings",
    searchable: ["key", "value"],
    prepare: withValidator(siteSettingsValidator, ["key", "type", "value"]),
  },
  certifications: {
    table: "certifications",
    resource: "certifications",
    locales: true,
    searchable: ["title", "issuer"],
    prepare: withValidator(certificationsValidator, [
      "type",
      "title",
      "locale",
      "translation_key",
      "issuer",
      "icon",
      "issued_on",
      "period",
      "credential_id",
      "verify_url",
      "description",
      "order_index",
      "is_visible",
    ]),
  },
  testimonials: {
    table: "testimonials",
    resource: "testimonials",
    locales: true,
    searchable: ["author", "quote"],
    prepare: withValidator(testimonialsValidator, [
      "quote",
      "author",
      "locale",
      "translation_key",
      "role",
      "avatar_media_id",
      "order_index",
      "is_visible",
    ]),
  },
};