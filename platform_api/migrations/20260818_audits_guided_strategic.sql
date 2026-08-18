-- Add guided_implementation and strategic_finding columns to audits table
-- guided_implementation: jsonb — step-by-step guided fix flow (from CAIOS M6)
-- strategic_finding: text — synthesized structural problem statement from audit_principles.py

ALTER TABLE audits ADD COLUMN IF NOT EXISTS guided_implementation jsonb;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS strategic_finding text;
