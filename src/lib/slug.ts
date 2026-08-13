import { queryOne } from "./db";

const NON_WORD = /[^\p{L}\p{N}\s-]/gu;

export function slugify(input: string): string {
  const slug = String(input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(NON_WORD, "")
    .trim()
    .replace(/[\s-]+/g, "-");
  return slug || "untitled";
}

export async function uniqueSlug(
  table: string,
  base: string,
  ignoreId?: number | null
): Promise<string> {
  const candidate = slugify(base);
  let suffix = 2;
  let current = candidate;
  for (;;) {
    const row = await queryOne<{ id: number }>(
      `SELECT id FROM ${table} WHERE slug = $1 ${ignoreId ? "AND id != $2" : ""}`,
      ignoreId ? [current, ignoreId] : [current]
    );
    if (!row) return current;
    current = `${candidate}-${suffix}`;
    suffix++;
  }
}