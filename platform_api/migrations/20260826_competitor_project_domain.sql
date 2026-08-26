-- target: platform
-- Competitor per-project attribution.
--
-- Canonical migration for the change first applied to production on 2026-08-25.
-- The parallel alembic file (migrations/versions/0006_competitor_project.py)
-- was archived to .legacy/ instead: it collided with 0006_ai_rewrites on the
-- same down_revision (multi-head breakage) and this repo's deploy pipeline
-- only applies platform_api/migrations/*.sql via scripts/migrate.py.
--
-- Idempotent: safe to re-apply on databases that already have the column.

ALTER TABLE competitor_tracking
    ADD COLUMN IF NOT EXISTS project_domain VARCHAR(255);

CREATE INDEX IF NOT EXISTS ix_competitor_tracking_user_project
    ON competitor_tracking (user_id, project_domain);
