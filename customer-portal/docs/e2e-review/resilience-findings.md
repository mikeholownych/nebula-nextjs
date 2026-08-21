# Resilience Findings

## RES-1 · Money-path external call without timeout (P1)
- `app/api/checkout/route.ts:183-190`: Stripe session creation via raw fetch with **no AbortSignal** (contrast: audit lookup at :94 uses 10 s). A hung TLS connection pins the request; Stripe-side retry storms compound it.
- Webhook handler performs many sequential awaits before acking (fulfillment enqueue, CRM notify, ledger write, GA4 MP fetch without timeout at :323, PostHog flush, HeyCatch) — any slow dependency extends webhook latency toward Stripe's timeout, triggering redelivery storms against an advisory lock.
- **Remediation:** HARDEN (timeouts everywhere; move analytics post-ack via outbox/task).

## RES-2 · Outbox exactly-once is not claimed anywhere (P1)
- Documented behavior: at-least-once with lease-based resend (`infra/outbox.py:74-153`); no provider idempotency key on `email` channel; kit_send subprocess receives stripe-session-id and downstream script is idempotent by session — the only true dedup lives outside this repo.
- Crash windows: (a) after SendGrid 2xx before `sent` update ⇒ duplicate email; (b) claim committed then process death ⇒ 15-min delay then resend (acceptable); (c) terminal failure at attempts≥3 marks purchase `failed` — recovery path exists only via webhook replay.
- **Remediation:** HARDEN (idempotency keys + document at-least-once contract).

## RES-3 · Connection budget exceeds server capacity (P2)
- Pools: SQLAlchemy 10+20 overflow; audit_db 10; CRM 5; analytics 5; AB 3; alerts 3; **per-request pools** in lead_scoring (`services/lead_scoring.py:91-92`) and newsletter_events (`routes/newsletter_events.py:115-172`); raw per-message connect for fulfillment (`outbox.py:238-244`). Aggregate ceiling >100 vs `max_connections=100`, shared with docker/honcho clients on the same instance.
- **Failure mode:** connection exhaustion under burst; per-request pool churn adds latency (TLS/session setup) precisely when load is high.
- **Remediation:** REFACTOR to shared pools + explicit global budget.

## RES-4 · Audit worker starvation vs sweeper race (P2)
- Heartbeat every 15 s from an asyncio task in the same event loop that serves `/audit/run` pollers (0.25 s DB poll per waiter, up to 120 s) plus monitor run-due loops. Event-loop stall >180 s ⇒ sweeper fails live audits (`audit_runner.py:231-241`). No isolation between serving and working loops.
- **Remediation:** HARDEN (separate process/thread for runner or push-based wait).

## RES-5 · Fire-and-forget side effects lost on crash (P2)
- Auto result email spawned via `asyncio.create_task(_auto_send_email)` post-completion (`routes/audit_api.py:345`) — no persistence/retry; crash ⇒ customer never emailed though audit completed. Same pattern for CRM/n8n tasks (:234,254).
- **Remediation:** REPLACE with outbox rows.

## RES-6 · Health/readiness semantics (P2)
- Next `/api/healthz` `{status:ok}` static liveness (good); `/api/readyz` returns ready — verified live; FastAPI `/health/deep` checks Redis+Postgres+last_audit (bounded, no scoring invocation) — good. Gap: platform-api production readiness gate runs only inside `/readyz`, not at startup (`main.py:227-241`) — a misconfigured prod boot serves traffic until first readiness probe; ENVIRONMENT defaults to development so gate is inert today (ties to SEC-P0-1).
- **Remediation:** CONFIGURE (fail-fast startup validation when ENVIRONMENT=production).

## RES-7 · Failure-mode table (condensed; full detail in failure-mode-analysis.md)

| Failure | Current behavior | Desired | Evidence | Risk |
| --- | --- | --- | --- | --- |
| Postgres down | FastAPI deep-health reports; Next pg Pool has no connectionTimeoutMillis ⇒ requests queue indefinitely | bounded 503 | `app/lib/db.ts:10-16` | P1 |
| Redis down | rate limits fail-open on PUBLIC_READ/WEBHOOK but fail-closed AUTH/EMAIL/CHECKOUT/EXPENSIVE_WORK ⇒ checkout/auth outage; JWT verify needs blacklist read | degrade gracefully w/ bounded local fallback for all classes | `rate_limit.py:370-400` | P1 |
| Worker crash mid-audit | heartbeat stops → sweeper fails row as stale_heartbeat (terminal, no requeue) | requeue N times | `audit_db.py:225-252` | P2 |
| Audit target slow | engine fetch 15 s ×redirects ≤6, score timeout 120 s → failed(timeout) | acceptable; user sees failed state | `deliver_audit.py:186`, `audit_runner.py:124-127` | P3 |
| Stripe duplicate delivery | advisory lock + delivered-status short-circuit + ON CONFLICT — solid | — | `webhooks/stripe/route.ts:147-263` | low |
| Email provider down | outbox retries [1,5,30] min then failed + purchase failed | dead-letter alert exists? sale alert only on success | `outbox.py:130-150` | P2 |
| Disk pressure | 42% used; build trees churn ~1 GB/deploy | retention policy | INF-7 | P3 |
| Memory pressure | nextjs uncapped cgroup; jest orphan ~1 GB | MemoryMax both services | INF-3/INF-4 | P2 |
| Stale deployment | observed HEAD≠prod pre-deploy window; deploy script verifies revision coherence | deploy on merge or explicit promote | runtime-topology.md | P3 |
| Migration mismatch | manual SQL application; operator-order guard probes accept route only | tracked migrations | DATA-2 | P1 |
| Queue backlog | admission control unwired; pending ages into failed | bounded intake + Retry-After | DATA-6 | P2 |
| Tunnel down | cron liveliness check */5 + alert state files; auto-restart of cloudflared Restart=always | fine | crontab, unit | P3 |

## RES-8 · Rate limiting inventory (P2 summary)
- FastAPI: GCRA in Redis, per-class policies with mixed fail modes (fail-open PUBLIC_READ/WEBHOOK/INTERNAL; fail-closed AUTH/EMAIL/CHECKOUT/EXPENSIVE_WORK; degraded-local INTERACTIVE_WRITE), identity = hash(IP|bearer|email|api-key) — anonymous classes keyed on client-spoofable headers (SEC-P1-1). WEBHOOK class fail-open with generous cap is deliberate (Stripe retries must succeed).
- Next.js: no shared limiter found on API routes; protection delegated to FastAPI classes or none (e.g., `/api/analytics` unlimited — SEC-P2-4).
- No Retry-After emission observed in limiter paths reviewed.
