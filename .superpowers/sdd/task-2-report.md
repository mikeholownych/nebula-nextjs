# Task 2 Report: Agency price reconciliation and billing parity fixture

**Status:** DONE
**Branch:** feat/billing-entitlements
**Commit:** ec466bf18 — `feat: agency price reconciliation and billing parity fixture`
**Date:** 2026-08-23

## What was done

1. **Created `scripts/stripe_reconcile_agency.py`** exactly per brief (stdlib-only urllib client; reads `STRIPE_SECRET_KEY` from env only; never prints it).
2. **Ran it against LIVE Stripe** via `source $HOME/.hermes/.env` + `uv run`:
   - Idempotent lookup found no existing active $49700/mo USD price under `prod_V0miqtrSEnPtiC`, so it created one.
   - **New Agency monthly price: `price_1U7eY8EINR1kU9chLslsSug3`** ($497/mo USD).
   - Deactivated legacy prices: `price_1U0l9CEINR1kU9chAZGBoJHS` ($199/mo) and `price_1U0l9CEINR1kU9chITjlRF0H` ($1990/yr) — no warnings on stderr.
3. **Updated `customer-portal/app/lib/subscription-plans.ts` agency block:** `monthlyUsd: 497`, `annualUsd: null`, `stripe.monthlyPrice = 'price_1U7eY8EINR1kU9chLslsSug3'`, `stripe.annualPrice = null`. Pro/growth blocks left untouched.
4. **Created `tests/billing_fixtures/plan_limits.json`** verbatim per brief (free/pro/growth/agency limits; JSON parses, all four keys present).

## Verification evidence (all commands actually ran)

- Reconcile script exit code: **0**, printed one `price_...` id to stdout.
- Live Stripe GET on new price: `unit_amount == 49700`, `livemode == true` → `confirmed $497 live`.
- Legacy price re-check via live API: both report `active= False`.
- `cd customer-portal && npx tsc --noEmit`: clean, zero errors.
- Node config check per brief Step 3: asserts file contains `497`, pro monthly id `price_1U0l9AEINR1kU9chtiA64BKd`, growth monthly id `price_1U0l9BEINR1kU9chHMT77i8i` → `config ok`.
- Fixture JSON parse check → `fixture ok ['agency', 'free', 'growth', 'pro']`.
- Commit scope verified via `git show --stat`: exactly 3 files (script +57 lines, fixture +6, subscription-plans.ts ±8). Not pushed.

## Incident note

The first attempt at editing `subscription-plans.ts` silently did not apply (file mtime unchanged); caught because the brief's node check failed with `missing 497`. Re-applied the edit and re-ran full verification. No partial state was ever committed or deployed.

## Secrets handling

`STRIPE_SECRET_KEY` sourced from `$HOME/.hermes/.env` in-memory only; never echoed, logged, staged, or written to any file. All outputs in this report are key-free.

## Blast radius

No deploy performed (TS config change is not yet live; deploy/restart is out of this task's scope). Downstream consumers of `subscription-plans.ts` compile cleanly (`tsc --noEmit`). Fixture is additive; Tasks 3 and 7 consume it.
