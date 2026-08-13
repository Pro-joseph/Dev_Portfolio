import { AuthError } from "./auth";
import { unauthorized, forbidden, validationError } from "./http";

export function handleError(e: unknown): Response {
  if (e instanceof AuthError) {
    return e.status === 403 ? forbidden() : unauthorized();
  }
  const errObj = e as { status?: number; message?: string };
  if (typeof errObj?.status === "number" && errObj.status >= 400) {
    return unauthorized(errObj.message);
  }
  throw e;
}

export function parseId(value: string | undefined): number | null {
  if (!value) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export { validationError };