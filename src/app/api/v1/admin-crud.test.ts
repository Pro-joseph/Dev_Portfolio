import { describe, it, expect, beforeEach } from "vitest";
import path from "node:path";
import os from "node:os";
import { resetDb } from "@/lib/db";
import { POST as loginPost } from "@/app/api/v1/auth/login/route";
import { POST as logoutPost } from "@/app/api/v1/auth/logout/route";
import { GET as meGet } from "@/app/api/v1/auth/me/route";

import {
  GET as projectsGet,
  POST as projectsPost,
} from "@/app/api/v1/admin/projects/route";
import {
  GET as skillsGet,
  POST as skillsPost,
} from "@/app/api/v1/admin/skills/route";
import {
  GET as categoriesGet,
  POST as categoriesPost,
} from "@/app/api/v1/admin/skill-categories/route";
import {
  GET as resumesGet,
  POST as resumesPost,
} from "@/app/api/v1/admin/resumes/route";
import {
  GET as socialLinksGet,
  POST as socialLinksPost,
} from "@/app/api/v1/admin/social-links/route";
import {
  GET as menuItemsGet,
  POST as menuItemsPost,
} from "@/app/api/v1/admin/menu-items/route";
import {
  GET as pagesGet,
  POST as pagesPost,
} from "@/app/api/v1/admin/pages/route";
import {
  GET as siteSettingsGet,
  POST as siteSettingsPost,
} from "@/app/api/v1/admin/site-settings/route";
import {
  GET as certificationsGet,
  POST as certificationsPost,
} from "@/app/api/v1/admin/certifications/route";
import {
  GET as testimonialsGet,
  POST as testimonialsPost,
} from "@/app/api/v1/admin/testimonials/route";
import {
  GET as mediaGet,
  POST as mediaPost,
} from "@/app/api/v1/admin/media/route";
import {
  GET as messagesGet,
} from "@/app/api/v1/admin/contact-messages/route";

import {
  GET as projectShowGet,
  PUT as projectUpdatePut,
  DELETE as projectDeleteDel,
} from "@/app/api/v1/admin/projects/[id]/route";
import {
  GET as skillShowGet,
  PUT as skillUpdatePut,
  DELETE as skillDeleteDel,
} from "@/app/api/v1/admin/skills/[id]/route";
import {
  GET as categoryShowGet,
  PUT as categoryUpdatePut,
  DELETE as categoryDeleteDel,
} from "@/app/api/v1/admin/skill-categories/[id]/route";
import {
  GET as resumeShowGet,
  PUT as resumeUpdatePut,
  DELETE as resumeDeleteDel,
} from "@/app/api/v1/admin/resumes/[id]/route";
import {
  GET as socialLinkShowGet,
  PUT as socialLinkUpdatePut,
  DELETE as socialLinkDeleteDel,
} from "@/app/api/v1/admin/social-links/[id]/route";
import {
  GET as menuItemShowGet,
  PUT as menuItemUpdatePut,
  DELETE as menuItemDeleteDel,
} from "@/app/api/v1/admin/menu-items/[id]/route";
import {
  GET as pageShowGet,
  PUT as pageUpdatePut,
  DELETE as pageDeleteDel,
} from "@/app/api/v1/admin/pages/[id]/route";
import {
  GET as siteSettingShowGet,
  PUT as siteSettingUpdatePut,
  DELETE as siteSettingDeleteDel,
} from "@/app/api/v1/admin/site-settings/[id]/route";
import {
  GET as certificationShowGet,
  PUT as certificationUpdatePut,
  DELETE as certificationDeleteDel,
} from "@/app/api/v1/admin/certifications/[id]/route";
import {
  GET as testimonialShowGet,
  PUT as testimonialUpdatePut,
  DELETE as testimonialDeleteDel,
} from "@/app/api/v1/admin/testimonials/[id]/route";
import { DELETE as mediaDeleteDel } from "@/app/api/v1/admin/media/[id]/route";
import {
  DELETE as messageDeleteDel,
} from "@/app/api/v1/admin/contact-messages/[id]/route";
import {
  PATCH as messageReadPatch,
} from "@/app/api/v1/admin/contact-messages/[id]/read/route";

