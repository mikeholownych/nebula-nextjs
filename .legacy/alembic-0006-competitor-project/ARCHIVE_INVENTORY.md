# Archive Inventory

## alembic-0006-competitor-project/

Archived: 2026-08-26

`0006_competitor_project.py` - alembic revision adding
`competitor_tracking.project_domain VARCHAR(255)` plus index
`ix_competitor_tracking_user_project (user_id, project_domain)`.

Reason for archival:
1. Head collision: declared `down_revision = "0005_competitor_tracking"`, the
   same parent as existing `0006_ai_rewrites`, producing two alembic heads and
   breaking `alembic upgrade head`.
2. Wrong mechanism: this repo's deploy pipeline applies only
   `platform_api/migrations/*.sql` via `platform_api/scripts/migrate.py`;
   nothing runs alembic in production.

Superseded by: `platform_api/migrations/20260826_competitor_project_domain.sql`
(idempotent, already applied to production `nebula_platform` on 2026-08-25).

The archived file must not be restored under `migrations/versions/`.
