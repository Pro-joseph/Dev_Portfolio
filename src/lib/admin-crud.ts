import { query, queryOne, nextId } from "./db";
import { mediaPublicUrl } from "./media-storage";
import { uniqueSlug } from "./slug";
import { json, validationError, notFound, paginate } from "./http";
import { PROJECT_MORPH } from "./enums";
import { PAGE_SIZE_ADMIN } from "./config";

// ------------------------------------------------------------- casts

export function laravelDateTime(value: string | Date | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const iso =
    value instanceof Date
      ? value.toISOString()
      : String(value).replace(" ", "T");
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
  if (!m) return null;
  return `${m[1]}T${m[2]}.000000Z`;
}

function laravelDateOnly(value: string | Date | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const iso =
    value instanceof Date
      ? value.toISOString()
      : String(value).replace(" ", "T");
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? `${m[1]}T00:00:00.000000Z` : null;
}

type CastKind = "bool" | "int" | "datetime" | "date" | "json";

const TIMESTAMPED_TABLES = new Set([
  "users",
  "pages",
  "media",
  "resumes",
  "skills",
  "projects",
  "certifications",
  "testimonials",
  "contact_messages",
]);

const UPDATED_ONLY_TABLES = new Set(["site_settings"]);

function applyTimestamps(table: string, data: Record<string, unknown>): void {
  const now = new Date().toISOString();
  if (TIMESTAMPED_TABLES.has(table)) {
    if (!data.created_at) data.created_at = now;
    if (!data.updated_at) data.updated_at = now;
  } else if (UPDATED_ONLY_TABLES.has(table)) {
    if (!data.updated_at) data.updated_at = now;
  }
}

const TABLE_CASTS: Record<string, Record<string, CastKind>> = {
  projects: {
    is_featured: "bool",
    order_index: "int",
    views_count: "int",
    started_on: "date",
    completed_on: "date",
    created_at: "datetime",
    updated_at: "datetime",
  },
  pages: {
    is_published: "bool",
    order_index: "int",
    content: "json",
    created_at: "datetime",
    updated_at: "datetime",
  },
  skills: {
    skill_category_id: "int",
    order_index: "int",
    is_visible: "bool",
    created_at: "datetime",
    updated_at: "datetime",
  },
  skill_categories: {
    order_index: "int",
  },
  resumes: {
    is_active: "bool",
    media_id: "int",
    created_at: "datetime",
    updated_at: "datetime",
  },
  social_links: {
    order_index: "int",
    is_visible: "bool",
  },
  menu_items: {
    parent_id: "int",
    page_id: "int",
    open_in_new_tab: "bool",
    order_index: "int",
    is_visible: "bool",
  },
  site_settings: {
    updated_at: "datetime",
  },
  certifications: {
    issued_on: "date",
    order_index: "int",
    is_visible: "bool",
    created_at: "datetime",
    updated_at: "datetime",
  },
  testimonials: {
    avatar_media_id: "int",
    order_index: "int",
    is_visible: "bool",
    created_at: "datetime",
    updated_at: "datetime",
  },
  contact_messages: {
    is_read: "bool",
    created_at: "datetime",
    updated_at: "datetime",
  },
  media: {
    size_kb: "int",
    mediable_id: "int",
    order_index: "int",
    created_at: "datetime",
    updated_at: "datetime",
  },
  users: {
    created_at: "datetime",
    updated_at: "datetime",
  },
};

export function castRow(table: string, raw: Record<string, unknown>): Record<string, unknown> {
  const casts = TABLE_CASTS[table] ?? {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    const kind = casts[key];
    if (kind === "bool") out[key] = Boolean(value);
    else if (kind === "int") out[key] = value === null ? null : Number(value);
    else if (kind === "date") out[key] = laravelDateOnly(value as string);
    else if (kind === "datetime") out[key] = laravelDateTime(value as string);
    else if (kind === "json") {
      try {
        out[key] = typeof value === "string" ? JSON.parse(value) : value;
      } catch {
        out[key] = null;
      }
    } else out[key] = value;
  }
  return out;
}

export function mediaUrlFor(raw: Record<string, unknown>): string {
  const disk = String(raw.disk ?? "public");
  const path = String(raw.path ?? "");
  if (disk === "url") return path;
  if (disk === "supabase") return mediaPublicUrl(path) ?? path;
  return `/${path.replace(/^\/+/, "")}`;
}

export function mediaRowWithUrl(raw: Record<string, unknown>): Record<string, unknown> {
  const row = castRow("media", raw);
  row.url = mediaUrlFor(raw);
  return row;
}

// ------------------------------------------------------------ relations

type RelationLoader = (
  row: Record<string, unknown>
) => Promise<Record<string, unknown>>;

const SKILL_QUERY = `SELECT s.id, s.skill_category_id, s.name, s.slug, s.icon, s.order_index, s.is_visible, s.created_at, s.updated_at FROM skills s`;

