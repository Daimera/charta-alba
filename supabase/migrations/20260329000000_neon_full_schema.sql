-- =============================================================================
-- Neon-compatible full schema (replaces 20260328000000_initial_schema.sql)
-- Run this on a fresh Neon database.
--
-- NOTE: 20260328000000_initial_schema.sql references auth.users which is
-- Supabase-specific and does not exist on vanilla Postgres / Neon. This
-- migration provides an equivalent schema using NextAuth-compatible tables.
-- =============================================================================

-- ── NextAuth auth tables ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name           TEXT,
  email          TEXT NOT NULL UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image          TEXT,
  password_hash  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  "userId"            TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT    NOT NULL,
  provider            TEXT    NOT NULL,
  "providerAccountId" TEXT    NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          INTEGER,
  token_type          TEXT,
  scope               TEXT,
  id_token            TEXT,
  session_state       TEXT,
  PRIMARY KEY (provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  "sessionToken" TEXT        PRIMARY KEY,
  "userId"       TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires        TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS "verificationTokens" (
  identifier TEXT        NOT NULL,
  token      TEXT        NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ── Application tables ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS papers (
  id           TEXT        PRIMARY KEY,
  title        TEXT        NOT NULL,
  abstract     TEXT        NOT NULL,
  authors      TEXT[]      NOT NULL DEFAULT '{}',
  categories   TEXT[]      NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ,
  pdf_url      TEXT,
  arxiv_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cards (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id             TEXT        NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  headline             TEXT        NOT NULL,
  hook                 TEXT        NOT NULL,
  body                 TEXT        NOT NULL,
  tldr                 TEXT        NOT NULL,
  tags                 TEXT[]      NOT NULL DEFAULT '{}',
  reading_time_seconds INTEGER     NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id         TEXT        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username   TEXT        UNIQUE,
  avatar_url TEXT,
  bio        TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS likes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id    UUID        NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, card_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id    UUID        NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, card_id)
);

CREATE TABLE IF NOT EXISTS follows (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category   TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category)
);

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_cards_paper_id      ON cards     (paper_id);
CREATE INDEX IF NOT EXISTS idx_cards_created_at    ON cards     (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_papers_published_at ON papers    (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user_id       ON likes     (user_id);
CREATE INDEX IF NOT EXISTS idx_likes_card_id       ON likes     (card_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id   ON bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_card_id   ON bookmarks (card_id);
CREATE INDEX IF NOT EXISTS idx_follows_user_id     ON follows   (user_id);

-- ── Row Level Security ─────────────────────────────────────────────────────
-- RLS is enabled on all tables per standing orders.
-- The application connects with a single DATABASE_URL; ownership is enforced
-- in server-side API routes by checking the NextAuth session before writes.
-- papers and cards are publicly readable; user tables are service-role only.

ALTER TABLE papers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards             ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows           ENABLE ROW LEVEL SECURITY;
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verificationTokens" ENABLE ROW LEVEL SECURITY;

-- Public read on research content
CREATE POLICY "papers_public_read"  ON papers FOR SELECT USING (true);
CREATE POLICY "cards_public_read"   ON cards  FOR SELECT USING (true);

-- All writes go through server-side API routes (service connection bypasses RLS)
CREATE POLICY "papers_service_write" ON papers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "cards_service_write"  ON cards  FOR ALL USING (true) WITH CHECK (true);
