import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "@/lib/db";
import { GET as siteGet } from "@/app/api/v1/site/route";
import { GET as skillsGet } from "@/app/api/v1/skills/route";
import { GET as certsGet } from "@/app/api/v1/certifications/route";
import { GET as testimonialsGet } from "@/app/api/v1/testimonials/route";
import { GET as projectsGet } from "@/app/api/v1/projects/route";
import { GET as projectShowGet } from "@/app/api/v1/projects/[slug]/route";
import { GET as translationsGet } from "@/app/api/v1/admin/translations/route";
import { GET as adminProjectsGet } from "@/app/api/v1/admin/projects/route";
import { POST as loginPost } from "@/app/api/v1/auth/login/route";

function jsonRequest(url: string, init?: RequestInit): Request {
  return new Request(`http://127.0.0.1:3001${url}`, init);
}

async function body(res: Response): Promise<unknown> {
  return res.json();
}

async function loginAsAdmin(): Promise<string> {
  const res = await loginPost(
    jsonRequest("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@josephlab.dev", password: "password" }),
    })
  );
  expect(res.status).toBe(200);
  const data = (await body(res)) as { token: string };
  return data.token;
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
  it("shows translated French certs plus untranslated English ones", async () => {
    const res = await certsGet(jsonRequest("/api/v1/certifications?locale=fr"));
    const { data } = (await body(res)) as {
      data: { title: string; translation_key?: string }[];
    };
    const titles = data.map((c) => c.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        "Licence en génie logiciel",
        "Architecte de solutions certifié AWS",
        "PostgreSQL Professional",
        "CompTIA Security+",
      ])
    );
    // English twins replaced by their French translations
    expect(titles).not.toContain("B.Sc. in Software Engineering");
    expect(titles).not.toContain("AWS Certified Solutions Architect");
    expect(titles).not.toContain("Certified Kubernetes Administrator");
    // each translation pair appears once
    expect(titles.length).toBe(5);
  });

  it("returns the English rows for the default locale", async () => {
    const res = await certsGet();
    const { data } = (await body(res)) as { data: { title: string }[] };
    const titles = data.map((c) => c.title);
    expect(titles).toEqual(
      expect.arrayContaining(["B.Sc. in Software Engineering", "AWS Certified Solutions Architect"])
    );
    expect(titles).not.toContain("Licence en génie logiciel");
  });
});

describe("GET /testimonials", () => {
  it("returns the French testimonial for locale=fr", async () => {
    const res = await testimonialsGet(
      jsonRequest("/api/v1/testimonials?locale=fr")
    );
    const { data } = (await body(res)) as {
      data: { author: string; quote: string }[];
    };
    expect(data.length).toBe(1);
    expect(data[0].author).toBe("Alex Morgan");
    expect(data[0].quote).toBe(
      "Un ingénieur exceptionnel qui a transformé notre infrastructure existante en une plateforme moderne et évolutive."
    );
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

describe("admin translations + locale filter", () => {
  it("pairs translation keys across locales", async () => {
    const token = await loginAsAdmin();
    const res = await translationsGet(
      jsonRequest("/api/v1/admin/translations?resource=certifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(res.status).toBe(200);
    const { data } = (await body(res)) as {
      data: { id: number; locale: string; translation_key: string }[];
    };
    const byKey = new Map(data.map((r) => [`${r.locale}:${r.translation_key}`, r]));
    expect(byKey.has("fr:cert-2")).toBe(true);
    expect(byKey.has("en:cert-2")).toBe(true);
    expect(byKey.has("en:cert-5")).toBe(true);
    expect(byKey.has("fr:cert-5")).toBe(false);
  });

  it("filters the admin projects list by locale", async () => {
    const token = await loginAsAdmin();
    const res = await adminProjectsGet(
      jsonRequest("/api/v1/admin/projects?locale=fr&per_page=50", {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(res.status).toBe(200);
    const { data } = (await body(res)) as {
      data: { locale: string; title: string }[];
    };
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((p) => p.locale === "fr")).toBe(true);
    expect(data.map((p) => p.title)).toContain("Plateforme Nexus");
  });
});
