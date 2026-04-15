import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { circles, circleMembers } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { assertUUID } from "@/lib/sanitize";

type Params = { params: Promise<{ id: string; userId: string }> };

/** PATCH — promote to moderator or demote to member */
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, userId } = await params;
  const uuidErr = assertUUID(id);
  if (uuidErr) return uuidErr;

  const [circle] = await db
    .select({ ownerId: circles.ownerId })
    .from(circles)
    .where(eq(circles.id, id))
    .limit(1);

  if (!circle) return Response.json({ error: "Circle not found" }, { status: 404 });
  // Only owner can promote/demote
  if (circle.ownerId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  // Cannot change own role
  if (userId === session.user.id) {
    return Response.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const body = await req.json() as { role: "member" | "moderator" };
  if (!["member", "moderator"].includes(body.role)) {
    return Response.json({ error: "role must be member or moderator" }, { status: 400 });
  }

  const [updated] = await db
    .update(circleMembers)
    .set({ role: body.role })
    .where(and(eq(circleMembers.circleId, id), eq(circleMembers.userId, userId)))
    .returning({ id: circleMembers.id, role: circleMembers.role });

  if (!updated) return Response.json({ error: "Member not found" }, { status: 404 });
  return Response.json({ ok: true, role: updated.role });
}

/** DELETE — remove a member (owner or moderator action) */
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, userId } = await params;
  const uuidErr = assertUUID(id);
  if (uuidErr) return uuidErr;

  const [circle] = await db
    .select({ ownerId: circles.ownerId })
    .from(circles)
    .where(eq(circles.id, id))
    .limit(1);

  if (!circle) return Response.json({ error: "Circle not found" }, { status: 404 });

  // Check requester's role
  const [requesterMember] = await db
    .select({ role: circleMembers.role })
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, id), eq(circleMembers.userId, session.user.id)))
    .limit(1);

  const isOwner = circle.ownerId === session.user.id;
  const isModerator = requesterMember?.role === "moderator";

  if (!isOwner && !isModerator) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (userId === circle.ownerId) {
    return Response.json({ error: "Cannot remove the circle owner" }, { status: 400 });
  }
  // Moderators can only remove regular members, not other moderators
  if (isModerator && !isOwner) {
    const [targetMember] = await db
      .select({ role: circleMembers.role })
      .from(circleMembers)
      .where(and(eq(circleMembers.circleId, id), eq(circleMembers.userId, userId)))
      .limit(1);
    if (targetMember?.role === "moderator") {
      return Response.json({ error: "Moderators cannot remove other moderators" }, { status: 403 });
    }
  }

  await db
    .delete(circleMembers)
    .where(and(eq(circleMembers.circleId, id), eq(circleMembers.userId, userId)));

  await db
    .update(circles)
    .set({ memberCount: sql`GREATEST(${circles.memberCount} - 1, 0)` })
    .where(eq(circles.id, id));

  return Response.json({ ok: true });
}
