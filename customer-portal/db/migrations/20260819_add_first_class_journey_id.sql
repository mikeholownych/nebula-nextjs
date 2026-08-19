-- Migration: 20260819_add_first_class_journey_id.sql
-- Adds first-class, immutable journey_id across all event stages for true cross-stage lineage

ALTER TABLE analytics_event_ledger
  ADD COLUMN IF NOT EXISTS journey_id TEXT;

CREATE INDEX IF NOT EXISTS idx_ledger_journey_id 
  ON analytics_event_ledger (journey_id) 
  WHERE journey_id IS NOT NULL;

-- Backfill legacy records to use COALESCE as journey_id if missing
BEGIN;
SET LOCAL nebula.admin_override = 'true';
UPDATE analytics_event_ledger
SET journey_id = COALESCE(session_id, anonymous_user_id, audit_id, audit_attempt_id, checkout_session_id, id::text)
WHERE journey_id IS NULL;
COMMIT;
