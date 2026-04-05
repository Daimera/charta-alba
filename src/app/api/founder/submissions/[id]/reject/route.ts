import { authenticateFounder } from "@/middleware/founderAuth";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sanitizeString } from "@/lib/sanitize";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const fa = await authenticateFounder(req, 2);
  if (!fa.ok) return fa.response;

  const { id } = await params;
  const body = await req.json() as { reason?: unknown };
  const reason = sanitizeString(body.reason, 500) ?? "No reason provided";

  await db.update(submissions).set({
    status: "rejected",
    rejectionReason: reason,
  }).where(eq(submissions.id, id));

  return Response.json({ ok: true });
}
