import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "@/lib/db";
import { GET as siteGet } from "@/app/api/v1/site/route";
import { GET as skillsGet } from "@/app/api/v1/skills/route";
import { GET as certsGet } from "@/app/api/v1/certifications/route";
import { GET as testimonialsGet } from "@/app/api/v1/testimonials/route";
import { GET as projectsGet } from "@/app/api/v1/projects/route";
import { GET as projectShowGet } from "@/app/api/v1/projects/[slug]/route";

function jsonRequest(url: string): Request {
  return new Request(`http://127.0.0.1:3001${url}`);
}

async function body(res: Response): Promise<unknown> {
  return res.json();
}

beforeEach(async () => {
  await resetDb();
});

describe("GET /site", () => {
  it("returns English menu by default", async () => {
    const res = await siteGet();
    const data = (await body(res)) as { menu: { label: string }[] };
    expect(data.menu.map((m) => m.label)).toEqual(
      expect.arrayContaining(["Projects", "Skills"])
    );
    expect(data.menu.map((m) => m.label)).not.toContain("Projets");
  });

  it("returns the French menu when locale=fr", async () => {
    const res = await siteGet(jsonRequest("/api/v1/site?locale=fr"));
    expect(res.status).toBe(200);
    const data = (await body(res)) as {
      menu: { label: string }[];
      settings: Record<string, unknown>;
    };
    expect(data.menu.map((m) => m.label)).toEqual(
      expect.arrayContaining(["Projets", "Compétences"])
    );
    expect(data.menu.map((m) => m.label)).not.toContain("Projects");
    expect(data.settings.site_title_fr).toBeTruthy();
  });
});

describe("GET /certifications", () => {
  it("falls back to English rows when no French rows exist", async () => {
    const res = await certsGet(jsonRequest("/api/v1/certifications?locale=fr"));
    const { data } = (await body(res)) as {
      data: { title: string; locale?: string }[];
    };
    expect(data.length).toBeGreaterThan(0);
  });

  it("returns French rows for locale=fr", async () => {
    const res = await certsGet(jsonRequest("/api/v1/certifications?locale=fr"));
    const { data } = (await body(res)) as { data: { title: string }[] };
    expect(data.map((c) => c.title)).toEqual(
      expect.arrayContaining([
        "Licence en génie logiciel",
        "Architecte de solutions certifié AWS",
      ])
    );
  });
});

describe("GET /testimonials", () => {
  it("returns French testimonials for locale=fr", async () => {
    const res = await testimonialsGet(
      jsonRequest("/api/v1/testimonials?locale=fr")
    );
    const { data } = (await body(res)) as { data: { author: string }[] };
    expect(data.map((t) => t.author)).toContain("Alex Morgan");
  });
});

describe("GET /skills", () => {
  it("falls back to English categories when locale=fr has none", async () => {
    const res = await skillsGet(jsonRequest("/api/v1/skills?locale=fr"));
    expect(res.status).toBe(200);
    const { data } = (await body(res)) as {
      data: { name: string; skills: unknown[] }[];
    };
    expect(data.length).toBeGreaterThan(0);
  });
});

describe("GET /projects", () => {
  it("returns the French version of a shared slug for locale=fr", async () => {
    const res = await projectsGet(
      jsonRequest("/api/v1/projects?locale=fr&per_page=20")
    );
    const { data } = (await body(res)) as {
      data: { title: string; slug: string; locale?: string }[];
    };
    const nexus = data.find((p) => p.slug === "nexus-platform");
    expect(nexus).toBeTruthy();
    expect(nexus?.title).toBe("Plateforme Nexus");
    expect(data.map((p) => p.title)).not.toContain("Nexus Platform");
  });

  it("keeps the English version for the default locale", async () => {
    const res = await projectsGet(
      jsonRequest("/api/v1/projects?per_page=20")
    );
    const { data } = (await body(res)) as { data: { title: string }[] };
    expect(data.map((p) => p.title)).not.toContain("Plateforme Nexus");
  });
});

describe("GET /projects/[slug]", () => {
  it("returns the French version for locale=fr", async () => {
    const res = await projectShowGet(
      jsonRequest("/api/v1/projects/nexus-platform?locale=fr"),
      { params: Promise.resolve({ slug: "nexus-platform" }) }
    );
    expect(res.status).toBe(200);
    const { data } = (await body(res)) as { data: { title: string } };
    expect(data.title).toBe("Plateforme Nexus");
  });
});
