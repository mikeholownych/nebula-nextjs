-- Newsletter double opt-in enforcement.
-- New signups are pending until the emailed token is confirmed.
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirmation_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ;

ALTER TABLE newsletter_subscribers
  ALTER COLUMN is_confirmed SET DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_newsletter_confirmation_token
  ON newsletter_subscribers (confirmation_token_hash)
  WHERE confirmation_token_hash IS NOT NULL;

-- Do not silently confirm future rows. Existing confirmed subscribers retain
-- their consent state; only new or re-subscribed records enter pending state.
