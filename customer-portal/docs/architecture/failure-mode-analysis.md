# Failure-Mode Analysis

**Assessment date:** 2026-08-20
Classification: fail-open / fail-closed / fail-degraded / retryable / non-retryable.

Where current behavior was not exercised live, it is marked **inferred from code**. Live checks are marked **observed**.

---

## 1. Matrix

| Failure | Probability | Impact | Detectability | Current behavior | Desired | Recovery |
|---|---|---|---|---|---|---|
| Database unavailable | Low | Total write failure | High (pool errors) | Portal 500; FastAPI 500; `/health/deep` JSON degraded but **HTTP 200**. Next has no readiness. **Fail-closed** on writes. | Fail-closed 503; Next readiness fails; traffic stops | systemd restart; do not serve stale commerce |
| DB latency spike | Medium | Request pile-up | Low (no query metrics) | `statement_timeout=0` → workers block. **Fail-degraded** into stalls. | Statement timeout; 504; no unbounded wait | Kill long queries; cap pools |
| Connection pool exhaustion | Medium if webhook lock leak (R09) or extra pools | New requests hang | Low | Two Next pools + SQLAlchemy overflow 20 + asyncpg. **Fail-degraded**. | One pool per process; fail 503 when exhausted | Restart process |
| Next.js restart | Medium (deploys, OOM 4GB cap) | In-flight audits/webhooks drop | Medium (systemd) | `Restart=on-failure`. In-flight Stripe webhook may 500 → Stripe retries (**retryable** if lock/release is fixed). Audit HTTP lost. | Durable pending audit + Stripe 500 retry | Startup sweeper already fails pending >5 min |
| Uvicorn crash mid-audit | Medium under load | Row stuck `pending` | Low | Startup: `UPDATE audits SET failed WHERE pending AND created_at < now()-5min` **observed in `main.py`**. Ledger may still say started. | Same + ledger `audit_failed` | Startup sweeper + ledger repair |
| Worker restart during `deliver_prompt_pack.py` | Medium | Paid, kit unsent | Medium (Stripe retry) | Status `processing`; Stripe 500; retry claims `processing` again. Script has session-id file ledger. **Retryable** if both gates hold. Early 500 **without release** is **not** safely retryable (R09). | Always release lock; fulfill from stored findings | Stripe redelivery |
| Malformed JSON | High (bots) | None | High | 400 + `audit_submission_rejected`. **Fail-closed**. **Observed** 160 rejected events. | KEEP | n/a |
| Oversized body | Medium | Memory | Low | FastAPI 413 if Content-Length set; Next funnel/start **unbounded**. **Fail-open** on omitted Content-Length. | Hard cap both | 413 |
| External audit target timeout | High | Audit fails | Medium | CLI timeout 120s → FastAPI **HTTP 200 status=error**. Portal may report completed. **Inappropriate success**. | 504 + `audit_failed` `fetch_timeout` + `audits.status=failed` | User retry (new attempt id) |
| External 429/500 from target site | High | Partial score | Medium | Scoring continues with failed signals (inferred). | Record per-signal fetch failure; still complete if HTML obtained | n/a |
| Stripe webhook duplicate | High (Stripe contract) | Double fulfill | High | Unique `stripe_session_id` + advisory lock + delivered short-circuit. **Good**. **Fail-closed** duplicate. | KEEP | Stripe stop |
| Stripe webhook out-of-order | Low | `review` stuck | Medium | First insert wins; cannot upgrade `review`→`pending`. | Allow upgrade when later event is canonical | Manual review |
| FastAPI Stripe webhook, empty secret | Low if loopback | Forged CRM | Low | **Fail-open** `return True`. | Fail-closed 503 | Disable endpoint |
| Partial deploy (Next new, API old) | High (portal deploy does not restart API) | Contract drift | Medium (SHA mismatch **observed**) | Three revisions live. | Atomic stamp; verify both SHAs | Restart both |
| Incompatible schema | Medium | Boot/query errors | Medium | Runtime ALTER hides missing columns. | Migrations before app | Roll forward |
| Stale Next instance | Medium | Old HTML/JS | High after 2026-07-26 | Verifier checks SHA + CSS 200. CDN `s-maxage=300`. | KEEP verifier; purge CF | Restart + purge |
| Corrupted cache | Low | Stale marketing | Medium | HTML s-maxage 300; `/api/build-info` no-store **KEEP**. Shared audit ISR 300s. | no-store for reports | Purge |
| Missing env | Medium | Half-up process | Low | API `ready()` does not require secrets. Next checkout 503 if no Stripe. **Inconsistent**. | Fail boot | Fix unit drop-in |
| Secret rotation | Medium | Auth/webhook outage | High | JWT invalid; Stripe 400. **Fail-closed** on Next webhook. | Dual-secret overlap window | Restart |
| Disk full | Low | Screenshots, logs, jsonl | Medium | `health-check.sh` disk >90%. Screenshots unbounded in `public/`. | Cap artifacts; rotate logs | Free disk |
| Memory pressure | Medium | OOM 137 historically | Medium | Next 4GB heap; API 2G. Concurrent Playwright unbounded. | Screenshot concurrency 1 | systemd restart |
| Redis down | Medium | Rate limit, magic links, JWT blacklist | Medium | Rate limit **fail-open**. Magic links fail. Verify still accepts unblacklisted JWT. | Fail-closed on auth issuance; fail-open on limiter for anonymous GETs only | Restart Redis |
| AgentMail down 1 min | Medium | Unlock email / kit delay | Medium | Unlock still sets cookie; kit webhook 500 → Stripe retry. | KEEP cookie; outbox for kit | Retry |
| AgentMail down 1 hour | Low | Stripe gives up retries | Medium | `purchases.failed`; paid unfilled. | Outbox + operator alert | Drain outbox |
| AgentMail down 1 day | Low | Same | High | Telegram/SRE may fire. | Same | Manual send from stored pack |
| PostHog/GA down | High | Analytics gap | Low | Swallowed. Ledger still writes. **Correct fail-degraded**. | KEEP | n/a |
| n8n down | Medium | content-extract skip | Low | `except: pass`. | KEEP | n/a |
| Playwright/screenshot fail | High | Missing visual | Low | Swallowed `None`. Audit still completes. **Fail-degraded**. | KEEP as non-blocking; log once | Retry job |
| Cloudflare tunnel down | Medium | Site dark | High | Cron `tunnel_liveliness_check` every 5m. | KEEP | Restart cloudflared |

