-- ==========================================================================
-- Nebula Components — Canonical Data Model
-- Version 1.0
-- Builds on existing content_ops database with immutable UUIDs and
-- a full lifecycle state machine.
-- Applies to: content_ops database on 10.0.8.220
-- ==========================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================================
-- PROSPECTS — the person/company at the center
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.prospects (
    prospect_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name               TEXT,
    email              TEXT,
    company            TEXT,
    role               TEXT,
    source             TEXT,          -- first-touch attribution channel
    source_post_id     TEXT,          -- reddit_xxx, linkedin_post_xxx, etc.
    utm_source         TEXT,
    utm_campaign       TEXT,
    first_seen_at      TIMESTAMPTZ,
    consent_status     TEXT DEFAULT 'pending' CHECK (consent_status IN ('pending','granted','denied','withdrawn')),
    crm_status         TEXT DEFAULT 'new' CHECK (crm_status IN ('new','active','archived','blacklisted')),
    lifecycle_state    TEXT DEFAULT 'audience'
                       CHECK (lifecycle_state IN (
                           'audience',
                           'engaged',
                           'audit_requested',
                           'audit_completed',
                           'problem_confirmed',
                           'commercially_qualified',
                           'fix_offered',
                           'fix_purchased',
                           'fix_delivered',
                           'outcome_measured',
                           'case_study_eligible'
                       )),
    tags               TEXT[],
    notes              TEXT,
    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prospects_email ON public.prospects(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospects_lifecycle ON public.prospects(lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_prospects_source ON public.prospects(source);

-- ==========================================================================
-- WEB PROPERTIES — domains/sites owned by a prospect
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.web_properties (
    property_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id        UUID REFERENCES public.prospects(prospect_id) ON DELETE CASCADE,
    domain             TEXT NOT NULL,
    submitted_url      TEXT NOT NULL,   -- the exact URL they submitted
    business_type      TEXT,            -- ecommerce, saas, lead_gen, content, etc.
    platform           TEXT,            -- shopify, wordpress, nextjs, etc.
    traffic_status     TEXT DEFAULT 'unknown'
                       CHECK (traffic_status IN ('unknown','active_paid','active_organic','low','negligible','unverified')),
    notes              TEXT,
    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_properties_prospect ON public.web_properties(prospect_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_web_properties_domain ON public.web_properties(domain);

-- ==========================================================================
-- AUDITS — each audit execution
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.audits (
    audit_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id        UUID REFERENCES public.web_properties(property_id) ON DELETE CASCADE,
    prospect_id        UUID REFERENCES public.prospects(prospect_id) ON DELETE CASCADE,
    audit_version      TEXT NOT NULL DEFAULT '1.0.0',
    rule_version       TEXT,           -- which rule set was applied
    status             TEXT DEFAULT 'pending'
                       CHECK (status IN ('pending','running','completed','failed','cancelled')),
    started_at         TIMESTAMPTZ,
    completed_at       TIMESTAMPTZ,
    error_message      TEXT,
    source_snapshot_id TEXT,           -- pointer to .citable/snapshots/ if archived
    x402_tx_hash       TEXT,           -- blockchain tx if paid via x402
    findings_count     INTEGER DEFAULT 0,
    created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audits_property ON public.audits(property_id);
CREATE INDEX IF NOT EXISTS idx_audits_prospect ON public.audits(prospect_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON public.audits(status);

-- ==========================================================================
-- FINDINGS — individual diagnostic findings per audit
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.findings (
    finding_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id           UUID NOT NULL REFERENCES public.audits(audit_id) ON DELETE CASCADE,
    rule_id            TEXT,           -- e.g. 'CTA-004', 'SEO-012'
    rule_version       TEXT,
    issue              TEXT NOT NULL,  -- human-readable description
    severity           TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low','info')),
    confidence         REAL CHECK (confidence >= 0 AND confidence <= 1),
    impact_score       INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
    effort_score       INTEGER CHECK (effort_score >= 1 AND effort_score <= 10),
    evidence           JSONB,          -- full evidence object with selector, measured, required, delta
    recommendation     TEXT,
    category           TEXT,           -- CTA, SEO, content, performance, mobile, etc.
    created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_findings_audit ON public.findings(audit_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON public.findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_rule ON public.findings(rule_id);

-- ==========================================================================
-- QUALIFICATIONS — commercial qualification records
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.qualifications (
    qualification_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id        UUID NOT NULL REFERENCES public.prospects(prospect_id) ON DELETE CASCADE,
    audit_id           UUID REFERENCES public.audits(audit_id),
    classification     TEXT NOT NULL
                       CHECK (classification IN ('qualified','potentially_qualified','not_qualified','unreviewed')),
    reason_codes       TEXT[],         -- e.g. {'active_paid_traffic','conversion_baseline_unavailable','buyer_authority_unclear'}
    missing_evidence   TEXT[],         -- what we need to reclassify
    reviewer           TEXT,           -- who reviewed this
    reviewed_at        TIMESTAMPTZ,
    score              INTEGER,        -- optional numeric score for sorting, NOT for routing decisions
    notes              TEXT,
    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qualifications_prospect ON public.qualifications(prospect_id);
CREATE INDEX IF NOT EXISTS idx_qualifications_class ON public.qualifications(classification);

-- ==========================================================================
-- OFFERS — fix pack offers sent to qualified prospects
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.offers (
    offer_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qualification_id   UUID REFERENCES public.qualifications(qualification_id),
    prospect_id        UUID NOT NULL REFERENCES public.prospects(prospect_id) ON DELETE CASCADE,
    offer_type         TEXT NOT NULL DEFAULT 'one_leak_repair'
                       CHECK (offer_type IN ('one_leak_repair','retainer','agency_partner')),
    price_cents        INTEGER NOT NULL DEFAULT 9700,  -- $97 in cents
    currency           TEXT DEFAULT 'USD',
    status             TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','sent','accepted','declined','expired','cancelled')),
    sent_at            TIMESTAMPTZ,
    accepted_at        TIMESTAMPTZ,
    declined_at        TIMESTAMPTZ,
    stripe_url         TEXT,           -- Stripe checkout session URL
    stripe_session_id  TEXT,
    notes              TEXT,
    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_prospect ON public.offers(prospect_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);

-- ==========================================================================
-- INTERVENTIONS — approved changes deployed to a site
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.interventions (
    intervention_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id         UUID NOT NULL REFERENCES public.findings(finding_id) ON DELETE CASCADE,
    offer_id           UUID REFERENCES public.offers(offer_id),
    prospect_id        UUID NOT NULL REFERENCES public.prospects(prospect_id),
    approved_change    TEXT NOT NULL,
    implementation_status TEXT NOT NULL DEFAULT 'pending'
                       CHECK (implementation_status IN ('pending','in_progress','deployed','failed','reverted','cancelled')),
    deployed_at        TIMESTAMPTZ,
    deployed_by        TEXT,           -- person or system that deployed
    rollback_method    TEXT,           -- how to undo if needed
    validation_status  TEXT DEFAULT 'pending'
                       CHECK (validation_status IN ('pending','passed','failed','not_applicable')),
    validation_notes   TEXT,
    before_snapshot    JSONB,          -- evidence of state before change
    after_snapshot     JSONB,          -- evidence of state after change
    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interventions_finding ON public.interventions(finding_id);
CREATE INDEX IF NOT EXISTS idx_interventions_prospect ON public.interventions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON public.interventions(implementation_status);

-- ==========================================================================
-- OUTCOMES — measured results after interventions
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.outcomes (
    outcome_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intervention_id    UUID REFERENCES public.interventions(intervention_id),
    prospect_id        UUID NOT NULL REFERENCES public.prospects(prospect_id),
    baseline_start     TIMESTAMPTZ,
    baseline_end       TIMESTAMPTZ,
    baseline_sessions  INTEGER,
    baseline_cr        REAL,           -- conversion rate (0-100%)
    measurement_start  TIMESTAMPTZ,
    measurement_end    TIMESTAMPTZ,
    measurement_sessions INTEGER,
    measurement_cr     REAL,
    change_description TEXT,           -- what interventions were applied
    confounders        TEXT[],         -- other factors that may have affected results
    conclusion         TEXT CHECK (conclusion IN ('improvement_confirmed','improvement_suggested','no_change','decline','insufficient_data')),
    customer_confirmed BOOLEAN DEFAULT FALSE,
    case_study_eligible BOOLEAN DEFAULT FALSE,
    notes              TEXT,
    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outcomes_prospect ON public.outcomes(prospect_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_intervention ON public.outcomes(intervention_id);

-- ==========================================================================
-- EVENTS — the canonical event log
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.events (
    event_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type         TEXT NOT NULL,  -- 'prospect.created', 'audit.requested', 'audit.completed', etc.
    entity_type        TEXT NOT NULL,  -- 'prospect', 'audit', 'finding', 'qualification', etc.
    entity_id          UUID NOT NULL,  -- the UUID of the affected entity
    prospect_id        UUID REFERENCES public.prospects(prospect_id),
    occurred_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor              TEXT NOT NULL DEFAULT 'system',  -- 'webhook', 'n8n', 'mike', 'system', etc.
    correlation_id     TEXT,           -- journey ID connecting first touch through purchase
    data               JSONB,          -- event-specific payload
    schema_version     TEXT DEFAULT '1.0'
);

CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_entity ON public.events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_events_prospect ON public.events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_events_correlation ON public.events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_events_occurred ON public.events(occurred_at DESC);

-- ==========================================================================
-- TRIGGER: auto-update updated_at on main tables
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    CREATE TRIGGER trg_prospects_updated_at BEFORE UPDATE ON public.prospects
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_web_properties_updated_at BEFORE UPDATE ON public.web_properties
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_qualifications_updated_at BEFORE UPDATE ON public.qualifications
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_offers_updated_at BEFORE UPDATE ON public.offers
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_interventions_updated_at BEFORE UPDATE ON public.interventions
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_outcomes_updated_at BEFORE UPDATE ON public.outcomes
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================================================
-- VIEW: funnel snapshot — count of prospects at each lifecycle state
-- ==========================================================================
CREATE OR REPLACE VIEW public.funnel_snapshot AS
SELECT
    lifecycle_state,
    COUNT(*) AS count,
    ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) AS pct
FROM public.prospects
GROUP BY lifecycle_state
ORDER BY array_position(ARRAY[
    'audience','engaged','audit_requested','audit_completed',
    'problem_confirmed','commercially_qualified','fix_offered',
    'fix_purchased','fix_delivered','outcome_measured','case_study_eligible'
]::TEXT[], lifecycle_state);

-- ==========================================================================
-- VIEW: audit funnel — completion and conversion metrics
-- ==========================================================================
CREATE OR REPLACE VIEW public.audit_funnel AS
SELECT
    p.lifecycle_state,
    COUNT(DISTINCT p.prospect_id) AS prospects,
    COUNT(DISTINCT a.audit_id) AS audits,
    COUNT(DISTINCT f.finding_id) AS findings,
    COUNT(DISTINCT q.qualification_id) AS qualifications,
    COUNT(DISTINCT o.offer_id) AS offers_sent,
    COUNT(DISTINCT o.offer_id) FILTER (WHERE o.status = 'accepted') AS offers_accepted,
    COUNT(DISTINCT i.intervention_id) AS interventions,
    COUNT(DISTINCT oc.outcome_id) AS outcomes
FROM public.prospects p
LEFT JOIN public.audits a ON p.prospect_id = a.prospect_id
LEFT JOIN public.findings f ON a.audit_id = f.audit_id
LEFT JOIN public.qualifications q ON p.prospect_id = q.prospect_id
LEFT JOIN public.offers o ON p.prospect_id = o.prospect_id
LEFT JOIN public.interventions i ON p.prospect_id = i.prospect_id
LEFT JOIN public.outcomes oc ON p.prospect_id = oc.prospect_id
GROUP BY p.lifecycle_state
ORDER BY p.lifecycle_state;

-- ==========================================================================
-- MIGRATE existing trigger_leads data into canonical tables
-- This is a one-time migration; new data flows through the canonical schema.
-- ==========================================================================
INSERT INTO public.prospects (
    email, source, source_post_id, first_seen_at, lifecycle_state,
    created_at, notes
)
SELECT
    email,
    COALESCE(source, 'legacy_import'),
    source_post_id,
    COALESCE(received_at, created_at),
    CASE
        WHEN status = 'alerted' THEN 'engaged'
        WHEN status = 'new' THEN CASE WHEN icp_score >= 40 THEN 'audit_completed' ELSE 'engaged' END
        ELSE 'audience'
    END,
    COALESCE(created_at, now()),
    'Migrated from legacy trigger_leads table. Score: ' || COALESCE(icp_score::TEXT, 'null') ||
    ', Segment: ' || COALESCE(segment, 'null') ||
    ', Triggers: ' || COALESCE(triggers::TEXT, 'null')
FROM public.trigger_leads
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Also import records without email but with source_post_id
INSERT INTO public.prospects (
    source, source_post_id, first_seen_at, lifecycle_state, created_at, notes
)
SELECT
    COALESCE(source, 'legacy_import'),
    source_post_id,
    COALESCE(received_at, created_at),
    'engaged',
    COALESCE(created_at, now()),
    'Migrated from legacy trigger_leads table (no email). Post ID: ' || source_post_id
FROM public.trigger_leads
WHERE email IS NULL AND source_post_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Log the migration event
INSERT INTO public.events (event_type, entity_type, entity_id, actor, data)
SELECT
    'system.migration',
    'prospect',
    p.prospect_id,
    'schema_canonical_v1',
    '{"migrated_from": "trigger_leads", "note": "Imported from legacy leads table"}'
FROM public.prospects p
WHERE p.notes LIKE 'Migrated from legacy trigger_leads table%';
