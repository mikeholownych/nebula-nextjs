-- Teardown claims phase 1: DB-backed teardowns + ownership claims.
-- Additive only. See docs/superpowers/specs/2026-08-22-teardown-claims-design.md

CREATE TABLE IF NOT EXISTS teardowns (
    slug            text PRIMARY KEY,
    name            text NOT NULL,
    url             text NOT NULL,
    domain          text NOT NULL,
    score           numeric(3,1),
    grade           text,
    audited_at      timestamptz,
    summary         text,
    context         text,
    findings        jsonb NOT NULL DEFAULT '[]'::jsonb,
    screenshot_path text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teardown_claims (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug               text NOT NULL REFERENCES teardowns(slug),
    claimed_by_email   text NOT NULL,
    verification_method text NOT NULL CHECK (verification_method IN ('email_domain','dns_txt','gsc')),
    verified_at        timestamptz NOT NULL DEFAULT now(),
    status             text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','superseded')),
    response_text      text,
    response_status    text CHECK (response_status IN ('visible','auto_hidden','removed')),
    response_updated_at timestamptz,
    private_context    text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

-- At most one active claim per teardown.
CREATE UNIQUE INDEX IF NOT EXISTS uq_teardown_claims_active_slug
    ON teardown_claims (slug) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_teardown_claims_email
    ON teardown_claims (claimed_by_email);

CREATE INDEX IF NOT EXISTS idx_teardown_claims_domain_lookup
    ON teardowns (domain);
