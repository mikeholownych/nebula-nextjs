# INC-XXXX: [Incident Name]

**Status:** Open | Resolved | Monitoring
**Date Detected:** YYYY-MM-DD
**Date Resolved:** YYYY-MM-DD
**Author:** [Agent / Person]
**Severity:** Critical | High | Medium | Low

---

## Situation

What broke, and how was it detected?

## Impact

Who/what was affected, for how long, and what's the concrete blast radius (data, money, trust, availability)?

## Root Cause

Not the symptom - the actual mechanism. Per VALUES.md #9, every incident must trace to a root cause, not a patch on the symptom.

## Evidence

Logs, file:line, commands run, reproduction steps.

## Fix

What changed, and why this fix addresses the root cause rather than the symptom.

## Verification

How was the fix confirmed to work (tests, manual repro, monitoring)?

## Prevention

What stops this class of bug from recurring - a test, a lint rule, a process change? A fix without prevention is a stopgap (VALUES.md #9 requires the proper fix within 7 days if this is one).

## Rollback

How to undo the fix if it causes a regression.

## Audit Trail

- **Commit:**
- **Files changed:**
- **Related decisions/retrospectives:**
