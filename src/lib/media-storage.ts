import path from "node:path";

/**
 * Storage root for media uploads. Configure via MEDIA_UPLOAD_DIR (relative
 * paths resolve against the app root, e.g. "public/uploads"). Falls back to
 * the original hard-coded location so the public URL mapping stays stable.
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
 * to live under "public", so the DB path is trimmed to that segment.
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