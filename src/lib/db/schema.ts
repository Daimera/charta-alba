import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  primaryKey,
  unique,
  boolean,
  jsonb,
  date,
  real,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

// ── NextAuth tables ────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  // Founder / god-mode fields
  isFounder: boolean("is_founder").notNull().default(false),
  founderSince: timestamp("founder_since", { withTimezone: true, mode: "string" }),
  founderTotpSecret: text("founder_totp_secret"),         // AES-256-GCM encrypted
  founderBackupCodes: text("founder_backup_codes").array(), // bcrypt-hashed
  founderLastVerified: timestamp("founder_last_verified", { withTimezone: true, mode: "string" }),
  founderIpWhitelist: text("founder_ip_whitelist").array(),
  founderTotpAttempts: integer("founder_totp_attempts").notNull().default(0),
  founderLockedUntil: timestamp("founder_locked_until", { withTimezone: true, mode: "string" }),
  lastTotpCodeHash: text("last_totp_code_hash"),
  lastTotpUsedAt: timestamp("last_totp_used_at", { withTimezone: true, mode: "string" }),
  // Account lockout
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true, mode: "string" }),
  // User 2FA (all users)
  totpSecret: text("totp_secret"),         // AES-256-GCM encrypted, null = disabled
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  totpBackupCodes: text("totp_backup_codes").array(), // bcrypt-hashed
  totpEnabledAt: timestamp("totp_enabled_at", { withTimezone: true, mode: "string" }),
  totpFailedAttempts: integer("totp_failed_attempts").notNull().default(0),
  totpLockedUntil: timestamp("totp_locked_until", { withTimezone: true, mode: "string" }),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ── Application tables ─────────────────────────────────────────────────────

