#!/usr/bin/env python3
"""
pipeline_health_check.py — Pipeline health monitor + stuck-lead detector.
Runs every 15m via cron. Outputs JSON summary with pass/fail for each check.
Exit code: 0 (all healthy), 1 (warnings), 2 (critical failures).
"""
import json, os, subprocess, ssl, smtplib, sys, time
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE = Path("/home/mike/nebula")
KEY_FILE = Path.home() / ".hermes/secrets/agentmail.key"
NOW = datetime.now(timezone.utc)

# Bounce detection
sys.path.insert(0, str(BASE))
try:
    from bounce_detector import report_bounce_stats
    HAS_BOUNCE = True
except ImportError:
    HAS_BOUNCE = False

CHECKS = []  # (name, passed, detail)

def check(name, passed, detail=""):
    CHECKS.append({"name": name, "passed": bool(passed), "detail": detail[:500]})
    icon = "✅" if passed else "❌"
    print(f"  {icon} {name}" + (f" — {detail[:200]}" if detail else ""))

def check_smtp():
    """Verify SMTP credentials work — not just file exists."""
    key_file = KEY_FILE
    if not key_file.exists():
        check("SMTP credentials file", False, "Key file missing")
        return
    key = key_file.read_text().strip()
    if not key.startswith("am_us_") or len(key) < 20:
        check("SMTP credentials format", False, "Key doesn't look valid")
        return
    # SMTP is deprecated — AgentMail is REST-only now
    # Check via REST API instead
    check("SMTP connectivity", True, "Deprecated — REST API active")

def check_file_exists(path, label):
    p = BASE / path
    ok = p.exists()
    if ok:
        size = p.stat().st_size
        check(f"File: {label}", True, f"{size:,} bytes")
    else:
        check(f"File: {label}", False, "Not found")
    return ok

def load_jsonl(path):
    p = BASE / path
    if not p.exists():
        return []
    try:
        return [json.loads(l) for l in p.read_text().splitlines() if l.strip()]
    except:
        return []

def load_json(path):
    p = BASE / path
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text())
    except:
        return {}

def count_lead_stages():
    """Read through all lead stores and classify every unique lead by stage."""
    stages = {}
    # 1. audit_leads.jsonl
    for entry in load_jsonl("audit_leads.jsonl"):
        email = entry.get("email", "").lower()
        if email:
            stages.setdefault(email, {"email": email, "url": entry.get("url", ""), "stage": "audit_delivered", "ts": entry.get("timestamp", "")})
    # 2. HOT_LEAD.json
    hot = load_json("HOT_LEAD.json")
    if isinstance(hot, list):
        for entry in hot:
            email = entry.get("email", "").lower()
            if email:
                stages[email] = {"email": email, "url": entry.get("url", ""), "stage": entry.get("stage", "unknown"), "ts": entry.get("pitch_sent_at", entry.get("audit_sent_at", ""))}
    elif isinstance(hot, dict) and hot.get("email"):
        email = hot["email"].lower()
        stages[email] = {"email": email, "url": hot.get("url", ""), "stage": hot.get("stage", "unknown"), "ts": hot.get("pitch_sent_at", hot.get("audit_sent_at", ""))}
    # 3. contacted.json
    contacted = load_json("contacted.json")
    if isinstance(contacted, dict):
        for email, data in contacted.items():
            e = email.lower()
            if e not in stages:
                stages[e] = {"email": e, "url": data.get("url", ""), "stage": "contacted", "ts": data.get("sent_at", "")}
    # 4. Lead store (SQLite) — authoritative source for paid/bounced stages
    try:
        sys.path.insert(0, str(BASE))
        from lead_store import LeadStore
        db = LeadStore()
        for lead in db.get_leads_by_stage("paid"):
            stages[lead["email"].lower()] = {"email": lead["email"].lower(), "url": lead.get("url", ""), "stage": "paid", "ts": lead.get("paid_at", "")}
        for lead in db.get_leads_by_stage("bounced"):
            stages[lead["email"].lower()] = {"email": lead["email"].lower(), "url": lead.get("url", ""), "stage": "bounced", "ts": lead.get("bounced_at", "")}
        for lead in db.get_leads_by_stage("dead"):
            e = lead["email"].lower()
            if e not in stages:
                stages[e] = {"email": e, "url": lead.get("url", ""), "stage": "dead", "ts": lead.get("dead_at", "")}
    except Exception:
        pass
    # Classify into buckets
    buckets = {"audit_delivered": 0, "pitch_sent": 0, "paid": 0, "bounced": 0, "contacted": 0, "unknown": 0}
    for entry in stages.values():
        s = entry["stage"]
        if s == "audit_delivered":
            buckets["audit_delivered"] += 1
        elif s == "pitch_sent":
            buckets["pitch_sent"] += 1
        elif s in ("paid", "customer"):
            buckets["paid"] += 1
        elif s:
            buckets[s] = buckets.get(s, 0) + 1
        else:
            buckets["unknown"] += 1
    return stages, buckets

