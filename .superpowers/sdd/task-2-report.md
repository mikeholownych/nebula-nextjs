# Task 2 report — Phase 2 Architectural boundaries

**Status:** DONE
**Branch:** `feat/enterprise-refactor`
**Worktree:** `/home/mike/nebula/.worktrees/enterprise-refactor`
**Commit:** `7b2e9e0e` — `fix(bff): stop dual writers and bound quota to audit DB`
**Review-fix:** Phase 2 required findings — start_api `:8001`, checkout 410 stub, CRM non-2xx + retry recovery

## What you implemented

1. **Quota.** `checkAuditQuota` still resolves plan from `nebula_platform` subscriptions, then counts **completed** audits this UTC month from **nebula_audit** via FastAPI `GET /audit/quota`. It no longer queries platform `audits`. FastAPI `audit_db.count_completed_this_month` filters `status = 'completed'`. Fail-open if FastAPI is down.

2. **Money writer.** Next `POST /api/webhooks/stripe` remains the only writer to `nebula_platform.purchases`. `purchases.audit_url` is set from Stripe `metadata.url` or FastAPI `GET /audit/{id}`, not `SELECT url FROM audits` on the platform DB.

3. **Checkout metadata.** Portal `POST /api/checkout` now copies the audited URL into `metadata[url]` so the webhook can persist it without a platform-audits subquery.

4. **CRM path.** After portal persist, Next calls FastAPI `POST /api/crm/purchase-completed` with `Authorization: Bearer ${INTERNAL_API_SECRET}`. The hook updates CRM (`trigger_delivery=False`). FastAPI `/api/stripe/webhook` stays fail-closed from Phase 1 and no longer delivers kits.

5. **FastAPI checkout.** `POST /api/checkout` is a **410 stub** (commented as unused; portal BFF owns checkout). Not deleted.

6. **One pg Pool.** `app/lib/email-service.ts` imports `pool` from `app/lib/db.ts`; duplicate `Pool` constructor removed.

7. **Rate limit / request identity.** Portal `POST /api/audit/start` (and `/api/audit/run`) forwards `X-Request-ID`, visitor `X-Forwarded-For`, and `X-Audit-Email`. FastAPI `/audit/run` keys by visitor IP + email; loopback hops in XFF are skipped.

8. **`PLATFORM_API_URL` default.** `http://127.0.0.1:8001` in dispatch/verify, start/quota, FastAPI `PORT`, README, and `scripts/weekly_dispatch.sh`. `:8769` leftovers in those paths removed.

Did **not** start Phase 3–8. Did **not** deploy or restart production.

## What you tested and test results

| Command | Result |
|---|---|
| Jest focused suite **before** implementation | **RED** — 12 failed, 30 passed |
| `cd customer-portal && npm test -- --runInBand --watchAll=false --forceExit` quota, start headers, 8001 default, checkout binding, stripe webhook, start timeout/malformed **after** | **GREEN** — 7 suites, 48 passed |
| `pytest` rate-limit identifier, checkout 410, CRM hook, audit quota, stripe fail-closed **after** | **GREEN** — 9 passed |
| production-safety (email-service import surface) | **GREEN** — 38 passed |
| Full `npm run ci` | Not run (not required) |

## TDD Evidence (RED then GREEN)

Tests written first. Representative RED:

```
FAIL __tests__/audit-quota.test.ts
  ✕ blocks a free-tier email that has already used 1 audit this month (allowed true)
  ✕ counts completed audits via FastAPI, not platform audits rows (FROM audits)

FAIL __tests__/checkout-audit-binding.test.ts
  ✕ metadata[url] expected https://example.com/landing, received null

FAIL __tests__/audit-start-forward-headers.test.ts
  ✕ X-Request-ID not forwarded (null)

FAIL __tests__/platform-api-url-default.test.ts
  ✕ dispatch/verify still default to :8769; email-service still constructs Pool

FAIL __tests__/stripe-webhook-fulfillment-gate.test.ts
  ✕ delivered UPDATE still subqueries FROM audits
  ✕ no GET /audit/{id} fallback
  ✕ no CRM HTTP call

FAILED tests/platform_api/test_rate_limit_identifier.py (email not in key; 127.0.0.1 collapsed)
FAILED tests/platform_api/test_checkout_gone.py (200 == 410)
FAILED tests/platform_api/test_crm_purchase_hook.py (404; purchase_completed missing)
FAILED tests/platform_api/test_audit_quota.py (count_completed_this_month missing)
```

