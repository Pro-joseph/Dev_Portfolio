import { query } from "./db";

// ----------------------------------------------------------- types

export interface MediaRow {
  id: number;
  disk: string;
  path: string;
  filename: string;
  mime_type: string | null;
  size_kb: number | null;
  alt_text: string | null;
  collection: string | null;
  mediable_type: string | null;
  mediable_id: number | null;
  order_index: number;
  created_at?: string | null;
  updated_at?: string | null;
  url?: string;
}

export interface SkillRow {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  proficiency: number | null;
  order_index: number;
}

export interface ProjectRow {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  status: string;
  is_featured: boolean;
  client: string | null;
  role_on_project: string | null;
  started_on: string | null;
  completed_on: string | null;
  views_count: number;
  user_id?: number | null;
  order_index?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ProjectLinkRow {
  id: number;
  label: string;
  url: string;
  type: string;
}

export interface SocialLinkRow {
  id: number;
  platform: string;
  url: string;
  icon: string | null;
}

// ------------------------------------------------------------- dates

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;

export function toDateString(value: string | Date | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const match = String(value).match(DATE_ONLY);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

// ----------------------------------------------------------- media url

export function mediaUrl(row: { disk: string; path: string }): string {
  if (row.disk === "url") return row.path;
  return `/${row.path.replace(/^\/+/, "")}`;
}

// ------------------------------------------------------------- media

export function mediaResource(row: MediaRow | null | undefined): Record<string, unknown> | null {
  if (!row) return null;
  return {
    id: row.id,
    url: mediaUrl(row),
    filename: row.filename,
    mime_type: row.mime_type,
    size_kb: row.size_kb,
    alt_text: row.alt_text,
    collection: row.collection,
    order_index: row.order_index,
  };
}

// ------------------------------------------------------------- skills

export function skillResource(row: SkillRow): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    proficiency: row.proficiency,
    order_index: row.order_index,
  };
}

// ----------------------------------------------------------- projects

export interface ProjectWithRelations {
  project: ProjectRow;
  links: ProjectLinkRow[];
  skills: SkillRow[];
  media: MediaRow[];
  cover: MediaRow | null;
}

async function loadProjectRelations(
  id: number
): Promise<{ links: ProjectLinkRow[]; skills: SkillRow[]; media: MediaRow[]; cover: MediaRow | null }> {
  const [links, skills, media] = await Promise.all([
    query<ProjectLinkRow>(
      "SELECT id, label, url, type FROM project_links WHERE project_id = $1 ORDER BY order_index",
      [id]
    ),
    query<SkillRow>(
      `SELECT s.id, s.name, s.slug, s.icon, s.proficiency, s.order_index
       FROM skills s
       JOIN project_skill ps ON ps.skill_id = s.id
       WHERE ps.project_id = $1
       ORDER BY s.order_index`,
      [id]
    ),
    query<MediaRow>(
      "SELECT * FROM media WHERE mediable_type = 'App\\Models\\Project' AND mediable_id = $1 ORDER BY order_index",
      [id]
    ),
  ]);
  const cover =
    media.find((m) => m.collection === "cover") ?? media[0] ?? null;
  return { links, skills, media, cover };
}

export function projectListResource(p: ProjectWithRelations): Record<string, unknown> {
  return {
    id: p.project.id,
    title: p.project.title,
    slug: p.project.slug,
    summary: p.project.summary,
    status: p.project.status,
    is_featured: p.project.is_featured,
    client: p.project.client,
    role_on_project: p.project.role_on_project,
    started_on: toDateString(p.project.started_on),
    completed_on: toDateString(p.project.completed_on),
    views_count: p.project.views_count,
    cover: mediaResource(p.cover),
    skills: p.skills.map((s) => s.name),
  };
}

export function projectResource(p: ProjectWithRelations): Record<string, unknown> {
  return {
    id: p.project.id,
    title: p.project.title,
    slug: p.project.slug,
    summary: p.project.summary,
    description: p.project.description,
    status: p.project.status,
    is_featured: p.project.is_featured,
    client: p.project.client,
    role_on_project: p.project.role_on_project,
    started_on: toDateString(p.project.started_on),
    completed_on: toDateString(p.project.completed_on),
    views_count: p.project.views_count,
    links: p.links.map((l) => ({
      id: l.id,
      label: l.label,
      url: l.url,
      type: l.type,
    })),
    skills: p.skills.map(skillResource),
    gallery: p.media.map(mediaResource),
    cover: mediaResource(p.cover),
  };
}

export async function buildProject(p: ProjectRow): Promise<ProjectWithRelations> {
  const relations = await loadProjectRelations(p.id);
  return { project: p, ...relations };
}

export async function buildProjectList(rows: ProjectRow[]): Promise<ProjectWithRelations[]> {
  return Promise.all(rows.map(buildProject));
}

