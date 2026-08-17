import { loadTestimonials } from "@/lib/resources";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request = new Request("http://localhost/")): Promise<Response> {
  const locale = new URL(request.url).searchParams.get("locale") ?? undefined;
  return json({ data: await loadTestimonials(locale) });
}