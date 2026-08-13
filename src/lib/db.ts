import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool, type QueryResult } from "pg";
import { newDb, type IMemoryDb } from "pg-mem";

const DATA_DIR = path.join(process.cwd(), "data");
const SCHEMA_PATH = path.join(DATA_DIR, "schema.sql");

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
  "from",
  "to",
  "per_page",
  "current_page",
  "last_page",
]);

function normalizeRow(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value instanceof Date) {
      out[key] = value.toISOString();
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

export function isUsingPg(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

// ---------------------------------------------------------------- real pg

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ...(process.env.DATABASE_SSL !== "false"
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    });
  }
  return pool;
}

// --------------------------------------------------------------- pg-mem

let memDb: IMemoryDb | null = null;
let memClient: import("pg").Client | null = null;

function ensureMemDb(): IMemoryDb {
  if (memDb) return memDb;
  const db = newDb();
  const raw = readFileSync(SCHEMA_PATH, "utf8");
  const withoutComments = raw
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const statements = withoutComments
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    db.public.none(stmt);
  }
  memDb = db;
  const { Client } = db.adapters.createPg() as {
    Client: new () => import("pg").Client;
  };
  memClient = new Client();
  memClient.connect();
  return db;
}

function memQuery(
  text: string,
  params?: unknown[]
): Promise<{ rows: Record<string, unknown>[] }> {
  return new Promise((resolve, reject) => {
    memClient!.query(text, params ?? [], (err, res: QueryResult) => {
      if (err) return reject(err);
      resolve({ rows: (res.rows ?? []).map((r) => normalizeRow(r)) });
    });
  });
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

function buildInsert(table: SeedTable, rows: unknown[]) {
  if (!rows.length) return null;
  const cols = Object.keys(rows[0] as Record<string, unknown>);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  const sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`;
  const prepared: unknown[][] = [];
  for (const row of rows) {
    const values = cols.map((c) => {
      const v = (row as Record<string, unknown>)[c];
      if (v === undefined) return null;
      if (typeof v === "boolean") return v;
      if (typeof v === "object" && v !== null) return JSON.stringify(v);
      return v;
    });
    prepared.push([sql, values] as unknown[]);
  }
  return prepared;
}

async function seedMem() {
  ensureMemDb();
  const res = await memQuery(
    "SELECT COUNT(*)::int AS ok FROM users"
  );
  if (Number(res.rows[0]?.ok) > 0) return;
  const data = loadSeedData();
  for (const table of INSERT_ORDER) {
    const rows = data[table];
    if (!Array.isArray(rows) || !rows.length) continue;
    const prepared = buildInsert(table, rows) as [string, unknown[]][];
    if (!prepared) continue;
    for (const [sql, values] of prepared) {
      await memQuery(sql, values);
    }
  }
}

// ------------------------------------------------------------------ facade

let memReady = false;

export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  if (isUsingPg()) {
    const res = await getPool().query(text, params ?? []);
    return res.rows.map((r) => normalizeRow(r)) as unknown as T[];
  }
  if (!memReady) {
    await seedMem();
    memReady = true;
  }
  const res = await memQuery(text, params);
  return res.rows as unknown as T[];
}

export async function queryOne<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function resetDb(): Promise<void> {
  if (isUsingPg()) {
    await getPool().query(
      "TRUNCATE users, site_settings, social_links, pages, menu_items, media, resumes, skill_categories, skills, projects, project_links, project_skill, certifications, testimonials, contact_messages RESTART IDENTITY CASCADE"
    );
    return;
  }
  memReady = false;
  memDb = null;
  memClient = null;
}

export async function nextId(table: string): Promise<number> {
  const row = await queryOne<{ m: number }>(
    `SELECT COALESCE(MAX(id), 0) + 1 AS m FROM ${table}`
  );
  return Number(row?.m ?? 1);
}