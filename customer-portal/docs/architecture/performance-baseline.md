# Performance Baseline

**Captured:** 2026-08-20, origin `http://127.0.0.1:3000` (production `nebula-nextjs.service`) and `http://127.0.0.1:8001`.
**Method:** `curl` timing, HTML/JS/CSS byte counts, Postgres `\dt` + `pg_stat_user_tables`, `ps` RSS, live ledger counts. **No synthetic audits were submitted** (would mutate production `audits` / ledger).
**Uncertainty:** these are origin measurements, not multi-region field CrUX. They are **not** p95 of real users. Gzip/brotli on the wire is on (`next.config.ts` `compress: true`); sizes below are **uncompressed** origin bodies.

Do not treat a single average as production performance.

---

## 1. Environment

| Item | Value |
|---|---|
| Next | `next-server (v16.2.11)` pid 738227, RSS **186 MB**, `NODE_OPTIONS=--max-old-space-size=4096` |
| FastAPI | uvicorn **1 worker** pid 699299, RSS **141 MB**, `MemoryMax=2G` |
| Postgres | :5433, `shared_buffers=128MB`, `max_connections=100`, `statement_timeout=0` |
| Redis | :6379 local |
| Traffic | 6 completed audits / 24h; 51 / 7d; 1 live delivered purchase |

---

## 2. Page load (origin, cache HIT)

| URL | HTTP | TTFB (s) | Total (s) | Body bytes | Notes |
|---|---|---|---|---|---|
| `/` | 200 | 0.015 | 0.016 | 188,416 | `x-nextjs-cache: HIT`, prerender, `s-maxage=300` |
| `/audit` | 200 | 0.011 | 0.011 | 157,332 | same |
| `/pricing` | 200 | 0.011 | 0.011 | 173,058 | same |
| `/api/build-info` | 200 | 0.009 | — | JSON | `Cache-Control: no-store`; revision `389068bd…` |
| `/api/audit/stats` | 200 | 0.033 | 0.033 | `{"completed_audits":150,"avg_score":null}` | hits FastAPI/DB |
| `/healthz` (API) | 200 | <0.05 | — | liveness | |
| `/health/deep` | 200 | — | — | Redis+PG ok; last_audit **warning** (stale >1h at capture) | always HTTP 200 |
| `/readyz` | 200 | — | — | config only | |
| Next `/healthz` | 404 | — | — | **does not exist** | |

HTML `X-Nebula-Revision` on `/` was `419eae81…` — **not** the JSON revision. That is a provenance defect, not a latency defect.

### Homepage transfer (uncompressed, listed `<script>` + CSS)

| Asset class | Bytes |
|---|---|
| HTML | 188,416 |
| JS (14 chunks) | **940,872** |
| CSS (1 chunk) | 100,373 |
| **Sum of measured first-load origin assets** | **1,229,661** |

Largest JS chunks: 238 KB, 232 KB, 142 KB, 113 KB. This is the **dominant frontend cost**. Origin TTFB is not.

Lighthouse CI (`lighthouserc.cjs`) gates desktop median performance ≥0.9 / LCP ≤2.5s / CLS ≤0.1 / TBT ≤200ms on **four editorial routes only**. Homepage, `/audit`, and `/checkout` are **not** in the lab set. Those scores were **not** re-run in this assessment (would require a second `next start` on :3102). Treat lab gates as **coverage of the wrong pages**, not as evidence the funnel is fast.

---

## 3. API / engine latency (not load-tested)

| Path | Bound | Observed / inferred |
|---|---|---|
| `POST /api/audit/start` | `AbortSignal.timeout(120000)` then FastAPI `subprocess.run(..., timeout=120)` | User-visible wait **until the CLI finishes**. Nested 120s+120s. Event loop blocked for the duration. |
| `POST /api/audit/run` (x402) | **no timeout** on the Next fetch | Can hang a Node worker |
| `POST /api/checkout` | 10s audit lookup + Stripe | Serial PG + Stripe. Fine at current volume. |
| `POST /api/webhooks/stripe` | 120s `deliver_prompt_pack.py` + 15s Telegram **before** 200 | Stripe retry budget at risk |
| `GET /api/audit/stats` | — | p≈33 ms origin (n=1) |
| FastAPI `/audit/run` rate limit | 5/min on 127.0.0.1 | First admission bottleneck under burst |

