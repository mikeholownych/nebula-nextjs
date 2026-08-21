-- target: audit
-- Wave 3 data-integrity consolidation (DATA-1/3/5/6).
-- 1) Archive + drop dead duplicate authorities (single-writer invariant).
-- 2) Timestamps: naive -> timestamptz on audits lifecycle columns.
-- 3) Status enum CHECK constraints on hot tables.
-- 4) Audit queue requeue support column.

-- ── 1) Dead duplicates (verified empty / superseded 2026-08-21 review) ──
CREATE TABLE IF NOT EXISTS subscriptions__archived_20260821 AS
    SELECT * FROM subscriptions;
-- Dependent FKs (client_workspaces, monitored_pages — both empty) drop with us.
DROP TABLE subscriptions CASCADE;

CREATE TABLE IF NOT EXISTS purchases__archived_20260821 AS
    SELECT * FROM purchases;
DROP TABLE purchases;

CREATE TABLE IF NOT EXISTS analytics_event_ledger__archived_20260821 AS
    SELECT * FROM analytics_event_ledger;
DROP TABLE analytics_event_ledger;

CREATE TABLE IF NOT EXISTS monitored_pages__archived_20260821 AS
    SELECT * FROM monitored_pages;
DROP TABLE monitored_pages CASCADE;  -- monitoring_events FK (both empty)

CREATE TABLE IF NOT EXISTS monitoring_events__archived_20260821 AS
    SELECT * FROM monitoring_events;
DROP TABLE monitoring_events;

-- ── 2) Timestamps: interpret stored naive values as UTC, store timestamptz ──
ALTER TABLE audits
    ALTER COLUMN created_at   TYPE TIMESTAMPTZ USING created_at   AT TIME ZONE 'UTC',
    ALTER COLUMN completed_at TYPE TIMESTAMPTZ USING completed_at AT TIME ZONE 'UTC',
    ALTER COLUMN email_sent_at TYPE TIMESTAMPTZ USING email_sent_at AT TIME ZONE 'UTC',
    ALTER COLUMN paid_at      TYPE TIMESTAMPTZ USING paid_at      AT TIME ZONE 'UTC';

-- ── 3) Status enums as CHECK constraints (values verified against live data) ──
ALTER TABLE outbox_messages DROP CONSTRAINT IF EXISTS outbox_status_check;
ALTER TABLE outbox_messages ADD CONSTRAINT outbox_status_check
    CHECK (status IN ('pending', 'sending', 'sent', 'failed'));

ALTER TABLE purchases__archived_20260821 DROP CONSTRAINT IF EXISTS fulfillment_check;
-- platform.purchases carries the authoritative constraint; audit copy archived.

-- ── 4) Queue requeue support (DATA-6): bounded retry before terminal failure ──
ALTER TABLE audits ADD COLUMN IF NOT EXISTS requeue_attempts SMALLINT NOT NULL DEFAULT 0;
