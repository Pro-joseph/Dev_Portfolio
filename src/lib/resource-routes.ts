import { crudDefs } from "./resource-crud";
import { crudIndex, crudStore } from "./admin-crud";
import { requireAdmin } from "./auth";
import { handleError } from "./route-helpers";
import { json } from "./http";

export async function resourceIndex(
  resource: string,
  request: Request
): Promise<Response> {
  const crud = crudDefs[resource];
  if (!crud) return json({ message: "Not found." }, 404);
  try {
    await requireAdmin(request);
    return await crudIndex(crud, request);
  } catch (e) {
    return handleError(e);
  }
}

export async function resourceStore(
  resource: string,
  request: Request
): Promise<Response> {
  const crud = crudDefs[resource];
  if (!crud) return json({ message: "Not found." }, 404);
  try {
    await requireAdmin(request);
    return await crudStore(crud, request);
  } catch (e) {
    return handleError(e);
  }
}