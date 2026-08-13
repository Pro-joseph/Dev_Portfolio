import { query, nextId } from "@/lib/db";
import { json, validationError } from "@/lib/http";
import { makeValidator } from "@/lib/validators";
import { readJson } from "@/lib/request";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  const result = makeValidator(() => ({
    name: { required: true, max: 120 },
    email: { required: true, email: true, max: 180 },
    subject: { max: 200 },
    message: { required: true, max: 5000 },
  }))(body);

  if (!result.ok) return validationError(result.errors);

  const data = result.data;
  const id = await nextId("contact_messages");
  const now = new Date().toISOString();

  await query(
    `INSERT INTO contact_messages (id, name, email, subject, message, is_read, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, false, $6, $7)`,
    [id, data.name, data.email, data.subject ?? null, data.message, now, now]
  );

  return json({ message: "Message sent.", data: { id } }, 201);
}