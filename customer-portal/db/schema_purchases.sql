-- Nebula Components - Purchases (Stripe checkout completions)
-- PostgreSQL 15+

CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_event_id VARCHAR(255),
  customer_email VARCHAR(255),
  offer_key VARCHAR(100),
  amount_total INTEGER,
  currency VARCHAR(10),
  payment_status VARCHAR(50),
  fulfillment_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, failed, delivered, review
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_email ON purchases(customer_email);
CREATE INDEX IF NOT EXISTS idx_purchases_fulfillment_status ON purchases(fulfillment_status);
