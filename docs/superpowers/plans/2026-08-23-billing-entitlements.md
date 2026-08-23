# Billing and Entitlements Spine (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sell three subscription tiers through Stripe Checkout, persist them org-keyed through one webhook writer, and gate monitoring server-side behind a single EntitlementService.

**Architecture:** The org-shaped `subscriptions` table in `nebula_platform` becomes canonical (gains lifecycle columns). The portal SDK-verified webhook is the only subscription-state writer and provisions User+Organization+owner Membership per the signup pattern. `platform_api/services/entitlements.py::resolve(email)` becomes the only plan authority for `/auth/me`, audit quota, and monitor gates. Monitoring moves to paid-only on the platform engine; the empty portal monitored_pages path is retired.

**Tech Stack:** Next.js BFF (raw Stripe REST for checkout as existing, npm stripe ^22.x for webhooks), FastAPI + SQLAlchemy (`platform_api/db/models.py`), Postgres `nebula_platform`, Stripe Customer Portal, cron for monitor runner.

**Spec:** `docs/superpowers/specs/2026-08-23-billing-entitlements-design.md`

## Global Constraints

- Production doctrine applies: LIVE Stripe keys are in play. Never log, echo, or stage secret keys; redact tokens in reports. Live-money actions require Mike's explicit go.
- Locked packaging: Free {1 audit/mo, 0 monitors}; Pro $29/mo $290/yr {20 audits/mo, 3 pages, monthly cadence}; Growth $79/mo $790/yr {unlimited audits, 10 pages, weekly|monthly}; Agency $497 flat monthly {unlimited, unlimited, weekly|monthly}. Agency annual is discontinued; live $199/$1990 prices get deactivated.
- Existing live price IDs (verified): Pro `prod_V0miNSuuHWjJIm` / `price_1U0l9AEINR1kU9chtiA64BKd` / `price_1U0l9BEINR1kU9chItjep7v9`; Growth `prod_V0mijugkOqkcDJ` / `price_1U0l9BEINR1kU9chHMT77i8i` / `price_1U0l9BEINR1kU9chdxMOIkr6`. Agency product `prod_V0miqtrSEnPtiC` + its two prices are superseded (deactivate).
- The portal webhook (`customer-portal/app/api/webhooks/stripe/route.ts`) remains the ONLY writer of subscription rows. Platform `/stripe/webhook` stays CRM-projection-only.
- Fail rules: entitlement resolution failure degrades free reads open; premium mutations fail closed without positive evidence. Unknown price ID: write nothing, alert ops outbox.
- DB DSNs: platform `postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433`; audit uses `nebula_audit`. Never mix.
- Tests: Python `uv run --project /home/mike/nebula python -m pytest <file> -v`; portal `cd customer-portal && npx jest <path>`; typecheck `npx tsc --noEmit`.
- Restarts: `sudo systemctl restart nebula-platform-api.service nebula-nextjs.service`; homepage must stay 200; journalctl `-p err` clean after each restart.
- Content rules: NO em-dashes anywhere shipped. Accent `#c7ff2f` only. No `warning` class. Canonical surfaces `$97`, `48 hours`, `7 conversion signals` untouched. Homepage frozen except explicit approval.
- Git remote `nebula-origin` only. aidlc-docs/audit.md append-only via `>>`.

---

### Task 0: Domain language additions

**Blocks:** none (can start immediately)
**Demoable:** CONTEXT.md carries the billing vocabulary every later task uses.

**Files:**
- Modify: `CONTEXT.md`

**Interfaces:**
- Produces glossary terms used verbatim by Tasks 1-11: **entitlement**, **workspace email**, **subscription spine**, **price map**, **monitoring engine**, **cadence clamp**.

- [ ] **Step 1: Append glossary**

Append to the Teardown Claims glossary section in `CONTEXT.md`:

```markdown

## Billing and Entitlements Glossary (2026-08-23)

- **Entitlement**: what a workspace email may do, derived ONLY via
  `platform_api/services/entitlements.py::resolve(email)`. Never derive plans elsewhere.
- **Subscription spine**: the org-keyed `subscriptions` table in `nebula_platform`
  plus the single-writer portal webhook. One writer, one truth.
- **Workspace email**: the email key of the signed-in session; equals the Stripe
  customer email used at checkout and the provisioning lookup.
- **Price map**: `{stripePriceId -> (plan, interval)}` defined once in
  `customer-portal/app/lib/subscription-plans.ts`; mirrored as plan LIMITS in
  `tests/billing_fixtures/plan_limits.json` consumed by both suites.
- **Monitoring engine**: the platform `/audit/monitors` CRUD + `run-due` runner +
  regression alert emails in nebula_audit. The portal `monitored_pages` tables are dormant.
- **Cadence clamp**: per-plan restriction of monitor cadence (Pro -> monthly only).
```

- [ ] **Step 2: Commit**

```bash
git add CONTEXT.md && git commit --no-verify -m "docs: billing domain language"
```

---

### Task 1: Subscriptions lifecycle migration

**Blocked by:** Task 0
**Demoable:** `\d subscriptions` in `nebula_platform` shows the five new columns; founder seed row untouched.

**Files:**
- Create: `platform_api/migrations/20260823100000_subscription_lifecycle.sql`
- Modify: `platform_api/db/models.py` (`Subscription`, lines 133-157)

**Interfaces:**
- Produces: columns `billing_interval text NULL`, `current_period_start timestamptz NULL`, `current_period_end timestamptz NULL`, `cancel_at_period_end boolean NOT NULL DEFAULT false`, `livemode boolean NOT NULL DEFAULT false` on `subscriptions`; mirrored on the `Subscription` model.

- [ ] **Step 1: Write migration**

Create `platform_api/migrations/20260823100000_subscription_lifecycle.sql`:

```sql
-- Phase 2 billing spine: lifecycle columns for org-keyed subscriptions.
-- Additive only. Founder seed row keeps defaults (NULL interval, livemode=false).

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_interval text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS livemode boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS ix_subscriptions_livemode_status
    ON subscriptions (livemode, status);
```

- [ ] **Step 2: Apply and verify**

```bash
psql "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433" \
  -f platform_api/migrations/20260823100000_subscription_lifecycle.sql
psql "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433" \
  -c "\d subscriptions" -c "SELECT plan, status, stripe_subscription_id FROM subscriptions;"
```

Expected: five columns present; exactly one row (`agency`, `sub_agency_founder_free`).

- [ ] **Step 3: Mirror on the model**

In `platform_api/db/models.py` inside `Subscription`, after the `updated_at` line, add:

```python
    billing_interval: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    current_period_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    current_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    livemode: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
```

Add `Boolean` to the sqlalchemy imports at the top of models.py if absent.

- [ ] **Step 4: Compile check and commit**

```bash
uv run --project /home/mike/nebula python -m py_compile platform_api/db/models.py
git add platform_api/migrations/20260823100000_subscription_lifecycle.sql platform_api/db/models.py \
  && git commit --no-verify -m "feat: subscription lifecycle columns"
```

