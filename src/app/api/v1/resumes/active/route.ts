import { query } from "@/lib/db";
import { resumeDownloadUrl } from "@/lib/resources";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const resume = await query<{
    resume_id: number;
    label: string;
    language: string;
    media_disk: string;
    media_path: string;
    media_filename: string;
  }>(
    `SELECT r.id AS resume_id, r.label, r.language,
            m.disk AS media_disk, m.path AS media_path,
            m.filename AS media_filename
     FROM resumes r
     JOIN media m ON m.id = r.media_id
     WHERE r.is_active = true
     ORDER BY r.created_at DESC
     LIMIT 1`
  );

  if (!resume[0]) {
    return json({ data: null });
  }

  const row = resume[0];
  return json({
    data: {
      id: row.resume_id,
      label: row.label,
      language: row.language,
      filename: row.media_filename,
      url: resumeDownloadUrl({
        disk: row.media_disk,
        path: row.media_path,
        filename: row.media_filename,
      }),
    },
  });
}