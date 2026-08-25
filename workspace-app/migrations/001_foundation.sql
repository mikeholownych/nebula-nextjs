-- Workspace Overhaul: Phase 0-2 schema foundation
-- ADDITIVE ONLY. No ALTERs on existing tables. Safe to run on live DB.
-- Idempotent: uses CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.
--
-- New surfaces:
--   audit_log       Append-only, governance-grade event ledger (spec #26/#27)
--   findings        Durable finding identity with lifecycle (spec #18)
--   finding_events  Immutable per-finding history (spec #19)

-- ============================================================
-- audit_log: append-only. No UPDATE/DELETE path in app code.
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_type    VARCHAR(32) NOT NULL,               -- user | system | api_key
    actor_id      UUID,                               -- users.id, NULL for system
    actor_email   VARCHAR(320),                       -- denormalized for readability
    organization_id UUID,                             -- tenant scope, nullable for global events
    action        VARCHAR(128) NOT NULL,              -- e.g. finding.status.update
    resource_type VARCHAR(64) NOT NULL,               -- e.g. finding, audit, membership
    resource_id   VARCHAR(128),                       -- opaque id (uuid or NBL-xxxx)
    old_value     JSONB,
    new_value     JSONB,
    request_id    VARCHAR(64),                        -- X-Request-ID correlation
    ip            INET,
    user_agent    TEXT,
    result        VARCHAR(32) NOT NULL DEFAULT 'ok'   -- ok | denied | error
);

CREATE INDEX IF NOT EXISTS idx_audit_log_org_time ON audit_log (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log (actor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_request ON audit_log (request_id);

-- ============================================================
-- findings: durable identity. One row per (audit, signal key).
-- Re-detection across audits of the same domain updates the row
-- and appends a finding_event; it never deletes history.
-- ============================================================
CREATE TABLE IF NOT EXISTS findings (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id      VARCHAR(32) NOT NULL UNIQUE,       -- NBL-xxxxx, human-quotable
    audit_id       UUID NOT NULL,                     -- audits.id in nebula_audit
    domain         VARCHAR(255) NOT NULL,             -- normalized target domain
    signal_key     VARCHAR(64) NOT NULL,              -- e.g. social_proof, ad_signals
    label          VARCHAR(128),
    issue          TEXT,
    fix            TEXT,
    quadrant       VARCHAR(32),
    impact         NUMERIC(4,1),
    effort         SMALLINT,
    signal_type    VARCHAR(32),
    evidence       JSONB,                             -- measured/delta/confidence as produced
    scoring_provenance JSONB,                         -- rule vs model basis (spec #21)
    evidence_class VARCHAR(16) NOT NULL DEFAULT 'observed',  -- observed|calculated|inferred|recommended
    status         VARCHAR(24) NOT NULL DEFAULT 'new',-- new|acknowledged|in_progress|resolved|accepted_risk|ignored|regressed
    owner_email    VARCHAR(320),                      -- assigned member (email-keyed until org FK migration)
    owner_user_id  UUID,
    first_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT findings_audit_fk FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
    CONSTRAINT findings_status_chk CHECK (status IN
        ('new','acknowledged','in_progress','resolved','accepted_risk','ignored','regressed')),
    CONSTRAINT findings_evidence_chk CHECK (evidence_class IN
        ('observed','calculated','inferred','recommended'))
);

CREATE INDEX IF NOT EXISTS idx_findings_domain ON findings (domain);
CREATE INDEX IF NOT EXISTS idx_findings_audit ON findings (audit_id);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings (status) WHERE status NOT IN ('resolved','ignored');
CREATE INDEX IF NOT EXISTS idx_findings_public ON findings (public_id);
CREATE INDEX IF NOT EXISTS idx_findings_domain_signal ON findings (domain, signal_key, last_seen_at DESC);

-- ============================================================
-- finding_events: append-only lifecycle history (spec #19)
-- ============================================================
CREATE TABLE IF NOT EXISTS finding_events (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    finding_id  BIGINT NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    event_type  VARCHAR(32) NOT NULL,   -- detected|re_detected|status_changed|assigned|regressed|verified
    old_status  VARCHAR(24),
    new_status  VARCHAR(24),
    actor_email VARCHAR(320),
    actor_id    UUID,
    audit_id    UUID,                   -- audit that observed the event
    note        TEXT,
    request_id  VARCHAR(64),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finding_events_finding ON finding_events (finding_id, occurred_at);

-- ============================================================
-- finding id sequence: NBL-xxxxx allocation
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS finding_public_id_seq START 10000;