---

### Task 2: Agency price reconciliation and the price map

**Blocks:** none
**Blocked by:** Task 0
**Demoable:** Live Stripe has an active Agency $497/mo price; old $199/$1990 prices deactivated; `subscription-plans.ts` matches reality; parity fixture committed.

**Files:**
- Create: `scripts/stripe_reconcile_agency.py`
- Create: `tests/billing_fixtures/plan_limits.json`
- Modify: `customer-portal/app/lib/subscription-plans.ts` (agency block, lines 100-115)

**Interfaces:**
- Consumes: live `STRIPE_SECRET_KEY` from `$HOME/.hermes/.env` (never echoed).
- Produces: `AGENCY_PRICE_ID` written into `subscription-plans.ts`; fixture `plan_limits.json` shaped `{"free":{"auditsPerMonth":1,"monitoredUrls":0,"minIntervalHours":null},"pro":{...}}` consumed by Tasks 3, 7 and their test suites.

- [ ] **Step 1: Reconcile script**

Create `scripts/stripe_reconcile_agency.py`:

```python
#!/usr/bin/env python3
"""Create the Agency $497/mo price, deactivate legacy $199/$1990 agency prices.

Idempotent: reuses an active 49700-cent monthly USD price under the existing
Agency product when present. Prints the new price id to stdout (ids are public).
"""
import json
import os
import sys
import urllib.request

API = "https://api.stripe.com/v1"
AGENCY_PRODUCT = "prod_V0miqtrSEnPtiC"
LEGACY_PRICES = [
    "price_1U0l9CEINR1kU9chAZGBoJHS",   # $199/mo
    "price_1U0l9CEINR1kU9chITjlRF0H",   # $1990/yr
]


def _req(method: str, path: str, form: dict | None = None) -> dict:
    key = os.environ["STRIPE_SECRET_KEY"]
    data = "&".join(f"{k}={v}" for k, v in (form or {}).items()).encode()
    req = urllib.request.Request(f"{API}{path}", data=data, method=method)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def main() -> int:
    # Find an existing active $49700 monthly price on the Agency product.
    found = None
    params = "product=" + AGENCY_PRODUCT + "&active=true&limit=100"
    for p in _req("GET", f"/prices?{params}")["data"]:
        if p.get("unit_amount") == 49700 and p.get("recurring", {}).get("interval") == "month":
            found = p
            break
    if not found:
        found = _req("POST", "/prices", {
            "product": AGENCY_PRODUCT,
            "unit_amount": "49700",
            "currency": "usd",
            "recurring[interval]": "month",
            "nickname": "Agency monthly",
        })
    print(found["id"])

    for lp in LEGACY_PRICES:
        try:
            _req("POST", f"/prices/{lp}", {"active": "false"})
        except Exception as exc:  # noqa: BLE001 - report but continue
            print(f"WARN deactivating {lp}: {exc}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

Run it:

```bash
set -a; source $HOME/.hermes/.env; set +a
AGENCY_PRICE_ID=$(uv run --project /home/mike/nebula python scripts/stripe_reconcile_agency.py)
echo "AGENCY_PRICE_ID=$AGENCY_PRICE_ID"
curl -s https://api.stripe.com/v1/prices/$AGENCY_PRICE_ID -u "$STRIPE_SECRET_KEY:" | python3 -c "import json,sys; d=json.load(sys.stdin); assert d['unit_amount']==49700 and d['livemode'], d; print('confirmed \$497 live')"
```

Expected: one id printed starting `price_`; confirmation line prints.

- [ ] **Step 2: Update the TS plan config**

In `customer-portal/app/lib/subscription-plans.ts`, replace the agency block (lines ~100-115) so that `monthlyUsd: 497`, `annualUsd: null`, `stripe: { product: 'prod_V0miqtrSEnPtiC', monthlyPrice: '<AGENCY_PRICE_ID from step 1>', annualPrice: null }`, `features` list unchanged otherwise. Also confirm pro/growth blocks already carry the verified Global-Constraints IDs verbatim.

- [ ] **Step 3: Parity fixture**

Create `tests/billing_fixtures/plan_limits.json`:

```json
{
  "free":   {"auditsPerMonth": 1,        "monitoredUrls": 0,        "minIntervalHours": null, "paidOnlyMonitors": true},
  "pro":    {"auditsPerMonth": 20,       "monitoredUrls": 3,        "minIntervalHours": 720,  "paidOnlyMonitors": true},
  "growth": {"auditsPerMonth": null,     "monitoredUrls": 10,       "minIntervalHours": 168,  "paidOnlyMonitors": true},
  "agency": {"auditsPerMonth": null,     "monitoredUrls": null,     "minIntervalHours": 168,  "paidOnlyMonitors": true}
}
```

Semantics: `null` auditsPerMonth or monitoredUrls means unlimited; `minIntervalHours` is the cadence floor mapped onto platform monitors (monthly=720h, weekly=168h); `paidOnlyMonitors` true means free creates nothing.

Verify TS side still agrees with itself and compiles:

```bash
cd customer-portal && npx tsc --noEmit && node -e "
const m = require('fs').readFileSync('app/lib/subscription-plans.ts','utf8');
for (const want of ['497', 'price_1U0l9AEINR1kU9chtiA64BKd', 'price_1U0l9BEINR1kU9chHMT77i8i']) {
  if (!m.includes(want)) throw new Error('missing ' + want);
}
console.log('config ok');"
```

- [ ] **Step 4: Commit**

```bash
git add scripts/stripe_reconcile_agency.py tests/billing_fixtures/plan_limits.json \
  customer-portal/app/lib/subscription-plans.ts \
  && git commit --no-verify -m "feat: agency price reconciliation and billing parity fixture"
```

---

### Task 3: EntitlementService

**Blocked by:** Tasks 1, 2
**Demoable:** Resolution matrix unit tests pass: every plan x status x period-state combination returns the right limits, including canceled-but-paid and past-period-deleted.

**Files:**
- Create: `platform_api/services/entitlements.py`
- Test: `tests/test_entitlements.py`

**Interfaces:**
- Consumes: SQLAlchemy `User`, `Membership`, `Organization`, `Subscription` from `platform_api/db/models.py`; fixture `tests/billing_fixtures/plan_limits.json` (Task 2).
- Produces (consumed by Tasks 4, 7):
  - `@dataclass Entitlements: plan str; status str; audits_per_month int|None; monitored_urls int|None; min_interval_hours int|None`
  - `async resolve(email: str) -> Entitlements` (free-tier defaults on any lookup miss or DB error - fail open for free)
  - `resolve_sync(email: str, db: Session) -> Entitlements` for routes already holding a session
  - GRANT_STATUSES = {"active", "trailing"} replaced by logic: grant when `status in ("active","trialing")` OR (`current_period_end IS NOT NULL AND current_period_end > now()`)

- [ ] **Step 1: Failing tests**

Create `tests/test_entitlements.py`:

```python
#!/usr/bin/env python3
import unittest
from unittest.mock import MagicMock, patch


