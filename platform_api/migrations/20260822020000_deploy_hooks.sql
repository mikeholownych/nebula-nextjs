-- target: platform
CREATE TABLE IF NOT EXISTS deploy_hooks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_email TEXT NOT NULL,
    token_hash      TEXT NOT NULL UNIQUE,
    token_prefix    TEXT NOT NULL,
    domains         TEXT[] NOT NULL DEFAULT '{}',
    revoked_at      TIMESTAMPTZ,
    last_used_at    TIMESTAMPTZ,
    use_count       INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deploy_hooks_email ON deploy_hooks(workspace_email);
