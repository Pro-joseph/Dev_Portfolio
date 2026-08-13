import { crudDefs } from "./resource-crud";
import { crudShow, crudUpdate, crudDestroy } from "./admin-crud";
import { requireAdmin } from "./auth";
import { handleError } from "./route-helpers";
import { notFound } from "./http";

export async function resourceShow(
  resource: string,
  id: number,
  request: Request
): Promise<Response> {
  const crud = crudDefs[resource];
  if (!crud) return notFound();
  try {
    await requireAdmin(request);
    return await crudShow(crud, id);
  } catch (e) {
    return handleError(e);
  }
}

export async function resourceUpdate(
  resource: string,
  id: number,
  request: Request
): Promise<Response> {
  const crud = crudDefs[resource];
  if (!crud) return notFound();
  try {
    await requireAdmin(request);
    return await crudUpdate(crud, id, request);
  } catch (e) {
    return handleError(e);
  }
}

export async function resourceDestroy(
  resource: string,
  id: number,
  request: Request
): Promise<Response> {
  const crud = crudDefs[resource];
  if (!crud) return notFound();
  try {
    await requireAdmin(request);
    return await crudDestroy(crud, id);
  } catch (e) {
    return handleError(e);
  }
}