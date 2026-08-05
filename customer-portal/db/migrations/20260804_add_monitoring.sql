-- Page monitoring tables for Pro/Growth/Agency subscribers.
-- Applied to nebula_platform database.
BEGIN;

CREATE TABLE IF NOT EXISTS monitored_pages (
  id SERIAL PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  url TEXT NOT NULL,
  label TEXT,
  plan TEXT NOT NULL,
  check_interval_hours INTEGER NOT NULL DEFAULT 168,
  last_checked_at TIMESTAMPTZ,
  last_audit_id TEXT,
  last_score INTEGER,
  last_grade TEXT,
  baseline_score INTEGER,
  baseline_grade TEXT,
  alert_threshold INTEGER NOT NULL DEFAULT 5,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subscription_id, url)
);

CREATE INDEX IF NOT EXISTS idx_monitored_pages_email ON monitored_pages (LOWER(email), active);
CREATE INDEX IF NOT EXISTS idx_monitored_pages_due
  ON monitored_pages (last_checked_at NULLS FIRST, active)
  WHERE active = TRUE;

CREATE TABLE IF NOT EXISTS monitoring_events (
  id SERIAL PRIMARY KEY,
  monitored_page_id INTEGER NOT NULL REFERENCES monitored_pages(id) ON DELETE CASCADE,
  audit_id TEXT NOT NULL,
  score INTEGER,
  grade TEXT,
  score_delta INTEGER,              -- null on first run, +/- vs previous
  alert_sent BOOLEAN NOT NULL DEFAULT FALSE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_page ON monitoring_events (monitored_page_id, checked_at DESC);

COMMIT;
