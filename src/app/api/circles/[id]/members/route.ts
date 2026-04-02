import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { circles, circleMembers, users } from "@/lib/db/schema";
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
      name: users.name,
      image: users.image,
    })
    .from(circleMembers)
    .leftJoin(users, eq(circleMembers.userId, users.id))
    .where(eq(circleMembers.circleId, id))
    .limit(100);

  return Response.json({ members });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [circle] = await db.select().from(circles).where(eq(circles.id, id)).limit(1);
  if (!circle) return Response.json({ error: "Circle not found" }, { status: 404 });
  if (!circle.isPublic) return Response.json({ error: "Private circles require an invitation" }, { status: 403 });

  const [existing] = await db
    .select({ id: circleMembers.id })
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, id), eq(circleMembers.userId, session.user.id)))
    .limit(1);

  if (!existing) {
    await db
      .insert(circleMembers)
      .values({ circleId: id, userId: session.user.id, role: "member" })
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
