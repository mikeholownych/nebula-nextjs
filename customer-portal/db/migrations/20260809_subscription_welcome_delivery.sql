-- Durable state for subscription welcome email delivery and retries.
BEGIN;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS welcome_email_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS welcome_email_last_error TEXT;
COMMIT;
