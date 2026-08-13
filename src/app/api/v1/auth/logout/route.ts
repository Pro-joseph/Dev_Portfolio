import { requireAuth, type AuthUser } from "@/lib/auth";
import { json } from "@/lib/http";
import { handleError } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    await requireAuth(request);
    return json({ message: "Logged out." });
  } catch (e) {
    return handleError(e);
  }
}