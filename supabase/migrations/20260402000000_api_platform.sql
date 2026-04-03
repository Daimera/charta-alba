-- ── API Platform tables ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                  TEXT        NOT NULL,
  key_hash              TEXT        NOT NULL UNIQUE,
  key_prefix            TEXT        NOT NULL,
  tier                  TEXT        NOT NULL DEFAULT 'free',
  requests_this_month   INTEGER     NOT NULL DEFAULT 0,
  requests_today        INTEGER     NOT NULL DEFAULT 0,
  last_used_at          TIMESTAMPTZ,
  last_reset_date       DATE,
  is_active             BOOLEAN     NOT NULL DEFAULT true,
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_keys_user_idx    ON api_keys (user_id);
CREATE INDEX IF NOT EXISTS api_keys_hash_idx    ON api_keys (key_hash);

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id        UUID        NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint          TEXT        NOT NULL,
  response_time_ms  INTEGER,
  status_code       INTEGER     NOT NULL,
  ip_address        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_usage_key_idx  ON api_usage_logs (api_key_id);
CREATE INDEX IF NOT EXISTS api_usage_date_idx ON api_usage_logs (created_at);

CREATE TABLE IF NOT EXISTS api_plans (
  tier              TEXT    PRIMARY KEY,
  monthly_requests  INTEGER NOT NULL,
  daily_requests    INTEGER NOT NULL,
  results_per_call  INTEGER NOT NULL,
  price_monthly     INTEGER NOT NULL,  -- cents; -1 = contact us
  price_annual      INTEGER NOT NULL,  -- cents; -1 = contact us
  features          JSONB
);

INSERT INTO api_plans (tier, monthly_requests, daily_requests, results_per_call, price_monthly, price_annual, features)
VALUES
  ('free',       1000,    100,    10,   0,      0,      '{"search": false, "citations": false, "webhooks": false, "support": "community"}'),
  ('starter',    10000,   1000,   50,   4900,   49900,  '{"search": true,  "citations": false, "webhooks": false, "support": "email"}'),
  ('pro',        100000,  10000,  200,  19900,  199900, '{"search": true,  "citations": true,  "webhooks": false, "support": "priority"}'),
  ('enterprise', -1,      -1,     1000, -1,     -1,     '{"search": true,  "citations": true,  "webhooks": true,  "support": "dedicated"}')
ON CONFLICT (tier) DO NOTHING;

-- Add stripe billing fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Enable RLS
ALTER TABLE api_keys       ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_plans      ENABLE ROW LEVEL SECURITY;
