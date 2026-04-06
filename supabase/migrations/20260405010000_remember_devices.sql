-- Trusted devices for "Remember this device" (30-day sessions)

CREATE TABLE IF NOT EXISTS remember_devices (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           text        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_token_hash text        NOT NULL UNIQUE,  -- SHA-256 of raw cookie token
  device_name       text,                         -- parsed from User-Agent
  user_agent        text,
  ip_address        text,
  city              text,
  country           text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz NOT NULL,
  last_used_at      timestamptz
);

CREATE INDEX IF NOT EXISTS remember_devices_user_id_idx       ON remember_devices(user_id);
CREATE INDEX IF NOT EXISTS remember_devices_token_hash_idx    ON remember_devices(device_token_hash);
CREATE INDEX IF NOT EXISTS remember_devices_expires_at_idx    ON remember_devices(expires_at);
