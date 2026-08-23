-- Task 13: unique target for fix_implementations upserts.
-- mark_finding_implemented uses ON CONFLICT (audit_id, finding_key);
-- without this index the conflict target does not exist.

CREATE UNIQUE INDEX IF NOT EXISTS uq_fix_impl_audit_finding
    ON fix_implementations (audit_id, finding_key);

-- Task 13 upsert SQL stamps row updates; the 20260818 table predates it.
ALTER TABLE fix_implementations
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

