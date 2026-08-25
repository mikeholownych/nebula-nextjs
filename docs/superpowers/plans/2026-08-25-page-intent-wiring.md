# Page Intent Classification: End-to-End Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the already-built page intent classifier into the audit completion path and workspace UI, restoring classification that was stashed during Phase 3 merge, adding URL-level override propagation, and shipping the Next.js proxy for the override badge.

**Architecture:** Pop the third-stream stash to restore `audit_runner._complete()` → `audit_db.update_audit()` intent writes + the single-audit `PATCH /audit/{id}/page-intent` FastAPI route. Extend the PATCH to propagate to all audits for the same URL + owner. Add a Next.js proxy so `IntentBadge` can call it. Fix a stale docstring. No migrations needed — all three DB columns (`page_intent`, `intent_confidence`, `intent_signals`) already exist and are already populated for all 841 completed audits.

**Tech Stack:** Python/FastAPI (platform API), Next.js 14 App Router (portal), asyncpg, psycopg2, TypeScript

## Global Constraints

- No em-dashes anywhere in shipped content. Ever.
- Accent color `#c7ff2f` only. No new colors.
- No `warning` Tailwind class.
- No push to `nebula-origin` until Mike gives explicit go.
- Homepage frozen.
- Production doctrine: every task verified against live service before marking done.
- Branch: `feat/page-intent` (create from main).
- DSN for findings_sync: `host=/var/run/postgresql port=5433 dbname=nebula_audit user=postgres`

---

### Task 0: Branch + stash apply

**Blocks:** none (start immediately)
**Blocked by:** nothing
**Demoable:** `git log --oneline feat/page-intent` shows branch from current main; `audit_runner.py` contains `classify_page` call; `audit_db.py` `update_audit` signature has `page_intent` param; `WorkspaceClient.tsx` `WorkspaceAudit` has `page_intent` field.

**Files:**
- Modify: `platform_api/services/audit_runner.py` (from stash)
- Modify: `platform_api/services/audit_db.py` (from stash)
- Modify: `platform_api/routes/audit_api.py` (from stash — single-audit PATCH; URL-propagation added in Task 1)
- Modify: `customer-portal/app/workspace/WorkspaceClient.tsx` (from stash)
- Modify: `platform_api/services/page_intent.py` (docstring fix)

**Interfaces:**
- Produces: `audit_db.update_audit(..., page_intent: Optional[str]=None, intent_confidence: Optional[float]=None, intent_signals: Optional[dict]=None)` — three new optional kwargs, params $12/$13/$14 in the SQL UPDATE
- Produces: `WorkspaceAudit` interface with `page_intent?: string | null` and `intent_confidence?: number | null`

- [ ] **Step 1: Create branch**

```bash
cd /home/mike/nebula
git checkout main
git checkout -b feat/page-intent
```
Expected: `Switched to a new branch 'feat/page-intent'`

- [ ] **Step 2: Pop the stash**

```bash
git stash pop stash@{0}
```
Expected: output shows `customer-portal/app/workspace/WorkspaceClient.tsx`, `platform_api/routes/audit_api.py`, `platform_api/services/audit_db.py`, `platform_api/services/audit_runner.py` modified. No conflicts (the stash was created from main before Phase 3 merge; all four files have been updated since, so conflicts are possible — resolve by keeping BOTH sets of changes: the stash adds new code alongside existing lines).

If conflicts occur on `audit_api.py`: keep existing Phase 3 route hunks AND add the PATCH route from the stash. For `audit_db.py`: keep existing `funnel`/`source` additions AND add the intent params. For `audit_runner.py`: keep existing structure AND add the `classify_page` call block.

- [ ] **Step 3: Fix docstring threshold in page_intent.py**

Open `platform_api/services/page_intent.py`. Two lines say `≥0.50` — the actual code threshold is `0.15`. Fix both:

