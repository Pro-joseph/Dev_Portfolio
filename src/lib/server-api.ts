import { headers } from "next/headers";
import { API_URL } from "./api";

/**
 * The API is served by this same Next.js app, so server-side fetches must
 * resolve to an absolute URL using the incoming request's origin.
 */
async function resolveApiUrl(path: string): Promise<string> {
  if (/^https?:\/\//.test(API_URL)) return `${API_URL}${path}`;
  const h = await headers();
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";
  const host =
    h.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h.get("host");
  const base = host ? `${proto}://${host}` : "http://localhost:3000";
  return `${base}${API_URL}${path}`;
}

export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = await resolveApiUrl(path);
  const response = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`API ${response.status} for ${path}`);
  }

  return (await response.json()) as T;
}