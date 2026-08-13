import { query } from "@/lib/db";
import { certificationResource, type CertificationRow } from "@/lib/resources";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const certifications = await query<CertificationRow>(
    "SELECT * FROM certifications WHERE is_visible = true ORDER BY order_index"
  );
  return json({ data: certifications.map(certificationResource) });
}