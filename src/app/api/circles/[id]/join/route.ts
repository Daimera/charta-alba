import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { circles, circleMembers } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { assertUUID } from "@/lib/sanitize";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const uuidErr = assertUUID(id);
  if (uuidErr) return uuidErr;

  const [circle] = await db.select({ id: circles.id, isPublic: circles.isPublic })
    .from(circles)
    .where(eq(circles.id, id))
    .limit(1);

  if (!circle) return Response.json({ error: "Circle not found" }, { status: 404 });
  if (!circle.isPublic) return Response.json({ error: "This circle is private" }, { status: 403 });

  // Check already a member
  const [existing] = await db
    .select({ id: circleMembers.id })
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, id), eq(circleMembers.userId, session.user.id)))
    .limit(1);

  if (existing) return Response.json({ ok: true, alreadyMember: true });

  await db.insert(circleMembers).values({
    circleId: id,
    userId: session.user.id,
    role: "member",
  });

  // Increment member count
  await db.update(circles)
    .set({ memberCount: sql`${circles.memberCount} + 1` })
    .where(eq(circles.id, id));

  return Response.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const uuidErr = assertUUID(id);
  if (uuidErr) return uuidErr;

  const [existing] = await db
    .select({ id: circleMembers.id, role: circleMembers.role })
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, id), eq(circleMembers.userId, session.user.id)))
    .limit(1);

  if (!existing) return Response.json({ ok: true });
  if (existing.role === "owner") return Response.json({ error: "Owners cannot leave their own circle" }, { status: 400 });

  await db.delete(circleMembers)
    .where(and(eq(circleMembers.circleId, id), eq(circleMembers.userId, session.user.id)));

  await db.update(circles)
    .set({ memberCount: sql`GREATEST(${circles.memberCount} - 1, 0)` })
    .where(eq(circles.id, id));

  return Response.json({ ok: true });
}