// --------------------------------------------------------------- site

export interface SiteSettingsRow {
  key: string;
  value: string | null;
  type: string;
}

export interface MenuItemRow {
  id: number;
  parent_id: number | null;
  label: string;
  page_id: number | null;
  external_url: string | null;
  open_in_new_tab: boolean;
  order_index: number;
  is_visible: boolean;
}

function castSetting(row: SiteSettingsRow): unknown {
  const value = row.value;
  switch (row.type) {
    case "boolean":
      return value === "1" || value === "true" || value === "1" || String(value) === "1";
    case "json":
      try {
        return typeof value === "string" ? JSON.parse(value) : value;
      } catch {
        return value;
      }
    case "text":
    case "string":
    default:
      return value;
  }
}

async function loadSiteData(): Promise<{
  settings: Record<string, unknown>;
  social_links: Record<string, unknown>[];
  menu: Record<string, unknown>[];
  resume: Record<string, unknown> | null;
}> {
  const [settings, socialLinks, menuItems, resumes] = await Promise.all([
    query<SiteSettingsRow>("SELECT key, value, type FROM site_settings"),
    query<SocialLinkRow>(
      "SELECT id, platform, url, icon FROM social_links WHERE is_visible = true ORDER BY order_index"
    ),
    query<MenuItemRow>(
      "SELECT * FROM menu_items WHERE is_visible = true ORDER BY order_index"
    ),
    query<{ resume_id: number; label: string; language: string; media_disk: string; media_path: string }>(
      `SELECT r.id AS resume_id, r.label, r.language,
              m.disk AS media_disk, m.path AS media_path
       FROM resumes r
       JOIN media m ON m.id = r.media_id
       WHERE r.is_active = true
       ORDER BY r.created_at DESC
       LIMIT 1`
    ),
  ]);

  const settingMap: Record<string, unknown> = {};
  for (const s of settings) settingMap[s.key] = castSetting(s);

  const pages = await query<{ id: number; slug: string }>(
    "SELECT id, slug FROM pages"
  );
  const pageBySlug = new Map(pages.map((p) => [p.id, p.slug]));
  const pageByParent = new Map<number | null, MenuItemRow[]>();
  for (const item of menuItems) {
    const list = pageByParent.get(item.parent_id) ?? [];
    list.push(item);
    pageByParent.set(item.parent_id, list);
  }

  const urlFor = (item: MenuItemRow): string | null =>
    item.external_url ?? (item.page_id ? `/${pageBySlug.get(item.page_id) ?? ""}` : null);

  const menu = (pageByParent.get(null) ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    url: urlFor(item),
    open_in_new_tab: item.open_in_new_tab,
    children: (pageByParent.get(item.id) ?? []).map((child) => ({
      id: child.id,
      label: child.label,
      url: urlFor(child),
      open_in_new_tab: child.open_in_new_tab,
    })),
  }));

  const resume = resumes[0]
    ? {
        id: resumes[0].resume_id,
        label: resumes[0].label,
        language: resumes[0].language,
        url: mediaUrl({ disk: resumes[0].media_disk, path: resumes[0].media_path }),
      }
    : null;

  return {
    settings: settingMap,
    social_links: socialLinks.map((l) => ({
      id: l.id,
      platform: l.platform,
      url: l.url,
      icon: l.icon,
    })),
    menu,
    resume,
  };
}

export async function siteResource(): Promise<Record<string, unknown>> {
  return loadSiteData();
}

// ------------------------------------------------------- certifications

export interface CertificationRow {
  id: number;
  type: string;
  title: string;
  issuer: string | null;
  icon: string | null;
  period: string | null;
  issued_on: string | null;
  credential_id: string | null;
  verify_url: string | null;
  description: string | null;
}

export function certificationResource(row: CertificationRow): Record<string, unknown> {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    issuer: row.issuer,
    icon: row.icon,
    period: row.period,
    issued_on: toDateString(row.issued_on),
    credential_id: row.credential_id,
    verify_url: row.verify_url,
    description: row.description,
  };
}

// --------------------------------------------------------- testimonials

export interface TestimonialRow {
  id: number;
  quote: string;
  author: string;
  role: string | null;
  avatar_media_id: number | null;
}

export function testimonialResource(row: TestimonialRow & { avatar: MediaRow | null }): Record<string, unknown> {
  return {
    id: row.id,
    quote: row.quote,
    author: row.author,
    role: row.role,
    avatar: mediaResource(row.avatar),
  };
}

// --------------------------------------------------------------- pages

export interface PageRow {
  id: number;
  title: string;
  slug: string;
  content: unknown[] | null;
  meta_title: string | null;
  meta_description: string | null;
}

export function pageResource(row: PageRow): Record<string, unknown> {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    meta_title: row.meta_title,
    meta_description: row.meta_description,
  };
}