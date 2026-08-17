export interface Media {
  id: number;
  url: string | null;
  filename: string;
  mime_type: string | null;
  size_kb: number | null;
  alt_text: string | null;
  collection: string | null;
  order_index: number;
}

export interface Skill {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  order_index: number;
}

export interface SkillCategory {
  id: number;
  name: string;
  slug: string;
  order_index: number;
  skills: Skill[];
}

export type ProjectStatus = "draft" | "published" | "archived";
export type ProjectLinkType = "github" | "demo" | "docs" | "video" | "other";

export interface ProjectLink {
  id: number;
  label: string;
  url: string;
  type: ProjectLinkType;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  status: ProjectStatus;
  is_featured: boolean;
  client: string | null;
  role_on_project: string | null;
  started_on: string | null;
  completed_on: string | null;
  views_count: number;
  links: ProjectLink[];
  skills: Skill[];
  gallery: Media[];
  cover: Media | null;
}

export interface ProjectListItem {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  status: ProjectStatus;
  is_featured: boolean;
  client: string | null;
  role_on_project: string | null;
  started_on: string | null;
  completed_on: string | null;
  views_count: number;
  cover: Media | null;
  skills: string[];
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: unknown[] | null;
  meta_title: string | null;
  meta_description: string | null;
}

export interface Certification {
  id: number;
  type: "education" | "certification";
  title: string;
  issuer: string | null;
  icon: string | null;
  period: string | null;
  issued_on: string | null;
  credential_id: string | null;
  verify_url: string | null;
  description: string | null;
}

export interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string | null;
  avatar: Media | null;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface MenuEntry {
  id: number;
  label: string;
  url: string | null;
  open_in_new_tab: boolean;
  children: MenuEntry[];
}

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  icon: string | null;
}

export interface ResumeEntry {
  id: number;
  label: string;
  language: string;
  filename: string;
  url: string;
}

export interface SiteData {
  settings: Record<string, unknown>;
  social_links: SocialLink[];
  menu: MenuEntry[];
  resume: ResumeEntry | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor";
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Paginated<T> {
  current_page: number;
  data: T[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  links: { url: string | null; label: string; active: boolean }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface DashboardStats {
  total_views: number;
  views_delta: string;
  views_series: { date: string; views: number }[];
  total_projects: number;
  published_projects: number;
  draft_projects: number;
  total_skills: number;
  total_certifications: number;
  unread_messages: number;
  total_messages: number;
  active_resume: { label: string; language: string; url: string } | null;
  recent_projects: {
    id: number;
    title: string;
    slug: string;
    status: ProjectStatus;
    views_count: number;
    updated_at: string;
  }[];
  media_storage: {
    used_bytes: number;
    quota_bytes: number;
    breakdown: { images: number; documents: number; video: number; other: number };
  };
}

export interface SystemStatus {
  ok: boolean;
  status: string;
  db: { ok: boolean; latency_ms: number };
  storage: { status: string; latency_ms: number | null };
  timestamp: string;
}
