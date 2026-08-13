import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, query } from "@/lib/db";
import { GET as siteGet } from "@/app/api/v1/site/route";
import { GET as skillsGet } from "@/app/api/v1/skills/route";
import { GET as certsGet } from "@/app/api/v1/certifications/route";
import { GET as testimonialsGet } from "@/app/api/v1/testimonials/route";
import { GET as resumesActiveGet } from "@/app/api/v1/resumes/active/route";
import { GET as projectsGet } from "@/app/api/v1/projects/route";
import {
  GET as projectShowGet,
} from "@/app/api/v1/projects/[slug]/route";
import { POST as projectViewPost } from "@/app/api/v1/projects/[slug]/view/route";
import { POST as contactPost } from "@/app/api/v1/contact/route";
import { GET as pagesGet } from "@/app/api/v1/pages/[slug]/route";
import { POST as loginPost } from "@/app/api/v1/auth/login/route";
import { GET as meGet } from "@/app/api/v1/auth/me/route";
import { GET as adminProjectsGet } from "@/app/api/v1/admin/projects/route";
import { GET as dashboardStatsGet } from "@/app/api/v1/admin/dashboard/stats/route";
import { POST as adminProjectsPost } from "@/app/api/v1/admin/projects/route";
import { PATCH as messageReadPatch } from "@/app/api/v1/admin/contact-messages/[id]/read/route";

function jsonRequest(url: string, init?: RequestInit): Request {
  return new Request(`http://127.0.0.1:3001${url}`, init);
}

async function body(res: Response): Promise<unknown> {
  return res.json();
}

let token: string;

async function loginAsAdmin(): Promise<string> {
  const res = await loginPost(
    jsonRequest("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@josephlab.dev", password: "password" }),
    })
  );
  expect(res.status).toBe(200);
  const data = (await body(res)) as { token: string; user: { role: string } };
  expect(data.user.role).toBe("admin");
  return data.token;
}

beforeEach(async () => {
  await resetDb();
  token = await loginAsAdmin();
});

// ----------------------------------------------------------- public

