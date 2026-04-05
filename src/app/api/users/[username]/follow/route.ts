import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userFollows, profiles } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { awardPoints } from "@/lib/points";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";

async function resolveUserId(username: string): Promise<string | null> {
  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);
  return row?.id ?? null;
}

async function getFollowerCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ cnt: sql<number>`COUNT(*)::int` })
    .from(userFollows)
    .where(eq(userFollows.followingId, userId));
  return row?.cnt ?? 0;
}

// POST /api/users/[username]/follow
export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = checkRateLimit(`follow:${session.user.id}`, 30, 60 * 60 * 1000);
  if (!rl.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { username } = await params;
  const targetId = await resolveUserId(username);
  if (!targetId) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (targetId === session.user.id) {
    return Response.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  try {
    await db.insert(userFollows).values({
      followerId: session.user.id,
      followingId: targetId,
    });
  } catch {
    // Already following — idempotent
  }

  // Update denormalized counts
  await Promise.all([
    db
      .update(profiles)
      .set({ followingCount: sql`following_count + 1` })
      .where(eq(profiles.id, session.user.id)),
    db
      .update(profiles)
      .set({ followerCount: sql`follower_count + 1` })
      .where(eq(profiles.id, targetId)),
  ]);

  // Award 5 points to the person being followed
  const ip = getIpFromRequest(req);
  await awardPoints({
    userId: targetId,
    actionType: "new_follower",
    referenceId: session.user.id,
    description: "Someone followed you",
    ipAddress: ip,
    skipAgeCheck: true,
  }).catch(() => undefined);

  const followerCount = await getFollowerCount(targetId);
  return Response.json({ following: true, followerCount });
}

// DELETE /api/users/[username]/follow
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await params;
  const targetId = await resolveUserId(username);
  if (!targetId) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const [deleted] = await db
    .delete(userFollows)
    .where(
      and(
        eq(userFollows.followerId, session.user.id),
        eq(userFollows.followingId, targetId)
      )
    )
    .returning({ id: userFollows.id });

  if (deleted) {
    // Decrement counts, floor at 0
    await Promise.all([
      db
        .update(profiles)
        .set({ followingCount: sql`GREATEST(following_count - 1, 0)` })
        .where(eq(profiles.id, session.user.id)),
      db
        .update(profiles)
        .set({ followerCount: sql`GREATEST(follower_count - 1, 0)` })
        .where(eq(profiles.id, targetId)),
    ]);
  }

  const followerCount = await getFollowerCount(targetId);
  return Response.json({ following: false, followerCount });
}
