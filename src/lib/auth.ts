import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { queryOne, run } from "./db";
import { jwtSecret } from "./config";

export const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

export const SESSION_COOKIE = "jl_session";

interface TokenPayload {
  sub: number;
  role: string;
  jti: string;
  iat: number;
  exp: number;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function signToken(user: { id: number; role: string }, jti: string): string {
  const secret = jwtSecret();
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: user.id,
    role: user.role,
    jti,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  const body = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const secret = jwtSecret();
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.jti) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: number, ttlSeconds = TOKEN_TTL_SECONDS): Promise<string> {
  const jti = randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await run("INSERT INTO sessions (id, user_id, created_at, expires_at, last_seen_at) VALUES ($1, $2, $3, $4, $3)", [
    jti,
    userId,
    now,
    expiresAt,
  ]);
  return jti;
}

export async function revokeSession(jti: string): Promise<void> {
  await run("DELETE FROM sessions WHERE id = $1", [jti]);
}

export async function purgeExpiredSessions(userId: number): Promise<void> {
  await run("DELETE FROM sessions WHERE user_id = $1 AND expires_at <= $2", [userId, new Date().toISOString()]);
}

export function sessionCookieHeader(token: string, ttlSeconds: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ttlSeconds}${secure}`;
}

export function clearSessionCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function checkPassword(plain: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return out;
}

function extractToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  const cookies = parseCookies(request.headers.get("cookie"));
  return cookies[SESSION_COOKIE] || null;
}

export function readToken(request: Request): TokenPayload | null {
  const token = extractToken(request);
  if (!token) return null;
  return verifyToken(token);
}

export async function authUser(request: Request): Promise<AuthUser | null> {
  const payload = readToken(request);
  if (!payload) return null;

  const session = await queryOne<{ id: string }>(
    "SELECT id FROM sessions WHERE id = $1 AND user_id = $2 AND expires_at > $3",
    [payload.jti, payload.sub, new Date().toISOString()]
  );
  if (!session) return null;

  await run("UPDATE sessions SET last_seen_at = $1 WHERE id = $2", [new Date().toISOString(), payload.jti]);

  const user = await queryOne<AuthUser>(
    "SELECT id, name, email, role FROM users WHERE id = $1",
    [payload.sub]
  );
  return user ?? null;
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const user = await authUser(request);
  if (!user) {
    throw new AuthError("Unauthenticated.", 401);
  }
  return user;
}

export async function requireAdmin(request: Request): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.role !== "admin") {
    throw new AuthError("Forbidden.", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

