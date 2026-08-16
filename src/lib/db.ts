import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import postgres from "postgres";

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Resolved Postgres connection string. Accepts both `DATABASE_URL` and the
 * `POSTGRES_URL` (transaction pooler) that the Vercel-Supabase integration
 * syncs. `POSTGRES_URL_NON_POOLING` is deliberately NOT used: it is the
 * direct IPv6 endpoint, unreachable from Vercel serverless.
 */
const DATABASE_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();

/**
 * During `next build`, static generation runs the root layout's
 * `loadSiteSettings()` for every prerendered page. Reaching the remote
 * Postgres pooler from the build machine is slow enough to blow the 60s
 * per-page limit, so we fall back to the fast in-memory SQLite seed at build
 * time. At runtime NEXT_PHASE is unset and Postgres is used as usual.
 */
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";

const USE_POSTGRES = Boolean(DATABASE_URL) && !IS_BUILD;

if (
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "production" &&
  !USE_POSTGRES
) {
  console.error(
    "[db] DATABASE_URL/POSTGRES_URL is not set. The app is falling back to an " +
      "ephemeral in-memory SQLite database: reads work, but no writes persist. " +
      "Link Supabase to Vercel or set DATABASE_URL (transaction pooler)."
  );
}

/**
 * SSL strategy for the Postgres driver:
 *  - DATABASE_SSL=false disables TLS (local Docker/dev).
 *  - otherwise honor `?sslmode=` from the connection string
 *    (disable -> off; verify-* -> verify; require/prefer/allow -> require).
 *  - with no sslmode, default to require for remote hosts and off for localhost.
 */
function pgSslConfig(): boolean | "verify-full" | "require" {
  const override = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (override === "false" || override === "disable" || override === "0") {
    return false;
  }
  try {
    const url = new URL(DATABASE_URL);
    const sslmode = url.searchParams.get("sslmode");
    if (sslmode === "disable") return false;
    if (sslmode === "verify-full" || sslmode === "verify-ca") return "verify-full";
    if (sslmode === "require" || sslmode === "prefer" || sslmode === "allow") {
      return "require";
    }
    const host = url.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      return false;
    }
    return "require";
  } catch {
    return "require";
  }
}

type SeedData = Record<string, unknown[] | undefined>;
function loadSeedData(): SeedData {
  return JSON.parse(readFileSync(path.join(DATA_DIR, "seed.json"), "utf8"));
}

const NUMERIC_KEYS = new Set([
  "id",
  "size_kb",
  "order_index",
  "proficiency",
  "views_count",
  "total",
  "n",
  "m",
  "from",
  "to",
  "per_page",
  "current_page",
  "last_page",
]);

const BOOLEAN_KEYS = new Set([
  "is_visible",
  "is_published",
  "open_in_new_tab",
  "is_active",
  "is_featured",
  "is_read",
]);

function normalizeRow(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value instanceof Date) {
      out[key] = value.toISOString();
    } else if (BOOLEAN_KEYS.has(key) && value !== null) {
      out[key] = Boolean(value);
    } else if (
      value !== null &&
      typeof value === "string" &&
      (key === "id" || key.endsWith("_id") || NUMERIC_KEYS.has(key))
    ) {
      const num = Number(value);
      out[key] = Number.isNaN(num) ? value : num;
    } else {
      out[key] = value;
    }
  }
  return out;
}

// ---------------------------------------------------------------- postgres

let pg: ReturnType<typeof postgres> | null = null;

function getPg() {
  if (!pg) {
    pg = postgres(DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 15,
      ssl: pgSslConfig(),
    });
  }
  return pg;
}

// ---------------------------------------------------------------- sqlite

let sqlite: DatabaseSync | null = null;
let dbPath: string | null = null;

function toBindValue(v: unknown): null | number | string {
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v === undefined || v === null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  return String(v);
}

/**
 * Translates Postgres-flavored SQL to SQLite:
 *  - $n -> ? placeholders (arrays passed to ANY($n::int[]) are expanded)
 *  - strips ::int / ::text / ::timestamp casts
 *  - ILIKE -> LIKE
 *  - ANY($n::int[]) -> IN (?, ?, ...)
 */
