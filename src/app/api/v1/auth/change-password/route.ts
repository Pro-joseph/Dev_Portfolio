import { query, queryOne } from "@/lib/db";
import { requireAuth, checkPassword, hashPassword } from "@/lib/auth";
import { json, validationError } from "@/lib/http";
import { readJson } from "@/lib/request";
import { handleError } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

const MIN_PASSWORD = 8;

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireAuth(request);
    const body = await readJson(request);

    const errors: Record<string, string[]> = {};
    const current = body.current_password;
    const next = body.new_password;
    const confirm = body.new_password_confirmation;

    if (!current) {
      errors.current_password = ["The current password field is required."];
    }
    if (!next) {
      errors.new_password = ["The new password field is required."];
    } else if (typeof next === "string" && next.length < MIN_PASSWORD) {
      errors.new_password = [
        `The new password field must be at least ${MIN_PASSWORD} characters.`,
      ];
    }
    if (!confirm) {
      errors.new_password_confirmation = [
        "The new password confirmation field is required.",
      ];
    } else if (next && confirm !== next) {
      errors.new_password_confirmation = [
        "The new password confirmation does not match.",
      ];
    }

    if (Object.keys(errors).length) return validationError(errors);

    const row = await queryOne<{ password: string }>(
      "SELECT password FROM users WHERE id = $1",
      [user.id]
    );

    if (!row || !checkPassword(String(current), row.password)) {
      return validationError({
        current_password: ["The current password is incorrect."],
      });
    }

    await query("UPDATE users SET password = $1, updated_at = $2 WHERE id = $3", [
      hashPassword(String(next)),
      new Date().toISOString(),
      user.id,
    ]);

    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}