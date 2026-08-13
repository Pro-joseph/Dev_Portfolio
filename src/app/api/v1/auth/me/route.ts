import { requireAuth, type AuthUser } from "@/lib/auth";
import { json } from "@/lib/http";
import { handleError } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireAuth(request) as AuthUser;
    return json({
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    return handleError(e);
  }
}