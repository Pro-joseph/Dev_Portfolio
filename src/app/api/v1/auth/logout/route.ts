import { readToken, revokeSession, clearSessionCookieHeader } from "@/lib/auth";
import { json } from "@/lib/http";
import { handleError } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = readToken(request);
    if (payload) {
      await revokeSession(payload.jti);
    }
    const response = json({ message: "Logged out." });
    response.headers.append("Set-Cookie", clearSessionCookieHeader());
    return response;
  } catch (e) {
    return handleError(e);
  }
}