function translateSql(
  text: string,
  params: unknown[]
): { sql: string; params: (null | number | string)[] } {
  const outParams: (null | number | string)[] = [];
  const out: string[] = [];
  const re =
    /(?:=|\bIN)\s*ANY\(\s*\$(\d+)\s*::int\[\]\s*\)|\$(\d+)(?:::[a-zA-Z\[\]]+)?|::(?:int|text|bigint|float|numeric|timestamp|timestamptz|boolean)\b|\bILIKE\b/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.push(text.slice(last, m.index));
    const [whole, anyIdx, plainIdx] = m;
    if (anyIdx !== undefined) {
      const arr = (params[Number(anyIdx) - 1] ?? []) as unknown[];
      if (arr.length === 0) {
        out.push("IN (NULL)");
      } else {
        out.push(`IN (${arr.map(() => "?").join(", ")})`);
        outParams.push(...arr.map(toBindValue));
      }
    } else if (plainIdx !== undefined) {
      out.push("?");
      outParams.push(toBindValue(params[Number(plainIdx) - 1]));
    } else if (/^::/.test(whole)) {
      out.push("");
    } else {
      out.push("LIKE");
    }
    last = m.index + whole.length;
  }
  out.push(text.slice(last));
  return { sql: out.join(""), params: outParams };
}

