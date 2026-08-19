-- Migration: 20260819_funnel_event_ledger.sql
-- Create append-only analytics event ledger table for end-to-end product funnel observability.

CREATE TABLE IF NOT EXISTS analytics_event_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(100) NOT NULL,
    event_version INT NOT NULL DEFAULT 1,
    stage VARCHAR(50) NOT NULL,
    source_system VARCHAR(50) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Identity & Sessions
    anonymous_user_id VARCHAR(100),
    session_id VARCHAR(100),
    user_id UUID,
    
    -- Journey Correlation Identifiers
    audit_attempt_id VARCHAR(100),
    audit_id VARCHAR(100),
    checkout_session_id VARCHAR(255),
    transaction_id VARCHAR(255),
    
    -- Attribution & Context
    landing_path VARCHAR(500),
    referrer_class VARCHAR(100),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_content VARCHAR(255),
    utm_term VARCHAR(255),
    device_class VARCHAR(50),
    
    -- Status & Failure Handling
    status VARCHAR(50) NOT NULL DEFAULT 'success',
    failure_reason VARCHAR(100),
    
    -- Idempotency & Provenance
    dedup_key VARCHAR(255) UNIQUE,
    build_revision VARCHAR(100),
    
    -- Controlled Properties
    properties JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Essential Performance & Diagnostics Indexes
CREATE INDEX IF NOT EXISTS idx_ael_occurred_at ON analytics_event_ledger (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ael_event_name_occurred ON analytics_event_ledger (event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ael_stage_occurred ON analytics_event_ledger (stage, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ael_audit_attempt_id ON analytics_event_ledger (audit_attempt_id) WHERE audit_attempt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ael_audit_id ON analytics_event_ledger (audit_id) WHERE audit_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ael_session_id ON analytics_event_ledger (session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ael_anon_user_id ON analytics_event_ledger (anonymous_user_id) WHERE anonymous_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ael_checkout_session ON analytics_event_ledger (checkout_session_id) WHERE checkout_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ael_transaction_id ON analytics_event_ledger (transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ael_dedup_key ON analytics_event_ledger (dedup_key) WHERE dedup_key IS NOT NULL;
