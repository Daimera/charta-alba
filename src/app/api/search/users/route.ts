import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, users, userFollows } from "@/lib/db/schema";
import { ilike, or, eq, and, sql } from "drizzle-orm";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";

export async function GET(req: Request) {
  const ip = getIpFromRequest(req);
  const rl = checkRateLimit(`search-users:${ip}`, 30, 60 * 1000);
  if (!rl.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await auth();
  const url = new URL(req.url);
  const rawQ = url.searchParams.get("q");
  const q = sanitizeString(rawQ, 100)?.trim().replace(/^@/, "");

  if (!q || q.length < 1) {
    return Response.json({ users: [] });
  }

  const rows = await db
    .select({
      id:             profiles.id,
      username:       profiles.username,
      bio:            profiles.bio,
      avatarUrl:      profiles.avatarUrl,
      followerCount:  profiles.followerCount,
      displayName:    users.name,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.id))
    .where(
      and(
        eq(profiles.isPublic, true),
        or(
          ilike(profiles.username, `%${q}%`),
          ilike(users.name, `%${q}%`)
        )
      )
    )
    .limit(10);

  // If viewer is logged in, check which results they follow
  let viewerFollowingIds = new Set<string>();
  if (session?.user?.id && rows.length > 0) {
    const ids = rows.map(r => r.id);
    const followRows = await db
      .select({ followingId: userFollows.followingId })
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, session.user.id),
          sql`${userFollows.followingId} = ANY(${sql.raw(`ARRAY[${ids.map(id => `'${id}'`).join(",")}]`)})`
        )
      );
    viewerFollowingIds = new Set(followRows.map(r => r.followingId));
  }

  return Response.json({
    users: rows.map(r => ({
      id: r.id,
      username: r.username,
      displayName: r.displayName ?? r.username,
      bio: r.bio,
      avatarUrl: r.avatarUrl,
      followerCount: r.followerCount,
      isFollowing: viewerFollowingIds.has(r.id),
    })),
  });
}
