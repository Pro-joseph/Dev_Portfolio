import { describe, it, expect, beforeEach } from "vitest";
import path from "node:path";
import os from "node:os";
import { resetDb } from "@/lib/db";
import { POST as loginPost } from "@/app/api/v1/auth/login/route";
import { GET as statsGet } from "@/app/api/v1/admin/dashboard/stats/route";
import { GET as exportGet } from "@/app/api/v1/admin/dashboard/export/route";
import { GET as statusGet } from "@/app/api/v1/admin/system/status/route";
import { GET as mediaGet, POST as mediaPost } from "@/app/api/v1/admin/media/route";
import { GET as messagesGet } from "@/app/api/v1/admin/contact-messages/route";

process.env.MEDIA_UPLOAD_DIR = path.join(os.tmpdir(), "dashboard-test-media");

function jsonRequest(url: string, init?: RequestInit): Request {
  return new Request(`http://127.0.0.1:3001${url}`, init);
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

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

// ------------------------------------------------------------ dashboard stats

describe("dashboard stats", () => {
  it("returns all metrics with a 30-day series by default", async () => {
    const res = await statsGet(jsonRequest("/api/v1/admin/dashboard/stats", { headers: auth(token) }));
    expect(res.status).toBe(200);
    const data = await body(res);
    expect(typeof data.total_views).toBe("number");
    expect(typeof data.views_delta).toBe("string");
    expect((data.views_series as unknown[]).length).toBe(30);
    expect(data.total_projects).toBeGreaterThan(0);
    expect(typeof data.published_projects).toBe("number");
    expect(typeof data.draft_projects).toBe("number");
    expect(typeof data.total_skills).toBe("number");
    expect(data.total_certifications).toBeGreaterThan(0);
    expect(typeof data.unread_messages).toBe("number");
    expect(Array.isArray(data.recent_projects)).toBe(true);
    expect(typeof data.media_storage).toBe("object");
  });

  it("honors the days parameter", async () => {
    const res = await statsGet(jsonRequest("/api/v1/admin/dashboard/stats?days=7", { headers: auth(token) }));
    expect(res.status).toBe(200);
    expect((await body(res)).views_series as unknown[]).toHaveLength(7);
  });

  it("clamps days to the 7–90 range", async () => {
    const low = await statsGet(jsonRequest("/api/v1/admin/dashboard/stats?days=3", { headers: auth(token) }));
    expect((await body(low)).views_series as unknown[]).toHaveLength(7);

    const high = await statsGet(jsonRequest("/api/v1/admin/dashboard/stats?days=500", { headers: auth(token) }));
    expect((await body(high)).views_series as unknown[]).toHaveLength(90);
  });

  it("requires admin auth", async () => {
    const res = await statsGet(jsonRequest("/api/v1/admin/dashboard/stats"));
    expect(res.status).toBe(401);
  });
});

// ------------------------------------------------------------ dashboard export

describe("dashboard CSV export", () => {
  it("downloads a CSV summary", async () => {
    const res = await exportGet(jsonRequest("/api/v1/admin/dashboard/export?days=7", { headers: auth(token) }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/csv/);
    expect(res.headers.get("content-disposition")).toMatch(/attachment/);
    const text = await res.text();
    expect(text).toContain("Metric");
    expect(text).toContain("Total Views");
    expect(text).toContain("Date,Views");
    expect(text.split("\n").length).toBeGreaterThan(12);
  });

  it("requires admin auth", async () => {
    const res = await exportGet(jsonRequest("/api/v1/admin/dashboard/export"));
    expect(res.status).toBe(401);
  });
});

// ------------------------------------------------------------ system status

describe("system status", () => {
  it("reports database health and storage state", async () => {
    const res = await statusGet(jsonRequest("/api/v1/admin/system/status", { headers: auth(token) }));
    expect(res.status).toBe(200);
    const data = await body(res);
    expect(data.ok).toBe(true);
    expect(data.status).toBe("ok");
    expect((data.db as Record<string, unknown>).ok).toBe(true);
    expect(typeof (data.db as Record<string, unknown>).latency_ms).toBe("number");
    expect((data.storage as Record<string, unknown>).status).toBe("unconfigured");
    expect((data.storage as Record<string, unknown>).latency_ms).toBeNull();
    expect(typeof data.timestamp).toBe("string");
  });

  it("requires admin auth", async () => {
    const res = await statusGet(jsonRequest("/api/v1/admin/system/status"));
    expect(res.status).toBe(401);
  });
});

// ------------------------------------------------------------ search filters

describe("media search", () => {
  it("filters by filename", async () => {
    const form = new FormData();
    form.append("file", new File([Buffer.from("not-really-a-png")], "search-me.png", { type: "image/png" }));
    const upload = await mediaPost(
      jsonRequest("/api/v1/admin/media", { method: "POST", headers: auth(token), body: form })
    );
    expect(upload.status).toBe(201);

    const hit = await mediaGet(jsonRequest("/api/v1/admin/media?search=search-me", { headers: auth(token) }));
    expect(hit.status).toBe(200);
    const hitData = (await body(hit)).data as { filename: string }[];
    expect(hitData.length).toBe(1);
    expect(hitData[0].filename).toBe("search-me.png");

    const miss = await mediaGet(jsonRequest("/api/v1/admin/media?search=zzzz-not-there", { headers: auth(token) }));
    const missData = (await body(miss)).data as unknown[];
    expect(missData.length).toBe(0);
  });
});

describe("contact messages search", () => {
  it("filters by name and subject", async () => {
    const byName = await messagesGet(
      jsonRequest("/api/v1/admin/contact-messages?search=Alicia", { headers: auth(token) })
    );
    expect(byName.status).toBe(200);
    const byNameData = (await body(byName)).data as { name: string }[];
    expect(byNameData.length).toBe(1);
    expect(byNameData[0].name).toBe("Alicia Roberts");

    const bySubject = await messagesGet(
      jsonRequest("/api/v1/admin/contact-messages?search=Contract", { headers: auth(token) })
    );
    const bySubjectData = (await body(bySubject)).data as { subject: string }[];
    expect(bySubjectData.length).toBe(1);
    expect(bySubjectData[0].subject).toBe("Contract role");

    const miss = await messagesGet(
      jsonRequest("/api/v1/admin/contact-messages?search=zzzz-not-there", { headers: auth(token) })
    );
    expect((await body(miss)).data as unknown[]).toHaveLength(0);
  });
});