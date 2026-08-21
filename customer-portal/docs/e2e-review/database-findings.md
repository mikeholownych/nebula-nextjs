# Database Findings

Live inspection (read-only) of `nebula_platform` and `nebula_audit` on :5433, cross-checked with migration files.

## DATA-1 · Duplicate authorities / dual-writer drift (P1)
- `subscriptions`: nebula_platform row = `sub_agency_founder_free|active|agency`; nebula_audit row = `sub_internal_mike|active|agency`. Two different subscription records for the same business fact in two databases — proven drift, not just schema remnant.
- `purchases`: platform has the live row(s); audit-DB copy empty. `analytics_event_ledger`: platform active (4,665 events); audit-DB copy dead (0). `audits`: audit-DB live (568); platform copy 0 rows. `monitored_pages`/`monitoring_events` exist in both.
- **Files:** webhook writes → `app/lib/db.ts` pool (platform DB); kit fulfillment writes purchases via raw asyncpg on DATABASE_URL (`platform_api/infra/outbox.py:226-244`); CRM writes → audit DB (`services/crm.py`).
- **Failure mode:** a future writer picks the wrong DSN fallback (see DATA-4) and silently forks state; reporting joins across divergent copies.
- **Remediation:** REFACTOR to single authority per fact + drop remnants. Risk: medium (needs data reconciliation).

## DATA-2 · No migration tracking or runner (P1)
- No `schema_migrations` table in either DB; alembic tracks only `nebula_platform` at `0007_experiments` while `platform_api/migrations/*.sql` (10 files incl. queue rewrite `20260820_audit_runner_queue.sql`) and `customer-portal/db/migrations/*.sql` (10 files) are applied manually — deploy script literally instructs: "Operator order: apply …sql on nebula_audit → restart nebula-platform-api" (`scripts/deploy_customer_portal.sh:44-49`).
- **Failure mode:** skipped/out-of-order SQL on a fresh host or under time pressure; code requiring columns before they exist.
- **Remediation:** REPLACE with one tracked runner. Risk: low-medium.

## DATA-3 · Schema-level integrity gaps in hot tables (P2)
- `audits`: `created_at`/`completed_at` are naive `timestamp` while `heartbeat_at` is `timestamptz`; `status` CHECK exists but fulfillment-style enums elsewhere (`purchases.fulfillment_status`, `outbox_messages.status`) are unconstrained varchar; no FK from `purchases.customer_email` (email-join model by design).
- Ledger indexes are good (dedup unique key + journey/audit/txn indexes verified live).
- **Remediation:** HARDEN (timestamptz migration, enum CHECKs).

## DATA-4 · Hardcoded fallback DSNs duplicated across modules (P1)
- `postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433` re-declared in ≥7 places (`services/audit_db.py:48-51`, `crm.py:24-27`, `lead_scoring.py:24-27`, `ab_test.py:30-33`, `alert_engine.py`, `newsletter_events.py:116`, `digest/builder.py:18-21`) plus platform variant in `analytics.py:20-23`. Missing env ⇒ silent attach to local socket DB.
- **Remediation:** REPLACE with config-only sourcing + startup fail-fast.

## DATA-5 · Transaction/side-effect coupling (P2)
- `update_audit` performs main UPDATE then best-effort badge/cohort writes autocommit-style with swallowed exceptions (`services/audit_db.py:563-616`) — completed audit can lack badge/cohort increment with no record of the gap.
- Outbox claim→dispatch→separate status update is standard at-least-once, but SendGrid sends carry **no idempotency key** (`infra/outbox.py:269-278`) — crash between 2xx and `sent` update ⇒ duplicate email after 15-min lease expiry.
- `find_open` dedup treats `sent` as blocking (`outbox.py:58-72`) — legitimate second send to same channel+recipient is permanently suppressed (e.g., re-delivery flows).
- **Remediation:** HARDEN (idempotency keys; dedup scoped to open messages only).

## DATA-6 · Queue semantics (P2)
- Claim uses `FOR UPDATE SKIP LOCKED` single-statement UPDATE→running with heartbeat guard — sound. Sweeper fails running rows with heartbeat >180 s and pending rows older than 30 min — pending work is **failed, not requeued** (accepted audits die silently if workers saturate).
- Admission control (`check_admission`, MAX_RUNNING=2/MAX_PENDING=8, `audit_db.py:32-38,126-139`) is **dead code** — no route calls it; only rate limiting bounds intake.
- Current state healthy: 0 pending, 0 running; historical failure share 112/568 ≈ 19.7%.
- **Remediation:** HARDEN (wire admission control; decide requeue policy).

## DATA-7 · Unbounded/expensive queries (P3)
- Funnel/SLO queries scan full ledger with correlated NOT EXISTS subqueries (`app/lib/funnel-ledger.ts:647-750`) — fine at 4.7k rows, will degrade linearly; `/api/analytics/funnel-report` exposure should be checked for auth (route exists; report endpoint class reviewed as internal).
- CRM weekly-review aggregates unbounded date ranges.
- **Remediation:** INVESTIGATE + add time-bounds defaults when volume grows.

## DATA-8 · Timestamp/timezone hygiene (P3)
- Naive `datetime.utcnow()` in followup selection (`services/followup_emails.py:41`) vs timestamptz columns elsewhere; mixed semantics invite off-by-DST bugs.
