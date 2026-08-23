-- Phase 2 billing spine: lifecycle columns for org-keyed subscriptions.
-- Additive only. Founder seed row keeps defaults (NULL interval, livemode=false).

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_interval text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS livemode boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS ix_subscriptions_livemode_status
    ON subscriptions (livemode, status);
