import { describe, it, expect } from "vitest";
import { query, queryOne, nextId, resetDb } from "../src/lib/db";

/**
 * Postgres driver smoke test. Runs only when BOTH DATABASE_URL and
 * SMOKE_POSTGRES=1 are set (so the default `npm test` suite is unaffected).
 * Exercises the schema apply, seed, native Postgres syntax, boolean binding
 * and nextId against a real Postgres/Supabase instance.
 */
const enabled = Boolean(
  process.env.DATABASE_URL?.trim() && process.env.SMOKE_POSTGRES === "1"
);

describe.skipIf(!enabled)("postgres driver", () => {
  it("applies schema + seeds, returns native types", async () => {
    await resetDb();
    const users = await query<{ n: number }>(
      "SELECT COUNT(*)::int AS n FROM users"
    );
    expect(Number(users[0]?.n)).toBeGreaterThan(0);

    const booleans = await queryOne<{ is_visible: unknown }>(
      "SELECT is_visible FROM social_links WHERE id = $1",
      [1]
    );
    expect(typeof booleans?.is_visible).toBe("boolean");

    const id = await nextId("projects");
    expect(typeof id).toBe("number");

    const linked = await query(
      "SELECT id FROM project_links WHERE project_id = ANY($1::int[]) ORDER BY id",
      [[1, 2]]
    );
    expect(linked.length).toBeGreaterThan(0);

    const searched = await query(
      "SELECT COUNT(*)::int AS n FROM projects WHERE title ILIKE $1",
      ["%a%"]
    );
    expect(Number(searched[0]?.n)).toBeGreaterThanOrEqual(0);
  });

  it("binds booleans for writes", async () => {
    await query("UPDATE social_links SET is_visible = $1 WHERE id = $2", [
      false,
      1,
    ]);
    const row = await queryOne<{ is_visible: unknown }>(
      "SELECT is_visible FROM social_links WHERE id = $1",
      [1]
    );
    expect(row?.is_visible).toBe(false);
    await query("UPDATE social_links SET is_visible = $1 WHERE id = $2", [
      true,
      1,
    ]);
  });
});