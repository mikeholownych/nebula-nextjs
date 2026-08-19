-- Migration: 20260819_enforce_append_only_and_env.sql
-- Enforces:
-- 1. Append-Only Database Rule: Triggers block UPDATE and DELETE on analytics_event_ledger
-- 2. Environment & Payment Mode: environment, payment_mode, is_synthetic columns
-- 3. Dedicated authoritative role / bypass semantics

ALTER TABLE analytics_event_ledger 
  ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'production',
  ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_ledger_env_live 
  ON analytics_event_ledger (environment, payment_mode, is_synthetic) 
  WHERE is_synthetic = FALSE;

-- Trigger function to reject UPDATE and DELETE operations
CREATE OR REPLACE FUNCTION trg_enforce_append_only_ledger()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if explicitly bypassed by admin override session config
    IF current_setting('nebula.admin_override', true) = 'true' THEN
        RETURN OLD;
    END IF;

    RAISE EXCEPTION 'Table analytics_event_ledger is append-only. % operations are prohibited for data provenance and regulatory integrity.', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_mutation_ledger ON analytics_event_ledger;

CREATE TRIGGER trg_prevent_mutation_ledger
BEFORE UPDATE OR DELETE ON analytics_event_ledger
FOR EACH ROW
EXECUTE FUNCTION trg_enforce_append_only_ledger();

-- Mark historical synthetic test events as synthetic
UPDATE analytics_event_ledger 
SET is_synthetic = TRUE, environment = 'test', payment_mode = 'test'
WHERE anonymous_user_id LIKE 'anon_tester_%'
   OR anonymous_user_id LIKE 'anon_e2e_%'
   OR checkout_session_id LIKE 'cs_test_%'
   OR transaction_id LIKE 'pi_test_%'
   OR audit_attempt_id LIKE 'att_e2e_%';
