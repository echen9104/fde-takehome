CREATE TABLE IF NOT EXISTS results (
  id           BIGINT PRIMARY KEY,           -- HN item id; upsert key
  title        TEXT NOT NULL,
  url          TEXT NOT NULL,
  by           TEXT,
  posted_at    TIMESTAMPTZ,
  category     TEXT NOT NULL,
  confidence   REAL NOT NULL,
  status       TEXT NOT NULL,                -- ok | needs_review | fallback
  summary      TEXT,
  extra        JSONB NOT NULL DEFAULT '{}',  -- category-specific fields
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
