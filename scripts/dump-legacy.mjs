// One-off migration helper: reads the legacy Laravel SQLite database and
// writes a portable JSON seed (data/seed.json) + copies media uploads into
// public/uploads. Run: node scripts/dump-legacy.mjs
//
// The seed is a plain-data snapshot (ISO timestamps, booleans/numbers as-is,
// JSON columns kept as their stored text) consumed by scripts/seed.mjs.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync, writeFileSync, copyFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const legacyDb = process.env.LEGACY_DB ?? join(root, "../Laravel/database/database.sqlite");
const legacyUploads = process.env.LEGACY_UPLOADS ?? join(root, "../Laravel/storage/app/public/uploads");

const TABLES = [
  "users",
  "site_settings",
  "social_links",
  "menu_items",
  "pages",
  "resumes",
  "media",
  "skill_categories",
  "skills",
  "projects",
  "project_links",
  "project_skill",
  "certifications",
  "testimonials",
  "contact_messages",
];

const DATE_COLUMNS = new Map([
  ["users", ["created_at", "updated_at", "email_verified_at"]],
  ["site_settings", ["updated_at"]],
  ["resumes", ["created_at", "updated_at"]],
  ["media", ["created_at", "updated_at"]],
  ["skills", ["created_at", "updated_at"]],
  ["projects", ["created_at", "updated_at", "started_on", "completed_on"]],
  ["certifications", ["created_at", "updated_at", "issued_on"]],
  ["testimonials", ["created_at", "updated_at"]],
  ["contact_messages", ["created_at", "updated_at"]],
]);

if (!existsSync(legacyDb)) {
  console.error(`Legacy DB not found: ${legacyDb}`);
  process.exit(1);
}

const db = new DatabaseSync(legacyDb, { readOnly: true });
const snapshot = {};

for (const table of TABLES) {
  const dateCols = DATE_COLUMNS.get(table) ?? [];
  const rows = db.prepare(`SELECT * FROM ${table}`).all().map((row) => {
    const out = {};
    for (const [key, value] of Object.entries(row)) {
      let v = value;
      if (v instanceof Uint8Array) v = Buffer.from(v).toString("utf8");
      if (dateCols.includes(key) && typeof v === "string" && v.trim() !== "") {
        v = new Date(v.replace(" ", "T") + "Z").toISOString();
      }
      out[key] = v;
    }
    return out;
  });
  snapshot[table] = rows;
  console.log(`${table.padEnd(18)} ${rows.length} rows`);
}

// Copy legacy uploads into public/uploads (only non-remote media rows we know
// about; anything referenced by media.path with disk='url' is already a URL).
let copied = 0;
if (existsSync(legacyUploads)) {
  const destDir = join(root, "public", "uploads");
  mkdirSync(destDir, { recursive: true });
  for (const file of readdirSync(legacyUploads)) {
    copyFileSync(join(legacyUploads, file), join(destDir, file));
    copied++;
  }
}

const outPath = join(root, "data", "seed.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
mkdirSync(join(root, "data"), { recursive: true });

console.log(`\nWrote ${outPath}`);
console.log(`Copied ${copied} uploads -> ${join("public", "uploads")}`);