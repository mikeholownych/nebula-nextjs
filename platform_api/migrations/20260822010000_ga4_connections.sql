-- target: platform
-- Phase 1 GA4 integration: one read-only connection per user (mirrors
-- gsc_connections). Tokens are encrypted at rest by the application layer
-- (platform_api.infra.secret_box) before they ever reach these columns.

CREATE TABLE IF NOT EXISTS ga4_connections (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID NOT NULL,
    property_id            TEXT,                -- e.g. 'properties/123456'
    property_display_name  TEXT,
    access_token           TEXT,
    refresh_token          TEXT,
    token_expiry           TIMESTAMPTZ,
    connected_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_ga4_connections_user_id
    ON ga4_connections (user_id);