---

## 2. Inappropriate fail-open (must change)

1. FastAPI Stripe webhook if `STRIPE_WEBHOOK_SECRET` empty.
2. Rate limiter on Redis error (`return True`) for **auth and audit** endpoints.
3. Unauthenticated writes: API keys, share-token mint, funnel ingest, audit email, v1/fixes without key.
4. Portal treating FastAPI HTTP 200 `status:"error"` as success.
5. Quota `checkAuditQuota` fail-open on DB error **and** querying the empty platform `audits` table.
6. Production `settings.ready()` without secrets.

---

## 3. Appropriate fail-closed / fail-degraded (KEEP)

- Next.js Stripe `constructEvent` (400 on bad sig).
- Checkout 503 if Stripe key or HTTPS site URL missing.
- SSRF `assertPublicHttpUrl` on `/api/audit/start`.
- RB2B / internal email processor / newsletter Svix without secret → 401/503.
- Analytics never blocks payment (PostHog/HeyCatch/GA in webhook).
- Unlock cookie verify returns null if `AUDIT_UNLOCK_SECRET` missing.
- Append-only ledger trigger.

---

## 4. Retry policy inventory

| Call | Timeout | Retry | Notes |
|---|---|---|---|
| Next → `/audit/run` | 120s | none | Timeout not ledgered |
| `deliver_audit.py` | 120s | none | HTTP 200 error body |
| Stripe session create | fetch default + 10s audit | none | |
| Stripe webhook → Python kit | 120s | **Stripe** retries on 500 | Correct *if* idempotent |
| AgentMail | 20s | outbox 1/5/30 min ×3 if used | Kit path is sync |
| PostHog | SDK | swallowed | |
| GSC | 10–30s | none | |
| Screenshot | 25s+15s | none | swallowed |
| n8n | 5s | none | swallowed |
| OpenRouter | 12s + circuit breaker | | |

**No infinite retries found.** Nested 120s timeouts exist (Next + CLI). Retry amplification exists only via Stripe redelivery of a leaked-lock webhook (R09).

---

## 5. Backpressure today

When work arrives faster than the engine:

1. Requests queue on the **single** uvicorn event loop.
2. Next aborts at 120s → user 500, **no** `audit_failed`.
3. Redis limiter may 429 the **proxy IP** at 5/min.
4. No queue depth metric. No admission control besides that 5/min.

Desired: persist `pending`, return 202, cap in-flight audits (2), 429 with `Retry-After` and ledger `rate_limited`, drain with a bounded process pool **in the same service**.

---

## 6. Transactional pairs

| Pair | Today | Risk |
|---|---|---|
| INSERT pending audit → CLI → UPDATE completed | Separate statements; crash leaves `pending` | Sweeper after 5 min |
| DB delivered → AgentMail already sent | Inverse: send then UPDATE; UPDATE fail resets `failed` | Duplicate send gated by session id |
| Payment succeeded → fulfillment | Webhook sync; 500 leaves `processing`/`failed` | Stripe retry |
| Ledger purchase_completed | After kit send | Paid-but-unfilled **absent** from funnel |
| Audit completed → screenshot | `create_task` | Missing image only |

No distributed transaction. Do **not** introduce sagas/Kafka. Use explicit state (`pending|processing|completed|failed|delivered`) plus idempotent retries.
