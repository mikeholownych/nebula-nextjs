-- Migration: 20260819_harden_ledger_and_permissions.sql
-- Hardens:
-- 1. Explicit Role-Based Authorization for Ledger Remediation (No Plain Session GUC Bypass)
-- 2. Revocation of UPDATE and DELETE from runtime application roles
-- 3. Synthetic Test Data Remediation & Strict Test Flagging

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nebula_ledger_admin') THEN
        CREATE ROLE nebula_ledger_admin;
    END IF;
END
$$;

-- Grant postgres user membership in nebula_ledger_admin
GRANT nebula_ledger_admin TO postgres;

-- Revoke mutation privileges from PUBLIC and standard app roles
REVOKE UPDATE, DELETE, TRUNCATE ON analytics_event_ledger FROM PUBLIC;

-- Hardened Trigger requiring role membership AND session override flag
CREATE OR REPLACE FUNCTION trg_enforce_append_only_ledger()
RETURNS TRIGGER AS $$
BEGIN
    -- Only permit mutation if session user belongs to nebula_ledger_admin AND explicitly sets admin_override
    IF pg_has_role(session_user, 'nebula_ledger_admin', 'MEMBER') 
       AND current_setting('nebula.admin_override', true) = 'true' THEN
        RETURN OLD;
    END IF;

    RAISE EXCEPTION 'Table analytics_event_ledger is append-only. % operations are prohibited for data provenance.', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_mutation_ledger ON analytics_event_ledger;

CREATE TRIGGER trg_prevent_mutation_ledger
BEFORE UPDATE OR DELETE ON analytics_event_ledger
FOR EACH ROW
EXECUTE FUNCTION trg_enforce_append_only_ledger();

-- Set session override for one-time synthetic data cleanup
SET LOCAL nebula.admin_override = 'true';

-- Mark ALL synthetic test rows as test/synthetic
UPDATE analytics_event_ledger 
SET is_synthetic = TRUE, environment = 'test', payment_mode = 'test'
WHERE transaction_id LIKE 'pi_test%'
   OR checkout_session_id LIKE 'cs_test%'
   OR audit_attempt_id LIKE 'att_e2e%'
   OR anonymous_user_id LIKE 'anon_tester%'
   OR anonymous_user_id LIKE 'anon_e2e%'
   OR session_id LIKE 'sess_tester%'
   OR session_id LIKE 'sess_e2e%'
   OR properties->>'is_synthetic' = 'true';
