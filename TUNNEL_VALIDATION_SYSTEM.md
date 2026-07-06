# TUNNEL VALIDATION & LIVELINESS SYSTEM

## Problem You Identified

**Cloudflare tunnel goes down during campaign execution**, blocking all customer access while local infrastructure stays up. This is a critical blind spot — without monitoring, we don't know the tunnel is down until manually checking.

---

## Solution Deployed

### 1. **Tunnel Liveliness Monitor** (Every 5 minutes)
**File:** `tunnel_liveliness_check.py`  
**Cron:** `tunnel_liveliness` (*/5 * * * *)

Checks:
- ✅ Local endpoint (http://localhost:8765) responding
- ✅ Tunnel endpoint (https://nebulacomponents.shop) responding
- ✅ Sync status (are they in sync?)
- ✅ Latency measurements

Logs to:
- `/home/mike/nebula/tunnel_liveliness.log` (human-readable)
- `/home/mike/nebula/tunnel_metrics.json` (machine-readable)
- `/home/mike/nebula/tunnel_alerts.txt` (critical alerts only)

**Alert Conditions:**
- 🚨 CRITICAL: Local up + tunnel down (site blocked from outside)
- 🚨 CRITICAL: Both down (infrastructure failure)
- ⚠️ WARNING: Tunnel degraded (slow responses)

---

### 2. **Tunnel Watchdog** (Every 5 minutes)
**Cron:** `tunnel_watchdog` (*/5 * * * *)

Checks if `cloudflared` process is running.  
If not, automatically restarts it:
```bash
cloudflared tunnel run 8cfcc2e1-cf49-4d57-b412-c1ec0474ffd2
```

Logs all restarts to `/home/mike/nebula/tunnel_restarts.log`  
Alerts if restarted 3+ times in one hour (indicates recurring failure, needs investigation)

---

### 3. **Pre-Campaign Validation** (Before Wave 2)
**Script:** `validate_before_campaign.py`

Mandatory checklist before launching any email campaign:

```
✅ Local Endpoint (8765) — Is the site up locally?
✅ Cloudflare Tunnel — Can customers access it?
✅ SMTP Credentials — Do we have AgentMail API key?
✅ SMTP Connectivity — Can we send emails?
✅ Wave 1 Results — Did previous wave create data?
✅ Wave 2 Script — Is campaign code ready?
✅ Auto-Responder — Is reply handler ready?
✅ Cron Jobs — Are checkpoints deployed?
✅ Tracking Log — Can we write delivery logs?
✅ Tunnel Metrics — Can we collect metrics?
```

**Exit Code:**
- 0 = All green, safe to launch
- 1 = Failures detected, fix before proceeding

---

## Metrics Tracked

### Uptime Percentage (continuously updated)
```json
{
  "checks_total": 288,
  "tunnel_up": 280,
  "tunnel_down": 8,
  "tunnel_uptime_pct": 97.22,
  "sync_uptime_pct": 98.6,
  "local_up": 288,
  "local_down": 0
}
```

### Alert History (last 100 entries)
```json
{
  "timestamp": "2026-06-24T17:00:15.123456",
  "alert": "CRITICAL: Local site up but tunnel down — customer access blocked"
}
```

---

## Pre-Campaign Validation Output

Run before Wave 2 launches:
```bash
$ python3 /home/mike/nebula/validate_before_campaign.py

🚀 PRE-CAMPAIGN VALIDATION
   Time: 2026-06-24T16:59:35
   Target: Wave 2 Deployment Check

🔍 Local Endpoint (8765)... ✅
🔍 Cloudflare Tunnel... ❌  ← FAILURE DETECTED
🔍 SMTP Credentials File... ✅
🔍 SMTP Connectivity... ✅
🔍 Wave 1 Results... ❌ ← Expected (hasn't run yet)
🔍 Wave 2 Script Ready... ✅
🔍 Auto-Responder Script... ✅
🔍 Cron Jobs Deployed... ✅
🔍 Tracking Log Ready... ✅
🔍 Tunnel Metrics Ready... ✅

============================================================
PRE-CAMPAIGN VALIDATION REPORT
============================================================

📊 Results: 8/10 checks passed

❌ FAILURES:
   • Cloudflare Tunnel
   • Wave 1 Results (expected)

============================================================
❌ FAILURES DETECTED — Fix before launching Wave 2
============================================================
```

---

## Integration with Challenge Timeline

| Time | Check | Action |
|------|-------|--------|
| **Now (16:59)** | Pre-campaign validation | Must PASS before Wave 2 launch |
| **Every 5 min** | Tunnel liveliness | Runs continuously, logs metrics |
| **Every 5 min** | Tunnel watchdog | Restarts if crashed |
| **Tonight 21:00** | Wave 2 launch | Only if pre-campaign validation passes |
| **Every 6 hours** | Self-audit checkpoint | Reports tunnel uptime % |
| **Tomorrow 10:36 AM** | 24-hour checkpoint | Forced pivot if tunnel unreliable |

---

## Failure Recovery Path

**Scenario 1: Tunnel down at Wave 2 launch time**
1. Pre-campaign validation catches it (exit code 1)
2. We DO NOT launch Wave 2
3. Tunnel watchdog auto-restarts cloudflared
4. Liveliness monitor verifies recovery
5. Re-run validation when ready

**Scenario 2: Tunnel crashes during campaign**
1. Liveliness monitor detects within 5 minutes
2. Alert logged to tunnel_alerts.txt
3. Watchdog auto-restarts within 5 minutes
4. Self-audit checkpoint (6h) reports the outage
5. We decide: continue or pivot

**Scenario 3: Tunnel flapping (repeatedly crashing)**
1. Watchdog logs 3+ restarts in 1 hour
2. Alerts to operator (you)
3. Self-audit checkpoint flags as unreliable
4. Decision at 24h checkpoint: fix tunnel or switch channels

---

## What Doesn't Get Theater'd

With this system, we can NO LONGER claim:
- ❌ "I think the tunnel is up" → We have metrics
- ❌ "The campaign is live" → We verify delivery through tunnel
- ❌ "Everything is fine" → We report actual uptime %

---

## Next Steps

1. **Verify tunnel is back up:**
   - Run `validate_before_campaign.py` before Wave 2 tonight
   - Only launch if validation passes

2. **Monitor continuously:**
   - Liveliness checks every 5 minutes
   - Watchdog restarts if needed
   - Metrics accumulated in `tunnel_metrics.json`

3. **Report at checkpoints:**
   - 6-hour self-audit includes tunnel uptime %
   - If uptime < 90%, consider alternative distribution (Reddit, Twitter)

4. **Post-mortem:**
   - Analyze why tunnel goes down
   - Document failure pattern
   - Decide: fix Cloudflare setup or add redundancy (secondary tunnel)

---

## Files Created

| File | Purpose |
|------|---------|
| `tunnel_liveliness_check.py` | Validation script (run every 5 min) |
| `tunnel_liveliness.log` | Human-readable monitoring log |
| `tunnel_metrics.json` | Machine-readable uptime metrics |
| `tunnel_alerts.txt` | Critical alerts only |
| `tunnel_restarts.log` | Watchdog restart log |
| `validate_before_campaign.py` | Pre-campaign validation checklist |
| `pre_campaign_validation.json` | Validation report (JSON) |

---

## Current Status

**Deployed:** 
- ✅ Tunnel liveliness monitor (cron job: `tunnel_liveliness`)
- ✅ Tunnel watchdog (cron job: `tunnel_watchdog`)
- ✅ Pre-campaign validation script

**Ready for Wave 2:**
- ⏳ Waiting on tunnel to come back up
- ⏳ Once up, run pre-campaign validation
- ⏳ If validation passes, launch Wave 2 @ 21:00 tonight

---

**Bottom line:** We now have visibility into tunnel health. No more blind spots. If the tunnel goes down, we'll know in 5 minutes, and the watchdog will auto-restart. Before launching any campaign, we validate that the tunnel is actually up.
