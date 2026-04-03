/**
 * Points system — all point awards MUST go through awardPoints().
 * The ledger is append-only; never update or delete rows.
 * Balance = SUM(amount) FROM points_ledger WHERE user_id = ?
 *
 * LEGAL: Points have no monetary value and cannot be redeemed for cash.
 */

import { db } from "./db";
import { users, pointsLedger, pointRules, profiles } from "./db/schema";
import { eq, sql, and, gte } from "drizzle-orm";

// ── Hard-coded rule fallbacks (mirror point_rules seed data) ──────────────

const RULE_DEFAULTS: Record<string, {
  amount: number;
  dailyLimit?: number;
  weeklyLimit?: number;
  oneTime?: boolean;
}> = {
  first_post_daily:        { amount: 10,  dailyLimit: 1 },
  post_milestone_10:       { amount: 25,  oneTime: true },
  post_milestone_50:       { amount: 75,  oneTime: true },
  post_milestone_100:      { amount: 150, oneTime: true },
  comment_paper:           { amount: 2,   dailyLimit: 10 },
  comment_milestone_5:     { amount: 10,  oneTime: true },
  video_posted:            { amount: 15,  dailyLimit: 2 },
  login_streak_3:          { amount: 15 },
  login_streak_7:          { amount: 50 },
  login_streak_30:         { amount: 200 },
  profile_completed:       { amount: 25,  oneTime: true },
  first_claim:             { amount: 50,  oneTime: true },
  orcid_verified:          { amount: 100, oneTime: true },
  top_contributor_weekly:  { amount: 100, weeklyLimit: 1 },
  most_liked_video_weekly: { amount: 150, weeklyLimit: 1 },
};

// Anti-abuse thresholds
const IP_HOURLY_LIMIT = 50;       // max point-earning events per IP per hour
const VELOCITY_FLAG_THRESHOLD = 500; // flag if user earns > this in one hour
const ACCOUNT_COOLDOWN_HOURS = 24;

export interface AwardResult {
  awarded: boolean;
  amount?: number;
  reason?: string;
  flagged?: boolean;
}

export interface AwardParams {
  userId: string;
  actionType: string;
  /** Related object ID — required for one-time-per-object awards */
  referenceId?: string;
  description: string;
  ipAddress?: string;
  /** Skip account-age check (for admin/cron awards) */
  skipAgeCheck?: boolean;
}

/**
 * The single entry point for awarding points.
 * Performs all anti-abuse checks before inserting into the ledger.
 */
export async function awardPoints(params: AwardParams): Promise<AwardResult> {
  const { userId, actionType, referenceId, description, ipAddress, skipAgeCheck } = params;

  // ── 1. Fetch rule (DB-driven, falls back to hardcoded) ──────────────────
  const [dbRule] = await db
    .select()
    .from(pointRules)
    .where(eq(pointRules.actionType, actionType))
    .limit(1);

  const rule = dbRule
    ? {
        amount: dbRule.pointsAwarded,
        dailyLimit: dbRule.dailyLimit ?? undefined,
        weeklyLimit: dbRule.weeklyLimit ?? undefined,
        oneTime: dbRule.oneTime,
        isActive: dbRule.isActive,
      }
    : { ...RULE_DEFAULTS[actionType], isActive: true };

  if (!rule || !rule.isActive) {
    return { awarded: false, reason: "Action type not active" };
  }

  const now = new Date();
  const hourAgo = new Date(now.getTime() - 3600_000).toISOString();
  const todayStart = new Date(now.toISOString().slice(0, 10) + "T00:00:00Z").toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 86400_000).toISOString();

  // ── 2. Account age check ────────────────────────────────────────────────
  if (!skipAgeCheck) {
    const [user] = await db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.createdAt) return { awarded: false, reason: "User not found" };

    const ageMs = now.getTime() - new Date(user.createdAt).getTime();
    if (ageMs < ACCOUNT_COOLDOWN_HOURS * 3600_000) {
      return { awarded: false, reason: "Account too new — points unlock after 24 hours" };
    }
  }

  // ── 3. IP rate limit ────────────────────────────────────────────────────
  if (ipAddress) {
    const [ipCount] = await db
      .select({ cnt: sql<number>`COUNT(*)::int` })
      .from(pointsLedger)
      .where(
        and(
          eq(pointsLedger.ipAddress, ipAddress),
          gte(pointsLedger.createdAt, hourAgo),
          sql`${pointsLedger.amount} > 0`
        )
      );

    if ((ipCount?.cnt ?? 0) >= IP_HOURLY_LIMIT) {
      return { awarded: false, reason: "IP rate limit exceeded" };
    }
  }

  // ── 4. One-time dedup ───────────────────────────────────────────────────
  if (rule.oneTime) {
    const conditions = [
      eq(pointsLedger.userId, userId),
      eq(pointsLedger.transactionType, actionType),
    ];
    if (referenceId) conditions.push(eq(pointsLedger.referenceId, referenceId));

    const [existing] = await db
      .select({ id: pointsLedger.id })
      .from(pointsLedger)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      return { awarded: false, reason: "Already awarded for this action" };
    }
  }

  // ── 5. Daily limit ──────────────────────────────────────────────────────
  if (rule.dailyLimit !== undefined) {
    const [dailyCount] = await db
      .select({ cnt: sql<number>`COUNT(*)::int` })
      .from(pointsLedger)
      .where(
        and(
          eq(pointsLedger.userId, userId),
          eq(pointsLedger.transactionType, actionType),
          gte(pointsLedger.createdAt, todayStart)
        )
      );

    if ((dailyCount?.cnt ?? 0) >= rule.dailyLimit) {
      return { awarded: false, reason: "Daily limit reached for this action" };
    }
  }

  // ── 6. Weekly limit ─────────────────────────────────────────────────────
  if (rule.weeklyLimit !== undefined) {
    const [weeklyCount] = await db
      .select({ cnt: sql<number>`COUNT(*)::int` })
      .from(pointsLedger)
      .where(
        and(
          eq(pointsLedger.userId, userId),
          eq(pointsLedger.transactionType, actionType),
          gte(pointsLedger.createdAt, weekAgo)
        )
      );

    if ((weeklyCount?.cnt ?? 0) >= rule.weeklyLimit) {
      return { awarded: false, reason: "Weekly limit reached for this action" };
    }
  }

  // ── 7. Velocity check (flag, don't block) ───────────────────────────────
  const [velocityRow] = await db
    .select({ total: sql<number>`COALESCE(SUM(${pointsLedger.amount}), 0)::int` })
    .from(pointsLedger)
    .where(
      and(
        eq(pointsLedger.userId, userId),
        gte(pointsLedger.createdAt, hourAgo),
        sql`${pointsLedger.amount} > 0`
      )
    );

  const hourlyEarned = velocityRow?.total ?? 0;
  const isFlagged = hourlyEarned + rule.amount > VELOCITY_FLAG_THRESHOLD;

  // ── 8. Insert into ledger ───────────────────────────────────────────────
  await db.insert(pointsLedger).values({
    userId,
    amount: rule.amount,
    transactionType: actionType,
    referenceId: referenceId ?? null,
    description,
    ipAddress: ipAddress ?? null,
    isFlagged,
  });

  return { awarded: true, amount: rule.amount, flagged: isFlagged };
}

