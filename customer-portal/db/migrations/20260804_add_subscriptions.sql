-- Subscriptions table for Nebula membership plans (Pro/Growth/Agency)
-- Applied to nebula_audit database (audit-pipeline data domain).
BEGIN;

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'growth', 'agency')),
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'active',
  livemode BOOLEAN NOT NULL DEFAULT TRUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_email
  ON subscriptions (LOWER(email), status) WHERE livemode;

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON subscriptions (stripe_customer_id);

-- Client workspaces for the Agency tier: isolated per-client audit context
CREATE TABLE IF NOT EXISTS client_workspaces (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_workspaces_subscription
  ON client_workspaces (subscription_id);

COMMIT;