describe("GET /site", () => {
  it("matches the captured Laravel payload shape", async () => {
    const res = await siteGet();
    expect(res.status).toBe(200);
    const data = (await body(res)) as Record<string, unknown>;
    const settings = data.settings as Record<string, unknown>;
    expect(settings.site_title).toBe("JosephLab");
    expect(settings.announcement_enabled).toBe(false);
    expect(settings.seo).toEqual({ twitter: "@josephlab", locale: "en" });
    expect(data.menu).toEqual(expect.any(Array));
    expect((data.menu as unknown[]).length).toBeGreaterThan(0);
    const resume = data.resume as { id: number; label: string; language: string; url: string };
    expect(resume.label).toBe("MON CV");
    expect(resume.url).toMatch(/^\/uploads\//);
    const socials = data.social_links as { platform: string }[];
    expect(socials.map((s) => s.platform)).toEqual(
      expect.arrayContaining(["github", "linkedin", "email"])
    );
  });
});

describe("GET /skills", () => {
  it("groups skills by category with the expected fields", async () => {
    const res = await skillsGet();
    expect(res.status).toBe(200);
    const { data } = (await body(res)) as { data: Record<string, unknown>[] };
    expect(data.length).toBeGreaterThan(0);
    const first = data[0] as { id: number; name: string; skills: unknown[] };
    expect(typeof first.id).toBe("number");
    expect(Array.isArray(first.skills)).toBe(true);
    const skill = (first.skills as { name: string; proficiency: number }[])[0];
    expect(typeof skill.proficiency).toBe("number");
  });
});

describe("GET /certifications", () => {
  it("returns a data array", async () => {
    const res = await certsGet();
    expect(res.status).toBe(200);
    const { data } = (await body(res)) as { data: unknown[] };
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("GET /testimonials", () => {
  it("returns only visible testimonials (seed has none visible)", async () => {
    const res = await testimonialsGet();
    expect(res.status).toBe(200);
    const { data } = (await body(res)) as { data: unknown[] };
    expect(data).toEqual([]);
  });
});

describe("GET /resumes/active", () => {
  it("returns the active resume with media url", async () => {
    const res = await resumesActiveGet();
    expect(res.status).toBe(200);
    const { data } = (await body(res)) as {
      data: { id: number; label: string; language: string; url: string };
    };
    expect(data.id).toBe(2);
    expect(data.language).toBe("Fr");
    expect(data.url).toMatch(/^\/uploads\/.*\.pdf$/);
  });
});

describe("GET /projects", () => {
  it("returns the public ResourceCollection paginator shape", async () => {
    const res = await projectsGet(jsonRequest("/api/v1/projects"));
    expect(res.status).toBe(200);
    const data = (await body(res)) as {
      data: unknown[];
      links: { first: string; last: string; prev: string | null; next: string | null };
      meta: { current_page: number; per_page: number; total: number };
    };
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.links).toHaveProperty("first");
    expect(data.links).toHaveProperty("last");
    expect(data.links).toHaveProperty("prev");
    expect(data.links).toHaveProperty("next");
    expect(data.meta.total).toBeGreaterThan(0);
    expect(data.meta.per_page).toBe(12);
  });

  it("filters by featured flag", async () => {
    const res = await projectsGet(jsonRequest("/api/v1/projects?featured=true"));
    const { data } = (await body(res)) as { data: { is_featured: boolean }[] };
    expect(data.length).toBeGreaterThan(0);
    for (const p of data) expect(p.is_featured).toBe(true);
  });

  it("searches by title/summary", async () => {
    const res = await projectsGet(jsonRequest("/api/v1/projects?search=Nexus"));
    const { meta, data } = (await body(res)) as {
      meta: { total: number };
      data: { title: string }[];
    };
    expect(meta.total).toBeGreaterThan(0);
    expect(data[0].title).toBe("Nexus Platform");
  });
});

describe("GET /projects/{slug}", () => {
  it("returns a published project and increments views", async () => {
    const res = await projectShowGet(jsonRequest("/api/v1/projects/nexus-platform"), {
      params: Promise.resolve({ slug: "nexus-platform" }),
    });
    expect(res.status).toBe(200);
    const { data } = (await body(res)) as { data: { title: string; views_count: number } };
    expect(data.title).toBe("Nexus Platform");
    expect(typeof data.views_count).toBe("number");
  });

  it("404s for a draft or missing project", async () => {
    const res = await projectShowGet(jsonRequest("/api/v1/projects/nope"), {
      params: Promise.resolve({ slug: "nope" }),
    });
    expect(res.status).toBe(404);
    expect((await body(res)) as { message: string }).toHaveProperty("message");
  });
});

describe("POST /projects/{slug}/view", () => {
  it("responds ok", async () => {
    const res = await projectViewPost(jsonRequest("/api/v1/projects/nexus-platform/view"), {
      params: Promise.resolve({ slug: "nexus-platform" }),
    });
    expect(res.status).toBe(200);
    expect(await body(res)).toEqual({ message: "ok" });
  });
});

describe("GET /pages/{slug}", () => {
  it("404s for a missing page", async () => {
    const res = await pagesGet(jsonRequest("/api/v1/pages/nope"), {
      params: Promise.resolve({ slug: "nope" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("POST /contact", () => {
  it("stores a message and returns 201", async () => {
    const res = await contactPost(
      jsonRequest("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Tester", email: "t@example.com", message: "hello" }),
      })
    );
    expect(res.status).toBe(201);
    const data = (await body(res)) as { message: string; data: { id: number } };
    expect(data.message).toBe("Message sent.");
    expect(typeof data.data.id).toBe("number");
  });

  it("422s with validation errors when fields are missing", async () => {
    const res = await contactPost(
      jsonRequest("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(422);
    const data = (await body(res)) as { errors: Record<string, string[]> };
    expect(data.errors.name).toEqual(["The name field is required."]);
    expect(data.errors.email).toBeDefined();
    expect(data.errors.message).toBeDefined();
  });
});

// --------------------------------------------------------------- auth

describe("POST /auth/login", () => {
  it("returns a JWT token for valid credentials", async () => {
    const res = await loginPost(
      jsonRequest("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@josephlab.dev", password: "password" }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await body(res)) as { token: string; user: { email: string } };
    expect(data.token.split(".")).toHaveLength(3);
    expect(data.user.email).toBe("admin@josephlab.dev");
  });

  it("422s on bad password", async () => {
    const res = await loginPost(
      jsonRequest("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@josephlab.dev", password: "nope" }),
      })
    );
    expect(res.status).toBe(422);
    const data = (await body(res)) as { errors: Record<string, string[]> };
    expect(data.errors.email).toEqual(["The provided credentials are incorrect."]);
  });
});

describe("GET /auth/me", () => {
  it("returns the authenticated user with Bearer token", async () => {
    const res = await meGet(
      jsonRequest("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(res.status).toBe(200);
    const data = (await body(res)) as { data: { role: string } };
    expect(data.data.role).toBe("admin");
  });

  it("401s without a token", async () => {
    const res = await meGet(jsonRequest("/api/v1/auth/me"));
    expect(res.status).toBe(401);
    expect(await body(res)).toEqual({ message: "Unauthenticated." });
  });
});

// --------------------------------------------------------------- admin

describe("GET /admin/projects", () => {
  it("returns the flat Laravel paginator shape", async () => {
    const res = await adminProjectsGet(
      jsonRequest("/api/v1/admin/projects", {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(res.status).toBe(200);
    const data = (await body(res)) as Record<string, unknown>;
    expect(data.current_page).toBe(1);
    expect(data.per_page).toBe(20);
    expect(data.total).toBeGreaterThan(0);
    expect(data).toHaveProperty("first_page_url");
    expect(data).toHaveProperty("last_page_url");
    expect(data).toHaveProperty("next_page_url");
    expect(data).toHaveProperty("prev_page_url");
    expect(data).toHaveProperty("links");
    expect((data.data as unknown[]).length).toBeGreaterThan(0);
  });

  it("403s for a non-admin user", async () => {
    const login = await loginPost(
      jsonRequest("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "editor@josephlab.dev", password: "password" }),
      })
    );
    const { token: editorToken } = (await body(login)) as { token: string };
    const res = await adminProjectsGet(
      jsonRequest("/api/v1/admin/projects", {
        headers: { Authorization: `Bearer ${editorToken}` },
      })
    );
    expect(res.status).toBe(403);
    expect(await body(res)).toEqual({ message: "Forbidden." });
  });
});

describe("POST /admin/projects", () => {
  it("creates a project with slug, links, skills, cover", async () => {
    const res = await adminProjectsPost(
      jsonRequest("/api/v1/admin/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "Test Project",
          status: "draft",
          skill_ids: [1, 2],
          media_ids: [1],
          links: [{ label: "GitHub", url: "https://github.com", type: "github" }],
        }),
      })
    );
    expect(res.status).toBe(201);
    const { data } = (await body(res)) as {
      data: {
        id: number;
        slug: string;
        links: { label: string }[];
        skills: { name: string }[];
        cover: { filename: string } | null;
      };
    };
    expect(data.slug).toBe("test-project");
    expect(data.links.map((l) => l.label)).toContain("GitHub");
    expect(data.skills.map((s) => s.name)).toEqual(expect.arrayContaining(["Rust", "Go"]));
    expect(data.cover).not.toBeNull();
  });

  it("422s when required fields are missing", async () => {
    const res = await adminProjectsPost(
      jsonRequest("/api/v1/admin/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(422);
  });
});

describe("GET /admin/dashboard/stats", () => {
  it("returns the stats contract", async () => {
    const res = await dashboardStatsGet(
      jsonRequest("/api/v1/admin/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(res.status).toBe(200);
    const data = (await body(res)) as Record<string, unknown>;
    expect(data).toHaveProperty("total_views");
    expect(data).toHaveProperty("views_delta");
    expect((data.views_series as unknown[]).length).toBe(30);
    expect(data).toHaveProperty("total_projects");
    expect(data).toHaveProperty("unread_messages");
    expect(data).toHaveProperty("active_resume");
  });
});

describe("PATCH /admin/contact-messages/{id}/read", () => {
  it("marks a message read", async () => {
    const res = await messageReadPatch(
      jsonRequest("/api/v1/admin/contact-messages/1/read", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }),
      { params: Promise.resolve({ id: "1" }) }
    );
    expect(res.status).toBe(200);
    const { data } = (await body(res)) as { data: { is_read: boolean } };
    expect(data.is_read).toBe(true);
  });
});

describe("concurrent cold start (first request after reset)", () => {
  it("handles simultaneous queries without duplicate-seed errors", async () => {
    await resetDb();
    const results = await Promise.all([
      siteGet(),
      query("SELECT COUNT(*)::int AS n FROM users"),
      query("SELECT COUNT(*)::int AS n FROM projects"),
      query("SELECT COUNT(*)::int AS n FROM skills"),
    ]);
    for (const res of results) {
      if (res instanceof Response) expect(res.status).toBe(200);
    }
    const users = await query<{ n: number }>(
      "SELECT COUNT(*)::int AS n FROM users"
    );
    expect(Number(users[0].n)).toBe(2);
  });
});