import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, query } from "@/lib/db";
import { POST as trackPost } from "@/app/api/v1/track/route";
import { GET as geoGet } from "@/app/api/v1/admin/dashboard/geo/route";
import { POST as loginPost } from "@/app/api/v1/auth/login/route";

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
  const data = (await body(res)) as { token: string };
  return data.token;
}

beforeEach(async () => {
  await resetDb();
  token = await loginAsAdmin();
});

describe("POST /track", () => {
  it("records a visit with geo headers", async () => {
    const res = await trackPost(
      jsonRequest("/api/v1/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/126.0",
          referer: "https://www.google.com/",
          "x-vercel-ip-country": "FR",
          "x-vercel-ip-country-region": "IDF",
          "x-vercel-ip-city": "Paris",
        },
        body: JSON.stringify({ path: "/fr/projects/threadforge", locale: "fr" }),
      })
    );
    expect(res.status).toBe(200);
    expect(await body(res)).toEqual({ ok: true });

    const rows = await query<{ path: string; locale: string; country: string; city: string; referrer: string }>(
      "SELECT path, locale, country, city, referrer FROM visit_logs"
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].path).toBe("/fr/projects/threadforge");
    expect(rows[0].locale).toBe("fr");
    expect(rows[0].country).toBe("FR");
    expect(rows[0].city).toBe("Paris");
    expect(rows[0].referrer).toContain("google.com");
  });

  it("skips bots but still returns ok", async () => {
    const res = await trackPost(
      jsonRequest("/api/v1/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
        },
        body: JSON.stringify({ path: "/en", locale: "en" }),
      })
    );
    expect(res.status).toBe(200);
    expect(await body(res)).toEqual({ ok: true });

    const rows = await query("SELECT id FROM visit_logs");
    expect(rows).toHaveLength(0);
  });

  it("rejects invalid paths", async () => {
    const res = await trackPost(
      jsonRequest("/api/v1/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "not-a-path", locale: "en" }),
      })
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /admin/dashboard/geo", () => {
  it("401s without a token", async () => {
    const res = await geoGet(jsonRequest("/api/v1/admin/dashboard/geo"));
    expect(res.status).toBe(401);
  });

  it("aggregates visits by country, city and day", async () => {
    const mk = (path: string, country: string | null, city: string | null, ua: string) =>
      trackPost(
        jsonRequest("/api/v1/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "user-agent": ua,
            ...(country ? { "x-vercel-ip-country": country } : {}),
            ...(city ? { "x-vercel-ip-city": city } : {}),
          },
          body: JSON.stringify({ path, locale: "en" }),
        })
      );

    await mk("/en", "MA", "Casablanca", "Mozilla/5.0 Chrome/126.0");
    await mk("/en/projects/threadforge", "MA", "Casablanca", "Mozilla/5.0 Chrome/126.0");
    await mk("/fr", "FR", "Paris", "Mozilla/5.0 Firefox/127.0");

    const res = await geoGet(jsonRequest("/api/v1/admin/dashboard/geo?days=7", {
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(200);
    const data = (await body(res)) as {
      total: number;
      countries: { name: string; count: number }[];
      cities: { name: string; count: number }[];
      series: { date: string; visits: number }[];
      recent: unknown[];
    };
    expect(data.total).toBe(3);
    expect(data.countries[0]).toEqual({ name: "MA", count: 2 });
    expect(data.cities[0]).toEqual({ name: "Casablanca", country: "MA", count: 2 });
    expect(data.series).toHaveLength(7);
    expect(data.series.reduce((a, b) => a + b.visits, 0)).toBe(3);
    expect(data.recent.length).toBe(3);
  });
});