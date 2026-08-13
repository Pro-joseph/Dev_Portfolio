-- Postgres schema mirroring the Laravel migrations (ids are BIGINT PRIMARY KEY;
-- id assignment is handled by the app via MAX(id)+1 so it works on pg-mem too).

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified_at TIMESTAMPTZ NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS site_settings (
  id BIGINT PRIMARY KEY,
  key VARCHAR(80) NOT NULL UNIQUE,
  value TEXT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'string',
  updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS social_links (
  id BIGINT PRIMARY KEY,
  platform VARCHAR(40) NOT NULL,
  url VARCHAR(500) NOT NULL,
  icon VARCHAR(120) NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS pages (
  id BIGINT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  content JSON NULL,
  meta_title VARCHAR(160) NULL,
  meta_description VARCHAR(300) NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS menu_items (
  id BIGINT PRIMARY KEY,
  parent_id BIGINT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  label VARCHAR(80) NOT NULL,
  page_id BIGINT NULL REFERENCES pages(id) ON DELETE SET NULL,
  external_url VARCHAR(500) NULL,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS media (
  id BIGINT PRIMARY KEY,
  disk VARCHAR(30) NOT NULL DEFAULT 'public',
  path VARCHAR(500) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NULL,
  size_kb INTEGER NULL,
  alt_text VARCHAR(255) NULL,
  collection VARCHAR(50) NULL,
  mediable_type VARCHAR(60) NULL,
  mediable_id BIGINT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_media_mediable ON media (mediable_type, mediable_id);

CREATE TABLE IF NOT EXISTS resumes (
  id BIGINT PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'fr',
  media_id BIGINT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS skill_categories (
  id BIGINT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS skills (
  id BIGINT PRIMARY KEY,
  skill_category_id BIGINT NULL REFERENCES skill_categories(id) ON DELETE SET NULL,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  icon VARCHAR(120) NULL,
  proficiency INTEGER NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  summary VARCHAR(280) NULL,
  description TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  client VARCHAR(160) NULL,
  role_on_project VARCHAR(160) NULL,
  started_on DATE NULL,
  completed_on DATE NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects (is_featured);

CREATE TABLE IF NOT EXISTS project_links (
  id BIGINT PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label VARCHAR(80) NOT NULL,
  url VARCHAR(500) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'other',
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS project_skill (
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, skill_id)
);

CREATE TABLE IF NOT EXISTS certifications (
  id BIGINT PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'certification',
  title VARCHAR(160) NOT NULL,
  issuer VARCHAR(160) NULL,
  icon VARCHAR(120) NULL,
  period VARCHAR(60) NULL,
  issued_on DATE NULL,
  credential_id VARCHAR(80) NULL,
  verify_url VARCHAR(500) NULL,
  description TEXT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS testimonials (
  id BIGINT PRIMARY KEY,
  quote TEXT NOT NULL,
  author VARCHAR(120) NOT NULL,
  role VARCHAR(160) NULL,
  avatar_media_id BIGINT NULL REFERENCES media(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  subject VARCHAR(200) NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);