-- Widget partner distribution (Play 4: agencies as distribution layer)
-- 2026-08-04 - additive; safe to run on live DB.

CREATE TABLE IF NOT EXISTS partners (
    id          TEXT PRIMARY KEY,              -- partner_id, e.g. 'agency_abc123'
    name        TEXT NOT NULL,
    email       TEXT,
    plan        TEXT NOT NULL DEFAULT 'agency', -- 'agency' ($497) reserved for future tiers
    status      TEXT NOT NULL DEFAULT 'active', -- active | suspended
    domains     JSONB NOT NULL DEFAULT '[]'::jsonb, -- CORS allowlist
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit attribution: where the audit came from + which partner drove it.
-- Additive columns on audits.
ALTER TABLE audits ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS partner_id TEXT;
CREATE INDEX IF NOT EXISTS idx_audits_source_partner ON audits(partner_id) WHERE partner_id IS NOT NULL;
