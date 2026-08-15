-- Postgres schema mirroring the Laravel migrations.
-- ids are BIGINT PRIMARY KEY; id assignment is handled by the app via MAX(id)+1.
-- Booleans are native BOOLEAN; timestamps are ISO-8601 TEXT.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified_at TEXT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  remember_token TEXT NULL,
  created_at TEXT NULL,
  updated_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS site_settings (
  id BIGINT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NULL,
  type TEXT NOT NULL DEFAULT 'string',
  updated_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS social_links (
  id BIGINT PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS pages (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NULL,
  meta_title TEXT NULL,
  meta_description TEXT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NULL,
  updated_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS menu_items (
  id BIGINT PRIMARY KEY,
  parent_id BIGINT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  page_id BIGINT NULL REFERENCES pages(id) ON DELETE SET NULL,
  external_url TEXT NULL,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS media (
  id BIGINT PRIMARY KEY,
  disk TEXT NOT NULL DEFAULT 'public',
  path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NULL,
  size_kb INTEGER NULL,
  alt_text TEXT NULL,
  collection TEXT NULL,
  mediable_type TEXT NULL,
  mediable_id BIGINT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NULL,
  updated_at TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_media_mediable ON media (mediable_type, mediable_id);

CREATE TABLE IF NOT EXISTS resumes (
  id BIGINT PRIMARY KEY,
  label TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr',
  media_id BIGINT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TEXT NULL,
  updated_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS skill_categories (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS skills (
  id BIGINT PRIMARY KEY,
  skill_category_id BIGINT NULL REFERENCES skill_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NULL,
  proficiency INTEGER NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TEXT NULL,
  updated_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  client TEXT NULL,
  role_on_project TEXT NULL,
  started_on TEXT NULL,
  completed_on TEXT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NULL,
  updated_at TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects (is_featured);

CREATE TABLE IF NOT EXISTS project_links (
  id BIGINT PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS project_skill (
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, skill_id)
);

CREATE TABLE IF NOT EXISTS certifications (
  id BIGINT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'certification',
  title TEXT NOT NULL,
  issuer TEXT NULL,
  icon TEXT NULL,
  period TEXT NULL,
  issued_on TEXT NULL,
  credential_id TEXT NULL,
  verify_url TEXT NULL,
  description TEXT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TEXT NULL,
  updated_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS testimonials (
  id BIGINT PRIMARY KEY,
  quote TEXT NOT NULL,
  author TEXT NOT NULL,
  role TEXT NULL,
  avatar_media_id BIGINT NULL REFERENCES media(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TEXT NULL,
  updated_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TEXT NULL,
  updated_at TEXT NULL
);