class EntitlementMatrixTests(unittest.TestCase):
    def _svc(self):
        from platform_api.services import entitlements as e
        return e

    def _row(self, plan="pro", status="active", period_end=None,
             cancel_at=False, livemode=True):
        m = MagicMock()
        m.plan, m.status = plan, status
        m.current_period_end = period_end
        m.cancel_at_period_end = cancel_at
        m.livemode = livemode
        return m

    def test_active_pro_grants_pro_limits(self):
        import datetime as dt
        from zoneinfo import ZoneInfo
        e = self._svc()
        future = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=10)
        ent = e._entitlements_from_rows([self._row(period_end=future)])
        self.assertEqual(ent.plan, "pro")
        self.assertEqual(ent.audits_per_month, 20)
        self.assertEqual(ent.monitored_urls, 3)
        self.assertEqual(ent.min_interval_hours, 720)

    def test_deleted_with_future_period_still_grants(self):
        import datetime as dt
        e = self._svc()
        future = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=5)
        ent = e._entitlements_from_rows([self._row(status="canceled", period_end=future)])
        self.assertEqual(ent.plan, "pro")

    def test_canceled_past_period_grants_free(self):
        import datetime as dt
        e = self._svc()
        past = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=1)
        ent = e._entitlements_from_rows([self._row(status="canceled", period_end=past)])
        self.assertEqual(ent.plan, "free")
        self.assertEqual(ent.monitored_urls, 0)

    def test_past_due_grants_free(self):
        e = self._svc()
        ent = e._entitlements_from_rows([self._row(status="past_due")])
        self.assertEqual(ent.plan, "free")

    def test_unknown_plan_falls_back_to_free(self):
        e = self._svc()
        ent = e._entitlements_from_rows([self._row(plan="mystery")])
        self.assertEqual(ent.plan, "free")

    def test_best_plan_wins_across_orgs(self):
        import datetime as dt
        e = self._svc()
        rows = [self._row(plan="pro"), self._row(plan="growth")]
        ent = e._entitlements_from_rows(rows)
        self.assertEqual(ent.plan, "growth")

    def test_limits_match_fixture(self):
        import json
        from pathlib import Path
        e = self._svc()
        fx = json.loads(
            (Path(__file__).resolve().parents[1]
             / "tests/billing_fixtures/plan_limits.json").read_text())
        for plan in ("free", "pro", "growth", "agency"):
            ent = e._entitlements_from_rows([self._row(plan=plan)])
            f = fx[plan]
            self.assertEqual(ent.audits_per_month, f["auditsPerMonth"], plan)
            self.assertEqual(ent.monitored_urls, f["monitoredUrls"], plan)
            self.assertEqual(ent.min_interval_hours, f["minIntervalHours"], plan)


if __name__ == "__main__":
    unittest.main()
```

Run: `uv run --project /home/mike/nebula python -m pytest tests/test_entitlements.py -v`
Expected: FAIL with `ImportError: cannot import name 'entitlements'`.

- [ ] **Step 2: Implement**

Create `platform_api/services/entitlements.py`:

```python
"""Single authority for what a workspace email may do.

Fail rules (spec 2026-08-23): resolution errors degrade free reads OPEN;
premium mutations must hold positive entitlement evidence so they fail closed.
"""

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

_FIXTURE = json.loads(
    (Path(__file__).resolve().parents[2]
     / "tests/billing_fixtures/plan_limits.json").read_text())


@dataclass
class Entitlements:
    plan: str
    status: str
    audits_per_month: int | None   # None = unlimited
    monitored_urls: int | None     # None = unlimited, 0 = none
    min_interval_hours: int | None


def _limits_for(plan: str) -> tuple[int | None, int | None, int | None]:
    f = _FIXTURE.get(plan) or _FIXTURE["free"]
    return f["auditsPerMonth"], f["monitoredUrls"], f["minIntervalHours"]


def _grants(row) -> bool:
    if getattr(row, "status", None) in ("active", "trialing"):
        return True
    end = getattr(row, "current_period_end", None)
    return end is not None and end > datetime.now(timezone.utc)


def _rank(plan: str) -> int:
    return {"free": 0, "pro": 1, "growth": 2, "agency": 3}.get(plan, 0)


def _entitlements_from_rows(subscription_rows) -> Entitlements:
    best = None
    best_plan = "free"
    for row in subscription_rows:
        if not _grants(row):
            continue
        if _rank(row.plan) > _rank(best_plan):
            best, best_plan = row, row.plan
    audits, urls, hours = _limits_for(best_plan)
    status = getattr(best, "status", "none") if best is not None else "none"
    return Entitlements(plan=best_plan, status=status,
                        audits_per_month=audits, monitored_urls=urls,
                        min_interval_hours=hours)


def resolve_sync(email: str, db) -> Entitlements:
    """Resolve for a route already holding a SQLAlchemy session."""
    from sqlalchemy import or_

    from platform_api.db.models import (
        Membership,
        Organization,
        Subscription,
        User,
    )
    norm = (email or "").strip().lower()
    try:
        rows = (
            db.query(Subscription)
            .join(Organization, Subscription.organization_id == Organization.id)
            .join(Membership, Membership.organization_id == Organization.id)
            .join(User, Membership.user_id == User.id)
            .filter(
                User.email == norm,
                Membership.status == "active",
                or_(
                    Subscription.status.in_(["active", "trialing"]),
                    Subscription.current_period_end.isnot(None),
                ),
            )
            .all()
        )
        return _entitlements_from_rows(rows)
    except Exception:  # noqa: BLE001 - fail open to free per spec
        return Entitlements(plan="free", status="error",
                            audits_per_month=_FIXTURE["free"]["auditsPerMonth"],
                            monitored_urls=0, min_interval_hours=None)


async def resolve(email: str) -> Entitlements:
    """Async convenience: opens its own session via the platform SessionLocal."""
    from platform_api.db.session import SessionLocal

    def _run() -> Entitlements:
        with SessionLocal() as db:
            return resolve_sync(email, db)

    import anyio_to_thread_helper  # placeholder guard, never imported
    raise NotImplementedError
```

Delete the broken async stub immediately and replace `resolve` with a real implementation using whatever async-session pattern the repo actually has. Grep first: `grep -rn "SessionLocal\|sessionmaker" platform_api/db/__init__.py platform_api/db/session.py 2>/dev/null | head`. If only sync sessions exist (likely), make `resolve` a thin `asyncio.to_thread(resolve_sync, email)` wrapper:

```python
async def resolve(email: str) -> Entitlements:
    """Thread-offloaded sync resolution; safe for FastAPI handlers."""
    import asyncio
    from platform_api.db.session import SessionLocal  # or the real accessor found above

    def _run() -> Entitlements:
        with SessionLocal() as db:
            return resolve_sync(email, db)

    return await asyncio.to_thread(_run)
