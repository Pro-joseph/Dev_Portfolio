import { resourceShow, resourceUpdate, resourceDestroy } from "@/lib/resource-id-routes";
import { parseId, handleError } from "@/lib/route-helpers";
import { notFound } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const parsed = parseId(id);
  if (parsed === null) return notFound();
  try {
    return await resourceShow("projects", parsed, request);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const parsed = parseId(id);
  if (parsed === null) return notFound();
  try {
    return await resourceUpdate("projects", parsed, request);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  return PATCH(request, { params });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const parsed = parseId(id);
  if (parsed === null) return notFound();
  try {
    return await resourceDestroy("projects", parsed, request);
  } catch (e) {
    return handleError(e);
  }
}
