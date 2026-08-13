export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const text = await request.text();
    if (!text) return {};
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function intOrNull(value: unknown): number | null {
  if (value === null || value === "" || value === undefined) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export function boolValue(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function strOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}