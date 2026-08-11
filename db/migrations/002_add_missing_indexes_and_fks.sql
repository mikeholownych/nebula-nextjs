-- Migration 002: Add missing indexes and foreign key constraints
-- Applied: 2026-08-01
-- Context: Infra audit - scheduler query optimization and referential integrity

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_email
  ON recommendations(email);

CREATE INDEX IF NOT EXISTS idx_recommendations_audit_id
  ON recommendations(audit_id);

CREATE INDEX IF NOT EXISTS idx_monitors_next_run_at
  ON monitors(next_run_at) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_monitor_events_audit_id
  ON monitor_events(audit_id) WHERE audit_id IS NOT NULL;

-- Foreign key constraints (previously missing)
ALTER TABLE recommendations
  ADD CONSTRAINT IF NOT EXISTS recommendations_audit_id_fkey
  FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE;

ALTER TABLE monitor_events
  ADD CONSTRAINT IF NOT EXISTS monitor_events_audit_id_fkey
  FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE SET NULL;
