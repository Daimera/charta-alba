import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { circles, circleMembers, users } from "@/lib/db/schema";
import { desc, eq, ilike, or, sql } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  const rows = await db
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
    .where(
      q
        ? or(ilike(circles.name, `%${q}%`), ilike(circles.description, `%${q}%`))
        : eq(circles.isPublic, true)
    )
    .orderBy(desc(circles.createdAt))
    .limit(50);

  return Response.json({ circles: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    name?: string;
    description?: string;
    topicTags?: string[];
    avatarUrl?: string;
    isPublic?: boolean;
  };

  const name = body.name?.trim();
  if (!name) {
    return Response.json({ error: "Circle name is required" }, { status: 400 });
  }
  if (name.length > 60) {
    return Response.json({ error: "Name must be 60 characters or fewer" }, { status: 400 });
  }

  const tags = (body.topicTags ?? [])
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);

  const [circle] = await db
    .insert(circles)
    .values({
      name,
      description: body.description?.trim() || null,
      topicTags: tags,
      avatarUrl: body.avatarUrl?.trim() || null,
      isPublic: body.isPublic ?? true,
      ownerId: session.user.id,
      memberCount: 1,
    })
    .returning();

  // Add creator as owner member
  await db.insert(circleMembers).values({
    circleId: circle.id,
    userId: session.user.id,
    role: "owner",
  });

  return Response.json({ circle }, { status: 201 });
}
