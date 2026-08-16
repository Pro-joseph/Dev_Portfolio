import { query, queryOne } from "./db";
import { mediaPublicUrl } from "./media-storage";
import { PROJECT_MORPH } from "./enums";
import { PAGE_SIZE_PUBLIC } from "./config";
import type {
  Certification,
  Project,
  ProjectListItem,
  SiteData,
  SkillCategory,
  Testimonial,
} from "./types";

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
  if (row.disk === "supabase") return mediaPublicUrl(row.path) ?? row.path;
  return `/${row.path.replace(/^\/+/, "")}`;
}

/**
 * URL for the resume download button. Supabase public object URLs are told to
 * send a Content-Disposition attachment via the `download` query param, so
 * clicking the button downloads the file instead of opening it in the tab.
 */
export function resumeDownloadUrl(row: { disk: string; path: string }): string {
  const url = mediaUrl(row);
  if (row.disk === "supabase") {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}download=`;
  }
  return url;
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
      "SELECT * FROM media WHERE mediable_type = '" + PROJECT_MORPH + "' AND mediable_id = $1 ORDER BY order_index",
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

/** Batched N+1-free relation load for a whole page of projects (3 queries total). */
export async function buildProjectListBatched(
  rows: ProjectRow[]
): Promise<ProjectWithRelations[]> {
  if (!rows.length) return [];
  const ids = rows.map((p) => p.id);
  const [links, skills, media] = await Promise.all([
    query<ProjectLinkRow & { project_id: number }>(
      "SELECT id, project_id, label, url, type FROM project_links WHERE project_id = ANY($1::int[]) ORDER BY order_index",
      [ids]
    ),
    query<SkillRow & { project_id: number }>(
      `SELECT s.id, s.name, s.slug, s.icon, s.proficiency, s.order_index, ps.project_id
       FROM skills s
       JOIN project_skill ps ON ps.skill_id = s.id
       WHERE ps.project_id = ANY($1::int[])
       ORDER BY s.order_index`,
      [ids]
    ),
    query<MediaRow & { project_id: number }>(
      `SELECT m.*, m.mediable_id AS project_id
       FROM media m
       WHERE m.mediable_type = '${PROJECT_MORPH}' AND m.mediable_id = ANY($1::int[])
       ORDER BY m.order_index`,
      [ids]
    ),
  ]);

  const linksByProject = new Map<number, ProjectLinkRow[]>();
  const skillsByProject = new Map<number, SkillRow[]>();
  const mediaByProject = new Map<number, MediaRow[]>();
  for (const l of links) {
    const list = linksByProject.get(l.project_id) ?? [];
    list.push(l);
    linksByProject.set(l.project_id, list);
  }
  for (const s of skills) {
    const list = skillsByProject.get(s.project_id) ?? [];
    list.push(s);
    skillsByProject.set(s.project_id, list);
  }
  for (const m of media) {
    const list = mediaByProject.get(m.project_id) ?? [];
    list.push(m);
    mediaByProject.set(m.project_id, list);
  }

  return rows.map((project) => {
    const links = linksByProject.get(project.id) ?? [];
    const skills = skillsByProject.get(project.id) ?? [];
    const media = mediaByProject.get(project.id) ?? [];
    const cover = media.find((m) => m.collection === "cover") ?? media[0] ?? null;
    return { project, links, skills, media, cover };
  });
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
      return value === "1" || value === "true";
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
        url: resumeDownloadUrl({ disk: resumes[0].media_disk, path: resumes[0].media_path }),
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

// ------------------------------------------------------------ data loaders

export interface ProjectListQuery {
  featured?: boolean;
  search?: string;
  perPage?: number;
  page?: number;
}

export async function loadProjectList(q: ProjectListQuery): Promise<{
  rows: ProjectRow[];
  total: number;
  perPage: number;
  page: number;
}> {
  const perPage = Math.max(1, q.perPage || PAGE_SIZE_PUBLIC);
  const page = Math.max(1, q.page || 1);

  const conditions: string[] = ["status = 'published'"];
  const params: unknown[] = [];

  if (q.featured) {
    params.push(true);
    conditions.push(`is_featured = $${params.length}`);
  }
  if (q.search) {
    params.push(`%${q.search}%`);
    conditions.push(
      `(title ILIKE $${params.length} OR summary ILIKE $${params.length})`
    );
  }

  const where = conditions.join(" AND ");
  const totalRow = await query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM projects WHERE ${where}`,
    params
  );
  const total = Number(totalRow[0]?.n ?? 0);

  const rows = await query<ProjectRow>(
    `SELECT * FROM projects WHERE ${where}
     ORDER BY is_featured DESC, order_index ASC, id ASC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, perPage, (page - 1) * perPage]
  );

  return { rows, total, perPage, page };
}

export async function loadProjectBySlug(
  slug: string
): Promise<ProjectWithRelations | null> {
  const project = await queryOne<ProjectRow>(
    "SELECT * FROM projects WHERE slug = $1 AND status = 'published'",
    [slug]
  );
  if (!project) return null;
  return buildProject(project);
}

export async function loadSkillCategories(): Promise<Record<string, unknown>[]> {
  const categories = await query<{
    id: number;
    name: string;
    slug: string;
    order_index: number;
  }>(
    "SELECT id, name, slug, order_index FROM skill_categories ORDER BY order_index"
  );
  return Promise.all(
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
}

export async function loadTestimonials(): Promise<Record<string, unknown>[]> {
  const testimonials = await query<TestimonialRow>(
    "SELECT * FROM testimonials WHERE is_visible = true ORDER BY order_index"
  );
  return Promise.all(
    testimonials.map(async (t) => {
      const avatar = await queryOne<MediaRow>(
        "SELECT * FROM media WHERE id = $1",
        [t.avatar_media_id]
      );
      return testimonialResource({ ...t, avatar });
    })
  );
}

export async function loadCertifications(): Promise<Record<string, unknown>[]> {
  const certifications = await query<CertificationRow>(
    "SELECT * FROM certifications WHERE is_visible = true ORDER BY order_index"
  );
  return certifications.map(certificationResource);
}

// ---------------------------------------------------- typed page loaders

export async function getSiteData(): Promise<SiteData> {
  return (await siteResource()) as unknown as SiteData;
}

export async function getSkillCategories(): Promise<SkillCategory[]> {
  return (await loadSkillCategories()) as unknown as SkillCategory[];
}

export async function getTestimonialsData(): Promise<Testimonial[]> {
  return (await loadTestimonials()) as unknown as Testimonial[];
}

export async function getCertificationsData(): Promise<Certification[]> {
  return (await loadCertifications()) as unknown as Certification[];
}

export async function getProjectListItems(
  q: ProjectListQuery
): Promise<ProjectListItem[]> {
  const { rows } = await loadProjectList(q);
  const projects = await buildProjectListBatched(rows);
  return projects.map((p) => projectListResource(p) as unknown as ProjectListItem);
}

export async function getProjectsFull(q: ProjectListQuery): Promise<Project[]> {
  const { rows } = await loadProjectList(q);
  const projects = await buildProjectListBatched(rows);
  return projects.map((p) => projectResource(p) as unknown as Project);
}

export async function getProjectBySlugTyped(slug: string): Promise<Project | null> {
  const withRels = await loadProjectBySlug(slug);
  return withRels ? (projectResource(withRels) as unknown as Project) : null;
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