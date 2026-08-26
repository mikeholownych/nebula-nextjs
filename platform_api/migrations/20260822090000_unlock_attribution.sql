-- Unlock attribution + provider message correlation (P0 funnel defects D3/D4).
-- audits.unlocked_at: single ownership transition stamp written by claim_audit.
-- audits.email_message_id: AgentMail message id for delivery/open reconciliation.
-- Backfill: any audit that ever had a report email sent was unlocked by definition.

ALTER TABLE audits ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS email_message_id TEXT;

UPDATE audits
SET unlocked_at = email_sent_at
WHERE email_sent_at IS NOT NULL
  AND unlocked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_audits_unlocked_at
    ON audits(unlocked_at) WHERE unlocked_at IS NOT NULL;
