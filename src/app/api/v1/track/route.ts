import { nextId, run } from "@/lib/db";
import { json } from "@/lib/http";
import { isBot } from "@/lib/bots";

export const dynamic = "force-dynamic";

const MAX_LEN = 300;

function clean(value: string | null, max = MAX_LEN): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export async function POST(request: Request): Promise<Response> {
  let body: { path?: unknown; locale?: unknown } = {};
  try {
    body = (await request.json()) as { path?: unknown; locale?: unknown };
  } catch {
    return json({ ok: false }, 400);
  }

  const path = typeof body.path === "string" ? body.path : "";
  if (!path.startsWith("/") || path.length > MAX_LEN) {
    return json({ ok: false }, 400);
  }
  const locale = typeof body.locale === "string" ? clean(body.locale, 10) : null;

  const userAgent = request.headers.get("user-agent");
  if (isBot(userAgent)) {
    return json({ ok: true });
  }

  const country = clean(request.headers.get("x-vercel-ip-country"), 10);
  const region = clean(request.headers.get("x-vercel-ip-country-region"), 100);
  const city = clean(request.headers.get("x-vercel-ip-city"), 100);
  const referrer = clean(request.headers.get("referer"));

  const id = await nextId("visit_logs");
  await run(
    "INSERT INTO visit_logs (id, path, locale, country, region, city, referrer, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [id, path, locale, country, region, city, referrer, new Date().toISOString()]
  );

  return json({ ok: true });
}