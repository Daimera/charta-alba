import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { circles, circleMembers, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { assertUUID } from "@/lib/sanitize";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  const uuidErr = assertUUID(id);
  if (uuidErr) return uuidErr;

  try {
    const [circle] = await db
      .select({
        id: circles.id,
        name: circles.name,
        description: circles.description,
        topicTags: circles.topicTags,
        avatarUrl: circles.avatarUrl,
        isPublic: circles.isPublic,
        ownerId: circles.ownerId,
        memberCount: circles.memberCount,
        createdAt: circles.createdAt,
        ownerName: users.name,
      })
      .from(circles)
      .leftJoin(users, eq(circles.ownerId, users.id))
      .where(eq(circles.id, id))
      .limit(1);

    if (!circle) {
      return Response.json({ error: "Circle not found" }, { status: 404 });
    }

    let membership: { role: string } | null = null;
    if (session?.user?.id) {
      const [member] = await db
        .select({ role: circleMembers.role })
        .from(circleMembers)
        .where(and(eq(circleMembers.circleId, id), eq(circleMembers.userId, session.user.id)))
        .limit(1);
      membership = member ?? null;
    }

    return Response.json({ circle, membership });
  } catch (err) {
    console.error("[api/circles/[id] GET]", err instanceof Error ? err.message : err);
    return Response.json({ error: "Failed to load circle" }, { status: 500 });
  }
}

export async function PATCH(
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
  if (circle.ownerId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as {
    name?: string;
    description?: string;
    topicTags?: string[];
    avatarUrl?: string;
    isPublic?: boolean;
  };

  const set: Record<string, unknown> = {};
  if (body.name?.trim()) set.name = body.name.trim();
  if (body.description !== undefined) set.description = body.description?.trim() || null;
  if (body.topicTags !== undefined) set.topicTags = body.topicTags.map((t) => t.trim()).filter(Boolean).slice(0, 5);
  if (body.avatarUrl !== undefined) set.avatarUrl = body.avatarUrl?.trim() || null;
  if (body.isPublic !== undefined) set.isPublic = body.isPublic;

  const [updated] = await db.update(circles).set(set).where(eq(circles.id, id)).returning();
  return Response.json({ circle: updated });
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
  const [circle] = await db.select().from(circles).where(eq(circles.id, id)).limit(1);

  if (!circle) return Response.json({ error: "Circle not found" }, { status: 404 });
  if (circle.ownerId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(circles).where(eq(circles.id, id));
  return Response.json({ ok: true });
}