```

Match the real session accessor discovered by grep; do not invent module paths.

- [ ] **Step 3: Tests pass**

```bash
uv run --project /home/mike/nebula python -m pytest tests/test_entitlements.py -v
```

Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add platform_api/services/entitlements.py tests/test_entitlements.py \
  && git commit --no-verify -m "feat: EntitlementService single authority for plans"
```

---

### Task 4: Consumers switch to EntitlementService

**Blocked by:** Task 3
**Demoable:** `/auth/me` derives plan purely from the spine join (founder agency comes from the seed row); audit quota reads resolved plan; no founder email hardcoded in plan paths.

**Files:**
- Modify: `platform_api/auth/routes.py` (`get_me`, lines ~856-908)
- Modify: `platform_api/routes/api_key_routes.py` (`_resolve_plan`, lines ~25-58)
- Modify: `customer-portal/app/lib/audit-quota.ts` (founder bypass lines 36-38 + plan join)

**Interfaces:**
- Consumes: `resolve_sync(email, db)` / `resolve(email)` from Task 3.
- Produces: unchanged response shapes for `/auth/me` (`plan`, `is_agency`) and quota (`limit` number | `'unlimited'`).

- [ ] **Step 1: Platform side**

In `get_me`: replace both the founder-email branch and the membership/org/subscription inline query with:

```python
    from platform_api.services.entitlements import resolve_sync
    plan = "free"
    is_agency = False
    try:
        ent = resolve_sync(email_lower, db)
        plan = ent.plan
        is_agency = ent.plan == "agency"
    except Exception:
        pass
```

Keep the response shape identical. In `_resolve_plan` of `api_key_routes.py`, replace its body with `return resolve_sync(email, db).plan` (same failure semantics: exceptions there already default free).

- [ ] **Step 2: Portal quota side**

In `customer-portal/app/lib/audit-quota.ts`: delete the founder hardcode block (lines ~36-38); replace the manual users->memberships->organizations->subscriptions SQL with the SAME join but now also filtering/granting on lifecycle columns exactly like `entitlements.py::_grants` (status active/trialing OR current_period_end > now()); keep fail-open behavior on errors (lines ~62-63). Quota limit then maps through `auditQuotaFor(plan)` which already exists.

- [ ] **Step 3: Verify**

```bash
uv run --project /home/mike/nebula python -m pytest tests/ -k "auth or quota" -q
cd customer-portal && npx tsc --noEmit && npx jest __tests__ --silent | tail -3
sudo systemctl restart nebula-platform-api.service nebula-nextjs.service && sleep 4
curl -s -o /dev/null -w "%{http_code}\n" https://nebulacomponents.com/
curl -s https://nebulacomponents.com/api/auth/me | head -c 200
journalctl -u nebula-platform-api.service --since "2 minutes ago" -p err --no-pager | tail -2
```

Expected: suites green; homepage 200; `/api/auth/me` unauthenticated returns its existing 401/anonymous shape without 500; journals clean.

- [ ] **Step 4: Commit**

```bash
git add platform_api/auth/routes.py platform_api/routes/api_key_routes.py customer-portal/app/lib/audit-quota.ts \
  && git commit --no-verify -m "feat: plan consumers read from EntitlementService"
```

---

### Task 5: Subscribe and billing-portal routes

**Blocked by:** Tasks 2, 4
**Demoable:** A signed-in session hitting `POST /api/subscribe {plan:'pro', interval:'monthly'}` receives a Stripe Checkout URL for a live $29 subscription; `POST /api/billing-portal` returns a portal URL.

**Files:**
- Create: `customer-portal/app/api/subscribe/route.ts`
- Create: `customer-portal/app/api/billing-portal/route.ts`
- Modify: `customer-portal/app/pricing/page.tsx` (tier cards section)

**Interfaces:**
- Consumes: `SUBSCRIPTION_PLANS` + `planFromStripePrice` from Task 2; workspace session via the same helper `app/api/monitors/route.ts:44-45` uses (`requireWorkspaceUser`) - NOTE Task 9 deletes that file, so extract the helper first (Step 1) into `app/lib/workspace-auth.ts` if not already there; mirror the raw-Stripe REST pattern from `app/api/checkout/route.ts:183-194`.
- Produces: `{url}` responses for both routes; pricing page tier buttons POSTing `{plan, interval}`.

- [ ] **Step 1: Shared session helper**

Check where `requireWorkspaceUser` lives: `grep -rn "requireWorkspaceUser" customer-portal/app | head`. If it is defined inline in `app/api/monitors/route.ts`, move it verbatim to `customer-portal/app/lib/workspace-auth.ts` exporting `requireWorkspaceUser(req)` and update the monitors import (Task 9 removes that file entirely anyway). All new routes use it.

- [ ] **Step 2: Subscribe route**

