import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { circles, circleMembers, users, profiles } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const members = await db
    .select({
      id: circleMembers.id,
      userId: circleMembers.userId,
      role: circleMembers.role,
      joinedAt: circleMembers.createdAt,
      name: users.name,
      image: users.image,
      username: profiles.username,
    })
    .from(circleMembers)
    .leftJoin(users, eq(circleMembers.userId, users.id))
    .leftJoin(profiles, eq(profiles.id, circleMembers.userId))
    .where(eq(circleMembers.circleId, id))
    .orderBy(circleMembers.createdAt)
    .limit(100);

  return Response.json({ members });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [circle] = await db.select().from(circles).where(eq(circles.id, id)).limit(1);
  if (!circle) return Response.json({ error: "Circle not found" }, { status: 404 });

  // Owner-add path: owner can directly add any user by id
  let body: { inviteUserId?: string } = {};
  try { body = await req.json() as { inviteUserId?: string }; } catch { /* empty body = self-join */ }

  const targetUserId = body.inviteUserId ?? session.user.id;
  const isOwnerAdding = body.inviteUserId && circle.ownerId === session.user.id;

  if (targetUserId !== session.user.id && !isOwnerAdding) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!circle.isPublic && targetUserId === session.user.id) {
    return Response.json({ error: "Private circles require an invitation" }, { status: 403 });
  }

  const [existing] = await db
    .select({ id: circleMembers.id })
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, id), eq(circleMembers.userId, targetUserId)))
    .limit(1);

  if (!existing) {
    await db
      .insert(circleMembers)
      .values({ circleId: id, userId: targetUserId, role: "member" })
      .onConflictDoNothing();

    await db
      .update(circles)
      .set({ memberCount: sql`${circles.memberCount} + 1` })
      .where(eq(circles.id, id));
  }

  return Response.json({ ok: true }, { status: 201 });
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
  const [circle] = await db.select({ ownerId: circles.ownerId }).from(circles).where(eq(circles.id, id)).limit(1);
  if (!circle) return Response.json({ error: "Circle not found" }, { status: 404 });
  if (circle.ownerId === session.user.id) {
    return Response.json({ error: "Owner cannot leave — transfer ownership or delete the circle" }, { status: 400 });
  }

  await db
    .delete(circleMembers)
    .where(and(eq(circleMembers.circleId, id), eq(circleMembers.userId, session.user.id)));

  await db
    .update(circles)
    .set({ memberCount: sql`GREATEST(${circles.memberCount} - 1, 0)` })
    .where(eq(circles.id, id));

  return Response.json({ ok: true });
}
