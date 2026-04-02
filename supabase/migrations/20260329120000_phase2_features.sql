-- Phase 2: video URL, like counts, comments, ratings, claims

-- Add columns to cards
ALTER TABLE cards ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    UUID        NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id  UUID        REFERENCES comments(id) ON DELETE CASCADE,
  body       TEXT        NOT NULL CHECK (char_length(body) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_card_id   ON comments (card_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments (parent_id) WHERE parent_id IS NOT NULL;

-- Card ratings (1–5 stars, one per user per card)
CREATE TABLE IF NOT EXISTS card_ratings (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id    UUID        NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  rating     INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_card_ratings_card_id ON card_ratings (card_id);

-- Paper claim requests
CREATE TABLE IF NOT EXISTS claims (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id   TEXT        NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  user_id    TEXT        REFERENCES users(id) ON DELETE SET NULL,
  email      TEXT        NOT NULL,
  orcid_id   TEXT,
  status     TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claims_paper_id ON claims (paper_id);