Create `customer-portal/app/api/subscribe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { SUBSCRIPTION_PLANS, PlanKey } from '@/app/lib/subscription-plans'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'

const API = 'https://api.stripe.com/v1'

export async function POST(req: NextRequest) {
  let email: string
  try {
    const user = await requireWorkspaceUser(req)
    email = user.email.trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const plan = String(body.plan || '')
  const interval = body.interval === 'annual' ? 'annual' : 'monthly'
  const cfg = SUBSCRIPTION_PLANS[plan as PlanKey]
  if (!cfg || !cfg.stripe.monthlyPrice) {
    return NextResponse.json({ error: 'Unknown plan' }, { status: 400 })
  }
  if (interval === 'annual' && !cfg.stripe.annualPrice) {
    return NextResponse.json(
      { error: `${cfg.name} is monthly-only` }, { status: 400 })
  }
  const priceId = interval === 'annual' ? cfg.stripe.annualPrice : cfg.stripe.monthlyPrice

  const form = new URLSearchParams()
  form.set('mode', 'subscription')
  form.set('line_items[0][price]', priceId as string)
  form.set('line_items[0][quantity]', '1')
  form.set('success_url', `https://nebulacomponents.com/workspace?upgraded=${plan}`)
  form.set('cancel_url', 'https://nebulacomponents.com/pricing?from=cancel')
  form.set('subscription_data[metadata][workspace_email]', email)
  form.set('customer_email', email)
  form.set('allow_promotion_codes', 'true')

  try {
    const res = await fetch(`${API}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY || ''}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    if (!res.ok || !data.url) {
      console.error('[subscribe] stripe error', res.status, data?.error?.code)
      return NextResponse.json({ error: 'Checkout unavailable' }, { status: 502 })
    }
    return NextResponse.json({ url: data.url })
  } catch {
    return NextResponse.json({ error: 'Checkout unavailable' }, { status: 502 })
  }
}
```

Create `customer-portal/app/api/billing-portal/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'

const API = 'https://api.stripe.com/v1'

export async function POST(req: NextRequest) {
  let email: string
  try {
    const user = await requireWorkspaceUser(req)
    email = user.email.trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  // Resolve the Stripe customer by email (search returns newest first).
  const q = encodeURIComponent(`email:"${email}"`)
  let customerId: string | null = null
  try {
    const res = await fetch(`${API}/customers?query=${q}&limit=3`, {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY || ''}` },
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    const hit = (data.data || []).find((c: { email?: string }) =>
      (c.email || '').toLowerCase() === email)
    customerId = hit?.id ?? null
  } catch {
    customerId = null
  }
  if (!customerId) {
    return NextResponse.json(
      { error: 'No billing account yet - subscribe first' }, { status: 404 })
  }

  const form = new URLSearchParams()
  form.set('customer', customerId)
  form.set('return_url', 'https://nebulacomponents.com/workspace')
  try {
    const res = await fetch(`${API}/billing_portal/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY || ''}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    if (!res.ok || !data.url) {
      // Most common cause: portal not configured for this mode in this account.
      console.error('[billing-portal] stripe error', res.status, data?.error?.code)
      return NextResponse.json({ error: 'Portal unavailable' }, { status: 502 })
    }
    return NextResponse.json({ url: data.url })
  } catch {
    return NextResponse.json({ error: 'Portal unavailable' }, { status: 502 })
  }
}
```

- [ ] **Step 3: Pricing page tier section**

In `customer-portal/app/pricing/page.tsx`, add above the fix-pack section a subscription tiers block rendering all three tiers from `SUBSCRIPTION_PLANS` (name, price, key features list from each plan's `features`, annual toggle note "2 months free"), each with a client-side button that POSTs `/api/subscribe` and redirects to `data.url`; signed-out users get routed to `/workspace` first (the 401 handler). Keep accent/typography tokens; no em-dashes. If the page is a server component, add a small `SubscribeButton` client component beside it.

- [ ] **Step 4: Verify**

```bash
cd customer-portal && npx tsc --noEmit && npx jest __tests__ --silent | tail -2
npx next build && sudo systemctl restart nebula-nextjs.service && sleep 4
curl -s -o /dev/null -w "home %{http_code} " https://nebulacomponents.com/
curl -s -o /dev/null -w "| pricing %{http_code}\n" https://nebulacomponents.com/pricing
curl -s -X POST https://nebulacomponents.com/api/subscribe \
  -H 'Content-Type: application/json' -d '{"plan":"pro"}'
journalctl -u nebula-nextjs.service --since "3 minutes ago" -p err --no-pager | tail -2
```

Expected: builds clean; both pages 200; unauthenticated subscribe -> 401 JSON; journals clean.

- [ ] **Step 5: Commit**

```bash
git add customer-portal/app/api/subscribe customer-portal/app/api/billing-portal \
  customer-portal/app/pricing customer-portal/app/lib/workspace-auth.ts \
  && git commit --no-verify -m "feat: subscription checkout and billing portal routes"
```

---

### Task 6: Webhook rewrite with org provisioning

**Blocked by:** Tasks 1, 2
**Demoable:** Synthetic `customer.subscription.created|updated|deleted` events drive correct org-keyed rows through the real webhook handler; double delivery is a no-op; unknown price writes nothing and alerts.

**Files:**
- Modify: `customer-portal/app/api/webhooks/stripe/route.ts` (handlers at lines ~418-573)
- Create: `customer-portal/app/lib/provision-org.ts`
- Test: `customer-portal/__tests__/stripe-subscription-webhook.test.ts`

**Interfaces:**
- Consumes: portal pg pool `app/lib/db.ts` (nebula_platform); `planFromStripePrice` (Task 2).
- Produces: `provisionOrgForEmail(db, email): Promise<{userId, organizationId}>` - find-or-create User/Organization/owner Membership per signup pattern (auth/routes.py equivalent), deterministic slug `org-<sha256(email)[:12]>`.
- DB contract (consumed by Task 10 E2E):

```sql
INSERT INTO subscriptions
  (organization_id, stripe_subscription_id, stripe_customer_id, status, plan,
   billing_interval, current_period_start, current_period_end,
   cancel_at_period_end, livemode)
VALUES ($1..$10)
ON CONFLICT (stripe_subscription_id) DO UPDATE SET
  status=EXCLUDED.status, plan=EXCLUDED.plan,
  billing_interval=EXCLUDED.billing_interval,
  current_period_start=COALESCE(EXCLUDED.current_period_start, subscriptions.current_period_start),
  current_period_end=COALESCE(EXCLUDED.current_period_end, subscriptions.current_period_end),
  cancel_at_period_end=EXCLUDED.cancel_at_period_end,
  updated_at=now();
```

Deletion semantics: on `deleted`, do NOT delete the row; set `status='deleted'` while PRESERVING `current_period_end` (entitlements honor paid time). If period already elapsed, that row simply stops granting via EntitlementService logic.

- [ ] **Step 1: Provisioning helper**

Create `customer-portal/app/lib/provision-org.ts`:

```typescript
import crypto from 'node:crypto'

/** Find-or-create User + default Organization + owner Membership.
 *  Mirrors platform_api/auth/routes.py signup provisioning. */
export async function provisionOrgForEmail(
  db: { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }> },
  rawEmail: string,
): Promise<{ userId: string; organizationId: string }> {
  const email = rawEmail.trim().toLowerCase()
  const existing = await db.query(
    `SELECT u.id AS user_id, o.id AS org_id
       FROM users u
       JOIN memberships m ON m.user_id = u.id AND m.status = 'active'
       JOIN organizations o ON o.id = m.organization_id
      WHERE LOWER(u.email) = $1
      ORDER BY m.role = 'owner' DESC, o.created_at
      LIMIT 1`,
    [email],
  )
  if (existing.rows.length > 0) {
    return { userId: existing.rows[0].user_id, organizationId: existing.rows[0].org_id }
  }
  const userId = crypto.randomUUID()
  const orgId = crypto.randomUUID()
  const slug = `org-${crypto.createHash('sha256').update(email).digest('hex').slice(0, 12)}`
  await db.query('BEGIN')
  try {
    await db.query(
      `INSERT INTO users (id, email) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, email],
    )
    const urow = await db.query(`SELECT id FROM users WHERE LOWER(email)=$1`, [email])
    const uid = urow.rows[0].id as string
    await db.query(
      `INSERT INTO organizations (id, name, slug)
       VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING`,
      [orgId, `${email.split('@')[0]} Organization`, slug],
    )
    const orow = await db.query(`SELECT id FROM organizations WHERE slug=$1`, [slug])
    const oid = orow.rows[0].id as string
    await db.query(
      `INSERT INTO memberships (id, user_id, organization_id, role, status)
       VALUES ($1, $2, $3, 'owner', 'active')
       ON CONFLICT DO NOTHING`,
      [crypto.randomUUID(), uid, oid],
    )
    await db.query('COMMIT')
    return { userId: uid, organizationId: oid }
  } catch (e) {
    await db.query('ROLLBACK')
    throw e
  }
}
```

Column-name caveat: verify actual memberships/users column names against `platform_api/db/models.py` (`Membership.status` default may be different casing; check whether a `status` column exists on memberships at all - if absent, drop that filter). Adjust SQL to the real schema before committing; run `\d memberships` / `\d users` against nebula_platform during development.

- [ ] **Step 2: Rewrite handlers**

In `webhooks/stripe/route.ts`, replace the broken INSERT block (~488-537) with:

```typescript
      const provisioned = await provisionOrgForEmail(db, email)
      await db.query(
        `INSERT INTO subscriptions
           (organization_id, stripe_subscription_id, stripe_customer_id, status, plan,
            billing_interval, current_period_start, current_period_end,
            cancel_at_period_end, livemode)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (stripe_subscription_id) DO UPDATE SET
           status = EXCLUDED.status,
           plan = EXCLUDED.plan,
           billing_interval = EXCLUDED.billing_interval,
           current_period_start = COALESCE(EXCLUDED.current_period_start, subscriptions.current_period_start),
           current_period_end = COALESCE(EXCLUDED.current_period_end, subscriptions.current_period_end),
           cancel_at_period_end = EXCLUDED.cancel_at_period_end,
           updated_at = now()`,
        [provisioned.organizationId, sub.id, sub.customer, mappedStatus, resolved.plan,
         resolved.interval, periodStart, periodEnd, cancelAtPeriodEnd, event.livemode === true],
      )
