# INC-0005: Root-Cron Watchdog Was Recurringly Restarting the Obsolete Service

**Status:** Resolved
**Date Detected:** 2026-07-24
**Date Introduced:** Unknown — earliest evidence 2026-07-17 (likely present since the Next.js migration off port 8765)
**Date Resolved:** 2026-07-24 00:44 UTC
**Author:** Claude (production deploy/alerting session)
**Severity:** High

---

## Situation

While wiring up Telegram alerting for `scripts/verify_production_services.sh` (following INC-0004), the very first live run of the new monitor caught `nebula-site.service` in state `activating (auto-restart)` — the obsolete unit was back, minutes after being stopped and disabled during the INC-0004 fix.

Root cause traced to `nebula_watchdog.sh`, scheduled every 5 minutes in **root's** crontab (`sudo crontab -l`, not `mike`'s — missed in the INC-0004 investigation because that only checked the user crontab). It health-checks `http://localhost:8765/` and unconditionally runs `systemctl restart nebula-site` whenever that check doesn't return 200/301/302.

Port 8765 was the pre-Next.js Python server's port (`agentic_server.py` et al., now archived to `.legacy/python-web-server/`). Nothing has listened there in a long time, so the check has been failing — and firing — every single run.

## Impact

`watchdog.log` shows `RESTART nebula-site` on 2026-07-17, 07-18, 07-19 (×2), 07-20 (×2), 07-23, and 07-24 — at least 15 times, over at least a week, likely longer (the log is trimmed to the last 1000 lines so earlier history is gone). Every one of those restarts brought the obsolete, un-canonical `nebula-site.service` back to `activating`, contending for port 3000 against the canonical `nebula-nextjs.service`. INC-0004's 14-hour stale-code outage was not a one-off mistake — it was this recurring cron job doing exactly what it was written to do, against a port that no longer means anything. It would have caused the same class of incident again on its very next successful trigger (which happened during this session, ~10 minutes after the INC-0004 fix was deployed) had it not been caught immediately by the new monitor.

## Root Cause

`nebula_watchdog.sh` was never updated when the site migrated off the port-8765 Python server to the Next.js/systemd/port-3000 architecture. It kept checking a retired port and kept "fixing" the resulting false-positive by restarting a unit that the deploy documentation explicitly says must stay off. Running as root's cron (separate from `mike`'s crontab) made it easy to miss during the INC-0004 investigation, which only checked `crontab -l` as the current user.

## Evidence

```
$ sudo crontab -l
*/5 * * * * /home/mike/nebula/nebula_watchdog.sh >> /home/mike/nebula/watchdog.log 2>&1

$ grep RESTART watchdog.log | awk '{$1=$2="";print}' | sed -E 's/\(got HTTP [0-9]+\)//' | sort | uniq -c
     21   RESTART cloudflared-tunnel
     15   RESTART nebula-site

$ sudo ss -ltnp 'sport = :8765'
(no listener)
```

## Fix

Removed the port-8765/`nebula-site` block from `nebula_watchdog.sh` entirely, with an inline comment explaining why (pointing at this incident and INC-0004). Left the other three checks untouched:
- `cloudflared-tunnel` restart-on-inactive: legitimate, fired correctly 21 times, matches the canonical unit name.
- Port 8766 (WordPress via docker): unrelated, no evidence of problems.
- Port 9000 (`nebula-webhook`): `nebula-webhook.service` is deliberately `disabled`/`inactive` right now. This check should, in principle, also be firing every run (port 9000 has nothing listening) — but `watchdog.log` shows zero `RESTART nebula-webhook` entries ever, which doesn't fully add up given the log only trims to the last 1000 lines. **Not touched in this fix** — flagged as a follow-up worth a closer look rather than acted on with the same confidence as the confirmed, actively-firing `nebula-site` bug.

Stopped the resurrected `nebula-site.service` (`sudo systemctl stop`), confirmed port 3000 still correctly owned by `nebula-nextjs.service`, then re-ran the fixed watchdog manually — it completed without touching `nebula-site`, and the service remained inactive afterward.

## Verification

`scripts/verify_production_services.sh`: 8/8 PASS after the fix. Manually invoked `nebula_watchdog.sh` post-fix — exit 0, no new `RESTART nebula-site` log line, `nebula-site.service` still `inactive` afterward. `scripts/notify_production_health.py` (new, see below) run clean against the fixed state: `{"status": "ok", "consecutive_failures": 0}`.

## Prevention

- `scripts/notify_production_health.py` now runs every 5 minutes (user crontab) and sends a Telegram alert on any `verify_production_services.sh` failure — so if this class of drift recurs (from this watchdog or anything else), it's caught and reported within 5 minutes instead of discovered incidentally during an unrelated deploy.
- Separately fixed `sre_responder.py`'s `telegram_alert()`, which was silently broken (`hermes send --chat <id>` — `--chat` isn't a valid flag; correct is `-t`/`--to`) — meaning SRE's revenue and escalation Telegram alerts have never actually been delivered. Now uses `hermes send --to telegram:5920497760`, tested and confirmed delivering.
- Also worth doing, not done in this pass: audit root's crontab (`sudo crontab -l`) as a standard part of any future infra investigation — this incident was missed once already because only the user crontab was checked.
- `scripts/health-check.sh` (a *different*, pre-existing health check in `.worktrees/nextjs-customer-platform/scripts/`, scheduled in the user crontab) has its own unrelated problems: its Telegram alerting is gated on `TELEGRAM_BOT_TOKEN`, which is never set anywhere in this environment, so it has also never actually delivered an alert. It also auto-restarts via a raw `npm start &` outside systemd from a separate worktree checkout on any failed check — the same class of anti-pattern that caused this incident and INC-0004. Not fixed in this pass; flagged for a follow-up decision since it operates in a different worktree this session didn't otherwise touch.

## Rollback

Revert `nebula_watchdog.sh` to restore the port-8765 check (not recommended — this is the bug).

## Audit Trail

- **Files changed:** nebula_watchdog.sh, sre_responder.py, scripts/notify_production_health.py (new), .gitignore
- **Related:** INC-0004, RETRO-0001
