# Failure-Mode Analysis

| # | Failure | Current behavior (evidence) | Desired behavior | Risk |
| --- | --- | --- | --- | --- |
| FM-1 | Postgres unavailable (platform) | Next pg Pool: no connectionTimeoutMillis ⇒ requests hang awaiting client (`app/lib/db.ts`); FastAPI SQLAlchemy pool_timeout 10 s then 500s; readyz flips | Bounded 503 with Retry-After at edge; circuit-breaker page | P1 |
| FM-2 | Redis unavailable | Rate limiter per-class fail modes: AUTH/EMAIL/CHECKOUT/EXPENSIVE_WORK fail-closed ⇒ login+checkout outage; PUBLIC_READ/WEBHOOK fail-open; JWT verify requires blacklist read ⇒ auth outage if Redis lost (`rate_limit.py:370-400`, `jwt.py`) | Degrade to bounded local limiter for all classes; cached blacklist grace | P1 |
| FM-3 | Audit worker crash | Heartbeat ceases → sweeper marks failed(stale_heartbeat), terminal, no requeue; user sees failure; no auto-retry (`audit_db.py:225-252`) | Requeue ≤N with backoff before terminal | P2 |
| FM-4 | Audit target timeout/slow | fetch 15 s/hop ×≤6, score budget 120 s → failed(timeout); rate limiter caps intake; pending rows >30 min swept to failed (accepted work dies silently) | Bounded wait + explicit user comms + requeue policy | P2 |
| FM-5 | External API timeout (OpenRouter/Bedrock) | Circuit breaker 5-fail→open 30 s, deterministic fallback copy — resilient by design (`circuit_breaker.py`) | OK as-is | P3 |
| FM-6 | Stripe duplicate/redelivery | Advisory lock on session id + delivered short-circuit + ON CONFLICT(session_id) + processing reclaim — strongest path in system (`webhooks/stripe/route.ts:147-263`) | Maintain in tests (currently mocked-only, TEST-1) | low |
| FM-7 | Email provider down / SendGrid 5xx | Outbox retries [1,5,30] min → terminal failed + purchase marked failed; no idempotency key ⇒ possible duplicate send after crash-before-sent (`outbox.py:74-153`) | Idempotency key + dead-letter alert | P2 |
| FM-8 | Disk pressure | 42% used; ~1 GB churn/deploy from three build trees; logs to journal + scattered files | Retention policy for .next-previous & cron logs | P3 |
| FM-9 | Memory pressure | nextjs cgroup uncapped (4 GB heap option only); platform-api capped 2 G; stray jest ~1 GB RSS | MemoryMax both; keep dev off prod host | P2 |
| FM-10 | Stale deployment / mixed revision | Promote-on-demand; observed HEAD≠prod window pre-deploy; deploy script verifies coherence post-swap | Document promote cadence or automate on merge | P3 |
| FM-11 | Migration mismatch | Manual SQL application; operator-order guard probes one route only; no tracking table (`deploy_customer_portal.sh:44-49`) | Tracked runner + CI migration dry-run against fresh DB | P1 |
| FM-12 | Queue backlog | Admission control unwired; only EXPENSIVE_WORK GCRA bounds intake; backlog ages into failed rows | Wire check_admission; return 429+Retry-After; dashboard depth metric | P2 |
| FM-13 | Tunnel/process death | cloudflared Restart=always + */5 liveliness cron + alert state files; nextjs Restart=on-failure StartLimit 5/60 s | Adequate | P3 |
| FM-14 | Secret exposure (realized class) | SEC-P0-1/P0-2 as discovered live during review | Wave-0 containment items | P0 |

Cross-reference: resilience-findings.md RES-1..RES-8 for mechanism detail.