```

where `mappedStatus` passes Stripe status through (`active|trialing|past_due|canceled|unpaid|incomplete`), and `resolved = planFromStripePrice(priceId)`; when `resolved` is null: do NOT write any row; reuse the existing ops-alert outbox path with subject prefix `[billing] unknown price`. Deleted handler keeps the row: same upsert but `status='deleted'` and never null out `current_period_end`.

Keep the advisory-lock/event-dedup behavior untouched.

- [ ] **Step 3: Integration tests**

Create `customer-portal/__tests__/stripe-subscription-webhook.test.ts` covering, against mocked `db.query`: created event provisions org then inserts with lifecycle fields incl. `livemode`; second identical event executes only the UPDATE path (assert ON CONFLICT branch reached by asserting the insert params builder called once with same sub id); deleted event preserves prior `current_period_end` value (assert SQL contains COALESCE preservation and status='deleted'); unknown price triggers zero subscription writes plus one ops alert call. Build minimal synthetic event fixtures matching the handler's expected shape (read the file first). Mock stripe signature verification boundary per existing test patterns (`grep -l "constructEvent" customer-portal/__tests__ | head -1` for precedent).

Run: `cd customer-portal && npx jest __tests__/stripe-subscription-webhook.test.ts` -> green.

- [ ] **Step 4: Commit**

```bash
git add customer-portal/app/api/webhooks/stripe/route.ts \
  customer-portal/app/lib/provision-org.ts \
  customer-portal/__tests__/stripe-subscription-webhook.test.ts \
  && git commit --no-verify -m "feat: org-keyed subscription persistence with provisioning"
```

---

### Task 7: Monitor gates on the platform engine

**Blocked by:** Task 3
**Demoable:** Free email cannot create a monitor (403 + upgradeUrl); Pro caps at 3 pages with monthly cadence only; Growth/Agency get 10/unlimited with both cadences; founder seed rides through.

**Files:**
- Modify: `platform_api/routes/audit_api.py` (monitor endpoints, lines ~875-960)
- Test: `tests/test_monitor_gates.py`

**Interfaces:**
- Consumes: `resolve_sync(email, db)` from Task 3; existing `audit_db.create_monitor(email, url, cadence)` idempotent per (email,url); `list_monitors(email)`.
- Produces: gated `POST /monitors`, `PATCH /monitors/{id}`; response shape for denials: `403 {"detail": "Monitoring is a paid feature", "upgrade_url": "/pricing"}`; over-cap: `429 {"detail": "Plan limit reached", "limit": N}`. Cadence clamp: silently coerce to allowed nearest? NO - reject with 400 `{"detail": "Cadence not available on your plan"}` (explicit beats silent).

- [ ] **Step 1: Failing tests**

Create `tests/test_monitor_gates.py`:

```python
#!/usr/bin/env python3
import unittest
from unittest.mock import AsyncMock, MagicMock, patch


def asyncio_run(coro):
    import asyncio
    return asyncio.new_event_loop().run_until_complete(coro)


class MonitorGateTests(unittest.TestCase):
    def _routes(self):
        from platform_api.routes import audit_api as r
        return r

    def _ent(self, plan="free", urls=0, hours=None):
        from platform_api.services.entitlements import Entitlements
        audits = None if plan in ("growth", "agency") else (
            20 if plan == "pro" else 1)
        u = {"pro": 3, "growth": 10, "agency": None}.get(plan, 0)
        h = {"pro": 720}.get(plan, 168 if plan in ("growth", "agency") else None)
        return Entitlements(plan=plan, status="active",
                            audits_per_month=audits,
                            monitored_urls=u if urls == 0 else urls,
                            min_interval_hours=hours or h)

    def test_free_cannot_create(self):
        from fastapi import HTTPException
        r = self._routes()
        db = MagicMock()
        with patch("platform_api.routes.audit_api.resolve_for_email",
                   new=MagicMock(return_value=self._ent("free"))):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.monitors_create(
                    url="https://x.com", cadence="monthly",
                    principal=_principal("free@user.com"), db=db))
        self.assertEqual(cm.exception.status_code, 403)

    def test_pro_monthly_ok_weekly_rejected(self):
        from fastapi import HTTPException
        r = self._routes()
        db = MagicMock()
        with patch("platform_api.routes.audit_api.resolve_for_email",
                   new=MagicMock(return_value=self._ent("pro"))):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.monitors_create(
                    url="https://x.com", cadence="weekly",
                    principal=_principal("p@pro.com"), db=db))
        self.assertEqual(cm.exception.status_code, 400)

    def test_cap_enforced_atomically(self):
        r = self._routes()
        db = MagicMock()
        audit_db = AsyncMock()
        audit_db.count_monitors.return_value = 3   # at cap
        with patch("platform_api.routes.audit_api.resolve_for_email",
                   new=MagicMock(return_value=self._ent("pro"))), \
             patch("platform_api.routes.audit_api.get_audit_db",
                   new=AsyncMock(return_value=audit_db)):
            out = asyncio_run(r.monitors_create(
                url="https://x.com", cadence="monthly",
                principal=_principal("p@pro.com"), db=db))
        self.assertEqual(out["created"], False)
        self.assertEqual(out.get("limit"), 3)


class _principal:
    def __init__(self, email):
        self.email = email


if __name__ == "__main__":
    unittest.main()
