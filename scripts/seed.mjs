#!/usr/bin/env node
/**
 * Seed a real Postgres database from data/schema.sql + data/seed.json.
 * Requires DATABASE_URL in the environment.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ...(process.env.DATABASE_SSL !== "false"
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
});

const INSERT_ORDER = [
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

async function main() {
  const schema = readFileSync(path.join(DATA_DIR, "schema.sql"), "utf8");
  const seed = JSON.parse(
    readFileSync(path.join(DATA_DIR, "seed.json"), "utf8")
  );

  console.log("Applying schema...");
  const statements = schema
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await pool.query(stmt);
  }

  console.log("Inserting seed data...");
  for (const table of INSERT_ORDER) {
    const rows = seed[table];
    if (!Array.isArray(rows) || !rows.length) continue;
    const cols = Object.keys(rows[0]);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    for (const row of rows) {
      const values = cols.map((c) => {
        const v = row[c];
        if (v === undefined || v === null) return null;
        if (typeof v === "boolean") return v;
        if (typeof v === "object") return JSON.stringify(v);
        return v;
      });
      await pool.query(
        `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`,
        values
      );
    }
    console.log(`  - ${table}: ${rows.length}`);
  }

  console.log("Done.");
}

main()
  .then(() => pool.end())
  .catch(async (e) => {
    console.error(e);
    await pool.end();
    process.exit(1);
  });