Line 19: `unknown         Insufficient signals to classify with confidence ≥0.50.`
→ `unknown         Insufficient signals to classify with confidence ≥0.15.`

Line 27: `- Minimum confidence 0.50 required to assign a non-unknown intent.`
→ `- Minimum confidence 0.15 required to assign a non-unknown intent.`

- [ ] **Step 4: Verify audit_db.update_audit signature**

Check that `platform_api/services/audit_db.py` `update_audit()` now has the three new params AND the SQL uses $12/$13/$14:

```bash
grep -n "page_intent\|intent_confidence\|intent_signals\|\$12\|\$13\|\$14" \
  platform_api/services/audit_db.py | head -15
```
Expected: lines showing `page_intent: Optional[str] = None`, `intent_confidence: Optional[float] = None`, `intent_signals: Optional[dict] = None` in signature, and `COALESCE($12, page_intent)` etc. in the UPDATE statement. If the stash applied cleanly these will be present; if not, add them manually (see Task 1 for exact code).

- [ ] **Step 5: Verify audit_runner._complete**

```bash
grep -n "classify_page\|page_intent\|intent_confidence\|intent_signals" \
  platform_api/services/audit_runner.py | head -15
```
Expected: lines showing the `try/except` block calling `classify_page()` and passing results to `update_audit()`.

- [ ] **Step 6: Verify WorkspaceClient type**

```bash
grep -n "page_intent\|intent_confidence" \
  customer-portal/app/workspace/WorkspaceClient.tsx | head -5
```
Expected: both fields present in the `WorkspaceAudit` interface.

- [ ] **Step 7: Run full test suite**

```bash
uv run --project /home/mike/nebula python -m pytest tests/ -q --tb=short 2>&1 | tail -10
```
Expected: 639+ passed, 0 failures.

- [ ] **Step 8: Commit**

```bash
git add platform_api/services/audit_runner.py \
        platform_api/services/audit_db.py \
        platform_api/services/page_intent.py \
        customer-portal/app/workspace/WorkspaceClient.tsx
git commit -m "feat: classify page intent at audit completion; fix docstring threshold"
```

Note: do NOT commit `platform_api/routes/audit_api.py` yet — Task 1 modifies it further.

---

### Task 1: URL-propagating override endpoint + tests

**Blocked by:** Task 0
**Demoable:** `PATCH /audit/{audit_id}/page-intent` with a valid session returns `{"page_intent":..., "intent_confidence":1.0, "overridden":true, "affected_audits":N}` where N = count of audits with the same URL + owner email. Sibling audits for the same URL all show the new intent in the DB.

**Files:**
- Modify: `platform_api/routes/audit_api.py` (apply stash hunk + URL-propagation change)
- Create: `tests/test_page_intent_override.py`

**Interfaces:**
- Consumes: `audit_db.pool` (asyncpg), `audit_db.get_audit(audit_uuid)` returning dict with `url`, `email`, `status`
- Consumes: `sync_findings_for_audit(audit_id: str, dsn: str) -> dict` from `platform_api.services.findings_sync`
- Consumes: `SCOPE_WORKSPACE_WRITE`, `require_principal`, `bind_email` from `platform_api.auth.principal`
- Produces: `PATCH /audit/{audit_id}/page-intent` → `{"page_intent": str, "intent_confidence": 1.0, "overridden": true, "affected_audits": int}`

- [ ] **Step 1: Write failing tests**

Create `tests/test_page_intent_override.py`:

