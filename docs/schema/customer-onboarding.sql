/**
 * Customer onboarding schema
 */

CREATE TABLE IF NOT EXISTS customer_onboarding (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  audit_id uuid REFERENCES audits(id) ON DELETE SET NULL,
  purchase_id TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('payment_received', 'onboarding_complete', 'sprint_delivered', 're_audit_scheduled', 'onboarding_complete_30_day', 'churned')),
  stage_changed_at timestamp with time zone DEFAULT NOW(),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_onboarding_customer_id ON customer_onboarding(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_onboarding_stage ON customer_onboarding(stage);
CREATE INDEX IF NOT EXISTS idx_customer_onboarding_stage_changed_at ON customer_onboarding(stage_changed_at);
CREATE INDEX IF NOT EXISTS idx_customer_onboarding_purchase_id ON customer_onboarding(purchase_id);
