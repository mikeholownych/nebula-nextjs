# Wave 3 Report — State & Data Integrity
Deployed: `6712169b` + follow-ups. pytest 112→116 green; live deploy verified.

| Finding | Fix | Validation |
| --- | --- | --- |
| DATA-2/FM-11 | `platform_api/scripts/migrate.py`: tracked runner (schema_migrations ledger, checksum drift detection, baseline adoption, dry-run, dollar-quote-aware txn normalization). Legacy queue baselined; fresh-host apply proven against restored backup | restore rehearsal + full apply of all 10 migrations on throwaway DB |
| DATA-1 step 2 | Dead duplicate authorities archived+dropped in nebula_audit (subscriptions/purchases/analytics_event_ledger/monitored_pages/monitoring_events); rows snapshotted to backups/ first | post-migration schema verified live |
| DATA-3 | audits lifecycle timestamps → timestamptz (UTC); outbox status CHECK | information_schema verified |
| DATA-6 | Admission control wired into /audit/accept (429+Retry-After); sweeper requeues stale RUNNING once (requeue_attempts) before terminal failure | test_accept_returns_429_when_queue_full + rewritten sweep tests |
| CODE-8 | Canonical offer module with 2027-01-01 rollover + env overrides; $97 literals removed from email/follow-up templates | test_offer_rollover.py ×4 incl. source-level anti-regression |
| DATA-5 | Badge/cohort side-effect failures logged w/ audit id (no longer silent swallows) | suite green |

Residual closed by design: platform DB needs no Wave-3 migration (already authority).