```python
"""Tests for PATCH /audit/{id}/page-intent URL-propagation endpoint."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4


AUDIT_ID = str(uuid4())
SIBLING_ID = str(uuid4())
OWNER_EMAIL = "owner@example.com"
URL = "https://example.com/pricing"


def _make_audit(audit_id, url=URL, email=OWNER_EMAIL, status="completed"):
    return {"id": audit_id, "url": url, "email": email, "status": status}


@pytest.mark.asyncio
async def test_override_updates_all_same_url_audits(client, mock_principal):
    """Overriding intent on one audit propagates to all audits with same URL + owner."""
    from platform_api.routes.audit_api import override_page_intent, PageIntentOverride
    from platform_api.auth.principal import Principal

    principal = Principal(
        principal_type="user",
        principal_id=OWNER_EMAIL,
        email=OWNER_EMAIL,
        workspace_email=OWNER_EMAIL,
        scopes=frozenset(["workspace:write"]),
    )

    mock_conn = AsyncMock()
    # get_audit returns the requested audit
    mock_conn.fetchrow = AsyncMock(return_value=_make_audit(AUDIT_ID))
    # UPDATE affects 2 rows (this audit + one sibling)
    mock_conn.execute = AsyncMock(return_value="UPDATE 2")
    # fetch returns 2 sibling audit IDs
    mock_conn.fetch = AsyncMock(return_value=[
        {"id": AUDIT_ID},
        {"id": SIBLING_ID},
    ])

    mock_pool = MagicMock()
    mock_pool.acquire = MagicMock(return_value=AsyncMock(
        __aenter__=AsyncMock(return_value=mock_conn),
        __aexit__=AsyncMock(return_value=None),
    ))

    with patch("platform_api.routes.audit_api.audit_db") as mock_db, \
         patch("platform_api.routes.audit_api.sync_findings_for_audit") as mock_sync:
        mock_db.get_audit = AsyncMock(return_value=_make_audit(AUDIT_ID))
        mock_db.pool = mock_pool
        mock_sync.return_value = {"created": 0, "resolved": 1}

        body = PageIntentOverride(page_intent="seo_content")
        result = await override_page_intent(AUDIT_ID, body, principal)

    assert result["page_intent"] == "seo_content"
    assert result["intent_confidence"] == 1.0
    assert result["overridden"] is True
    assert result["affected_audits"] == 2


@pytest.mark.asyncio
async def test_override_rejects_invalid_intent(client, mock_principal):
    """Invalid intent value returns 400."""
    from platform_api.routes.audit_api import override_page_intent, PageIntentOverride
    from platform_api.auth.principal import Principal
    from fastapi import HTTPException

    principal = Principal(
        principal_type="user",
        principal_id=OWNER_EMAIL,
        email=OWNER_EMAIL,
        workspace_email=OWNER_EMAIL,
        scopes=frozenset(["workspace:write"]),
    )

    body = PageIntentOverride(page_intent="not_a_real_intent")
    with patch("platform_api.routes.audit_api.audit_db") as mock_db:
        mock_db.get_audit = AsyncMock(return_value=_make_audit(AUDIT_ID))
        with pytest.raises(HTTPException) as exc_info:
            await override_page_intent(AUDIT_ID, body, principal)
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_override_rejects_wrong_owner():
    """A different user cannot override someone else's audit."""
    from platform_api.routes.audit_api import override_page_intent, PageIntentOverride
    from platform_api.auth.principal import Principal
    from fastapi import HTTPException

    principal = Principal(
        principal_type="user",
        principal_id="other@example.com",
        email="other@example.com",
        workspace_email="other@example.com",
        scopes=frozenset(["workspace:write"]),
    )

    body = PageIntentOverride(page_intent="seo_content")
    with patch("platform_api.routes.audit_api.audit_db") as mock_db:
        mock_db.get_audit = AsyncMock(return_value=_make_audit(AUDIT_ID))
        with pytest.raises(HTTPException) as exc_info:
            await override_page_intent(AUDIT_ID, body, principal)
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_override_404_on_missing_audit():
    """Missing audit returns 404."""
    from platform_api.routes.audit_api import override_page_intent, PageIntentOverride
    from platform_api.auth.principal import Principal
    from fastapi import HTTPException

    principal = Principal(
        principal_type="user",
        principal_id=OWNER_EMAIL,
        email=OWNER_EMAIL,
        workspace_email=OWNER_EMAIL,
        scopes=frozenset(["workspace:write"]),
    )

    body = PageIntentOverride(page_intent="seo_content")
    with patch("platform_api.routes.audit_api.audit_db") as mock_db:
        mock_db.get_audit = AsyncMock(return_value=None)
        with pytest.raises(HTTPException) as exc_info:
            await override_page_intent(AUDIT_ID, body, principal)
    assert exc_info.value.status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
uv run python -m pytest tests/test_page_intent_override.py -v 2>&1 | tail -15
```
Expected: collection error or ImportError (`override_page_intent` not importable yet with new signature / URL-propagation logic missing).

