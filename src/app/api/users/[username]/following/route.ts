import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userFollows, profiles, users } from "@/lib/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";

const PAGE_SIZE = 20;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const session = await auth();

  const [target] = await db
    .select({ id: profiles.id, isPublic: profiles.isPublic })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  if (!target) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (!target.isPublic && session?.user?.id !== target.id) {
    return Response.json({ items: [], nextCursor: null, privateAccount: true });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");

  const rows = await db
    .select({
      userId: userFollows.followingId,
      createdAt: userFollows.createdAt,
      username: profiles.username,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
      followerCount: profiles.followerCount,
    })
    .from(userFollows)
    .innerJoin(profiles, eq(profiles.id, userFollows.followingId))
    .where(
      cursor
        ? and(
            eq(userFollows.followerId, target.id),
            lt(userFollows.createdAt, cursor)
          )
        : eq(userFollows.followerId, target.id)
    )
    .orderBy(sql`${userFollows.createdAt} DESC`)
    .limit(PAGE_SIZE + 1);

  const hasMore = rows.length > PAGE_SIZE;
  const items = rows.slice(0, PAGE_SIZE);

  let viewerFollowingIds = new Set<string>();
  if (session?.user?.id && items.length > 0) {
    const ids = items.map((r) => r.userId);
    const followRows = await db
      .select({ followingId: userFollows.followingId })
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, session.user.id),
          sql`${userFollows.followingId} = ANY(${sql.raw(`ARRAY[${ids.map((id) => `'${id}'`).join(",")}]`)})`
        )
      );
    viewerFollowingIds = new Set(followRows.map((r) => r.followingId));
  }

  const userIds = items.map((r) => r.userId);
  const nameRows =
    userIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(sql`${users.id} = ANY(${sql.raw(`ARRAY[${userIds.map((id) => `'${id}'`).join(",")}]`)})`)
      : [];
  const nameMap = Object.fromEntries(nameRows.map((r) => [r.id, r.name]));

  return Response.json({
    items: items.map((r) => ({
      userId: r.userId,
      username: r.username,
      displayName: nameMap[r.userId] ?? r.username,
      bio: r.bio,
      avatarUrl: r.avatarUrl,
      followerCount: r.followerCount,
      isFollowingBack: viewerFollowingIds.has(r.userId),
    })),
    nextCursor: hasMore ? items[items.length - 1].createdAt : null,
  });
}