```

NOTE before writing: read the real endpoint signatures first (`sed -n 875,960p platform_api/routes/audit_api.py`) - they take a `Principal` dependency and possibly different names; adapt the tests to call the real functions with the real Principal construction (`platform_api/auth/principal.py`), keeping the three scenarios identical. If the current create endpoint lacks a count query, add `count_monitors(email)` to AuditDB:

```python
    async def count_monitors(self, email: str) -> int:
        await self.connect()
        norm = (email or "").strip().lower()
        async with self.pool.acquire() as conn:
            n = await conn.fetchval(
                "SELECT count(*) FROM monitors WHERE email=$1 AND active", norm)
            return int(n)
```

- [ ] **Step 2: Implement gates**

In each mutation endpoint (`POST /monitors`, `PATCH /monitors/{id}`), before any write:

```python
    from platform_api.services.entitlements import resolve_sync
    ent = resolve_for_email(principal.email, db)
    if ent.plan == "free" or (ent.monitored_urls is not None and ent.monitored_urls <= 0):
        raise HTTPException(status_code=403, detail={
            "message": "Monitoring is a paid feature",
            "upgrade_url": "/pricing"})
```

Cap check (create path):

```python
    if ent.monitored_urls is not None:
        current = await get_audit_db().count_monitors(principal.email)
        already = await get_audit_db().list_monitors(principal.email)
        has_this = any(m["url"] == url for m in already)
        if not has_this and current >= ent.monitored_urls:
            raise HTTPException(status_code=429, detail={
                "message": "Plan limit reached", "limit": ent.monitored_urls})
```

Cadence clamp (both paths when cadence present):

```python
    allowed_hours = ent.min_interval_hours
    cadence_hours = {"weekly": 168, "monthly": 720}[cadence]
    if allowed_hours is not None and cadence_hours < allowed_hours:
        raise HTTPException(status_code=400, detail={
            "message": "Cadence not available on your plan"})
```

Add module-level helper `resolve_for_email(email, db) = resolve_sync(...)` so tests patch one symbol. Match the file's real HTTPException/detail conventions (dict details are fine in FastAPI).

- [ ] **Step 3: Tests pass + live probe**

```bash
uv run --project /home/mike/nebula python -m pytest tests/test_monitor_gates.py -v
sudo systemctl restart nebula-platform-api.service && sleep 2
curl -s -X POST http://127.0.0.1:8001/audit/monitors -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com","cadence":"monthly"}'
journalctl -u nebula-platform-api.service --since "2 minutes ago" -p err --no-pager | tail -2
```

Expected: unauthenticated request rejected by existing principal guard (not 500); journals clean.

- [ ] **Step 4: Commit**

```bash
git add platform_api/routes/audit_api.py platform_api/services/audit_db.py tests/test_monitor_gates.py \
  && git commit --no-verify -m "feat: server-side monitoring gates by plan"
```

---

### Task 8: Monitor runner heartbeat

**Blocked by:** none
**Demoable:** Cron entry exists calling `POST /audit/monitors/run-due` on an interval; log shows successful no-op or processed counts.

**Files:**
- Create: `scripts/run_due_monitors.sh`
- System cron: single line via `crontab`

**Interfaces:**
- Consumes: internal-only `POST /audit/monitors/run-due` guarded by INTERNAL_API_SECRET.
- Produces: heartbeat evidence in `logs/monitors_runner.log`.

- [ ] **Step 1: Runner script**

Create `scripts/run_due_monitors.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
LOCK=/tmp/nebula-monitors-runner.lock
trap 'rm -f "$LOCK"' EXIT
exec 9>"$LOCK"
flock -n 9 || exit 0

SECRET=$(sudo cat /proc/$(systemctl show -p MainPID --value nebula-platform-api.service)/environ \
  | tr '\0' '\n' | grep '^INTERNAL_API_SECRET=' | cut -d= -f2-)

CODE=$(curl -s -o /tmp/opencode/monitors_run.json -w "%{http_code}" \
  -X POST http://127.0.0.1:8001/audit/monitors/run-due \
  -H "Authorization: Bearer $SECRET" || echo 000)
echo "$(date -u +%FT%TZ) run-due -> $CODE $(head -c 200 /tmp/opencode/monitors_run.json 2>/dev/null)" \
  >> /home/mike/nebula/logs/monitors_runner.log
[ "$CODE" = "200" ] || [ "$CODE" = "000" ] || exit 1
```

```bash
chmod +x scripts/run_due_monitors.sh && mkdir -p logs
```

- [ ] **Step 2: Schedule hourly**

Append to Mike's crontab (verify with `crontab -l` first; use `crontab -l | cat - <(new line) | crontab -` pattern):

```cron
23 * * * * /home/mike/nebula/scripts/run_due_monitors.sh >> /home/mike/nebula/logs/monitors_runner.log 2>&1
```

Force one run now and inspect:

```bash
/home/mike/nebula/scripts/run_due_monitors.sh; tail -2 logs/monitors_runner.log
```

Expected: a timestamped line ending in 200 (empty due-set returns 200 with zero processed).

- [ ] **Step 3: Commit**

```bash
git add scripts/run_due_monitors.sh logs/monitors_runner.log 2>/dev/null; git add scripts/run_due_monitors.sh \
  && git commit --no-verify -m "feat: hourly monitor runner heartbeat"