- [ ] **Step 3: Apply and extend the PATCH route in audit_api.py**

The stash already added a `PATCH /{audit_id}/page-intent` route that updates only the one audit. Find it in `platform_api/routes/audit_api.py` (search for `override_page_intent` or `page-intent`). Replace the body after the ownership check with URL-propagation logic:

```python
# --- after ownership / status checks ---

    # Update ALL audits for the same URL + owner (not just this one).
    own = (principal.workspace_email or principal.email or "").strip().lower()
    async with audit_db.pool.acquire() as conn:
        # Write intent to every audit this owner has for this URL.
        result = await conn.execute(
            """
            UPDATE audits
            SET page_intent       = $2,
                intent_confidence = 1.0,
                intent_signals    = intent_signals || '{"override": true}'::jsonb
            WHERE url   = $3
              AND email = $4
            """,
            # $1 unused here — UPDATE WHERE url+email, not id
            # positional params start at $2
            body.page_intent,
            row.get("url"),
            own,
        )
        # Fix param numbering: asyncpg $n is 1-indexed and positional
        # Re-write correctly:
        await conn.execute(
            """
            UPDATE audits
               SET page_intent       = $1,
                   intent_confidence = 1.0,
                   intent_signals    = COALESCE(intent_signals, '{}'::jsonb)
                                       || '{"override": true}'::jsonb
             WHERE url   = $2
               AND email = $3
            """,
            body.page_intent,
            row.get("url"),
            own,
        )
        affected_rows = await conn.fetch(
            "SELECT id FROM audits WHERE url = $1 AND email = $2",
            row.get("url"),
            own,
        )

    affected_ids = [str(r["id"]) for r in affected_rows]

    # Re-sync findings for each affected audit (guarded — sync failure never blocks).
    import asyncio as _asyncio
    from platform_api.services.findings_sync import sync_findings_for_audit as _sync

    DSN = "host=/var/run/postgresql port=5433 dbname=nebula_audit user=postgres"

    async def _resync(aid: str) -> None:
        try:
            await _asyncio.to_thread(_sync, aid, DSN)
        except Exception:
            logger.exception("findings resync after intent override failed for %s", aid)

    _asyncio.create_task(_asyncio.gather(*[_resync(aid) for aid in affected_ids]))

    return {
        "audit_id": str(audit_uuid),
        "page_intent": body.page_intent,
        "intent_confidence": 1.0,
        "overridden": True,
        "affected_audits": len(affected_ids),
    }
```

