# Page Intent Classification: End-to-End Wiring
**Date:** 2026-08-25
**Status:** approved

---

## Problem

The page intent classifier (`page_intent.py`), signal gate (`signal_intent_map.py`), findings sync (`findings_sync.py`), `IntentBadge` component, and DB columns (`page_intent`, `intent_confidence`, `intent_signals`) all exist and are complete. None of them are connected. Every audit has NULL intent, so the signal gate never fires and `IntentBadge` has nothing to show.

## Goals

1. Classify intent on every new audit at completion time.
2. Backfill all existing completed audits using stored `engine_output`.
3. Surface intent in the workspace audit list with user-overridable badge.
4. Propagate user overrides to all audits for the same URL + owner.
5. Fix the stale docstring (0.50 threshold claim vs. actual 0.15 in code).

## Non-goals

- No ML, no external API calls for classification.
- No new DB columns or schema changes (all three columns already exist).
- No changes to `signal_intent_map.py` or `findings_sync.py` logic (already correct).

---

## Architecture

### 1. Classification at audit completion

**File:** `platform_api/services/audit_engine.py` — `score_inprocess()`

`page` dict from `da.scrape_page()` already contains `title`, `h1`, and the raw `html`. Add a `meta_desc` extraction from `page` (`page.get("meta_desc", "")` — field already scraped by deliver_audit). Call `classify_page()` before returning the result dict:

```python
from platform_api.services.page_intent import classify_page
classification = classify_page(
    url=url,
    title=page.get("title", ""),
    h1=page.get("h1", ""),
    meta_desc=page.get("meta_desc", ""),
    text=page.get("text", ""),
    html=html,
)
```

Embed result in returned dict as `page_intent`, `intent_confidence`, `intent_signals`. Guarded: classify failure must never raise — log exception and leave fields absent (runner handles missing keys gracefully).

**File:** `platform_api/services/audit_db.py` — `update_audit()`

Add three optional keyword parameters (`page_intent`, `intent_confidence`, `intent_signals`) and extend the `UPDATE audits SET ...` statement with `COALESCE($12, page_intent)` etc. (positions $12/$13/$14). Also extend `get_audits_by_email()` SELECT to include `page_intent, intent_confidence`.

**File:** `platform_api/services/audit_runner.py` — `_complete()`

Pass the three new fields from `data` dict to `update_audit()`. This is already wired in the stash — apply it as-is.

**Fix:** `page_intent.py` docstring line 19 and line 27: change `≥0.50` to `≥0.15` (match actual code).

---

### 2. Backfill job

**File:** `scripts/backfill_page_intent.py`

Single-pass script. Queries all completed audits with `page_intent IS NULL`, processes in batches of 100. For each audit:

