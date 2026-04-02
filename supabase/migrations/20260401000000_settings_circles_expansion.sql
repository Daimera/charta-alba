-- ── Extend profiles with new settings columns ─────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_active          BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_public          BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS comment_permission TEXT    NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS dm_permission      TEXT    NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS mark_sensitive     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_replies     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS feed_algorithm     TEXT    NOT NULL DEFAULT 'trending',
  ADD COLUMN IF NOT EXISTS email_new_follower BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_reply        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_breakthrough BOOLEAN NOT NULL DEFAULT false;

-- Flip notification defaults to false for new rows
ALTER TABLE profiles
  ALTER COLUMN email_digest   SET DEFAULT false,
  ALTER COLUMN email_comments SET DEFAULT false;

-- ── Two-step email change ─────────────────────────────────────────────────
ALTER TABLE email_change_tokens
  ADD COLUMN IF NOT EXISTS old_email_confirmed BOOLEAN NOT NULL DEFAULT false;

-- ── Login sessions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Muted keywords ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS muted_keywords (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, keyword)
);

-- ── Blocked users ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

-- ── Circles ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS circles (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  description  TEXT,
  topic_tags   TEXT[]      NOT NULL DEFAULT '{}',
  avatar_url   TEXT,
  is_public    BOOLEAN     NOT NULL DEFAULT true,
  owner_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_count INTEGER     NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS circle_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id  UUID        NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS circle_posts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id  UUID        NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL DEFAULT 'discussion',
  content    TEXT,
  paper_id   TEXT        REFERENCES papers(id)  ON DELETE SET NULL,
  video_id   UUID        REFERENCES videos(id)  ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
