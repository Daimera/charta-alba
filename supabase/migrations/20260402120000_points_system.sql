-- ── Points system ─────────────────────────────────────────────────────────────

-- Admin role on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Login streak tracking on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS login_streak     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date  DATE,
  ADD COLUMN IF NOT EXISTS point_features   JSONB;

-- Immutable points ledger (source of truth — never UPDATE or DELETE)
CREATE TABLE IF NOT EXISTS points_ledger (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount           INTEGER     NOT NULL,          -- positive = credit, negative = debit
  transaction_type TEXT        NOT NULL,
  reference_id     TEXT,                          -- related object (card id, purchase id, etc.)
  description      TEXT        NOT NULL,
  ip_address       TEXT,
  is_flagged       BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS points_ledger_user_idx   ON points_ledger (user_id);
CREATE INDEX IF NOT EXISTS points_ledger_type_idx   ON points_ledger (transaction_type);
CREATE INDEX IF NOT EXISTS points_ledger_date_idx   ON points_ledger (created_at);
CREATE INDEX IF NOT EXISTS points_ledger_flag_idx   ON points_ledger (is_flagged) WHERE is_flagged = true;

-- Trigger: make ledger truly immutable at DB level
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'points_ledger rows are immutable — use offsetting entries to correct';
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'points_ledger_immutable'
  ) THEN
    CREATE TRIGGER points_ledger_immutable
      BEFORE UPDATE OR DELETE ON points_ledger
      FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();
  END IF;
END; $$;

-- Point purchases (Stripe one-time payments)
CREATE TABLE IF NOT EXISTS point_purchases (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_amount       INTEGER     NOT NULL,
  price_usd           INTEGER     NOT NULL,        -- cents
  stripe_session_id   TEXT,
  stripe_payment_id   TEXT,
  status              TEXT        NOT NULL DEFAULT 'pending',  -- pending/completed/refunded
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS point_purchases_user_idx    ON point_purchases (user_id);
CREATE INDEX IF NOT EXISTS point_purchases_session_idx ON point_purchases (stripe_session_id);

-- Point rules (admin-configurable earning rules)
CREATE TABLE IF NOT EXISTS point_rules (
  id             UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type    TEXT     NOT NULL UNIQUE,
  points_awarded INTEGER  NOT NULL,
  daily_limit    INTEGER,   -- NULL = no daily limit
  weekly_limit   INTEGER,   -- NULL = no weekly limit
  one_time       BOOLEAN  NOT NULL DEFAULT false,
  description    TEXT     NOT NULL,
  is_active      BOOLEAN  NOT NULL DEFAULT true
);

INSERT INTO point_rules (action_type, points_awarded, daily_limit, weekly_limit, one_time, description) VALUES
  ('first_post_daily',       10,  1,    NULL, false, 'First post of the day'),
  ('post_milestone_10',      25,  NULL, NULL, true,  'Post reaches 10 likes'),
  ('post_milestone_50',      75,  NULL, NULL, true,  'Post reaches 50 likes'),
  ('post_milestone_100',     150, NULL, NULL, true,  'Post reaches 100 likes'),
  ('comment_paper',          2,   10,   NULL, false, 'Comment on a paper'),
  ('comment_milestone_5',    10,  NULL, NULL, true,  'Comment reaches 5 likes'),
  ('video_posted',           15,  2,    NULL, false, 'Video posted'),
  ('login_streak_3',         15,  NULL, NULL, false, 'Login streak: day 3'),
  ('login_streak_7',         50,  NULL, NULL, false, 'Login streak: day 7'),
  ('login_streak_30',        200, NULL, NULL, false, 'Login streak: day 30'),
  ('profile_completed',      25,  NULL, NULL, true,  'Profile completed (bio + avatar)'),
  ('first_claim',            50,  NULL, NULL, true,  'First paper claimed'),
  ('orcid_verified',         100, NULL, NULL, true,  'ORCID ID verified'),
  ('top_contributor_weekly', 100, NULL, 1,    false, 'Top 10 contributor this week'),
  ('most_liked_video_weekly',150, NULL, 1,    false, 'Most liked video this week')
ON CONFLICT (action_type) DO NOTHING;

-- Enable RLS
ALTER TABLE points_ledger   ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_rules     ENABLE ROW LEVEL SECURITY;