**No p50/p95/p99 for `/audit/run`** was collected. Doing so requires submitting audits against production. Historical table: 180 completed, 31 failed all-time; 2026-08-20 ledger `audit_started=195` vs `audits.completed=6` implies most start attempts never produce a completed row (timeouts, 429s, HTTP-200 errors swallowed, bots).

---

## 4. Database

| Fact | Value |
|---|---|
| `nebula_platform.analytics_event_ledger` | 2,037 live tuples, 2.5 MB |
| `nebula_audit.audits` | 211 live / 85 dead, 784 KB |
| `nebula_platform.purchases` | 1 delivered live |
| Active connections at sample | 4 idle platform + 1 idle audit |
| Unbounded queries in code | `get_benchmarks` loads all completed findings JSON; funnel SLO anti-joins; `get_due_monitors` no LIMIT |
| Indexes on ledger | `occurred_at`, `(event_name,occurred_at)`, journey/audit/session partials, `dedup_key` unique |

At current size, **Postgres is not the bottleneck**. Missing indexes are not justified until a specific query is slow. Do not add Redis as a query cache.

---

## 5. Bottlenecks ranked by evidence

1. **Audit execution model** — sync CLI on the only FastAPI event loop, 120s occupancy, 5/min global. Dominates user latency and 10× burst failure.
2. **Frontend JS on the default shell** — ~941 KB JS on `/` plus HeyCatch/Searchable/RB2B/PostHog recording. Dominates LCP/INP after TTFB.
3. **Results waterfall** — 70 KB client module + workspace-gated JSON after SSR shell. Dominates report view.
4. **Webhook synchronous Python** — 120s inside Stripe’s HTTP request. Dominates payment-ack latency, not page load.
5. **Duplicate PG pools and serial ledger writes** — measurable but small vs (1)–(3).

---

## 6. Proposed targets (after refactor, not before)

Set from this workload (founders, not hyperscale):

| Metric | Current | Target |
|---|---|---|
| Interactive API p95 (auth, stats, checkout session create, report GET) | unmeasured; checkout is seconds | **< 250 ms** origin excluding Stripe |
| Interactive API p99 | unmeasured | **< 750 ms** |
| Audit **accept** (persist pending, return `audit_id`) p95 | today coupled to full run (seconds–120s) | **< 300 ms** |
| Audit **complete** p95 | CLI + PageSpeed; unmeasured | **< 15 s** for HTML-only scoring; Lighthouse/PageSpeed **off** the request |
| Homepage JS transferred (uncompressed listed scripts) | 941 KB | **< 250 KB** first load |
| Homepage HTML | 188 KB | **< 80 KB** |
| Origin TTFB cached HTML | 11–15 ms | KEEP |
| Concurrent in-flight audits | unbounded, serialized | **explicit cap** (start at 2) with 429 + ledger `rate_limited` |
| Postgres primary interactive query p95 | unmeasured; tables tiny | **< 100 ms**; add `statement_timeout` |
| Stripe webhook HTTP time | up to 120s | **< 2 s** persist+ack; fulfillment drained in-process |

Acceptance: measure with the same `curl` method plus a **staging** k6/hey burst of 20 concurrent starts. Do not claim improvement from production intuition.

---

## 7. What was not measured

- Field LCP/INP/CLS (no CrUX pull in this pass).
- Gzip ratio on the wire through Cloudflare.
- CPU during `deliver_audit.py`.
- Memory during concurrent Playwright screenshots.
- Stripe p95 (external).

Those belong in Phase 0 instrumentation, not in fabricated tables.
