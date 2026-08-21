-- target: platform
-- Workspace preferences, team members, and account deletion support
-- Run: psql -h /var/run/postgresql -p 5433 -d nebula_platform -f this_file.sql

-- Preferences (JSONB per email)
CREATE TABLE IF NOT EXISTS workspace_preferences (
    email TEXT PRIMARY KEY,
    preferences JSONB NOT NULL DEFAULT '{}',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team members / invitations
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_email TEXT NOT NULL,
    member_email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    invitation_status TEXT NOT NULL DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'revoked')),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    joined_at TIMESTAMPTZ,
    invite_token TEXT UNIQUE,
    UNIQUE(workspace_email, member_email)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_email);
CREATE INDEX IF NOT EXISTS idx_workspace_members_member ON workspace_members(member_email);
CREATE INDEX IF NOT EXISTS idx_workspace_members_token ON workspace_members(invite_token) WHERE invite_token IS NOT NULL;

-- Soft-delete support
CREATE TABLE IF NOT EXISTS account_deletions (
    email TEXT PRIMARY KEY,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    purge_after TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    export_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'exported', 'purged', 'cancelled'))
);
