BEGIN;

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS livemode BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_purchases_live_email
  ON purchases (lower(customer_email), created_at DESC)
  WHERE livemode = TRUE;

COMMIT;
