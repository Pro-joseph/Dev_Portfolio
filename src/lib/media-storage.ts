import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Storage root for media uploads. Configure via MEDIA_UPLOAD_DIR (relative
 * paths resolve against the app root, e.g. "public/uploads"). Falls back to
 * the original hard-coded location so the public URL mapping stays stable.
 * Only used on the local-filesystem (non-Supabase) path.
 */
export function uploadRoot(): string {
  const configured = process.env.MEDIA_UPLOAD_DIR?.trim();
  if (!configured) return path.join(process.cwd(), "public", "uploads");
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

/**
 * Public-relative path stored on the media row. MEDIA_UPLOAD_DIR is expected
 * to live under "public", so the DB path is trimmed to that segment. The same
 * relative path is used as the object key inside the Supabase storage bucket.
 */
export function uploadRelPath(storedName: string): string {
  const configured = process.env.MEDIA_UPLOAD_DIR?.trim();
  if (!configured) return `uploads/${storedName}`;
  const normalized = configured.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const segments = normalized.split("/");
  const publicIndex = segments.indexOf("public");
  const tail =
    publicIndex >= 0
      ? segments.slice(publicIndex + 1).join("/")
      : segments[segments.length - 1];
  return tail ? `${tail}/${storedName}` : storedName;
}

// ---------------------------------------------------------------- supabase

export function supabaseEnabled(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export function bucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "media";
}

let sb: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!sb) {
    sb = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      { auth: { persistSession: false } }
    );
  }
  return sb;
}

/**
 * Uploads a buffer to the Supabase storage bucket. Returns the object key
 * (equal to uploadRelPath(storedName)) on success.
 */
export async function saveMediaFile(
  buffer: Buffer,
  storedName: string
): Promise<string> {
  const rel = uploadRelPath(storedName);
  const { error } = await getSupabase()
    .storage.from(bucketName())
    .upload(rel, buffer, { contentType: "application/octet-stream", upsert: true });
  if (error) throw new Error(error.message);
  return rel;
}

/** Removes an object from the Supabase storage bucket. */
export async function deleteMediaFile(objectPath: string): Promise<void> {
  const { error } = await getSupabase().storage.from(bucketName()).remove([objectPath]);
  if (error) throw new Error(error.message);
}

/** Public URL for an object in the Supabase storage bucket. */
export function mediaPublicUrl(objectPath: string): string | null {
  if (!supabaseEnabled()) return null;
  return getSupabase().storage.from(bucketName()).getPublicUrl(objectPath).data
    .publicUrl;
}