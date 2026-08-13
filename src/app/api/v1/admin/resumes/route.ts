import { resourceIndex, resourceStore } from "@/lib/resource-routes";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return resourceIndex("resumes", request);
}

export async function POST(request: Request): Promise<Response> {
  return resourceStore("resumes", request);
}
