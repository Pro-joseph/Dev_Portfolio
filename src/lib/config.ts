export const ALLOWED_MEDIA = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "video/mp4",
];

export const ALLOWED_MEDIA_REGEX =
  /^(image\/(jpeg|png|gif|webp|svg\+xml)|image\/svg|application\/pdf|video\/mp4)$/;

export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;

const MEDIA_QUOTA_DEFAULT = 6 * 1024 * 1024 * 1024;

export function mediaMaxBytes(): number {
  const n = Number(process.env.MEDIA_MAX_BYTES);
  return Number.isFinite(n) && n > 0 ? n : MEDIA_MAX_BYTES;
}

export function mediaQuotaBytes(): number {
  const n = Number(process.env.MEDIA_QUOTA_BYTES);
  return Number.isFinite(n) && n > 0 ? n : MEDIA_QUOTA_DEFAULT;
}

export function mediaBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "media";
}

export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is not set.");
  }
  return "dev-secret-change-me";
}

export const DEV_JWT_SECRET = "dev-secret-change-me";

export const UPLOADS_REL_DIR = "uploads";

export const PAGE_SIZE_PUBLIC = 12;
export const PAGE_SIZE_ADMIN = 20;
export const PAGE_SIZE_MEDIA = 24;
export const PAGE_SIZE_LISTS = 50;
export const PAGE_SIZE_OPTIONS = 100;