function getSqlite(): DatabaseSync {
  if (sqlite) return sqlite;
  const file = process.env.DB_FILE;
  dbPath = file && file !== ":memory:" ? path.resolve(/* turbopackIgnore: true */ process.cwd(), file) : null;
  if (dbPath) {
    mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const conn = new DatabaseSync(dbPath ?? ":memory:");
  if (dbPath) {
    conn.exec("PRAGMA journal_mode = WAL");
    conn.exec("PRAGMA foreign_keys = ON");
  }
  sqlite = conn;
  return conn;
}

function applySqliteSchema(conn: DatabaseSync): void {
  const raw = readFileSync(path.join(DATA_DIR, "schema.sqlite.sql"), "utf8");
  conn.exec(raw);
}

// ------------------------------------------------------------- query exec

async function exec(
  text: string,
  params: unknown[] = []
): Promise<Record<string, unknown>[]> {
  if (USE_POSTGRES) {
    const bind = params.map((p) => (p === undefined ? null : p)) as never[];
    const rows = (await getPg().unsafe(text, bind)) as Record<
      string,
      unknown
    >[];
    return rows.map((r) => normalizeRow(r));
  }
  const conn = getSqlite();
  const { sql, params: bind } = translateSql(text, params);
  const stmt = conn.prepare(sql);
  const rows = (stmt.all(...bind) as Record<string, unknown>[]).map((r) =>
    normalizeRow(r)
  );
  return rows;
}

async function run(text: string, params: unknown[] = []): Promise<void> {
  if (USE_POSTGRES) {
    const bind = params.map((p) => (p === undefined ? null : p)) as never[];
    await getPg().unsafe(text, bind);
    return;
  }
  const conn = getSqlite();
  const { sql, params: bind } = translateSql(text, params);
  const stmt = conn.prepare(sql);
  stmt.run(...bind);
}

// ------------------------------------------------------------------ seed

type SeedTable =
  | "users"
  | "site_settings"
  | "social_links"
  | "menu_items"
  | "pages"
  | "media"
  | "resumes"
  | "skill_categories"
  | "skills"
  | "projects"
  | "project_links"
  | "project_skill"
  | "certifications"
  | "testimonials"
  | "contact_messages";

const INSERT_ORDER: SeedTable[] = [
  "users",
  "skill_categories",
  "pages",
  "media",
  "skills",
  "projects",
  "project_links",
  "project_skill",
  "resumes",
  "certifications",
  "testimonials",
  "social_links",
  "menu_items",
  "site_settings",
  "contact_messages",
];

const PK_COLUMNS: Partial<Record<SeedTable, string[]>> = {
  project_skill: ["project_id", "skill_id"],
};

const BOOLEAN_COLUMNS: Partial<Record<SeedTable, string[]>> = {
  social_links: ["is_visible"],
  pages: ["is_published"],
  menu_items: ["open_in_new_tab", "is_visible"],
  resumes: ["is_active"],
  skills: ["is_visible"],
  projects: ["is_featured"],
  certifications: ["is_visible"],
  testimonials: ["is_visible"],
  contact_messages: ["is_read"],
};

function seedCell(table: SeedTable, col: string, value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (BOOLEAN_COLUMNS[table]?.includes(col) && (value === 0 || value === 1 || value === "0" || value === "1")) {
    return value === 1 || value === "1";
  }
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

function buildInsert(table: SeedTable, rows: unknown[]): [string, unknown[]][] {
  if (!rows.length) return [];
  const cols = Object.keys(rows[0] as Record<string, unknown>);
  const conflict = (PK_COLUMNS[table] ?? ["id"]).join(", ");
  const valuesList: unknown[] = [];
  const rowGroup: string[] = [];
  let offset = 0;
  for (const row of rows) {
    const placeholders = cols.map((_, i) => `$${offset + i + 1}`).join(", ");
    rowGroup.push(`(${placeholders})`);
    for (const c of cols) {
      valuesList.push(seedCell(table, c, (row as Record<string, unknown>)[c]));
    }
    offset += cols.length;
  }
  const sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES ${rowGroup.join(", ")}
    ON CONFLICT (${conflict}) DO NOTHING`;
  return [[sql, valuesList]];
}

async function applySchema(): Promise<void> {
  if (USE_POSTGRES) {
    // Run the schema one statement at a time: Supabase's pgbouncer transaction
    // pooler can hang on a multi-statement simple query, so a single
    // `unsafe(raw)` here stalls (and can leave a stuck connection that
    // eventually exhausts the pooler slot limit).
    const raw = readFileSync(path.join(DATA_DIR, "schema.postgres.sql"), "utf8")
      .replace(/--[^\n]*/g, "");
    for (const stmt of raw.split(";")) {
      const s = stmt.trim();
      if (!s) continue;
      await getPg().unsafe(s);
    }
    return;
  }
  applySqliteSchema(getSqlite());
}

const SEED_FLAG_KEY = "_seed_complete";
const SEED_FLAG_ID = 999999001;

async function seedDb() {
  // Check the completion flag before applying the schema: the live DB is
  // already seeded, so cold serverless starts must not re-run the CREATE TABLE
  // script over the pooler (that's what stalled requests and exhausted the
  // pooler connections). A fresh DB errors on the flag lookup and falls
  // through to schema + seed below.
  let seeded = false;
  try {
    const flag = await exec("SELECT value FROM site_settings WHERE key = $1", [
      SEED_FLAG_KEY,
    ]);
    seeded = flag.length === 1 && Boolean(flag[0]?.value);
  } catch {
    seeded = false;
  }
  if (seeded) return;

  await applySchema();
  const data = loadSeedData();
  for (const table of INSERT_ORDER) {
    const rowsForTable = data[table];
    if (!Array.isArray(rowsForTable) || !rowsForTable.length) continue;
    for (const [sql, values] of buildInsert(table, rowsForTable)) {
      await run(sql, values);
    }
  }
  await run(
    "INSERT INTO site_settings (id, key, value, type, updated_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (key) DO NOTHING",
    [SEED_FLAG_ID, SEED_FLAG_KEY, "1", "flag", new Date().toISOString()]
  );
}

// ------------------------------------------------------------------ facade

let seedPromise: Promise<void> | null = null;

export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  if (!seedPromise) {
    seedPromise = seedDb().finally(() => {
      seedPromise = null;
    });
  }
  await seedPromise;
  return exec(text, params) as unknown as T[];
}

export async function queryOne<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function resetDb(): Promise<void> {
  if (USE_POSTGRES) {
    // Non-destructive: tests run against the in-memory SQLite path.
    seedPromise = null;
    return;
  }
  const file = process.env.DB_FILE;
  if (sqlite) {
    sqlite.close();
    sqlite = null;
  }
  if (file && file !== ":memory:") {
    try {
      // Drop the file so a fresh DB + seed is created on next access.
      const { rmSync } = await import("node:fs");
      rmSync(path.resolve(/* turbopackIgnore: true */ process.cwd(), file), { force: true });
    } catch {
      // ignore
    }
  }
  seedPromise = null;
}

export async function nextId(table: string): Promise<number> {
  const row = await queryOne<{ m: number }>(
    `SELECT COALESCE(MAX(id), 0) + 1 AS m FROM ${table}`
  );
  return Number(row?.m ?? 1);
}