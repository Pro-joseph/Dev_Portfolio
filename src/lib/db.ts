import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = path.join(process.cwd(), "data");
const SCHEMA_PATH = path.join(DATA_DIR, "schema.sqlite.sql");

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

// ---------------------------------------------------------------- sqlite

let db: DatabaseSync | null = null;
let dbPath: string | null = null;

function getDb(): DatabaseSync {
  if (db) return db;
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
  db = conn;
  return conn;
}

function applySchema(conn: DatabaseSync): void {
  const raw = readFileSync(SCHEMA_PATH, "utf8");
  conn.exec(raw);
}

function exec(text: string, params: unknown[] = []): Record<string, unknown>[] {
  const conn = getDb();
  const { sql, params: bind } = translateSql(text, params);
  const stmt = conn.prepare(sql);
  const rows = (stmt.all(...bind) as Record<string, unknown>[]).map(
    (r) => normalizeRow(r) as Record<string, unknown>
  );
  return rows;
}

function run(text: string, params: unknown[] = []): void {
  const conn = getDb();
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
      if (typeof v === "boolean") return v ? 1 : 0;
      if (typeof v === "object" && v !== null) return JSON.stringify(v);
      return v;
    });
    prepared.push([sql, values]);
  }
  return prepared;
}

async function seedDb() {
  const conn = getDb();
  applySchema(conn);
  const rows = exec("SELECT COUNT(*) AS ok FROM users");
  if (Number(rows[0]?.ok) > 0) return;
  const data = loadSeedData();
  for (const table of INSERT_ORDER) {
    const rowsForTable = data[table];
    if (!Array.isArray(rowsForTable) || !rowsForTable.length) continue;
    for (const [sql, values] of buildInsert(table, rowsForTable)) {
      run(sql, values);
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
  const file = process.env.DB_FILE;
  if (db) {
    db.close();
    db = null;
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
