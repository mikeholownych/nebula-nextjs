-- Audit worker queue: running status, heartbeat, engine payload columns.
-- Apply to nebula_audit. Expand-only; old app versions ignore extra columns.

ALTER TABLE audits ADD COLUMN IF NOT EXISTS engine_input jsonb;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS engine_output jsonb;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS heartbeat_at timestamptz;

ALTER TABLE audits DROP CONSTRAINT IF EXISTS audits_status_check;
ALTER TABLE audits ADD CONSTRAINT audits_status_check
  CHECK (status::text = ANY (ARRAY[
    'pending'::character varying,
    'processing'::character varying,
    'running'::character varying,
    'completed'::character varying,
    'failed'::character varying
  ]::text[]));

CREATE INDEX IF NOT EXISTS idx_audits_pending_created
  ON audits (created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_audits_running_heartbeat
  ON audits (heartbeat_at)
  WHERE status = 'running';

CREATE UNIQUE INDEX IF NOT EXISTS idx_audits_open_attempt_id
  ON audits ((engine_input->>'analytics_attempt_id'))
  WHERE status IN ('pending', 'running')
    AND COALESCE(engine_input->>'analytics_attempt_id', '') <> '';
