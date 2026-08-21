# Wave 1 Report — Correctness & Authority

Deployed: commit `ebf5d078` (API + Next), full suites green (pytest 105, jest 729), rehearsal-gated deploy passed.

| Finding | Fix | Validation |
| --- | --- | --- |
| SEC-P1-2 + CODE-4 | Per-session Redis keys w/ own TTL; verify enforces live membership | test_session_enforcement.py ×4 (logout deny, flush-deny, no-TTL-extension, revoke-all) |
| SEC-P1-3 | AES-256-GCM secret box; GSC tokens encrypted at rest; lazy legacy migration | test_secret_box.py ×5 (roundtrip, passthrough, nonce freshness, tamper, empty) |
| DATA-4 | config.py `_dsn` authority; prod fail-fast; 9 modules de-hardcoded | grep clean; prod boot validated post-deploy (readyz 200) |
| SEC-P1-4 / TD-9 | hermes scraping removed (OPENROUTER now drop-in var); GA4 ID defaults removed ×3 | code review + import tests |
| CODE-1 | `?? 0` nullish handling for amounts/currency in webhook ledger+GA4+HeyCatch paths | typecheck; falsy-zero unit surface covered by existing webhook tests |
| CODE-2 | Unbound subscription → durable ops alert via internal outbox API | typecheck; alert path fail-open-safe |
| CODE-3 | CRM upgrade-only lifecycle; objections logged without downgrade | crm_hooks edit; existing suite green |
| DATA-1 (step 1) | welcome/first-value workers repointed to platform subscriptions authority | scripts updated; physical duplicate-table removal deferred to Wave 3 migration runner |

Residual: DATA-1 completion requires tracked-migration runner (Wave 3) to snapshot+drop `nebula_audit.{subscriptions,purchases,analytics_event_ledger}` dead copies.
