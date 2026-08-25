-- org_domains: durable domain ownership for the workspace (Phase 3).
-- Replaces email-chain inference as the PRIMARY visibility path. Email-chain
-- remains as a fallback for domains not yet claimed.
--
-- Precedence rule (enforced in workspace queries):
--   explicit claim in org_domains  >  email-chain inference
--
-- verified_by: 'manual' (founder-set), 'dns_txt' (future TXT record proof)
-- status:      'active' | 'revoked'

BEGIN;

CREATE TABLE IF NOT EXISTS org_domains (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    domain           text NOT NULL,
    status           text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'revoked')),
    verified_by      text NOT NULL DEFAULT 'manual'
                     CHECK (verified_by IN ('manual', 'dns_txt')),
    verified_at      timestamptz NOT NULL DEFAULT now(),
    created_by       uuid REFERENCES users(id),
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS org_domains_active_domain_unique
    ON org_domains (lower(domain))
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS org_domains_org_idx
    ON org_domains (organization_id) WHERE status = 'active';

COMMIT;

-- 'excluded' status: owner says this domain is NOT theirs. Suppresses
-- email-chain inference for it (claims still win; exclusions beat inference).