process.env.MEDIA_UPLOAD_DIR = path.join(os.tmpdir(), "crud-media-test");

function jsonRequest(url: string, init?: RequestInit): Request {
  return new Request(`http://127.0.0.1:3001${url}`, init);
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const jsonAuth = (token: string) => ({
  "Content-Type": "application/json",
  ...auth(token),
});

async function body(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

let token: string;

beforeEach(async () => {
  await resetDb();
  const res = await loginPost(
    jsonRequest("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@josephlab.dev", password: "password" }),
    })
  );
  expect(res.status).toBe(200);
  token = (await body(res)).token as string;
});

// ------------------------------------------------------------------ helpers

type Handlers = {
  list: (r: Request) => Promise<Response>;
  create: (r: Request) => Promise<Response>;
  show: (r: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  update: (r: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  destroy: (r: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  path: string;
  createBody: Record<string, unknown>;
  updateBody: Record<string, unknown>;
};

async function crudCycle(h: Handlers) {
  const list = await h.list(jsonRequest(h.path, { headers: auth(token) }));
  expect(list.status).toBe(200);
  const listData = (await body(list)).data as unknown[];
  expect(Array.isArray(listData)).toBe(true);

  const created = await h.create(
    jsonRequest(h.path, {
      method: "POST",
      headers: jsonAuth(token),
      body: JSON.stringify(h.createBody),
    })
  );
  expect(created.status).toBe(201);
  const createdData = (await body(created)).data as { id: number };
  const id = createdData.id;
  expect(typeof id).toBe("number");

  const ctx = { params: Promise.resolve({ id: String(id) }) };

  const show = await h.show(jsonRequest(`${h.path}/${id}`, { headers: auth(token) }), ctx);
  expect(show.status).toBe(200);

  const updated = await h.update(
    jsonRequest(`${h.path}/${id}`, {
      method: "PUT",
      headers: jsonAuth(token),
      body: JSON.stringify(h.updateBody),
    }),
    ctx
  );
  expect(updated.status).toBe(200);

  const destroyed = await h.destroy(
    jsonRequest(`${h.path}/${id}`, { method: "DELETE", headers: auth(token) }),
    ctx
  );
  expect(destroyed.status).toBe(200);

  const gone = await h.show(jsonRequest(`${h.path}/${id}`, { headers: auth(token) }), ctx);
  expect(gone.status).toBe(404);
}

// ----------------------------------------------------------------- admin CRUD

describe("admin CRUD — every resource", () => {
  it("projects", async () => {
    await crudCycle({
      list: projectsGet,
      create: projectsPost,
      show: projectShowGet,
      update: projectUpdatePut,
      destroy: projectDeleteDel,
      path: "/api/v1/admin/projects",
      createBody: { title: "CRUD Project", status: "published", locale: "en" },
      updateBody: { title: "CRUD Project", status: "draft", locale: "en" },
    });
  });

  it("skills", async () => {
    await crudCycle({
      list: skillsGet,
      create: skillsPost,
      show: skillShowGet,
      update: skillUpdatePut,
      destroy: skillDeleteDel,
      path: "/api/v1/admin/skills",
      createBody: { name: "CRUD Skill" },
      updateBody: { name: "CRUD Skill" },
    });
  });

  it("skill-categories", async () => {
    await crudCycle({
      list: categoriesGet,
      create: categoriesPost,
      show: categoryShowGet,
      update: categoryUpdatePut,
      destroy: categoryDeleteDel,
      path: "/api/v1/admin/skill-categories",
      createBody: { name: "CRUD Category", locale: "en" },
      updateBody: { name: "CRUD Category 2", locale: "en" },
    });
  });

  it("social-links", async () => {
    await crudCycle({
      list: socialLinksGet,
      create: socialLinksPost,
      show: socialLinkShowGet,
      update: socialLinkUpdatePut,
      destroy: socialLinkDeleteDel,
      path: "/api/v1/admin/social-links",
      createBody: { platform: "crud", url: "https://example.com", is_visible: true },
      updateBody: { platform: "crud", url: "https://example.com/2" },
    });
  });

  it("menu-items", async () => {
    await crudCycle({
      list: menuItemsGet,
      create: menuItemsPost,
      show: menuItemShowGet,
      update: menuItemUpdatePut,
      destroy: menuItemDeleteDel,
      path: "/api/v1/admin/menu-items",
      createBody: { label: "CRUD Menu", locale: "en", is_visible: false },
      updateBody: { label: "CRUD Menu", locale: "en", is_visible: true },
    });
  });

  it("pages", async () => {
    await crudCycle({
      list: pagesGet,
      create: pagesPost,
      show: pageShowGet,
      update: pageUpdatePut,
      destroy: pageDeleteDel,
      path: "/api/v1/admin/pages",
      createBody: { title: "CRUD Page", locale: "en", is_published: false },
      updateBody: { title: "CRUD Page 2", locale: "en" },
    });
  });

  it("site-settings", async () => {
    await crudCycle({
      list: siteSettingsGet,
      create: siteSettingsPost,
      show: siteSettingShowGet,
      update: siteSettingUpdatePut,
      destroy: siteSettingDeleteDel,
      path: "/api/v1/admin/site-settings",
      createBody: { key: "crud_test_key", type: "string", value: "1" },
      updateBody: { key: "crud_test_key", type: "string", value: "2" },
    });
  });

  it("certifications", async () => {
    await crudCycle({
      list: certificationsGet,
      create: certificationsPost,
      show: certificationShowGet,
      update: certificationUpdatePut,
      destroy: certificationDeleteDel,
      path: "/api/v1/admin/certifications",
      createBody: { type: "certification", title: "CRUD Cert", locale: "en" },
      updateBody: { type: "certification", title: "CRUD Cert 2", locale: "en" },
    });
  });

  it("certifications persist description and issued_on", async () => {
    const created = await certificationsPost(
      jsonRequest("/api/v1/admin/certifications", {
        method: "POST",
        headers: jsonAuth(token),
        body: JSON.stringify({
          type: "certification",
          title: "Round Trip Cert",
          locale: "en",
          description: "A meaningful description.",
          issued_on: "2024-05-01",
        }),
      })
    );
    expect(created.status).toBe(201);
    const createdData = (await body(created)).data as {
      id: number;
      description: string | null;
      issued_on: string | null;
    };
    expect(createdData.description).toBe("A meaningful description.");
    expect(createdData.issued_on).toBe("2024-05-01T00:00:00.000000Z");

    const show = await certificationShowGet(
      jsonRequest(`/api/v1/admin/certifications/${createdData.id}`, { headers: auth(token) }),
      { params: Promise.resolve({ id: String(createdData.id) }) }
    );
    expect(show.status).toBe(200);
    const showData = (await body(show)).data as {
      description: string | null;
      issued_on: string | null;
    };
    expect(showData.description).toBe("A meaningful description.");
    expect(showData.issued_on).toBe("2024-05-01T00:00:00.000000Z");

    const updated = await certificationUpdatePut(
      jsonRequest(`/api/v1/admin/certifications/${createdData.id}`, {
        method: "PUT",
        headers: jsonAuth(token),
        body: JSON.stringify({
          type: "certification",
          title: "Round Trip Cert Updated",
          locale: "en",
          description: "An updated description.",
          issued_on: "2025-02-10",
        }),
      }),
      { params: Promise.resolve({ id: String(createdData.id) }) }
    );
    expect(updated.status).toBe(200);
    const updatedData = (await body(updated)).data as {
      title: string;
      description: string | null;
      issued_on: string | null;
    };
    expect(updatedData.title).toBe("Round Trip Cert Updated");
    expect(updatedData.description).toBe("An updated description.");
    expect(updatedData.issued_on).toBe("2025-02-10T00:00:00.000000Z");

    const showAgain = await certificationShowGet(
      jsonRequest(`/api/v1/admin/certifications/${createdData.id}`, { headers: auth(token) }),
      { params: Promise.resolve({ id: String(createdData.id) }) }
    );
    expect(showAgain.status).toBe(200);
    const showAgainData = (await body(showAgain)).data as {
      title: string;
      description: string | null;
      issued_on: string | null;
    };
    expect(showAgainData.title).toBe("Round Trip Cert Updated");
    expect(showAgainData.description).toBe("An updated description.");
    expect(showAgainData.issued_on).toBe("2025-02-10T00:00:00.000000Z");
  });

  it("testimonials", async () => {
    await crudCycle({
      list: testimonialsGet,
      create: testimonialsPost,
      show: testimonialShowGet,
      update: testimonialUpdatePut,
      destroy: testimonialDeleteDel,
      path: "/api/v1/admin/testimonials",
      createBody: { quote: "Great work.", author: "CRUD Tester", locale: "en", is_visible: false },
      updateBody: { quote: "Great work.", author: "CRUD Tester", locale: "en", is_visible: true },
    });
  });

  it("resumes (with a real uploaded media file)", async () => {
    const form = new FormData();
    form.append("file", new File(["%PDF-1.4 fake resume"], "cv.pdf", { type: "application/pdf" }));
    const upload = await mediaPost(
      jsonRequest("/api/v1/admin/media", { method: "POST", headers: auth(token), body: form })
    );
    expect(upload.status).toBe(201);
    const mediaId = ((await body(upload)).data as { id: number }).id;

    const created = await resumesPost(
      jsonRequest("/api/v1/admin/resumes", {
        method: "POST",
        headers: jsonAuth(token),
        body: JSON.stringify({ label: "CRUD Resume", language: "En", media_id: mediaId, is_active: true }),
      })
    );
    expect(created.status).toBe(201);
    const createdData = (await body(created)).data as { id: number; media: { url: string } };
    expect(createdData.media.url).toMatch(/^\//);
    const id = createdData.id;

    const ctx = { params: Promise.resolve({ id: String(id) }) };
    const show = await resumeShowGet(jsonRequest(`/api/v1/admin/resumes/${id}`, { headers: auth(token) }), ctx);
    expect(show.status).toBe(200);
    const updated = await resumeUpdatePut(
      jsonRequest(`/api/v1/admin/resumes/${id}`, {
        method: "PUT",
        headers: jsonAuth(token),
        body: JSON.stringify({ label: "CRUD Resume", language: "Fr", media_id: mediaId }),
      }),
      ctx
    );
    expect(updated.status).toBe(200);

    const destroyed = await resumeDeleteDel(
      jsonRequest(`/api/v1/admin/resumes/${id}`, { method: "DELETE", headers: auth(token) }),
      ctx
    );
    expect(destroyed.status).toBe(200);

    const mediaDel = await mediaDeleteDel(
      jsonRequest(`/api/v1/admin/media/${mediaId}`, { method: "DELETE", headers: auth(token) }),
      { params: Promise.resolve({ id: String(mediaId) }) }
    );
    expect(mediaDel.status).toBe(200);
  });
});

describe("project relations sync", () => {
  type RelProject = {
    id: number;
    media: { id: number; collection: string; order_index: number }[];
    skills: { id: number }[];
    links: { label: string }[];
    cover: { id: number } | null;
  };

  async function createRelProject(extra: Record<string, unknown> = {}): Promise<RelProject> {
    const res = await projectsPost(
      jsonRequest("/api/v1/admin/projects", {
        method: "POST",
        headers: jsonAuth(token),
        body: JSON.stringify({
          title: "Relation Project",
          status: "published",
          locale: "en",
          ...extra,
        }),
      })
    );
    expect(res.status).toBe(201);
    return (await body(res)).data as RelProject;
  }

  async function updateRelProject(
    id: number,
    extra: Record<string, unknown>
  ): Promise<RelProject> {
    const res = await projectUpdatePut(
      jsonRequest(`/api/v1/admin/projects/${id}`, {
        method: "PUT",
        headers: jsonAuth(token),
        body: JSON.stringify({ title: "Relation Project", status: "published", locale: "en", ...extra }),
      }),
      { params: Promise.resolve({ id: String(id) }) }
    );
    expect(res.status).toBe(200);
    return (await body(res)).data as RelProject;
  }

  it("attaches media/skills/links on create with cover + order", async () => {
    const project = await createRelProject({
      media_ids: [1, 2, 3],
      skill_ids: [1, 2],
      links: [
        { label: "Demo", url: "https://example.com/demo", type: "demo" },
        { label: "GitHub", url: "https://github.com/x", type: "code" },
      ],
    });
    expect(project.media.map((m) => m.id)).toEqual([1, 2, 3]);
    expect(project.media[0].collection).toBe("cover");
    expect(project.media[0].order_index).toBe(0);
    expect(project.media[1].collection).toBe("gallery");
    expect(project.cover?.id).toBe(1);
    expect(project.skills.map((s) => s.id)).toEqual([1, 2]);
    expect(project.links.map((l) => l.label)).toEqual(["Demo", "GitHub"]);
  });

  it("detaches deselected media and re-syncs skills/links on update", async () => {
    const project = await createRelProject({
      media_ids: [1, 2, 3],
      skill_ids: [1, 2],
      links: [
        { label: "Demo", url: "https://example.com/demo", type: "demo" },
        { label: "GitHub", url: "https://github.com/x", type: "code" },
      ],
    });

    const updated = await updateRelProject(project.id, {
      media_ids: [3, 1],
      skill_ids: [2],
      links: [{ label: "Demo", url: "https://example.com/demo", type: "demo" }],
    });

    // media id 2 was detached; reordered selection makes id 3 the cover
    expect(updated.media.map((m) => m.id)).toEqual([3, 1]);
    expect(updated.media[0].collection).toBe("cover");
    expect(updated.media[0].order_index).toBe(0);
    expect(updated.media[1].collection).toBe("gallery");
    expect(updated.media[1].order_index).toBe(1);
    expect(updated.cover?.id).toBe(3);
    expect(updated.skills.map((s) => s.id)).toEqual([2]);
    expect(updated.links.map((l) => l.label)).toEqual(["Demo"]);
  });

  it("clears all relations when the arrays are emptied", async () => {
    const project = await createRelProject({
      media_ids: [1, 2],
      skill_ids: [1],
      links: [{ label: "Demo", url: "https://example.com/demo", type: "demo" }],
    });

    const updated = await updateRelProject(project.id, {
      media_ids: [],
      skill_ids: [],
      links: [],
    });

    expect(updated.media).toEqual([]);
    expect(updated.cover).toBeNull();
    expect(updated.skills).toEqual([]);
    expect(updated.links).toEqual([]);
  });

  it("leaves relations untouched when their keys are absent from the payload", async () => {
    const project = await createRelProject({
      media_ids: [1, 2],
      skill_ids: [1],
      links: [{ label: "Demo", url: "https://example.com/demo", type: "demo" }],
    });

    const updated = await updateRelProject(project.id, { summary: "title-only touch" });

    expect(updated.media.map((m) => m.id)).toEqual([1, 2]);
    expect(updated.skills.map((s) => s.id)).toEqual([1]);
    expect(updated.links.map((l) => l.label)).toEqual(["Demo"]);
  });
});

// ------------------------------------------------------- media + messages

describe("media library", () => {
  it("lists, uploads, and deletes a file", async () => {
    const list = await mediaGet(jsonRequest("/api/v1/admin/media", { headers: auth(token) }));
    expect(list.status).toBe(200);

    const form = new FormData();
    form.append("file", new File([Buffer.from("not-really-a-png")], "verify.png", { type: "image/png" }));
    const upload = await mediaPost(
      jsonRequest("/api/v1/admin/media", { method: "POST", headers: auth(token), body: form })
    );
    expect(upload.status).toBe(201);
    const data = (await body(upload)).data as { id: number; url: string; filename: string };
    expect(data.url).toMatch(/^\//);
    expect(data.filename).toBe("verify.png");

    const del = await mediaDeleteDel(
      jsonRequest(`/api/v1/admin/media/${data.id}`, { method: "DELETE", headers: auth(token) }),
      { params: Promise.resolve({ id: String(data.id) }) }
    );
    expect(del.status).toBe(200);
  });

  it("rejects an unsupported file type", async () => {
    const form = new FormData();
    form.append("file", new File(["doc"], "resume.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
    const upload = await mediaPost(
      jsonRequest("/api/v1/admin/media", { method: "POST", headers: auth(token), body: form })
    );
    expect(upload.status).toBe(422);
  });
});

describe("contact messages", () => {
  it("lists, marks read, deletes", async () => {
    const list = await messagesGet(jsonRequest("/api/v1/admin/contact-messages", { headers: auth(token) }));
    expect(list.status).toBe(200);
    const data = (await body(list)).data as { id: number }[];
    expect(data.length).toBeGreaterThan(0);

    const ctx = { params: Promise.resolve({ id: "1" }) };
    const read = await messageReadPatch(
      jsonRequest("/api/v1/admin/contact-messages/1/read", { method: "PATCH", headers: auth(token) }),
      ctx
    );
    expect(read.status).toBe(200);

    const del = await messageDeleteDel(
      jsonRequest("/api/v1/admin/contact-messages/1", { method: "DELETE", headers: auth(token) }),
      ctx
    );
    expect(del.status).toBe(200);
  });
});

// ------------------------------------------------------------------- auth

describe("auth + guards", () => {
  it("rejects admin endpoints without a token (401)", async () => {
    const res = await skillsGet(jsonRequest("/api/v1/admin/skills"));
    expect(res.status).toBe(401);
  });

  it("rejects non-admin users (403)", async () => {
    const login = await loginPost(
      jsonRequest("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "editor@josephlab.dev", password: "password" }),
      })
    );
    const editorToken = (await body(login)).token as string;
    const res = await resumesGet(jsonRequest("/api/v1/admin/resumes", { headers: auth(editorToken) }));
    expect(res.status).toBe(403);
  });

  it("logs out", async () => {
    const res = await logoutPost(
      jsonRequest("/api/v1/auth/logout", { method: "POST", headers: auth(token) })
    );
    expect(res.status).toBe(200);
  });

  it("me still works after login", async () => {
    const res = await meGet(jsonRequest("/api/v1/auth/me", { headers: auth(token) }));
    expect(res.status).toBe(200);
  });

  it("422s on missing required fields", async () => {
    const res = await skillsPost(
      jsonRequest("/api/v1/admin/skills", {
        method: "POST",
        headers: jsonAuth(token),
        body: JSON.stringify({ icon: "x" }),
      })
    );
    expect(res.status).toBe(422);
  });

  it("supports search and pagination on admin lists", async () => {
    const searched = await skillsGet(
      jsonRequest("/api/v1/admin/skills?search=Go&per_page=5&page=1", { headers: auth(token) })
    );
    expect(searched.status).toBe(200);
    const data = (await body(searched)).data as { name: string }[];
    expect(data.length).toBeGreaterThan(0);
    for (const r of data) expect(r.name).toMatch(/go/i);
  });
});