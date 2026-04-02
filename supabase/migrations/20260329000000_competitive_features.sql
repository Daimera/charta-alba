-- Competitive feature additions: citations, replication status, ELI5,
-- digest subscribers, paper collections

-- ── New columns on cards ──────────────────────────────────────────────────────
ALTER TABLE cards ADD COLUMN IF NOT EXISTS replication_status TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS eli5_summary TEXT;

-- ── Citation graph ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citing_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  cited_card_id  UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (citing_card_id, cited_card_id)
);

CREATE INDEX IF NOT EXISTS citations_citing_idx ON citations (citing_card_id);
CREATE INDEX IF NOT EXISTS citations_cited_idx  ON citations (cited_card_id);

-- ── Weekly digest subscribers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Paper collections ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  card_id       UUID NOT NULL REFERENCES cards(id)        ON DELETE CASCADE,
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (collection_id, card_id)
);

CREATE INDEX IF NOT EXISTS collection_items_collection_idx ON collection_items (collection_id);
