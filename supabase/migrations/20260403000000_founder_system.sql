-- ─────────────────────────────────────────────────────────────────────────────
-- FOUNDER / GOD MODE SYSTEM
-- Migration: 20260403000000_founder_system.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Extend users table with founder fields ───────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_founder           BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS founder_since         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS founder_totp_secret   TEXT,           -- AES-256-GCM encrypted
  ADD COLUMN IF NOT EXISTS founder_backup_codes  TEXT[],         -- bcrypt-hashed one-time codes
  ADD COLUMN IF NOT EXISTS founder_last_verified TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS founder_ip_whitelist  TEXT[],         -- optional IP lockdown
  ADD COLUMN IF NOT EXISTS founder_totp_attempts INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS founder_locked_until  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_totp_code_hash   TEXT,           -- replay prevention
  ADD COLUMN IF NOT EXISTS last_totp_used_at     TIMESTAMPTZ;

-- Physically enforce: only ONE founder ever, at the DB level
CREATE UNIQUE INDEX IF NOT EXISTS only_one_founder
  ON users (is_founder)
  WHERE is_founder = TRUE;

-- ── audit_log ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type        TEXT        NOT NULL,
  target_type        TEXT,                       -- 'user', 'paper', 'api_key', etc.
  target_id          TEXT,
  detail             JSONB,
  ip_address         TEXT,
  user_agent         TEXT,
  totp_verified      BOOLEAN     NOT NULL DEFAULT FALSE,
  verification_level INTEGER     NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutability trigger — audit log can never be modified
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Audit log is immutable — no updates or deletes allowed';
END;
$$;

DROP TRIGGER IF EXISTS audit_log_immutable ON audit_log;
CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- RLS: only service role (bypasses RLS) can read audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON audit_log
  FOR ALL USING (FALSE);

-- ── founder_api_key ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS founder_api_key (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash     TEXT        NOT NULL UNIQUE,   -- SHA-256 of raw key
  key_prefix   TEXT        NOT NULL,          -- first 16 chars for display
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE
);

ALTER TABLE founder_api_key ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON founder_api_key
  FOR ALL USING (FALSE);

-- ── system_config ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_config (
  key         TEXT        PRIMARY KEY,
  value       JSONB       NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  TEXT        REFERENCES users(id) ON DELETE SET NULL
);

-- Seed default config values
INSERT INTO system_config (key, value, description)
VALUES
  ('maintenance_mode',         'false',                   'Show maintenance page to all non-founder users'),
  ('arxiv_daily_seed_enabled', 'true',                    'Enable daily arXiv paper seeding'),
  ('arxiv_seed_hour_utc',      '6',                       'Hour (UTC) to run daily arXiv seed'),
  ('arxiv_max_papers',         '20',                      'Max papers to seed per daily run'),
  ('api_rate_limit_multiplier','1.0',                     'Global multiplier applied to all API tier limits'),
  ('points_earning_enabled',   'true',                    'Allow users to earn points'),
  ('points_purchasing_enabled','true',                    'Allow users to purchase points')
ON CONFLICT (key) DO NOTHING;

-- ── feature_flags ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
  key         TEXT        PRIMARY KEY,
  enabled     BOOLEAN     NOT NULL DEFAULT FALSE,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  TEXT        REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO feature_flags (key, enabled, description)
VALUES
  ('circles',           TRUE,  'Enable Circles (community groups)'),
  ('videos',            TRUE,  'Enable Videos tab'),
  ('api_platform',      TRUE,  'Enable public API platform'),
  ('points_system',     TRUE,  'Enable points & rewards system'),
  ('ask_ai',            TRUE,  'Enable Ask AI feature on papers'),
  ('developer_portal',  TRUE,  'Enable developer portal pages'),
  ('digest',            TRUE,  'Enable Digest tab'),
  ('og_sharing',        TRUE,  'Enable OG share cards')
ON CONFLICT (key) DO NOTHING;

-- ── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_log_action_type  ON audit_log (action_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at   ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target        ON audit_log (target_type, target_id);
