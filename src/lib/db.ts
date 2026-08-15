import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import postgres from "postgres";

const DATA_DIR = path.join(process.cwd(), "data");

const USE_POSTGRES = Boolean(process.env.DATABASE_URL?.trim());

if (
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "production" &&
  !USE_POSTGRES
) {
  console.error(
    "[db] DATABASE_URL is not set. The app is falling back to an ephemeral " +
      "in-memory SQLite database: reads work, but no writes persist. " +
      "Set DATABASE_URL (Supabase transaction pooler) in the Vercel project."
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
    const url = new URL(process.env.DATABASE_URL as string);
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
    pg = postgres(process.env.DATABASE_URL as string, {
      max: 1,
      idle_timeout: 20,
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
  dbPath = file && file !== ":memory:" ? path.resolve(process.cwd(), file) : null;
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

function buildInsert(table: SeedTable, rows: unknown[]): [string, unknown[]][] {
  if (!rows.length) return [];
  const cols = Object.keys(rows[0] as Record<string, unknown>);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  const sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`;
  const prepared: [string, unknown[]][] = [];
  for (const row of rows) {
    const values = cols.map((c) => {
      const v = (row as Record<string, unknown>)[c];
      if (v === undefined) return null;
      if (BOOLEAN_KEYS.has(c)) {
        // SQLite binds 1/0 (toBindValue), Postgres gets a real boolean.
        return v === true || v === 1 || v === "1" || v === "true";
      }
      if (typeof v === "object" && v !== null) return JSON.stringify(v);
      return v;
    });
    prepared.push([sql, values]);
  }
  return prepared;
}

async function applySchema(): Promise<void> {
  if (USE_POSTGRES) {
    const raw = readFileSync(path.join(DATA_DIR, "schema.postgres.sql"), "utf8");
    await getPg().unsafe(raw);
    return;
  }
  applySqliteSchema(getSqlite());
}

async function seedDb() {
  await applySchema();
  const rows = await exec("SELECT COUNT(*) AS ok FROM users");
  if (Number(rows[0]?.ok) > 0) return;
  const data = loadSeedData();
  for (const table of INSERT_ORDER) {
    const rowsForTable = data[table];
    if (!Array.isArray(rowsForTable) || !rowsForTable.length) continue;
    for (const [sql, values] of buildInsert(table, rowsForTable)) {
      await run(sql, values);
    }
  }
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
      rmSync(path.resolve(process.cwd(), file), { force: true });
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