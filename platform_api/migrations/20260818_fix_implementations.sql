-- Fix implementations tracking table
-- Stores data on which fixes were applied and their outcomes
-- Used by /audit/fix-library and /audit/fix-effectiveness endpoints

CREATE TABLE IF NOT EXISTS fix_implementations (
    id              SERIAL PRIMARY KEY,
    audit_id        UUID REFERENCES audits(id) ON DELETE SET NULL,
    email           TEXT,
    finding_key     TEXT NOT NULL,
    implemented     BOOLEAN NOT NULL DEFAULT FALSE,
    score_before    NUMERIC(4,1),
    score_after     NUMERIC(4,1),
    implemented_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fix_impl_finding_key ON fix_implementations(finding_key);
CREATE INDEX IF NOT EXISTS idx_fix_impl_email ON fix_implementations(email);
CREATE INDEX IF NOT EXISTS idx_fix_impl_implemented ON fix_implementations(implemented) WHERE implemented = TRUE;