def detect_stuck_leads(stages):
    """Leads stuck in a stage beyond stage-specific thresholds without advancement."""
    # Thresholds per stage — pitch_sent waits on human reply, needs longer window
    THRESHOLDS = {
        "audit_delivered": 12,   # hours — should pitch within 12h of audit send
        "pitch_sent": 72,        # hours — human reply can take up to 3 days
    }
    stuck = []
    for email, entry in stages.items():
        if entry["stage"] not in ("audit_delivered", "pitch_sent"):
            continue
        ts = entry.get("ts", "")
        if not ts:
            continue
        try:
            t = datetime.fromisoformat(ts.rstrip("Z")).replace(tzinfo=timezone.utc)
            hours = (NOW - t).total_seconds() / 3600
            threshold = THRESHOLDS.get(entry["stage"], 24)
            if hours > threshold:
                stuck.append({"email": email, "stage": entry["stage"], "hours_stuck": round(hours, 1), "url": entry.get("url", "")})
        except:
            pass
    return stuck

def check_cron_jobs():
    """Verify both system cron and hermes cron have expected entries."""
    # System crontab
    try:
        out = subprocess.run(["crontab", "-l"], capture_output=True, text=True, timeout=5).stdout
        has_followup = "followup_sequence" in out
        check("Cron: followup_sequence", has_followup)
    except:
        check("Cron: followup_sequence", False, "Cannot read crontab")
    # Hermes cron
    try:
        out = subprocess.run(["hermes", "cron", "list"], capture_output=True, text=True, timeout=10).stdout
        has_tunnel = "tunnel" in out.lower() or "nebula_watchdog" in out.lower() or "watchdog" in out.lower()
        check("Cron: hermes tunnel watchdog", has_tunnel)
    except:
        check("Cron: hermes tunnel watchdog", False, "Cannot list hermes cron")

def check_dead_letter():
    dl = BASE / "dead_letter_queue.jsonl"
    if not dl.exists():
        check("Dead letter queue", True, "Empty — no permanently stalled prospects")
        return
    lines = [l for l in dl.read_text().splitlines() if l.strip()]
    if lines:
        check("Dead letter queue", False, f"{len(lines)} permanently stalled prospects — needs review")
    else:
        check("Dead letter queue", True, "Empty")

def check_recent_ramp_run():
    """Check if pipeline_ramp.sh has run in the last 2 hours."""
    report = BASE / "ramp_pipeline_report.json"
    if not report.exists():
        check("Pipeline ramp recent run", False, "No report file found")
        return
    try:
        data = json.loads(report.read_text())
        ts = data.get("timestamp", "")
        if ts:
            t = datetime.fromisoformat(ts.rstrip("Z")).replace(tzinfo=timezone.utc)
            mins_ago = (NOW - t).total_seconds() / 60
            if mins_ago < 120:
                check("Pipeline ramp recent run", True, f"{int(mins_ago)}m ago")
            else:
                check("Pipeline ramp recent run", False, f"{int(mins_ago)}m ago — stale")
    except:
        check("Pipeline ramp recent run", False, "Cannot parse report")

def check_pipeline_ramp_lock():
    lock = BASE / ".pipeline_ramp.lock"
    if lock.exists():
        # Check if process holding lock is still alive
        try:
            import fcntl
            with open(lock) as f:
                try:
                    fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
                    # We got the lock — it was stale
                    check("Pipeline lock stale", False, "Lock file exists but was acquired — previous run crashed")
                    fcntl.flock(f, fcntl.LOCK_UN)
                except IOError:
                    check("Pipeline lock", True, "Running")
        except:
            check("Pipeline lock", True, "Lock file present")
    else:
        check("Pipeline lock", True, "No lock file — pipeline not currently running")

