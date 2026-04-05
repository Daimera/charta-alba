-- ── Session 4: Social Follow Graph ───────────────────────────────────────────

-- User-to-user follows (separate from topic follows)
CREATE TABLE IF NOT EXISTS user_follows (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS user_follows_follower_idx  ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS user_follows_following_idx ON user_follows(following_id);

-- Denormalized counts on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS follower_count  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count integer NOT NULL DEFAULT 0;

-- ── Session 5: Submissions ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS submissions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_type   text NOT NULL,  -- 'paper'|'white_paper'|'discovery'|'dataset'
  title             text NOT NULL,
  authors           text NOT NULL,
  abstract          text NOT NULL,
  external_url      text,
  pdf_url           text,
  doi               text,
  journal_name      text,
  organization      text,
  category          text,
  dataset_size      text,
  dataset_format    text,
  dataset_license   text,
  version_number    text,
  methodology       text,
  field_of_discovery text,
  peer_reviewed     boolean NOT NULL DEFAULT false,
  status            text NOT NULL DEFAULT 'pending',
  ai_processed_at   timestamptz,
  published_card_id uuid,
  rejection_reason  text,
  suggested_tags    text[],
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS submissions_user_id_idx ON submissions(user_id);
CREATE INDEX IF NOT EXISTS submissions_status_idx  ON submissions(status);

-- ── Session 7: Fraud / Quality Detection ─────────────────────────────────────

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS semantic_fingerprint text,
  ADD COLUMN IF NOT EXISTS fraud_risk_score     integer,
  ADD COLUMN IF NOT EXISTS fraud_flags          text[],
  ADD COLUMN IF NOT EXISTS fraud_checked_at     timestamptz;

-- Full-text search index on semantic fingerprint for duplicate detection
CREATE INDEX IF NOT EXISTS cards_semantic_fingerprint_fts
  ON cards USING gin(to_tsvector('english', COALESCE(semantic_fingerprint, '')));

-- ── Session 8: User 2FA ───────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS totp_secret          text,
  ADD COLUMN IF NOT EXISTS totp_enabled         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS totp_backup_codes    text[],
  ADD COLUMN IF NOT EXISTS totp_enabled_at      timestamptz,
  ADD COLUMN IF NOT EXISTS totp_failed_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS totp_locked_until    timestamptz;

-- ── Device tokens (push notifications) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS device_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      text NOT NULL,
  platform   text NOT NULL,  -- 'ios'|'android'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON device_tokens(user_id);

-- Add referrer_url to content_views
ALTER TABLE content_views
  ADD COLUMN IF NOT EXISTS referrer_url text;