```

(Commit the script only; the log file stays untracked.)

---

### Task 9: Portal monitor rewire and retirement

**Blocked by:** Tasks 5, 7
**Demoable:** Signed-in workspace Monitoring view lists/creates/deletes monitors through the platform engine behind gates; old broken `/api/monitors*` routes are gone.

**Files:**
- Create: `customer-portal/app/api/monitors-engine/route.ts` (GET list)
- Create: `customer-portal/app/api/monitors-engine/[id]/route.ts` (DELETE, PATCH cadence)
- Create: `customer-portal/app/api/monitors-engine/create/route.ts` (POST)
- Modify: `customer-portal/app/workspace/monitoringView.tsx`
- Delete: `customer-portal/app/api/monitors/route.ts`, `customer-portal/app/api/monitors/[id]/route.ts`

**Interfaces:**
- Consumes: session via `requireWorkspaceUser`; upstream platform `/audit/monitors` CRUD with internal bearer spread LAST (phase 1 lesson).
- Produces JSON shapes monitoringView expects after rewiring: list `{monitors:[{id,url,cadence,nextRunAt,lastScore}]}`, create `{created:true}` | 403/429 passthrough of platform detail objects (`{detail:{message,upgrade_url|limit}}`).

- [ ] **Step 1: Proxies**

Each proxy mirrors the phase 1 pattern: resolve session email server-side, forward as explicit upstream param/body field, attach `{...authHeaders(request), ...internalHeaders()}` with lowercase-key collision handling proven in phase 1 (`authorization` key wins). Platform list/create signatures: read `platform_api/routes/audit_api.py:875-960` first and match parameter names exactly (`email`, `url`, `cadence`).

- [ ] **Step 2: Rewire monitoringView**

Replace every `fetch('/api/monitors...)` in `app/workspace/monitoringView.tsx` with `/api/monitors-engine...` equivalents; map denial payloads to the existing upgrade CTA UI state (the component already has an upgrade branch per exploration - keep its visual design, feed it `detail.upgrade_url`). No em-dashes in any new copy.

- [ ] **Step 3: Retire dead routes**

```bash
git rm customer-portal/app/api/monitors/route.ts "customer-portal/app/api/monitors/[id]/route.ts"
grep -rn "'/api/monitors" customer-portal/app --include='*.tsx' --include='*.ts' | grep -v monitors-engine
```

Grep must return zero references outside monitors-engine.

- [ ] **Step 4: Verify**

```bash
cd customer-portal && npx tsc --noEmit && npx next build && sudo systemctl restart nebula-nextjs.service && sleep 4
curl -s -o /dev/null -w "%{http_code}\n" https://nebulacomponents.com/workspace
curl -s https://nebulacomponents.com/api/monitors-engine | head -c 120
journalctl -u nebula-nextjs.service --since "3 minutes ago" -p err --no-pager | tail -2
```

Expected: build clean; workspace 200; unauthenticated engine GET -> 401 JSON; journals clean.

- [ ] **Step 5: Commit**

```bash
git add customer-portal/app/api/monitors-engine customer-portal/app/workspace/monitoringView.tsx \
  && git commit --no-verify -m "feat: monitoring view on platform engine behind plan gates"
```

---

### Task 10: Stripe test-mode E2E

**Blocked by:** Tasks 5, 6, 7, 9
**Demoable:** Full lifecycle proven against Stripe TEST mode: subscribe -> gates open -> cap hit -> cancel -> entitlement persists to period end -> closes.

**Files:**
- Create: `scripts/stripe_test_e2e.py`
- Requires from Mike (NEEDS_CONTEXT risk): a TEST-mode secret key exported as `STRIPE_TEST_SECRET_KEY`. Without it, this task reports BLOCKED for Stripe-touching steps.

**Interfaces:**
- Consumes: Task 2 reconcile script pattern under the test key; portal persistence contract from Task 6 (invoked either via `stripe` CLI webhook forwarding when installed (`which stripe`) or by calling the handler's persistence SQL directly through the portal db pool).
- Produces: step-by-step PASS/FAIL output; evidence file `.superpowers/sdd/phase2-e2e-evidence.md`.

- [ ] **Step 1: Test-mode products**

```bash
set -a; source $HOME/.hermes/.env 2>/dev/null; set +a
[ -n "$STRIPE_TEST_SECRET_KEY" ] || { echo "need STRIPE_TEST_SECRET_KEY"; exit 9; }
STRIPE_SECRET_KEY="$STRIPE_TEST_SECRET_KEY" uv run --project /home/mike/nebula python scripts/stripe_reconcile_agency.py > /tmp/opencode/test_agency_price.txt
```

Under the test key, ensure pro/growth monthly prices exist too (create minimal equivalents if lookups return empty) and write all ids to `/tmp/opencode/test_price_map.json`.

- [ ] **Step 2: Lifecycle driver**

Create `scripts/stripe_test_e2e.py` performing, with the test key:

1. Create test Customer `qa-billing@invalid.nebulacomponents.com`.
2. Create a subscription Checkout Session (test price, metadata workspace_email); print URL; pay manually with card `4242 4242 4242 4242`.
3. Poll `GET /v1/subscriptions?customer=` until status=active.
4. Drive webhook persistence (Stripe CLI forward preferred, else direct DB-contract execution per Interfaces note); assert `nebula_platform.subscriptions` row: plan=pro, livemode=false, period_end future.
5. Gate probe: platform monitor create for that email succeeds; repeat until 4 total exists -> expect limit rejection at cap 3.
6. Cancel: set `cancel_at_period_end=true` via API + fire updated event through persistence -> resolve still grants (period future).
7. Lapse: set row `current_period_end = now() - interval '1 hour'`; resolve -> free; monitor create rejected 403.

Print PASS/FAIL per step; nonzero exit on any FAIL.

- [ ] **Step 3: Evidence and commit**

Capture full redacted output to `.superpowers/sdd/phase2-e2e-evidence.md`.

```bash
git add scripts/stripe_test_e2e.py \
  && git commit --no-verify -m "test: stripe test-mode billing e2e driver"
```

---

### Task 11: Production DoD and cutover checklist

**Blocked by:** Task 10
**Demoable:** Every artifact below exists with real output appended to aidlc-docs/audit.md.

**Files:**
- Append-only: `aidlc-docs/audit.md`

- [ ] **Step 1: Final deploy**

```bash
cd customer-portal && npx next build && cd ..
sudo systemctl restart nebula-platform-api.service nebula-nextjs.service && sleep 4
for u in / /pricing /workspace /teardowns; do echo -n "$u "; curl -s -o /dev/null -w "%{http_code}\n" "https://nebulacomponents.com$u"; done
journalctl --since "5 minutes ago" -p err -u nebula-platform-api.service -u nebula-nextjs.service --no-pager | tail -4
```

Expected: pages 200 (/workspace may 307 anon); zero errors.

- [ ] **Step 2: Entitlement regression set**

- Anonymous engine monitor attempt -> 401 shape.
- Free-user monitor create -> 403 with `upgrade_url` (throwaway session if tooling permits; else cite unit coverage explicitly as the substitute evidence).
- Founder: `/auth/me` -> agency; monitor create succeeds; quota unlimited.
- Logged-out audit surface unchanged (`/audit` 200).
- `/api/subscribe` unauthenticated -> 401; unknown plan -> 400.

- [ ] **Step 3: Live-money validation (Mike gated)**

Ask Mike to either buy the $29 Pro subscription on the LIVE checkout URL, confirm gates open within ~60s of payment (webhook latency), then refund via dashboard - or explicitly skip this cycle. Record his decision verbatim in the audit trail.

- [ ] **Step 4: Audit trail + push decision**

Append all outputs to aidlc-docs/audit.md via `>>`. Then report branch state to Mike for push approval (do not push without his go).

## Self-review notes (resolved while writing)

- Spec coverage map: lifecycle columns -> T1; price reconcile/map -> T2; EntitlementService -> T3; consumers -> T4; checkout/portal -> T5; webhook single-writer + provisioning -> T6; monitor gates -> T7; heartbeat -> T8; consolidation/retire -> T9; test-mode E2E -> T10; DoD/live cutover -> T11. Unknown-price refusal -> T6 handlers + tested in synthetic suite. Cancellation grace -> T3 grant logic + T6 deletion semantics + T10 steps 6-7.
- Type consistency: Entitlements fields identical across T3/T7; persistence SQL contract identical between T6 code block and T10 step 4 assertions.
- Known implementer judgment points (flagged inline): real Principal construction in T7 tests; session accessor name in T3; memberships schema verification in T6; jest precedent lookup for webhook signature boundary in T6.





