/**
 * Audit events table schema
 * 
 * Columns:
 * - id (uuid, primary key)
 * - audit_id (uuid, references audits)
 * - event_type (text): 'audit_started', 'email_opened', 'email_clicked', 'email_bounced', 'email_unsubscribed', 'purchase_completed'
 * - event_data (jsonb): source, referrer, utm, customerId, amount, product, etc.
 * - created_at (timestamp)
 */

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('audit_started', 'email_opened', 'email_clicked', 'email_bounced', 'email_unsubscribed', 'purchase_completed')),
  event_data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_audit_id ON audit_events(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);
