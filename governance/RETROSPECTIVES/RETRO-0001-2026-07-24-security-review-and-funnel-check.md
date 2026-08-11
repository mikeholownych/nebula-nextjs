# RETRO-0001: Full Repo Review, Security Fixes, and a Funnel Reality Check

**Status:** Complete
**Date:** 2026-07-24
**Author:** Claude (repo review)
**Period Covered:** Single session, 2026-07-23 to 2026-07-24

---

## What Happened

A full repo review (security, CLAUDE.md operational-checklist compliance, repo hygiene, customer-portal app quality) surfaced 14 concrete issues, all fixed and verified in one pass: an AgentMail webhook that accepted unsigned requests (INC-0001), an audit-unlock cookie that gated on presence rather than validity (INC-0002), five non-atomic writers to `HOT_LEAD.json`/`contacted.json` (one of which - `deliver_mirowl_audit.py` - was clobbering the entire shared file with a single lead's record instead of upserting), Stripe purchases that were logged but never persisted anywhere, bounce checks that failed open on exception, an SSRF-shaped route, bare `python3` bypassing the venv in the live crontab and 12 shell wrappers, and a pile of repo-hygiene debt (dead scripts, tracked runtime-state churn, stale binaries). Commit 7593dd8c. Full detail in each INC-000x file and the session transcript.

Separately, `ledger_metrics.py` was found broken (INC-0003) - swept into an unrelated bulk archive move the day before - and restored.

After the fixes shipped, a direct question ("what should I be focusing on that I may not have thought through") prompted pulling the actual funnel numbers rather than assuming the codebase's correctness was the bottleneck.

## What Worked

- The fix-and-verify loop held: every change was checked against the real test suites (283 Python tests, 72 JS tests) and, where relevant, against real running state (SQLite integrity checks post-backup, a live `pg_dump` against the actual local Postgres, a live crontab edit with before/after diff).
- `ledger_metrics.summary()` - existing, already-written code - was enough to get a real revenue number in one call. The instrumentation to see the truth already existed; it just wasn't being looked at as the primary signal.
- The `.legacy/ARCHIVE_INVENTORY.md` paper-trail convention made the INC-0003 root cause traceable in under five minutes instead of requiring archaeology.

## What Didn't

- **DEC-0002 (2026-07-07) already diagnosed this exact problem** - "27 pitch sends, 0 conversions" - and shipped an ICP quality gate as the fix. Seventeen days later, `HOT_LEAD.json` shows the same count, 27 leads at `stage: pitch_sent`, and the ledger still shows zero real payments ever. The gate likely improved lead *quality* going forward (worth confirming with fresh cohort data), but it did not convert the existing backlog, and nothing since 07-07 appears to have followed up on whether the fix actually moved the conversion needle. This is exactly the failure mode VALUES.md #7 ("every 30 days: retrospective on what worked, what didn't") exists to catch - and no retrospective happened in the 17 days between the fix and this one.
- `governance/INCIDENTS/` and `governance/RETROSPECTIVES/` were empty despite VALUES.md #6 explicitly requiring incident postmortems there. The 2026-07-07 root-cause writeup that should arguably have been an incident report was instead filed as DEC-0002 (a defensible choice, but it means INCIDENTS/ has never been used for its stated purpose until this entry).
- No backup of `lead_state.db`, `nebula.db`, `outbound_delivery.db`, or the Postgres `nebula_platform` database existed anywhere before this session, on a single machine, for the only copy of the business's lead and purchase history.
- `OUTREACH_DISABLED` (set 2026-07-23 20:11 UTC for a reply-ledger-v2 cutover) is currently blocking the 25 recycle-eligible `pitch_sent`/no-payment leads from any further follow-up. Unknown at time of writing whether the cutover's post-deploy verification is complete.

## Open Threads

- **Why hasn't a single real Stripe checkout session ever been initiated**, across the entire payment ledger history (only two `cs_test_...` rows exist)? This is upstream of price - nobody has been motivated enough to click "buy" even once. Needs direct investigation: read the actual pitch email copy, check whether the audit itself demonstrates enough value, check inbox placement (spam vs. primary) if that data exists anywhere.
- **Is the reply-ledger-v2 cutover verification done?** If yes, lift `OUTREACH_DISABLED` - every day it stays on, the 25 recycle candidates go colder. If no, what's the blocker and when will it clear?
- **27% hard-bounce rate (13/48 in HOT_LEAD.json)** - separate from the conversion problem, this is pure wasted send volume from weak email verification. Fixable independently and immediately.
- **Did DEC-0002's ICP gate actually work?** Nobody has pulled before/after cohort data (leads sourced pre- vs. post-07-07) to check reply rate or bounce rate improvement. The gate should be evaluated on its own evidence, not assumed effective because it shipped.

## Action Items

- [ ] Decide whether `OUTREACH_DISABLED` can be lifted - Mike - ASAP, blocking 25 leads
- [ ] Investigate the zero-checkout-click problem directly (read actual pitch copy + audit output sent to real leads) - owner TBD
- [ ] Pull DEC-0002 before/after cohort metrics to confirm the ICP gate is actually working - owner TBD
- [ ] Set up off-machine copy of the new `backups/` directory (local backup as of this session protects against corruption/deletion, not disk/machine failure) - Mike, needs credentials for a remote destination
- [ ] Establish the 30-day retrospective cadence VALUES.md #7 calls for - next one due ~2026-08-23

## Related

- Decisions: DEC-0002 (ICP quality gate - the fix that this retro found didn't fully resolve the underlying problem)
- Incidents: INC-0001, INC-0002, INC-0003
