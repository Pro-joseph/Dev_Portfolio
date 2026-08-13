#!/usr/bin/env node
/**
 * Seed a SQLite database from data/schema.sqlite.sql + data/seed.json.
 * Requires DB_FILE in the environment (defaults to data/portfolio.db).
 */
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.resolve(
  ROOT,
  process.env.DB_FILE || path.join(DATA_DIR, "portfolio.db")
);

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

function main() {
  const schema = readFileSync(path.join(DATA_DIR, "schema.sqlite.sql"), "utf8");
  const seed = JSON.parse(
    readFileSync(path.join(DATA_DIR, "seed.json"), "utf8")
  );

  mkdirSync(path.dirname(DB_FILE), { recursive: true });
  rmSync(DB_FILE, { force: true });

  const db = new DatabaseSync(DB_FILE);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  console.log(`Seeding ${DB_FILE}...`);

  console.log("Applying schema...");
  db.exec(schema);

  console.log("Inserting seed data...");
  for (const table of INSERT_ORDER) {
    const rows = seed[table];
    if (!Array.isArray(rows) || !rows.length) continue;
    const cols = Object.keys(rows[0]);
    const placeholders = cols.map(() => "?").join(", ");
    const insert = db.prepare(
      `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`
    );
    for (const row of rows) {
      const values = cols.map((c) => {
        const v = row[c];
        if (v === undefined || v === null) return null;
        if (typeof v === "boolean") return v ? 1 : 0;
        if (typeof v === "object") return JSON.stringify(v);
        return v;
      });
      insert.run(...values);
    }
    console.log(`  - ${table}: ${rows.length}`);
  }

  db.close();
  console.log("Done.");
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