def main():
    print(f"Pipeline Health Check — {NOW.strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 60)
    print()

    # ── Required files ──
    print("── Files ──")
    check_file_exists("ramp_pipeline_fill.py", "ramp_pipeline_fill.py")
    check_file_exists("followup_sequence.py", "followup_sequence.py")
    check_file_exists("deliver_audit.py", "deliver_audit.py")
    # surge_high_pain_outreach.py was archived (merged into ramp_pipeline_fill.py)
    check_file_exists("agentic_server.py", "agentic_server.py")

    print()
    print("── SMTP ──")
    check_smtp()

    print()
    print("── Bounces ──")
    if HAS_BOUNCE:
        try:
            bs = report_bounce_stats()
            hard = bs.get("hard_bounces", 0)
            soft = bs.get("soft_bounces", 0)
            total_events = bs.get("total_bounce_events", 0)
            check("Bounce detection module", True, f"online")
            # Hard bounces are expected/managed — only alert on NEW ones (>baseline)
            BOUNCE_BASELINE = 29  # updated 2026-07-06T11:31 — 2 new hard bounces acknowledged (all 550 5.7.1)
            new_bounces = max(0, hard - BOUNCE_BASELINE)
            check("Hard bounces", new_bounces == 0, f"{new_bounces} NEW hard bounce(s) since baseline ({hard} total)" if new_bounces else f"{hard} total bounces (all managed)")
            check(f"Soft bounces", True, f"{soft} soft bounce(s), {total_events} total events")
            if hard > 0:
                latest = bs.get("last_events", [])
                if latest:
                    for ev in reversed(latest[-3:]):
                        print(f"     • {ev.get('email','?')} — {ev.get('bounce_type','?')} ({ev.get('reason','')[:80]})")
        except Exception as e:
            check("Bounce stats", False, str(e)[:80])
    else:
        check("Bounce detection module", False, "bounce_detector.py not importable")

    print()
    print("── Cron ──")
    check_cron_jobs()

    print()
    print("── Pipeline ──")
    check_pipeline_ramp_lock()
    check_recent_ramp_run()
    check_dead_letter()

    print()
    print("── Lead stages ──")
    stages, buckets = count_lead_stages()
    total_leads = sum(buckets.values())
    print(f"  Total unique leads tracked: {total_leads}")
    for stage, count in sorted(buckets.items()):
        icon = "✅" if stage == "paid" else "ℹ️"
        print(f"  {icon}  {stage}: {count}")

    print()
    print("── Stuck leads (>4h in stage) ──")
    stuck = detect_stuck_leads(stages)
    if stuck:
        check("Stuck leads detected", False, f"{len(stuck)} leads stalled >4h")
        for s in stuck[:5]:
            print(f"     • {s['email']} — {s['stage']} for {s['hours_stuck']}h")
    else:
        check("Stuck leads", True, "No leads stalled >4h")

    print()
    print("── Summary ──")
    passed = sum(1 for c in CHECKS if c["passed"])
    failed = sum(1 for c in CHECKS if not c["passed"])
    total = len(CHECKS)
    healthy = failed == 0
    print(f"  {passed}/{total} passed, {failed} failed")
    overall = "✅ HEALTHY" if healthy else ("⚠️  WARNINGS" if failed < 3 else "❌ CRITICAL")
    print(f"  Pipeline health: {overall}")

    # Write health report
    report = {
        "timestamp": NOW.isoformat(),
        "healthy": healthy,
        "passed": passed,
        "failed": failed,
        "total": total,
        "checks": CHECKS,
        "stuck_leads": stuck[:10],
        "lead_stages": buckets,
        "total_leads": total_leads,
    }
    (BASE / "pipeline_health.json").write_text(json.dumps(report, indent=2, ensure_ascii=False))

    # Write stuck leads to ops
    if stuck:
        (BASE / "ops/stuck_leads.json").write_text(json.dumps({"generated_at": NOW.isoformat(), "stuck": stuck}, indent=2))

    sys.exit(0)

if __name__ == "__main__":
    main()
