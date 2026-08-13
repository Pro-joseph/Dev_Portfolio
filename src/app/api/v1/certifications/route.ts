import { loadCertifications } from "@/lib/resources";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return json({ data: await loadCertifications() });
}
