# INC-0004: Obsolete `nebula-site.service` Served Stale Code in Production for 14+ Hours

**Status:** Resolved
**Date Detected:** 2026-07-24
**Date Introduced:** 2026-07-23 (approx. 09:58 UTC)
**Date Resolved:** 2026-07-24 00:31 UTC
**Author:** Claude (deploy session)
**Severity:** High

---

## Situation

Asked to "build and deploy changes" after the INC-0001–INC-0003 fixes. Checking `nebula-nextjs.service` (the canonical, documented production unit per `deploy/systemd/README.md`) before restarting it showed it had been `failed` since **2026-07-23 09:58 UTC** — over 14 hours — crash-looping on `EADDRINUSE: address already in use :::3000` until it exhausted systemd's restart limit.

Investigating what actually held port 3000 found `nebula-site.service` — the *obsolete alias* the README explicitly states "must remain disabled/inactive" — `active (running)` since 2026-07-23 22:03 UTC, started manually (`disabled` for boot, but running). It was serving a build from before any of this session's security fixes existed.

## Impact

- `nebulacomponents.shop` continued serving traffic throughout the window (the obsolete service kept the site up), so there was no visible outage from a visitor's perspective — but the site was running whatever code was in place when `nebula-site.service` was started, meaning **none of the INC-0001/INC-0002 security fixes (webhook signature enforcement, signed audit-unlock cookie) or the Stripe purchase-persistence fix were live in production** for the ~2.5 hours between that commit landing and this deploy.
- The canonical, monitored, systemd-managed service was down and alarming (crash-loop failed state) for 14+ hours with no indication anyone had responded, because the obsolete service masked the outage by keeping the site reachable.
- `scripts/verify_production_services.sh` — which exists specifically to catch this class of drift (it checks `nebula-site.service enabled=disabled active=inactive` as one of its 8 assertions) — was not run during that window. Had it been run, it would have failed immediately and surfaced the problem.

## Root Cause

Two compounding issues:
1. Something/someone started `nebula-site.service` directly (bypassing the canonical unit), almost certainly as an ad hoc attempt to get the site back up after `nebula-nextjs.service` started crash-looping around 09:58 UTC — a reasonable-looking fix in the moment that violated the documented "two canonical owners" rule and created exactly the confusing double-service state the README's own warning exists to prevent.
2. No monitoring caught the drift for 14+ hours. `verify_production_services.sh` exists and would have caught it on the first run, but nothing runs it on a schedule — it's a manual/on-demand script, not a cron-scheduled health check.

## Evidence

```
$ systemctl status nebula-nextjs.service
Active: failed (Result: exit-code) since Thu 2026-07-23 09:58:04 UTC; 14h ago
Process: 1760083 ExecStart=/home/mike/.local/bin/npm run start (code=exited, status=1/FAILURE)

$ journalctl -u nebula-nextjs.service | tail
Error: listen EADDRINUSE: address already in use :::3000

$ ss -ltnp 'sport = :3000'
LISTEN 0 511 *:3000 *:* users:(("next-server (v1",pid=2159614,...))
$ cat /proc/2159614/cgroup
0::/system.slice/nebula-site.service

$ systemctl status nebula-site.service
Loaded: loaded (...; disabled; preset: enabled)
Active: active (running) since Thu 2026-07-23 22:03:06 UTC; 2h 24min ago
```
Process 2159614 started 2026-07-23 22:03:05 UTC — before commit 7593dd8c (2026-07-24 00:03:20 UTC), confirming it was serving pre-fix code.

## Fix

1. `sudo systemctl stop nebula-site.service` (freed port 3000)
2. `sudo systemctl disable nebula-site.service` (already disabled for boot, confirmed)
3. `sudo systemctl reset-failed nebula-nextjs.service` (clear the exhausted restart counter)
4. Fresh, verified build per the documented deploy process: `npm ci --include=dev && npm run ci` (typecheck + lint + citable-projection check + `next build` + full test suite — all clean, 105 routes, 72/72 tests)
5. `sudo systemctl start nebula-nextjs.service`

## Verification

`scripts/verify_production_services.sh`: 8/8 PASS, including `nebula-site.service enabled=disabled active=inactive`, `port 3000 listener ... belongs to nebula-nextjs.service`, and both `http://127.0.0.1:3000/` and `https://nebulacomponents.shop/` returning 200. Additionally smoke-tested the SSRF guard (INC-0002-adjacent fix) directly against the live domain — `POST /api/audit/start` with a `169.254.169.254` target returned the expected `{"error":"URL is not a public address"}`, confirming the new build is actually serving, not cached.

## Prevention

`verify_production_services.sh` catching this on the first run but not running automatically is the real gap. It should be added to a scheduled health check (e.g. alongside `pipeline_health_check.py`'s cadence) so drift between the canonical and obsolete units is caught within minutes, not discovered 14+ hours later during an unrelated deploy. Not yet implemented — flagged as an open thread rather than done silently, since scheduling it is a judgment call about alert routing (where should a FAIL here notify) that's Mike's to make.

## Rollback

None applicable — the fix restores the documented canonical state. Reverting would mean re-starting `nebula-site.service`, which is the bug, not a rollback option.

## Audit Trail

- **Action:** stopped `nebula-site.service`, started `nebula-nextjs.service` with a fresh verified build (no code changes — this incident was infrastructure state, not source)
- **Related:** INC-0001, INC-0002, RETRO-0001
