import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Columns present in the very first schema migration — always safe to select.
const BASE_PROFILE_SELECT = {
  id:                profiles.id,
  username:          profiles.username,
  avatarUrl:         profiles.avatarUrl,
  bio:               profiles.bio,
  isActive:          profiles.isActive,
  isPublic:          profiles.isPublic,
  commentPermission: profiles.commentPermission,
  dmPermission:      profiles.dmPermission,
  markSensitive:     profiles.markSensitive,
  hiddenReplies:     profiles.hiddenReplies,
  feedAlgorithm:     profiles.feedAlgorithm,
  emailDigest:       profiles.emailDigest,
  emailComments:     profiles.emailComments,
  emailNewFollower:  profiles.emailNewFollower,
  emailReply:        profiles.emailReply,
  emailBreakthrough: profiles.emailBreakthrough,
  createdAt:         profiles.createdAt,
};

// Full column list — includes columns added in later migrations.
// If these columns don't exist in the Neon DB yet, the query throws and
// we fall back to BASE_PROFILE_SELECT below.
const FULL_PROFILE_SELECT = {
  ...BASE_PROFILE_SELECT,
  phone:             profiles.phone,
  subscriptionTier:  profiles.subscriptionTier,
  loginStreak:       profiles.loginStreak,
  followerCount:     profiles.followerCount,
  followingCount:    profiles.followingCount,
  preferredLanguage: profiles.preferredLanguage,
  ccpaDoNotSell:     profiles.ccpaDoNotSell,
  analyticsOptOut:   profiles.analyticsOptOut,
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email, image: users.image })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Try with all columns first; fall back to base columns if newer migrations
    // haven't been applied to the Neon database yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let profile: Record<string, any> | undefined;
    let profileBaseOnly = false;

    try {
      [profile] = await db
        .select(FULL_PROFILE_SELECT)
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);
    } catch (colErr) {
      console.warn("[api/settings GET] full select failed (missing DB column?), retrying with base columns:", colErr instanceof Error ? colErr.message : colErr);
      profileBaseOnly = true;
      const [baseProfile] = await db
        .select(BASE_PROFILE_SELECT)
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);
      profile = baseProfile;
    }

    if (!profile) {
      // Auto-create a minimal profile row on first settings load
      await db.insert(profiles).values({ id: userId }).onConflictDoNothing();
      return Response.json({ user, profile: null });
    }

    if (profileBaseOnly) {
      console.warn("[api/settings GET] returning base profile — run missing Neon migrations to unlock all settings");
    }

    return Response.json({ user, profile });
  } catch (err) {
    console.error("[api/settings GET]", err instanceof Error ? err.message : err);
    return Response.json({ error: "Failed to load settings" }, { status: 500 });
  }
}
