-- Structural integrity constraints identified during the 2026-08-09 audit.
-- Apply to nebula_audit after verifying the application deploy that accompanies it.
BEGIN;

ALTER TABLE audits DROP CONSTRAINT IF EXISTS audits_status_check;
ALTER TABLE audits ADD CONSTRAINT audits_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE audits DROP CONSTRAINT IF EXISTS audits_score_check;
ALTER TABLE audits ADD CONSTRAINT audits_score_check
  CHECK (score IS NULL OR (score >= 0 AND score <= 100));

ALTER TABLE audits DROP CONSTRAINT IF EXISTS audits_grade_check;
ALTER TABLE audits ADD CONSTRAINT audits_grade_check
  CHECK (grade IS NULL OR grade IN ('A', 'B', 'C', 'D', 'F', 'N/A'));

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'));

COMMIT;
