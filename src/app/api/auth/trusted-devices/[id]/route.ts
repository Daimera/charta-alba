import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rememberDevices } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db
    .delete(rememberDevices)
    .where(and(eq(rememberDevices.id, id), eq(rememberDevices.userId, session.user.id)));

  return Response.json({ ok: true });
}
