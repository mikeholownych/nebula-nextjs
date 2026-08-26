-- target: audit
-- Phase 3 paid analytics surfaces. Additive only.

CREATE TABLE IF NOT EXISTS funnel_runs (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email            text NOT NULL,
    domain           text NOT NULL,
    status           text NOT NULL DEFAULT 'discovering'
                     CHECK (status IN ('discovering','running','complete','complete_partial','failed')),
    requested_count  int NOT NULL DEFAULT 0,
    discovered_count int NOT NULL DEFAULT 0,
    plan_snapshot    text NOT NULL,
    scorecard        jsonb,
    coverage_pct     numeric(5,2),
    created_at       timestamptz NOT NULL DEFAULT now(),
    completed_at     timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_funnel_runs_active_domain
    ON funnel_runs (domain) WHERE status IN ('discovering','running');

CREATE INDEX IF NOT EXISTS idx_funnel_runs_email ON funnel_runs (email);

CREATE TABLE IF NOT EXISTS funnel_pages (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id     uuid NOT NULL REFERENCES funnel_runs(id) ON DELETE CASCADE,
    url        text NOT NULL,
    audit_id   uuid REFERENCES audits(id),
    status     text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','running','done','failed')),
    score      numeric(5,1),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funnel_pages_run ON funnel_pages (run_id);

CREATE TABLE IF NOT EXISTS competitor_audits (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_email    text NOT NULL,
    competitor_url text NOT NULL,
    audit_id       uuid NOT NULL REFERENCES audits(id),
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitor_audits_owner
    ON competitor_audits (owner_email, competitor_url);

CREATE TABLE IF NOT EXISTS benchmark_rollups (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    computed_at  timestamptz NOT NULL DEFAULT now(),
    window_days  int NOT NULL DEFAULT 90,
    sample_size  int NOT NULL,
    composite    jsonb NOT NULL,
    signals      jsonb NOT NULL,
    segment      text NOT NULL DEFAULT 'global'
);

CREATE TABLE IF NOT EXISTS programs (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email        text NOT NULL,
    domain       text NOT NULL,
    status       text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','completed','archived')),
    generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_programs_active_email_domain
    ON programs (email, domain) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS program_steps (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id        uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    seq               int NOT NULL,
    stage             int NOT NULL CHECK (stage IN (1,2)),
    finding_key       text NOT NULL,
    url               text NOT NULL,
    title             text NOT NULL,
    impact            numeric(4,1),
    effort            numeric(4,1),
    quadrant          text,
    status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','active','done','verified','dismissed')),
    verified_audit_id uuid REFERENCES audits(id),
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_program_steps_program ON program_steps (program_id, seq);
