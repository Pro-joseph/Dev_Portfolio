import { queryOne } from "@/lib/db";
import {
  checkPassword,
  signToken,
  createSession,
  purgeExpiredSessions,
  sessionCookieHeader,
  TOKEN_TTL_SECONDS,
  type AuthUser,
} from "@/lib/auth";
import { json, validationError } from "@/lib/http";
import { makeValidator } from "@/lib/validators";
import { readJson } from "@/lib/request";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  const result = makeValidator(() => ({
    email: { required: true, email: true },
    password: { required: true },
  }))(body);

  if (!result.ok) return validationError(result.errors);

  const data = result.data;
  const user = await queryOne<AuthUser & { password: string }>(
    "SELECT id, name, email, password, role FROM users WHERE email = $1",
    [String(data.email)]
  );

  if (!user || !checkPassword(String(data.password), user.password)) {
    return validationError({
      email: ["The provided credentials are incorrect."],
    });
  }

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };

  await purgeExpiredSessions(user.id);
  const jti = await createSession(user.id);
  const token = signToken(safeUser, jti);

  const response = json({ token, user: safeUser });
  response.headers.append("Set-Cookie", sessionCookieHeader(token, TOKEN_TTL_SECONDS));
  return response;
}