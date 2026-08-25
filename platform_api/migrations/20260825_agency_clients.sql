-- agency_clients: client accounts managed by agency organizations.
-- client_email is a system-managed audit ownership key (never a real mailbox):
--   {slug}+{org_id_prefix8}@clients.nebulacomponents.com

CREATE TABLE IF NOT EXISTS agency_clients (
    id                uuid         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id   uuid         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              text         NOT NULL,
    slug              text         NOT NULL,
    domain            text         NOT NULL,
    client_email      text         NOT NULL UNIQUE,
    status            text         NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active', 'suspended', 'unlinked')),
    notes             text,
    invited_user_id   uuid         REFERENCES users(id) ON DELETE SET NULL,
    invite_token      text,
    invite_expires_at timestamptz,
    created_at        timestamptz  NOT NULL DEFAULT now(),
    updated_at        timestamptz  NOT NULL DEFAULT now(),
    UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_agency_clients_org
    ON agency_clients (organization_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_agency_clients_token
    ON agency_clients (invite_token) WHERE invite_token IS NOT NULL;
