-- ── Privacy & Compliance additions ──────────────────────────────────────────

-- Profiles: i18n + compliance columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_language          text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS ccpa_do_not_sell            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS analytics_opt_out           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accessibility_reduced_motion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accessibility_high_contrast  boolean NOT NULL DEFAULT false;

-- Privacy requests (GDPR/CCPA data subject requests)
CREATE TABLE IF NOT EXISTS privacy_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         text REFERENCES users(id) ON DELETE SET NULL,
  request_type    text NOT NULL,   -- 'download', 'delete', 'correct', 'opt_out_analytics', 'ccpa_do_not_sell', 'other'
  status          text NOT NULL DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'denied'
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  notes           text,
  requester_email text,
  ip_address      text
);

CREATE INDEX IF NOT EXISTS privacy_requests_user_id_idx ON privacy_requests(user_id);
CREATE INDEX IF NOT EXISTS privacy_requests_status_idx  ON privacy_requests(status);

-- Translations cache (AI-translated card content)
CREATE TABLE IF NOT EXISTS translations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type         text NOT NULL DEFAULT 'card',
  content_id           uuid NOT NULL,
  language_code        text NOT NULL,
  translated_headline  text,
  translated_hook      text,
  translated_body      text,
  translated_tldr      text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  last_used_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_type, content_id, language_code)
);

CREATE INDEX IF NOT EXISTS translations_content_lang_idx
  ON translations(content_type, content_id, language_code);