export const papers = pgTable("papers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  abstract: text("abstract").notNull(),
  authors: text("authors").array().notNull().default([]),
  categories: text("categories").array().notNull().default([]),
  publishedAt: timestamp("published_at", { withTimezone: true, mode: "string" }),
  pdfUrl: text("pdf_url"),
  arxivUrl: text("arxiv_url"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const cards = pgTable("cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  paperId: text("paper_id")
    .notNull()
    .references(() => papers.id, { onDelete: "cascade" }),
  headline: text("headline").notNull(),
  hook: text("hook").notNull(),
  body: text("body").notNull(),
  tldr: text("tldr").notNull(),
  tags: text("tags").array().notNull().default([]),
  readingTimeSeconds: integer("reading_time_seconds").notNull(),
  likeCount: integer("like_count").notNull().default(0),
  videoUrl: text("video_url"),
  replicationStatus: text("replication_status"),
  eli5Summary: text("eli5_summary"),
  // Fraud / quality detection
  semanticFingerprint: text("semantic_fingerprint"),
  fraudRiskScore: integer("fraud_risk_score"),
  fraudFlags: text("fraud_flags").array(),
  fraudCheckedAt: timestamp("fraud_checked_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: text("id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  username: text("username").unique(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  emailDigest: boolean("email_digest").notNull().default(false),
  emailComments: boolean("email_comments").notNull().default(false),
  // Privacy & Safety
  isActive: boolean("is_active").notNull().default(true),
  isPublic: boolean("is_public").notNull().default(true),
  commentPermission: text("comment_permission").notNull().default("everyone"),
  dmPermission: text("dm_permission").notNull().default("everyone"),
  markSensitive: boolean("mark_sensitive").notNull().default(false),
  hiddenReplies: boolean("hidden_replies").notNull().default(false),
  // Personalization
  feedAlgorithm: text("feed_algorithm").notNull().default("trending"),
  // Notifications
  emailNewFollower: boolean("email_new_follower").notNull().default(false),
  emailReply: boolean("email_reply").notNull().default(false),
  emailBreakthrough: boolean("email_breakthrough").notNull().default(false),
  // Sign-in identifier
  phone: text("phone").unique(),
  // Subscription tier
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  // Billing
  stripeCustomerId: text("stripe_customer_id"),
  // Points / engagement
  loginStreak: integer("login_streak").notNull().default(0),
  lastLoginDate: date("last_login_date"),
  pointFeatures: jsonb("point_features"),
  // Social graph counts (denormalized for performance)
  followerCount: integer("follower_count").notNull().default(0),
  followingCount: integer("following_count").notNull().default(0),
  // Analytics privacy
  shareLocationWithCreators: boolean("share_location_with_creators").notNull().default(true),
  // i18n
  preferredLanguage: text("preferred_language").notNull().default("en"),
  // Compliance
  ccpaDoNotSell:                 boolean("ccpa_do_not_sell").notNull().default(false),
  analyticsOptOut:               boolean("analytics_opt_out").notNull().default(false),
  accessibilityReducedMotion:    boolean("accessibility_reduced_motion").notNull().default(false),
  accessibilityHighContrast:     boolean("accessibility_high_contrast").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const likes = pgTable(
  "likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (t) => [unique("likes_user_card_unique").on(t.userId, t.cardId)]
);

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (t) => [unique("bookmarks_user_card_unique").on(t.userId, t.cardId)]
);

export const follows = pgTable(
  "follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (t) => [unique("follows_user_category_unique").on(t.userId, t.category)]
);

// ── Phase 2 tables ─────────────────────────────────────────────────────────

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, {
    onDelete: "cascade",
  }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const cardRatings = pgTable(
  "card_ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (t) => [unique("card_ratings_user_card_unique").on(t.userId, t.cardId)]
);

export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  paperId: text("paper_id")
    .notNull()
    .references(() => papers.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  orcidId: text("orcid_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ── Competitive feature tables ─────────────────────────────────────────────────

export const citations = pgTable(
  "citations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    citingCardId: uuid("citing_card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    citedCardId: uuid("cited_card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (t) => [unique("citations_pair_unique").on(t.citingCardId, t.citedCardId)]
);

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const collectionItems = pgTable(
  "collection_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (t) => [unique("collection_items_unique").on(t.collectionId, t.cardId)]
);

// ── Videos ─────────────────────────────────────────────────────────────────

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  paperId: text("paper_id").references(() => papers.id, { onDelete: "set null" }),
  likeCount: integer("like_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const videoLikes = pgTable(
  "video_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (t) => [unique("video_likes_user_video_unique").on(t.userId, t.videoId)]
);

// ── Auth tokens ────────────────────────────────────────────────────────────

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const emailChangeTokens = pgTable("email_change_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  newEmail: text("new_email").notNull(),
  oldEmailConfirmed: boolean("old_email_confirmed").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ── Settings expansion tables ──────────────────────────────────────────────

export const loginSessions = pgTable("login_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  // Geo
  country:     text("country"),
  countryCode: text("country_code"),
  region:      text("region"),
  city:        text("city"),
  timezone:    text("timezone"),
  latitude:    real("latitude"),
  longitude:   real("longitude"),
  // Device
  deviceType: text("device_type"),
  browser:    text("browser"),
  os:         text("os"),
  // Security
  isSuspicious: boolean("is_suspicious").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const mutedKeywords = pgTable(
  "muted_keywords",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (t) => [unique("muted_keywords_user_keyword_unique").on(t.userId, t.keyword)]
);

export const blockedUsers = pgTable(
  "blocked_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blockerId: text("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: text("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (t) => [unique("blocked_users_pair_unique").on(t.blockerId, t.blockedId)]
);

// ── Circles ────────────────────────────────────────────────────────────────

export const circles = pgTable("circles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  topicTags: text("topic_tags").array().notNull().default([]),
  avatarUrl: text("avatar_url"),
  isPublic: boolean("is_public").notNull().default(true),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  memberCount: integer("member_count").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const circleMembers = pgTable(
  "circle_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    circleId: uuid("circle_id")
      .notNull()
      .references(() => circles.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (t) => [unique("circle_members_circle_user_unique").on(t.circleId, t.userId)]
);

export const circlePosts = pgTable("circle_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  circleId: uuid("circle_id")
    .notNull()
    .references(() => circles.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  type: text("type").notNull().default("discussion"),
  paperId: text("paper_id").references(() => papers.id, { onDelete: "set null" }),
  videoId: uuid("video_id").references(() => videos.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ── Public API platform ────────────────────────────────────────────────────

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: text("key_prefix").notNull(),
  tier: text("tier").notNull().default("free"),
  requestsThisMonth: integer("requests_this_month").notNull().default(0),
  requestsToday: integer("requests_today").notNull().default(0),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "string" }),
  lastResetDate: date("last_reset_date"),
  isActive: boolean("is_active").notNull().default(true),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const apiUsageLogs = pgTable("api_usage_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  apiKeyId: uuid("api_key_id")
    .notNull()
    .references(() => apiKeys.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  responseTimeMs: integer("response_time_ms"),
  statusCode: integer("status_code").notNull(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const apiPlans = pgTable("api_plans", {
  tier: text("tier").primaryKey(),
  monthlyRequests: integer("monthly_requests").notNull(),
  dailyRequests: integer("daily_requests").notNull(),
  resultsPerCall: integer("results_per_call").notNull(),
  priceMonthly: integer("price_monthly").notNull(),
  priceAnnual: integer("price_annual").notNull(),
  features: jsonb("features"),
});

// ── Points system ──────────────────────────────────────────────────────────

export const pointsLedger = pgTable("points_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  transactionType: text("transaction_type").notNull(),
  referenceId: text("reference_id"),
  description: text("description").notNull(),
  ipAddress: text("ip_address"),
  isFlagged: boolean("is_flagged").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const pointPurchases = pgTable("point_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  pointsAmount: integer("points_amount").notNull(),
  priceUsd: integer("price_usd").notNull(),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const pointRules = pgTable("point_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  actionType: text("action_type").notNull().unique(),
  pointsAwarded: integer("points_awarded").notNull(),
  dailyLimit: integer("daily_limit"),
  weeklyLimit: integer("weekly_limit"),
  oneTime: boolean("one_time").notNull().default(false),
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// ── Founder / God-mode tables ──────────────────────────────────────────────────

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actionType: text("action_type").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  detail: jsonb("detail"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  totpVerified: boolean("totp_verified").notNull().default(false),
  verificationLevel: integer("verification_level").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const founderApiKey = pgTable("founder_api_key", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: text("key_prefix").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "string" }),
  isActive: boolean("is_active").notNull().default(true),
});

export const systemConfig = pgTable("system_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedBy: text("updated_by").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
});

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedBy: text("updated_by").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
});

// ── Analytics tables ────────────────────────────────────────────────────────

export const profileViews = pgTable("profile_views", {
  id:            uuid("id").primaryKey().defaultRandom(),
  profileUserId: text("profile_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  viewerUserId:  text("viewer_user_id").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
  viewerIp:      text("viewer_ip"),
  country:       text("country"),
  countryCode:   text("country_code"),
  region:        text("region"),
  city:          text("city"),
  deviceType:    text("device_type"),
  browser:       text("browser"),
  referrerUrl:   text("referrer_url"),
  viewedAt:      timestamp("viewed_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const contentViews = pgTable("content_views", {
  id:           uuid("id").primaryKey().defaultRandom(),
  contentType:  text("content_type").notNull(),  // 'paper' | 'video' | 'card'
  contentId:    text("content_id").notNull(),
  viewerUserId: text("viewer_user_id").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
  viewerIp:     text("viewer_ip"),
  country:      text("country"),
  countryCode:  text("country_code"),
  city:         text("city"),
  deviceType:   text("device_type"),
  viewedAt:     timestamp("viewed_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ── Compliance & i18n ──────────────────────────────────────────────────────

export const privacyRequests = pgTable("privacy_requests", {
  id:             uuid("id").primaryKey().defaultRandom(),
  userId:         text("user_id").references(() => users.id, { onDelete: "set null" }),
  requestType:    text("request_type").notNull(),
  status:         text("status").notNull().default("pending"),
  submittedAt:    timestamp("submitted_at", { withTimezone: true, mode: "string" }).defaultNow(),
  completedAt:    timestamp("completed_at", { withTimezone: true, mode: "string" }),
  notes:          text("notes"),
  requesterEmail: text("requester_email"),
  ipAddress:      text("ip_address"),
});

export const translations = pgTable(
  "translations",
  {
    id:                  uuid("id").primaryKey().defaultRandom(),
    contentType:         text("content_type").notNull().default("card"),
    contentId:           uuid("content_id").notNull(),
    languageCode:        text("language_code").notNull(),
    translatedHeadline:  text("translated_headline"),
    translatedHook:      text("translated_hook"),
    translatedBody:      text("translated_body"),
    translatedTldr:      text("translated_tldr"),
    createdAt:           timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    lastUsedAt:          timestamp("last_used_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (t) => [unique("translations_content_lang_unique").on(t.contentType, t.contentId, t.languageCode)],
);

// ── Social follow graph ────────────────────────────────────────────────────

export const userFollows = pgTable(
  "user_follows",
  {
    id:          uuid("id").primaryKey().defaultRandom(),
    followerId:  text("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt:   timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (t) => [unique("user_follows_pair_unique").on(t.followerId, t.followingId)],
);

// ── Submissions ────────────────────────────────────────────────────────────

export const submissions = pgTable("submissions", {
  id:               uuid("id").primaryKey().defaultRandom(),
  userId:           text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  submissionType:   text("submission_type").notNull(), // 'paper'|'white_paper'|'discovery'|'dataset'
  title:            text("title").notNull(),
  authors:          text("authors").notNull(),
  abstract:         text("abstract").notNull(),
  externalUrl:      text("external_url"),
  pdfUrl:           text("pdf_url"),
  doi:              text("doi"),
  journalName:      text("journal_name"),
  organization:     text("organization"),
  category:         text("category"),
  datasetSize:      text("dataset_size"),
  datasetFormat:    text("dataset_format"),
  datasetLicense:   text("dataset_license"),
  versionNumber:    text("version_number"),
  methodology:      text("methodology"),
  fieldOfDiscovery: text("field_of_discovery"),
  peerReviewed:     boolean("peer_reviewed").notNull().default(false),
  status:           text("status").notNull().default("pending"), // pending|ai_processing|published|rejected
  aiProcessedAt:    timestamp("ai_processed_at", { withTimezone: true, mode: "string" }),
  publishedCardId:  uuid("published_card_id"),
  rejectionReason:  text("rejection_reason"),
  suggestedTags:    text("suggested_tags").array(),
  createdAt:        timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ── Device tokens (push notifications) ────────────────────────────────────

export const deviceTokens = pgTable(
  "device_tokens",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token:     text("token").notNull(),
    platform:  text("platform").notNull(), // 'ios'|'android'
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (t) => [unique("device_tokens_user_token_unique").on(t.userId, t.token)],
);

// ── Remember-me trusted devices ───────────────────────────────────────────────

export const rememberDevices = pgTable("remember_devices", {
  id:              uuid("id").primaryKey().defaultRandom(),
  userId:          text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceTokenHash: text("device_token_hash").notNull().unique(), // SHA-256 of raw token
  deviceName:      text("device_name"),                          // parsed from User-Agent
  userAgent:       text("user_agent"),
  ipAddress:       text("ip_address"),
  city:            text("city"),
  country:         text("country"),
  createdAt:       timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  expiresAt:       timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  lastUsedAt:      timestamp("last_used_at", { withTimezone: true, mode: "string" }),
});