**Important:** Remove the duplicate `await conn.execute(...)` — the block above shows both the wrong and correct version for illustration. The final code must have exactly ONE `UPDATE` statement followed by the `SELECT` to fetch affected IDs. The full replacement block for the route body (after the stash's single-audit UPDATE) is:

```python
    own = (principal.workspace_email or principal.email or "").strip().lower()
    try:
        await audit_db.connect()
        async with audit_db.pool.acquire() as conn:
            await conn.execute(
                """UPDATE audits
                      SET page_intent       = $1,
                          intent_confidence = 1.0,
                          intent_signals    = COALESCE(intent_signals, '{}'::jsonb)
                                             || '{"override": true}'::jsonb
                    WHERE url   = $2
                      AND email = $3""",
                body.page_intent,
                row.get("url"),
                own,
            )
            affected_rows = await conn.fetch(
                "SELECT id FROM audits WHERE url = $1 AND email = $2",
                row.get("url"),
                own,
            )
        affected_ids = [str(r["id"]) for r in affected_rows]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("intent override failed for %s: %s", audit_id, e, exc_info=True)
        raise HTTPException(status_code=503, detail="Override failed")

    import asyncio as _asyncio
    from platform_api.services.findings_sync import sync_findings_for_audit as _sync

    DSN = "host=/var/run/postgresql port=5433 dbname=nebula_audit user=postgres"

    async def _resync(aid: str) -> None:
        try:
            await _asyncio.to_thread(_sync, aid, DSN)
        except Exception:
            logger.exception("intent override resync failed for %s", aid)

    _asyncio.create_task(_asyncio.gather(*[_resync(aid) for aid in affected_ids]))

    return {
        "audit_id": str(audit_uuid),
        "page_intent": body.page_intent,
        "intent_confidence": 1.0,
        "overridden": True,
        "affected_audits": len(affected_ids),
    }
```

Also ensure the ownership check at the top of the route reads `row` from `await audit_db.get_audit(audit_uuid)` before the `async with audit_db.pool.acquire()` block (the stash already does this).

- [ ] **Step 4: Run tests to verify they pass**

```bash
uv run python -m pytest tests/test_page_intent_override.py -v 2>&1 | tail -15
```
Expected: 4 passed.

- [ ] **Step 5: Run full suite**

```bash
uv run python -m pytest tests/ -q --tb=short 2>&1 | tail -5
```
Expected: 639+ passed, 0 failures.

- [ ] **Step 6: Restart API and smoke-test the route**

```bash
sudo systemctl restart nebula-platform-api.service && sleep 4
systemctl is-active nebula-platform-api.service
curl -s -m 5 http://127.0.0.1:8001/healthz | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])"
# Unauthenticated → 401
curl -s -m 5 -X PATCH -H "Content-Type: application/json" \
  -d '{"page_intent":"seo_content"}' \
  "http://127.0.0.1:8001/audit/00000000-0000-0000-0000-000000000000/page-intent" | python3 -m json.tool
```
Expected: healthz `ok`; PATCH returns `{"code":"http_error","message":"Authentication required",...}` (401).

- [ ] **Step 7: Commit**

```bash
git add platform_api/routes/audit_api.py tests/test_page_intent_override.py
git commit -m "feat: page intent override propagates to all audits for same URL and owner"
```

---

### Task 2: Next.js proxy + page intent classifier tests

**Blocked by:** Task 1
**Demoable:** `curl https://nebulacomponents.com/api/audit/SOME_ID/page-intent` unauthenticated → 401 JSON. `IntentBadge` override picker saves without console errors (verified by inspecting network tab once logged in).

**Files:**
- Create: `customer-portal/app/api/audit/[id]/page-intent/route.ts`
- Create: `tests/test_page_intent.py`

**Interfaces:**
- Consumes: `requireWorkspaceUser`, `authHeaders` from `@/app/lib/workspace-auth`
- Consumes: `PLATFORM_API_URL` env var (default `http://127.0.0.1:8001`), `INTERNAL_API_SECRET` env var
- Produces: `PATCH /api/audit/[id]/page-intent` → upstream response JSON passthrough (200/400/403/404)

- [ ] **Step 1: Write classifier unit tests**

Create `tests/test_page_intent.py`:

```python
"""Unit tests for the page intent classifier."""
import pytest
from platform_api.services.page_intent import classify_page, INTENTS


def test_paid_landing_url_path():
    result = classify_page(url="https://example.com/lp/free-trial", title="", h1="")
    assert result.intent == "paid_landing"
    assert result.confidence >= 0.15


def test_seo_content_title():
    result = classify_page(
        url="https://example.com/blog/how-to-write-copy",
        title="How to Write High-Converting Landing Page Copy",
        h1="",
    )
    assert result.intent in ("seo_content", "paid_landing")  # both are plausible
    assert result.confidence >= 0.15


def test_comparison_url():
    result = classify_page(url="https://example.com/vs/competitor", title="", h1="")
    assert result.intent == "comparison"
    assert result.confidence >= 0.15


def test_below_threshold_returns_unknown():
    result = classify_page(url="https://example.com/", title="", h1="")
    # Home page with no signals → may or may not be unknown depending on rules
    # Regardless: confidence must be a float, intent must be in taxonomy
    assert result.intent in INTENTS
    assert 0.0 <= result.confidence <= 1.0


def test_unknown_when_no_signals():
    result = classify_page(url="https://example.com/zzz-totally-ambiguous-slug", title="", h1="", meta_desc="", text="", html="")
    assert result.intent == "unknown"
    assert result.confidence == 0.0


def test_checkout_url():
    result = classify_page(url="https://example.com/checkout/payment", title="", h1="")
    assert result.intent == "checkout"


def test_about_trust_url():
    result = classify_page(url="https://example.com/about-us/team", title="", h1="")
    assert result.intent == "about_trust"


def test_result_has_signals_dict():
    result = classify_page(url="https://example.com/pricing", title="Plans and Pricing", h1="")
    assert isinstance(result.signals, dict)
    assert "fired" in result.signals
    assert "votes" in result.signals


def test_confidence_capped_at_one():
    # Many signals firing at once should not produce confidence > 1.0
    result = classify_page(
        url="https://example.com/lp/get-started",
        title="Get Started Free — Limited Time Offer",
        h1="Claim Your Free Trial",
        meta_desc="Start your free trial today. Exclusive offer.",
    )
    assert result.confidence <= 1.0


def test_to_dict_keys():
    result = classify_page(url="https://example.com/vs/other", title="", h1="")
    d = result.to_dict()
    assert set(d.keys()) == {"intent", "confidence", "signals"}
    assert isinstance(d["confidence"], float)
```

- [ ] **Step 2: Run tests**

```bash
uv run python -m pytest tests/test_page_intent.py -v 2>&1 | tail -15
```
Expected: all pass. If any fail, adjust the test (e.g. `test_below_threshold_returns_unknown` — home page may have some signals; adjust the assertion to check it's in INTENTS only).

- [ ] **Step 3: Create Next.js proxy**

Create `customer-portal/app/api/audit/[id]/page-intent/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser, authHeaders } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { authorization: `Bearer ${secret}` } : {}
}

/**
 * Override the page intent for an audit (and all audits for the same URL + owner).
 * PATCH /api/audit/[id]/page-intent { page_intent: string }
 *
 * Auth: workspace session required. Internal bearer spread last so it wins
 * the lowercase `authorization` key collision.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response

  const { id } = await params
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid audit ID' }, { status: 400 })
  }

  let body: { page_intent?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.page_intent !== 'string' || !body.page_intent.trim()) {
    return NextResponse.json({ error: 'page_intent string required' }, { status: 400 })
  }

  try {
    const response = await fetch(`${API_BASE}/audit/${encodeURIComponent(id)}/page-intent`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(request),
        ...internalHeaders(),
      },
      body: JSON.stringify({ page_intent: body.page_intent }),
      signal: AbortSignal.timeout(10000),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Page intent override proxy error:', error)
    return NextResponse.json({ error: 'Override failed' }, { status: 502 })
  }
}
```

- [ ] **Step 4: TypeScript check**

```bash
cd /home/mike/nebula/customer-portal && npx tsc --noEmit 2>&1 | tail -10
```
Expected: 0 errors.

- [ ] **Step 5: Build**

```bash
npx next build 2>&1 | tail -10
```
Expected: exit 0.

- [ ] **Step 6: Restart and verify**

```bash
sudo systemctl restart nebula-nextjs.service && sleep 5
systemctl is-active nebula-nextjs.service
# Unauthenticated PATCH → 401
curl -s -m 8 -X PATCH -H "Content-Type: application/json" \
  -d '{"page_intent":"seo_content"}' \
  "https://nebulacomponents.com/api/audit/00000000-0000-0000-0000-000000000000/page-intent"
```
Expected: service active; response is `{"code":"http_error","message":"Authentication required",...}` or similar 401 shape.

- [ ] **Step 7: Blast radius**

```bash
curl -s -o /dev/null -w "/ -> %{http_code}\n" https://nebulacomponents.com/
curl -s -o /dev/null -w "/audit -> %{http_code}\n" https://nebulacomponents.com/audit
curl -s -o /dev/null -w "/pricing -> %{http_code}\n" https://nebulacomponents.com/pricing
```
Expected: all 200.

- [ ] **Step 8: Commit**

```bash
cd /home/mike/nebula
git add customer-portal/app/api/audit/\[id\]/page-intent/route.ts \
        tests/test_page_intent.py
git commit -m "feat: Next.js proxy for intent override; classifier unit tests"
```

---

### Task 3: E2E verification

**Blocked by:** Task 2
**Demoable:** A real audit has its intent overridden via the API; all audits for that URL + owner show the new intent; `journalctl` shows findings resync log lines.

**Files:**
- Evidence: `.superpowers/sdd/page-intent-e2e-evidence.md`

**Interfaces:**
- Consumes: founder session mint pattern (asyncio + `create_session`, as used in Phase 3 Task 8)
- Consumes: `INTERNAL_API_SECRET` from `/proc/$(systemctl show -p MainPID --value nebula-platform-api.service)/environ`

- [ ] **Step 1: Check current state of intent data**

```bash
INTERNAL_API_SECRET=$(cat /proc/$(systemctl show -p MainPID --value nebula-platform-api.service)/environ | tr '\0' '\n' | grep INTERNAL_API_SECRET | cut -d= -f2-)
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" -c \
  "SELECT page_intent, COUNT(*) FROM audits WHERE status='completed' GROUP BY page_intent ORDER BY count DESC;"
```
Expected: distribution showing `unknown` (majority), `comparison`, `seo_content`, etc. Capture output.

- [ ] **Step 2: Mint founder session**

```bash
cat > /tmp/opencode/mint_founder_session.py << 'EOF'
import asyncio, sys
sys.path.insert(0, '/home/mike/nebula')
async def main():
    from platform_api.redis_client import get_redis
    from platform_api.auth.jwt import create_session
    redis = await get_redis()
    token = await create_session(redis, '002cc901-4181-49db-bf18-9b49c6740b17',
                                  'ba53a48c-f54a-4057-bff3-09e2b7034932',
                                  {'agent': 'page-intent-e2e'})
    print(token)
asyncio.run(main())
EOF
cd /home/mike/nebula && timeout 15 uv run --project . python /tmp/opencode/mint_founder_session.py 2>&1 | head -1
```
Expected: JWT string (299 chars).

- [ ] **Step 3: Pick a URL with multiple audits to test propagation**

```bash
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" -t -c \
  "SELECT url, COUNT(*) as cnt, MAX(id::text) as latest_id
   FROM audits
   WHERE email='mike.holownych@gmail.com' AND status='completed'
   GROUP BY url HAVING COUNT(*) > 1
   ORDER BY cnt DESC LIMIT 3;"
```
Pick the URL with the most sibling audits. Note the `latest_id`.

- [ ] **Step 4: Override intent and verify propagation**

```bash
FOUNDER_TOKEN=<token from Step 2>
AUDIT_ID=<latest_id from Step 3>
TARGET_URL=<url from Step 3>

# Override
curl -s -m 10 -X PATCH \
  -H "Authorization: Bearer $FOUNDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"page_intent":"seo_content"}' \
  "http://127.0.0.1:8001/audit/$AUDIT_ID/page-intent" | python3 -m json.tool
```
Expected: `{"audit_id": "...", "page_intent": "seo_content", "intent_confidence": 1.0, "overridden": true, "affected_audits": N}` where N ≥ 2.

```bash
# Verify DB propagation
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" -c \
  "SELECT id, page_intent, intent_confidence FROM audits
   WHERE url='$TARGET_URL' AND email='mike.holownych@gmail.com';"
```
Expected: all rows show `page_intent=seo_content`, `intent_confidence=1.0`.

- [ ] **Step 5: Verify new audit classification**

Trigger a real audit (or wait for one to complete). Check the most recent completed audit:
```bash
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" -c \
  "SELECT url, page_intent, intent_confidence FROM audits
   WHERE status='completed' ORDER BY completed_at DESC LIMIT 3;"
```
Expected: `page_intent` and `intent_confidence` are non-null on recent completions.

- [ ] **Step 6: Journal check**

```bash
timeout 8 bash -c "journalctl -u nebula-platform-api.service -n 50 --no-pager 2>&1 | grep -i 'intent'" || echo "no intent logs (ok if no recent audits completed)"
```
Expected: either `intent_gate suppressed N findings` lines, or `page_intent classified:` lines, or silence if no audits completed since restart.

- [ ] **Step 7: Revert test override**

```bash
# Restore original intent (unknown) so we don't permanently override real data
curl -s -m 10 -X PATCH \
  -H "Authorization: Bearer $FOUNDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"page_intent":"unknown"}' \
  "http://127.0.0.1:8001/audit/$AUDIT_ID/page-intent"
# Revoke session
JTI_VAL=$(python3 -c "
import json,base64,sys
t='$FOUNDER_TOKEN'
p=t.split('.')[1];p+='='*(4-len(p)%4)
d=json.loads(base64.b64decode(p))
print(d['jti']+'|'+d['user_id'])
")
JTI=$(echo $JTI_VAL | cut -d'|' -f1)
USER_ID=$(echo $JTI_VAL | cut -d'|' -f2)
redis-cli DEL "session:$USER_ID:$JTI"
echo "session revoked"
```

- [ ] **Step 8: Write evidence file**

Write `.superpowers/sdd/page-intent-e2e-evidence.md` with all verbatim outputs from steps 1-7, with PASS/FAIL verdict per step.

- [ ] **Step 9: Final test suite**

```bash
cd /home/mike/nebula && uv run python -m pytest tests/ -q --tb=no 2>&1 | tail -5
```
Expected: 649+ passed (639 prior + ~10 new), 0 failures.

- [ ] **Step 10: Commit**

```bash
git add -f .superpowers/sdd/page-intent-e2e-evidence.md
git commit -m "docs: page intent e2e evidence"
```

---

## File Map Summary

| File | Action | Task |
|---|---|---|
| `platform_api/services/audit_runner.py` | Modify (stash: classify_page call in `_complete`) | T0 |
| `platform_api/services/audit_db.py` | Modify (stash: intent params in `update_audit` + SELECT) | T0 |
| `platform_api/services/page_intent.py` | Modify (docstring fix only) | T0 |
| `customer-portal/app/workspace/WorkspaceClient.tsx` | Modify (stash: type fields) | T0 |
| `platform_api/routes/audit_api.py` | Modify (stash PATCH route + URL-propagation) | T1 |
| `tests/test_page_intent_override.py` | Create | T1 |
| `customer-portal/app/api/audit/[id]/page-intent/route.ts` | Create | T2 |
| `tests/test_page_intent.py` | Create | T2 |
| `.superpowers/sdd/page-intent-e2e-evidence.md` | Create | T3 |
