import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { circles, circleMembers, users } from "@/lib/db/schema";
import { desc, eq, ilike, or, and, notInArray, inArray } from "drizzle-orm";

const circleSelect = {
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
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const session = await auth();
  const userId = session?.user?.id;

  try {
    if (userId && !q) {
      // Return { mine, discover } when logged in and not searching
      const memberRows = await db
        .select({ circleId: circleMembers.circleId, role: circleMembers.role })
        .from(circleMembers)
        .where(eq(circleMembers.userId, userId));

      const myCircleIds = memberRows.map((r) => r.circleId);
      const roleMap = new Map(memberRows.map((r) => [r.circleId, r.role]));

      // Circles the user belongs to
      const mine = myCircleIds.length > 0
        ? await db
            .select(circleSelect)
            .from(circles)
            .leftJoin(users, eq(circles.ownerId, users.id))
            .where(inArray(circles.id, myCircleIds))
            .orderBy(desc(circles.createdAt))
        : [];

      // Public circles not already joined
      const discoverQuery = db
        .select(circleSelect)
        .from(circles)
        .leftJoin(users, eq(circles.ownerId, users.id))
        .orderBy(desc(circles.createdAt))
        .limit(30);

      const discover = myCircleIds.length > 0
        ? await discoverQuery.where(
            and(eq(circles.isPublic, true), notInArray(circles.id, myCircleIds))
          )
        : await discoverQuery.where(eq(circles.isPublic, true));

      return Response.json({
        mine: mine.map((c) => ({ ...c, userRole: roleMap.get(c.id) ?? "member" })),
        discover,
      });
    }

    // Unauthenticated or searching — return flat list
    const rows = await db
      .select(circleSelect)
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("does not exist") || msg.includes("relation")) {
      console.error("[api/circles GET] circles table missing — run migration 20260401000000_settings_circles_expansion.sql");
      return Response.json({ circles: [], mine: [], discover: [], _migrationRequired: true });
    }
    console.error("[api/circles GET]", msg);
    return Response.json({ circles: [], mine: [], discover: [] });
  }
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

  try {
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("does not exist") || msg.includes("relation")) {
      console.error("[api/circles POST] circles table missing — run migration 20260401000000_settings_circles_expansion.sql");
      return Response.json({ error: "Circles feature not yet enabled — database migration required." }, { status: 503 });
    }
    console.error("[api/circles POST]", msg);
    return Response.json({ error: "Failed to create circle. Please try again." }, { status: 500 });
  }
}
