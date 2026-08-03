ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS delivery_failed_at TIMESTAMPTZ;
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS url TEXT;

UPDATE recommendations r
SET url = a.url
FROM audits a
WHERE r.audit_id = a.id
  AND r.url IS NULL;