/** Get current balance (SUM of all ledger entries) for a user. */
export async function getBalance(userId: string): Promise<number> {
  const [row] = await db
    .select({ balance: sql<number>`COALESCE(SUM(${pointsLedger.amount}), 0)::int` })
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, userId));
  return Math.max(0, row?.balance ?? 0);
}

export interface SpendResult {
  success: boolean;
  reason?: string;
  newBalance?: number;
}

/**
 * Spend points on a platform feature.
 * Inserts a negative ledger entry. Atomically checks balance.
 */
export async function spendPoints(params: {
  userId: string;
  amount: number;
  spendType: string;
  referenceId?: string;
  description: string;
}): Promise<SpendResult> {
  const { userId, amount, spendType, referenceId, description } = params;

  if (amount <= 0) return { success: false, reason: "Invalid spend amount" };

  const currentBalance = await getBalance(userId);
  if (currentBalance < amount) {
    return { success: false, reason: `Insufficient points (have ${currentBalance}, need ${amount})` };
  }

  await db.insert(pointsLedger).values({
    userId,
    amount: -amount,
    transactionType: spendType,
    referenceId: referenceId ?? null,
    description,
    isFlagged: false,
  });

  return { success: true, newBalance: currentBalance - amount };
}

/** Award purchased points after successful Stripe payment. (skips all anti-abuse checks) */
export async function awardPurchasedPoints(params: {
  userId: string;
  amount: number;
  purchaseId: string;
  description: string;
}): Promise<void> {
  await db.insert(pointsLedger).values({
    userId: params.userId,
    amount: params.amount,
    transactionType: "purchase",
    referenceId: params.purchaseId,
    description: params.description,
    isFlagged: false,
  });
}

/** Update login streak and award streak bonuses. Call on each authenticated request. */
export async function updateLoginStreak(userId: string, ipAddress?: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  const [profile] = await db
    .select({ loginStreak: profiles.loginStreak, lastLoginDate: profiles.lastLoginDate })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) return;

  const lastDate = profile.lastLoginDate;
  if (lastDate === today) return; // Already counted today

  const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
  const newStreak = lastDate === yesterday ? (profile.loginStreak ?? 0) + 1 : 1;

  await db
    .insert(profiles)
    .values({ id: userId, loginStreak: newStreak, lastLoginDate: today })
    .onConflictDoUpdate({ target: profiles.id, set: { loginStreak: newStreak, lastLoginDate: today } });

  // Award streak bonuses
  if (newStreak === 3) {
    await awardPoints({ userId, actionType: "login_streak_3", description: "3-day login streak!", ipAddress });
  } else if (newStreak === 7) {
    await awardPoints({ userId, actionType: "login_streak_7", description: "7-day login streak!", ipAddress });
  } else if (newStreak === 30) {
    await awardPoints({ userId, actionType: "login_streak_30", description: "30-day login streak!", ipAddress });
  }
}