GREEN after implementation:

```
Test Suites: 7 passed, 7 total
Tests:       48 passed, 48 total

pytest: 9 passed
```

## Files changed

Portal: `audit-quota.ts`, `email-service.ts`, `audit/start`, `audit/run`, `checkout`, `webhooks/stripe`, workspace dispatch/verify, README.

FastAPI: `audit_db.count_completed_this_month`, `GET /audit/quota`, `POST /api/crm/purchase-completed`, checkout 410, stripe webhook no kit delivery, rate-limit identifier, `config.PORT=8001`.

Tests as listed above.

Not committed: `customer-portal/node_modules`, `.superpowers/sdd/progress.md`, this report.

## Self-review findings

- FastAPI `GET /audit/quota` is unauthenticated on loopback, same as `GET /audit/{id}` (Phase 1 leftover / Phase 3+).
- CRM HTTP is fail-silent: missing `INTERNAL_API_SECRET` still returns Stripe 200 after persist. Production must have that secret for CRM to move.
- FastAPI `/api/stripe/webhook` remains mounted and fail-closed. If Stripe still posts there, CRM can dual-upsert (idempotent); kit delivery will not dual-run.
- Several portal routes still default `http://localhost:8001` (same port, not 8769). Not changed outside the listed leftovers.

## Concerns

1. Confirm Stripe dashboard has **one** webhook URL (`https://nebulacomponents.com/api/webhooks/stripe`). Not verified here (no production mutation).
2. Set `INTERNAL_API_SECRET` on both Next and FastAPI or CRM projection will skip.
3. Quota now counts **completed** audits only; a failed free-tier run does not consume the monthly slot (binding).
4. Jest open-handle warning from start-route tests hitting the real pool (pre-existing pattern).

## Review fixes (required)

1. `scripts/start_api.sh` listens on `127.0.0.1:8001`. Leftover scan now fails if any `scripts/**/*.sh` contains `:8769` or `--port 8769`.
2. `platform_api/routes/checkout.py` is a body-free 410 stub: no Stripe client, no `.shop` URLs, no `CheckoutRequest`.
3. Portal CRM notify logs non-2xx bodies. Already-delivered Stripe retries call CRM again so a post-persist CRM miss can recover. Fire-and-forget-without-ok-check is no longer the only path.

### Re-run covering tests

```
cd customer-portal && npm test -- --runInBand --watchAll=false --forceExit \
  __tests__/audit-quota.test.ts \
  __tests__/platform-api-url-default.test.ts \
  __tests__/stripe-webhook-fulfillment-gate.test.ts
```

```
PASS __tests__/stripe-webhook-fulfillment-gate.test.ts
PASS __tests__/audit-quota.test.ts
PASS __tests__/platform-api-url-default.test.ts

Test Suites: 3 passed, 3 total
Tests:       39 passed, 39 total
```

```
PYTHONPATH=/home/mike/nebula/.worktrees/enterprise-refactor \
  /home/mike/nebula/venv/bin/python3 -m pytest \
  tests/platform_api/test_checkout_gone.py \
  tests/platform_api/test_crm_purchase_hook.py \
  tests/platform_api/test_audit_quota.py \
  tests/platform_api/test_rate_limit_identifier.py \
  tests/platform_api/test_stripe_webhook_fail_closed.py -q
```

```
tests/platform_api/test_checkout_gone.py ...                             [ 27%]
tests/platform_api/test_crm_purchase_hook.py ...                         [ 54%]
tests/platform_api/test_audit_quota.py ..                                [ 72%]
tests/platform_api/test_rate_limit_identifier.py ..                      [ 90%]
tests/platform_api/test_stripe_webhook_fail_closed.py .                  [100%]

============================== 11 passed in 0.43s ==============================
```

Did **not** start Phase 3. Did **not** deploy.