const relationLoaders: Record<string, RelationLoader> = {
  projects: async (row) => {
    const id = Number(row.id);
    const [links, skills, media] = await Promise.all([
      query<Record<string, unknown>>(
        `SELECT id, project_id, label, url, type, order_index FROM project_links WHERE project_id = $1 ORDER BY order_index`,
        [id]
      ),
      query<Record<string, unknown>>(
        `${SKILL_QUERY} JOIN project_skill ps ON ps.skill_id = s.id WHERE ps.project_id = $1 ORDER BY s.order_index`,
        [id]
      ),
      query<Record<string, unknown>>(
        `SELECT m.* FROM media m WHERE m.mediable_type = '${PROJECT_MORPH}' AND m.mediable_id = $1 ORDER BY m.order_index`,
        [id]
      ),
    ]);
    const mediaRows = media.map(mediaRowWithUrl);
    return {
      links: links.map((l) => castRow("project_links", l)),
      skills: skills.map((s) => castRow("skills", s)),
      media: mediaRows,
      cover: mediaRows[0] ?? null,
    };
  },
  skills: async (row) => {
    const category = await queryOne<Record<string, unknown>>(
      "SELECT id, name, slug, order_index FROM skill_categories WHERE id = $1",
      [row.skill_category_id]
    );
    return { category: category ? castRow("skill_categories", category) : null };
  },
  skill_categories: async (row) => {
    const skills = await query<Record<string, unknown>>(
      `SELECT * FROM skills WHERE skill_category_id = $1 ORDER BY order_index`,
      [row.id]
    );
    return { skills: skills.map((s) => castRow("skills", s)) };
  },
  resumes: async (row) => {
    const media = await queryOne<Record<string, unknown>>(
      "SELECT * FROM media WHERE id = $1",
      [row.media_id]
    );
    return { media: media ? mediaRowWithUrl(media) : null };
  },
  menu_items: async (row) => {
    const id = Number(row.id);
    const [parent, children, page] = await Promise.all([
      queryOne<Record<string, unknown>>("SELECT * FROM menu_items WHERE id = $1", [
        row.parent_id,
      ]),
      query<Record<string, unknown>>(
        "SELECT * FROM menu_items WHERE parent_id = $1 ORDER BY order_index",
        [id]
      ),
      queryOne<Record<string, unknown>>("SELECT id, slug FROM pages WHERE id = $1", [
        row.page_id,
      ]),
    ]);
    return {
      parent: parent ? castRow("menu_items", parent) : null,
      children: children.map((c) => castRow("menu_items", c)),
      page: page ? castRow("pages", page) : null,
    };
  },
  testimonials: async (row) => {
    const avatar = await queryOne<Record<string, unknown>>(
      "SELECT * FROM media WHERE id = $1",
      [row.avatar_media_id]
    );
    return { avatar: avatar ? mediaRowWithUrl(avatar) : null };
  },
};

async function withRelations(
  resource: string,
  rows: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const loader = relationLoaders[resource];
  if (!loader) return rows;
  const out: Record<string, unknown>[] = [];
  for (const row of rows) {
    out.push({ ...row, ...(await loader(row)) });
  }
  return out;
}

// ------------------------------------------------------------ crud object

export interface Crud {
  table: string;
  resource: string;
  searchable?: string[];
  hasSlug?: boolean;
  slugSource?: "title" | "name";
  /** the table carries a `locale` column and can be filtered by it */
  locales?: boolean;
  /** additional fields allowed in insert/update */
  fields?: string[];
  /**
   * Payload keys kept for prepare/afterInsert/afterUpdate but NOT written
   * to the database as columns (e.g. relation arrays).
   */
  virtualFields?: string[];
  /**
   * Validate + transform the payload. Must return { ok: true, data } or { ok: false, errors }.
   * When absent, all payload fields are accepted as-is.
   */
  prepare?: (
    payload: Record<string, unknown>,
    id?: number
  ) => Promise<ValidationResult> | ValidationResult;
  afterInsert?: (id: number, payload: Record<string, unknown>) => Promise<void>;
  afterUpdate?: (
    id: number,
    payload: Record<string, unknown>,
    existing: Record<string, unknown>
  ) => Promise<void>;
}

type ValidationResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; errors: Record<string, string[]> };

async function ensureSlug(
  crud: Crud,
  payload: Record<string, unknown>,
  ignoreId?: number
): Promise<Record<string, unknown>> {
  if (!crud.hasSlug) return payload;
  const data = { ...payload };
  if (!data.slug || !String(data.slug).trim()) {
    const source = crud.slugSource ?? "title";
    if (data[source] && String(data[source]).trim()) {
      data.slug = await uniqueSlug(
        crud.table,
        String(data[source]),
        ignoreId,
        data.locale ? String(data.locale) : null
      );
    }
  }
  return data;
}

async function runPrepare(
  crud: Crud,
  payload: Record<string, unknown>,
  id?: number
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; errors: Record<string, string[]> }> {
  if (crud.prepare) {
    return await crud.prepare(payload, id);
  }
  const data: Record<string, unknown> = {};
  for (const f of crud.fields ?? Object.keys(payload)) {
    if (f in payload) data[f] = payload[f];
  }
  return { ok: true, data };
}