1. Extract `url`, `title` (`engine_output->>'page_title'`), `h1` (`engine_output->>'page_h1'`), `meta_desc` (`engine_output->>'page_meta_desc'` — may be absent). HTML is NOT stored, so `html=""` and `text=""` — URL and title/h1/meta signals only.
2. Call `classify_page(url=url, title=title, h1=h1, meta_desc=meta_desc)`.
3. If result is `unknown` (confidence < 0.15): skip — leave row NULL, do not run findings sync.
4. If classified: `UPDATE audits SET page_intent=$2, intent_confidence=$3, intent_signals=$4 WHERE id=$1`.
5. Run `sync_findings_for_audit(audit_id, DSN)` — this re-gates and **replaces** findings (sync's normal reconciliation logic already handles replace: signals absent from incoming are auto-resolved, new ones are created).
6. Log: `[backfill] audit=<id> url=<url> intent=<intent> confidence=<n> findings_result=<counts>`.

Idempotent: re-running skips audits that already have `page_intent IS NOT NULL`. Safe for production: reads/writes only to `nebula_audit`, no locking, runs as a script (not inside the API event loop).

DSN: `host=/var/run/postgresql port=5433 dbname=nebula_audit user=postgres` (same as `findings_sync.py`).

---

### 3. Manual override endpoint

**File:** `platform_api/routes/audit_api.py`

`PATCH /audit/{audit_id}/page-intent` (already in the stash, apply as-is with one change):

- After ownership check, update **all** audits where `url = this_url AND email = owner_email` (not just the one audit). Return `{"page_intent": ..., "intent_confidence": 1.0, "overridden": true, "affected_audits": N}`.
- Run `sync_findings_for_audit` on each affected audit ID (wrapped in `asyncio.to_thread`, guarded).
- Valid intent values: the `_VALID_INTENTS` frozenset already in the stash (9 values).

**File:** `customer-portal/app/api/audit/[id]/page-intent/route.ts` *(new)*

Next.js proxy, PATCH only. Follows the established Phase 3 proxy pattern: `requireWorkspaceUser`, spread `{...authHeaders(request), ...internalHeaders()}` with the internal bearer last, forward to `http://127.0.0.1:8001/audit/${params.id}/page-intent`. Return the upstream response (200 on success, 400/403/404 as-is).

---

### 4. Frontend wiring

**File:** `customer-portal/app/workspace/WorkspaceClient.tsx`

Apply the stash hunk: add `page_intent?: string | null` and `intent_confidence?: number | null` to `WorkspaceAudit` interface.

`views.tsx` already imports `IntentBadge` and passes `page_intent`/`intent_confidence` — no changes needed there.

`IntentBadge.tsx` already calls `PATCH /api/audit/${auditId}/page-intent` and handles the override picker — no changes needed.

---

### 5. Stash cleanup

Pop `stash@{0}` (`third-stream-wip-pre-merge`). Apply the four modified files. The stash's `audit_api.py` hunk contains the PATCH route (use it, adding the URL-propagation change). The `audit_db.py` hunk extends `update_audit()` and `get_audits_by_email()` (use as-is). The `audit_runner.py` hunk passes intent fields to `update_audit()` (use as-is). The `WorkspaceClient.tsx` hunk adds the two type fields (use as-is).

---

## Data Flow Summary

```
audit_engine.score_inprocess()
  └── classify_page(url, title, h1, meta_desc, text, html)
        └── ClassificationResult{intent, confidence, signals}
              └── returned in data dict

audit_runner._complete(job, data)
  └── audit_db.update_audit(..., page_intent, intent_confidence, intent_signals)
        └── UPDATE audits SET ... WHERE id=$1

findings_sync.sync_findings_for_audit(audit_id, dsn)
  └── reads page_intent from audits row
        └── is_relevant(signal_key, page_intent) gates incoming findings
              └── replace: suppressed signals auto-resolved, new ones created

WorkspaceClient.tsx
  └── WorkspaceAudit.page_intent / .intent_confidence
        └── AuditsView -> IntentBadge
              └── PATCH /api/audit/:id/page-intent
                    └── Next.js proxy -> FastAPI PATCH /audit/{id}/page-intent
                          └── UPDATE all audits WHERE url=X AND email=Y
                                └── sync_findings_for_audit per affected audit
```

---

## Testing

- `tests/test_page_intent.py` *(new)*: unit tests for `classify_page()` — paid_landing URL path hit, seo_content text hit, below-threshold falls to unknown, HTML structure signals, empty inputs.
- `tests/test_findings_sync_intent.py` *(new or extend existing)*: assert that a `seo_content` audit suppresses `cta`/`above_fold`/`headline`/`ad_signals`/`social_proof` findings, retains `load_speed`/`mobile`/`seo_foundations`.
- `tests/test_audit_db_intent.py` *(new)*: mock pool, assert `update_audit` writes all three columns; assert `get_audits_by_email` SELECT includes them.
- Backfill script: manual run on production, capture `[backfill]` log lines; verify `SELECT COUNT(*) FROM audits WHERE page_intent IS NULL AND status='completed'` drops to near-zero (residual = genuine unknowns).
- Live PATCH: verify URL-level propagation by overriding one audit and checking sibling audits for the same URL also updated.

---

## Commit Plan

1. `fix: page_intent docstring threshold 0.50 -> 0.15` — single-line fix
2. `feat: classify page intent at audit completion` — audit_engine + audit_db + audit_runner
3. `feat: page intent manual override with URL propagation` — audit_api.py PATCH route + Next.js proxy
4. `feat: surface intent badge in workspace audit list` — WorkspaceClient.tsx type fields
5. `feat: backfill page intent for existing completed audits` — scripts/backfill_page_intent.py
6. `test: page intent classifier, findings gate, db wiring` — test files

All commits to `feat/page-intent`. Merge to main after E2E verification.

---

## Definition of Done

- `SELECT COUNT(*) FROM audits WHERE page_intent IS NOT NULL AND status='completed'` is substantially non-zero after backfill.
- New audit completion writes `page_intent` column (check via `SELECT page_intent, intent_confidence FROM audits ORDER BY created_at DESC LIMIT 1`).
- `IntentBadge` renders in workspace audit list for audits with a classified intent.
- Override from badge propagates to all audits for that URL + owner.
- `journalctl` shows `intent_gate suppressed N findings` log lines for real audits.
- 639 + new tests pass. Build clean.
