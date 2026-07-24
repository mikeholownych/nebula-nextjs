# INC-0003: Bulk Archive Move Broke 3 Live Scripts' Imports

**Status:** Resolved
**Date Detected:** 2026-07-24
**Date Introduced:** 2026-07-23
**Date Resolved:** 2026-07-24
**Author:** Claude (repo review)
**Severity:** Medium

---

## Situation

On 2026-07-23, "40 tracked scripts formerly under `archived/`" were moved intact to `.legacy/outreach-wave-archive-2026-07-23/` as part of an outbound-bypass cleanup (see `.legacy/ARCHIVE_INVENTORY.md`, "Historical outreach-wave directory cutover"). `ledger_metrics.py` — a genuinely live, self-contained metrics module with no relation to the SMTP/REST outbound bypasses that move was meant to clean up — was swept into that directory move without an individual reference check. `challenge_risk_monitor.py`, `audit_quality_review.py`, and `normalize_public_stats.py` each do `from ledger_metrics import ...` at module level and were left broken (`ModuleNotFoundError`) for approximately 24 hours until this was caught during an unrelated repo review.

## Impact

Three scripts non-functional for ~1 day: `challenge_risk_monitor.py` (risk monitoring), `audit_quality_review.py`, `normalize_public_stats.py`. None of the three are in the live crontab, so there's no evidence a scheduled run actually failed during the window — but any manual or ad hoc invocation would have errored immediately on import.

## Root Cause

The archive move was a wholesale directory move ("preserve first" bulk operation) rather than a per-file dependency check. `ledger_metrics.py` happened to live in the same source directory (`archived/`) as the actual outbound-bypass scripts being cleaned up, despite being unrelated in purpose and still having live importers elsewhere in the tree.

## Evidence

```
$ python3 -c "import ledger_metrics"
ModuleNotFoundError: No module named 'ledger_metrics'
$ grep -rn "from ledger_metrics import" .
challenge_risk_monitor.py:11:from ledger_metrics import summary, load_hot_leads
audit_quality_review.py:10:from ledger_metrics import summary, load_hot_leads
normalize_public_stats.py:9:from ledger_metrics import summary
```

## Fix

Restored `ledger_metrics.py` from `.legacy/outreach-wave-archive-2026-07-23/` to the repo root via `git mv` (preserves history). Confirmed the module is self-contained — stdlib only, hardcoded `BASE = Path('/home/mike/nebula')`, no dependency on the outbound-bypass code around it — so restoring it does not reintroduce any of the risk the original archive move addressed.

## Verification

`import ledger_metrics` succeeds; `ledger_metrics.summary()` runs and returns real data; all three importing scripts execute cleanly at module level (tested via `importlib.util.spec_from_file_location` + `exec_module`). Full Python test suite: 283/283 passing before and after.

## Prevention

Bulk "move N files from directory X to Y" archive operations should include an automated reverse-reference check (grep the moved basenames against the rest of the tree) before or immediately after the move, not rely on the mover's manual judgment of "these all look related." No such check exists yet — worth adding as a small script if bulk archive moves happen again (they have, at least twice, per `ARCHIVE_INVENTORY.md`).

## Rollback

Re-archive `ledger_metrics.py` (not recommended — this immediately re-breaks the three importers).

## Audit Trail

- **Commit:** (restoration committed alongside the broader repo-review fix commit; see `.legacy/ARCHIVE_INVENTORY.md` "Restoration — ledger_metrics.py" entry for the detailed reasoning)
- **Files changed:** ledger_metrics.py (restored), .legacy/ARCHIVE_INVENTORY.md
- **Related:** RETRO-0001