async function loadRow(crud: Crud, row: Record<string, unknown>): Promise<Record<string, unknown>> {
  const casted = castRow(crud.table, row);
  const withRels = await withRelations(crud.resource, [casted]);
  return withRels[0];
}

// -------------------------------------------------------------- handlers

export async function crudIndex(crud: Crud, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const perPage = Math.max(1, Number(url.searchParams.get("per_page")) || PAGE_SIZE_ADMIN);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const locale = url.searchParams.get("locale")?.trim() ?? "";

  let where = "";
  const params: unknown[] = [];

  if (search && crud.searchable?.length) {
    const ors = crud.searchable
      .map((_, i) => `${_} ILIKE $${params.length + 1 + i}`)
      .join(" OR ");
    params.push(`%${search}%`);
    where = ` WHERE (${ors})`;
  }

  if (crud.locales && locale) {
    params.push(locale);
    where = `${where ? where + " AND" : " WHERE"} locale = $${params.length}`;
  }

  const totalRow = await queryOne<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM ${crud.table}${where}`,
    params
  );
  const total = Number(totalRow?.n ?? 0);
  const offset = (page - 1) * perPage;

  const raw = await query<Record<string, unknown>>(
    `SELECT * FROM ${crud.table}${where} ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, perPage, offset]
  );

  const rows = [];
  for (const row of raw) rows.push(await loadRow(crud, row));

  const paginator = paginate({ page, perPage, total, data: rows, url: request.url });
  return json(paginator);
}

export async function crudStore(crud: Crud, request: Request): Promise<Response> {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(await request.text());
  } catch {
    return validationError({ data: ["Invalid JSON body."] });
  }

  const result = await runPrepare(crud, payload);
  if (!result.ok) return validationError(result.errors);
  let data = result.data;

  data = await ensureSlug(crud, data);
  applyTimestamps(crud.table, data);

  const id = await nextId(crud.table);
  data = { id, ...data };
  const virtuals = new Set(crud.virtualFields ?? []);
  const cols = Object.keys(data).filter((c) => !virtuals.has(c));
  if (cols.length === 0) {
    return validationError({ data: ["No fields provided."] });
  }
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  await query(
    `INSERT INTO ${crud.table} (${cols.join(", ")}) VALUES (${placeholders})`,
    cols.map((c) => {
      const v = data[c];
      if (v === null || v === undefined) return null;
      if (typeof v === "object") return JSON.stringify(v);
      return v;
    })
  );

  if (crud.afterInsert) await crud.afterInsert(id, data);

  const row = await queryOne<Record<string, unknown>>(
    `SELECT * FROM ${crud.table} WHERE id = $1`,
    [id]
  );
  return json({ data: await loadRow(crud, row ?? {}) }, 201);
}

export async function crudShow(crud: Crud, id: number): Promise<Response> {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT * FROM ${crud.table} WHERE id = $1`,
    [id]
  );
  if (!row) return notFound();
  return json({ data: await loadRow(crud, row) });
}

export async function crudUpdate(crud: Crud, id: number, request: Request): Promise<Response> {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(await request.text());
  } catch {
    return validationError({ data: ["Invalid JSON body."] });
  }

  const existing = await queryOne<Record<string, unknown>>(
    `SELECT * FROM ${crud.table} WHERE id = $1`,
    [id]
  );
  if (!existing) return notFound();

  const result = await runPrepare(crud, payload, id);
  if (!result.ok) return validationError(result.errors);
  let data = result.data;

  data = await ensureSlug(crud, data, id);

  if (crud.afterUpdate) {
    await crud.afterUpdate(id, data, existing);
  }

  applyTimestamps(crud.table, data);

  const virtuals = new Set(crud.virtualFields ?? []);
  const cols = Object.keys(data).filter((c) => !virtuals.has(c));
  if (cols.length) {
    const assignments = cols.map((c, i) => `${c} = $${i + 1}`).join(", ");
    await query(
      `UPDATE ${crud.table} SET ${assignments} WHERE id = $${cols.length + 1}`,
      [
        ...cols.map((c) => {
          const v = data[c];
          if (v === null || v === undefined) return null;
          if (typeof v === "object") return JSON.stringify(v);
          return v;
        }),
        id,
      ]
    );
  }

  const row = await queryOne<Record<string, unknown>>(
    `SELECT * FROM ${crud.table} WHERE id = $1`,
    [id]
  );
  return json({ data: await loadRow(crud, row ?? {}) });
}

export async function crudDestroy(crud: Crud, id: number): Promise<Response> {
  const existing = await queryOne<Record<string, unknown>>(
    `SELECT * FROM ${crud.table} WHERE id = $1`,
    [id]
  );
  if (!existing) return notFound();
  await query(`DELETE FROM ${crud.table} WHERE id = $1`, [id]);
  return json({ message: "Deleted." });
}