-- Authoritative newsletter release and event ledger.
-- Reversible by stopping newsletter sends and retaining these append-only records.

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS consent_state TEXT NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS consent_source TEXT,
  ADD COLUMN IF NOT EXISTS consent_captured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_policy_version TEXT,
  ADD COLUMN IF NOT EXISTS hard_bounced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS complained_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_suppressed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suppression_reason TEXT;

CREATE TABLE IF NOT EXISTS newsletter_release (
  release_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','VALIDATING','BLOCKED','APPROVED','SENDING','PARTIAL','SENT','FAILED','CANCELLED')),
  source_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  preheader TEXT NOT NULL DEFAULT '',
  from_name TEXT NOT NULL,
  from_address TEXT NOT NULL,
  reply_to TEXT NOT NULL,
  approved_html TEXT NOT NULL,
  approved_text TEXT NOT NULL,
  approved_content_hash TEXT NOT NULL CHECK (approved_content_hash ~ '^[0-9a-f]{64}$'),
  template_version TEXT NOT NULL,
  source_revision TEXT NOT NULL,
  build_revision TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  send_not_before TIMESTAMPTZ,
  actual_send_started_at TIMESTAMPTZ,
  actual_send_completed_at TIMESTAMPTZ,
  provider TEXT NOT NULL DEFAULT 'agentmail',
  release_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (campaign_id),
  CHECK ((status <> 'APPROVED') OR approved_at IS NOT NULL),
  CHECK ((status NOT IN ('SENDING','PARTIAL','SENT')) OR approved_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_release_status ON newsletter_release(status, created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_release_issue ON newsletter_release(issue_id);

CREATE TABLE IF NOT EXISTS newsletter_recipient_decision (
  decision_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  release_id UUID NOT NULL REFERENCES newsletter_release(release_id),
  subscriber_id UUID NOT NULL REFERENCES newsletter_subscribers(id),
  email_hash TEXT NOT NULL CHECK (email_hash ~ '^[0-9a-f]{64}$'),
  confirmation_state TEXT NOT NULL,
  consent_state TEXT NOT NULL,
  consent_source TEXT,
  unsubscribed_state BOOLEAN NOT NULL,
  hard_bounce_state BOOLEAN NOT NULL,
  complaint_state BOOLEAN NOT NULL,
  admin_suppressed_state BOOLEAN NOT NULL,
  suppression_reason TEXT,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  eligible BOOLEAN NOT NULL,
  decision_reason TEXT NOT NULL,
  decision_hash TEXT NOT NULL CHECK (decision_hash ~ '^[0-9a-f]{64}$'),
  UNIQUE (release_id, subscriber_id)
);
CREATE INDEX IF NOT EXISTS idx_newsletter_decision_release ON newsletter_recipient_decision(release_id, eligible);

CREATE TABLE IF NOT EXISTS newsletter_submission (
  submission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  release_id UUID NOT NULL REFERENCES newsletter_release(release_id),
  decision_id UUID NOT NULL UNIQUE REFERENCES newsletter_recipient_decision(decision_id),
  subscriber_id UUID NOT NULL REFERENCES newsletter_subscribers(id),
  idempotency_key TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  provider_message_id TEXT,
  submitted_content_hash TEXT NOT NULL CHECK (submitted_content_hash ~ '^[0-9a-f]{64}$'),
  submitted_at TIMESTAMPTZ,
  provider_acceptance_state TEXT NOT NULL DEFAULT 'PENDING',
  last_error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (release_id, subscriber_id)
);
CREATE INDEX IF NOT EXISTS idx_newsletter_submission_provider_message ON newsletter_submission(provider_message_id);

CREATE TABLE IF NOT EXISTS newsletter_event (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL CHECK (event_type IN ('SENT','DELIVERY','HARD_BOUNCE','SOFT_BOUNCE','COMPLAINT','REJECTED','UNSUBSCRIBE')),
  provider_message_id TEXT,
  subscriber_id UUID REFERENCES newsletter_subscribers(id),
  release_id UUID REFERENCES newsletter_release(release_id),
  event_at TIMESTAMPTZ NOT NULL,
  payload_hash TEXT NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  processing_status TEXT NOT NULL DEFAULT 'PROCESSED',
  processing_error TEXT
);
CREATE INDEX IF NOT EXISTS idx_newsletter_event_message ON newsletter_event(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_event_type ON newsletter_event(event_type, event_at);

CREATE TABLE IF NOT EXISTS newsletter_telemetry (
  telemetry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  release_id UUID REFERENCES newsletter_release(release_id),
  subscriber_id UUID REFERENCES newsletter_subscribers(id),
  stable_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_newsletter_telemetry_release ON newsletter_telemetry(release_id, occurred_at);

-- No old subscriber is granted new provenance. Existing rows remain UNKNOWN
-- until a new verified confirmation event establishes consent evidence.
