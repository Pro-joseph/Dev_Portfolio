import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { RESOURCES } from "@/lib/admin-config";
import { crudDefs } from "@/lib/resource-crud";

const ROOT = process.cwd();
const ADMIN_API = path.join(ROOT, "src", "app", "api", "v1", "admin");
const ADMIN_PAGES = path.join(ROOT, "src", "app", "admin");

const SIDEBAR_PAGES = [
  "",
  "projects",
  "media",
  "skills",
  "resumes",
  "pages",
  "menu-items",
  "messages",
  "certifications",
  "testimonials",
  "social-links",
  "site-settings",
];

describe("admin wiring consistency", () => {
  it("every resource config has a crud definition", () => {
    for (const res of RESOURCES) {
      expect(crudDefs[res.key], `crudDefs["${res.key}"]`).toBeDefined();
    }
  });

  it("every crud definition has a resource config (no orphans)", () => {
    for (const key of Object.keys(crudDefs)) {
      expect(
        RESOURCES.some((r) => r.key === key),
        `no config for crudDef "${key}"`
      ).toBe(true);
    }
  });

  it("every resource config path matches its key", () => {
    for (const res of RESOURCES) {
      expect(res.path).toBe(`/admin/${res.key}`);
    }
  });

  it("every resource has API routes and an admin page on disk", () => {
    for (const res of RESOURCES) {
      const index = path.join(ADMIN_API, res.key, "route.ts");
      const item = path.join(ADMIN_API, res.key, "[id]", "route.ts");
      const page = path.join(ADMIN_PAGES, res.key, "page.tsx");
      expect(fs.existsSync(index), `${res.key}/route.ts`).toBe(true);
      expect(fs.existsSync(item), `${res.key}/[id]/route.ts`).toBe(true);
      expect(fs.existsSync(page), `admin/${res.key}/page.tsx`).toBe(true);
    }
  });

  it("custom resources (media, contact-messages) have routes", () => {
    for (const key of ["media", "contact-messages"]) {
      expect(fs.existsSync(path.join(ADMIN_API, key, "route.ts")), `${key}/route.ts`).toBe(true);
      expect(fs.existsSync(path.join(ADMIN_API, key, "[id]", "route.ts")), `${key}/[id]/route.ts`).toBe(true);
    }
  });

  it("every sidebar destination has an admin page", () => {
    for (const page of SIDEBAR_PAGES) {
      const file = path.join(ADMIN_PAGES, page, "page.tsx");
      expect(fs.existsSync(file), `admin/${page}/page.tsx`).toBe(true);
    }
  });
});