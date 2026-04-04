-- ─────────────────────────────────────────────────────────────────────────────
-- LOCATION TRACKING & PROFILE VIEW ANALYTICS
-- Migration: 20260403120000_location_analytics.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Extend login_sessions with geo + device data ─────────────────────────────
ALTER TABLE login_sessions
  ADD COLUMN IF NOT EXISTS country        TEXT,
  ADD COLUMN IF NOT EXISTS country_code   TEXT,
  ADD COLUMN IF NOT EXISTS region         TEXT,
  ADD COLUMN IF NOT EXISTS city           TEXT,
  ADD COLUMN IF NOT EXISTS timezone       TEXT,
  ADD COLUMN IF NOT EXISTS latitude       REAL,
  ADD COLUMN IF NOT EXISTS longitude      REAL,
  ADD COLUMN IF NOT EXISTS device_type    TEXT,   -- mobile / tablet / desktop
  ADD COLUMN IF NOT EXISTS browser        TEXT,   -- Chrome / Safari / Firefox / etc.
  ADD COLUMN IF NOT EXISTS os             TEXT,   -- iOS / Android / macOS / Windows / Linux
  ADD COLUMN IF NOT EXISTS is_suspicious  BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Add location sharing preference to profiles ───────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS share_location_with_creators BOOLEAN NOT NULL DEFAULT TRUE;

-- ── profile_views ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_views (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id   TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewer_user_id    TEXT        REFERENCES users(id) ON DELETE SET NULL,
  viewer_ip         TEXT,
  country           TEXT,
  country_code      TEXT,
  region            TEXT,
  city              TEXT,
  device_type       TEXT,
  browser           TEXT,
  referrer_url      TEXT,
  viewed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile_user  ON profile_views (profile_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at     ON profile_views (viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_ip     ON profile_views (viewer_ip, profile_user_id, viewed_at);

-- ── content_views ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_views (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type     TEXT        NOT NULL,   -- 'paper' | 'video' | 'card'
  content_id       TEXT        NOT NULL,
  viewer_user_id   TEXT        REFERENCES users(id) ON DELETE SET NULL,
  viewer_ip        TEXT,
  country          TEXT,
  country_code     TEXT,
  city             TEXT,
  device_type      TEXT,
  viewed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_views_content   ON content_views (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_views_viewed_at ON content_views (viewed_at DESC);
-- Dedup index: one view per (content_type, content_id, viewer_ip) per hour
-- Enforced in application code, not DB constraint (too strict for edge cases)
