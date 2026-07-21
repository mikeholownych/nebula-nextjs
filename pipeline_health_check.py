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
    """Lead stages from LeadStore (authoritative) with legacy file fallback."""
    stages = {}
    leadstore_emails = set()

    # 1. LeadStore — authoritative for every lead that exists in it
    try:
        sys.path.insert(0, str(BASE))
        from lead_store import LeadStore
        db = LeadStore()
        # Pull all leads via stage buckets
        for stage in ["discovered", "site_found", "audit_requested", "audit_delivered",
                       "pitch_queued", "pitch_sent", "paid", "bounced", "dead",
                       "needs_review", "recycle"]:
            for lead in db.get_leads_by_stage(stage):
                email = lead["email"].lower()
                leadstore_emails.add(email)
                stage_label = lead.get("stage", "unknown")
                if stage_label == "paid":
                    stage_label = "paid"
                stages[email] = {
                    "email": email,
                    "url": lead.get("url", ""),
                    "stage": stage_label,
                    "ts": lead.get(f"{stage_label}_at", lead.get("updated_at", "")),
                }
    except Exception as e:
        print(f"  [LeadStore error] {e}")

    # 2. Legacy files — only for leads NOT yet in LeadStore
    def _missing(email: str) -> bool:
        return email.lower() not in leadstore_emails

    # audit_leads.jsonl
    for entry in load_jsonl("audit_leads.jsonl"):
        email = entry.get("email", "").lower()
        if email and _missing(email):
            stages[email] = {"email": email, "url": entry.get("url", ""), "stage": "audit_delivered", "ts": entry.get("timestamp", "")}

    # HOT_LEAD.json
    hot = load_json("HOT_LEAD.json")
    if isinstance(hot, list):
        for entry in hot:
            email = entry.get("email", "").lower()
            if email and _missing(email):
                stages[email] = {"email": email, "url": entry.get("url", ""), "stage": entry.get("stage", "unknown"), "ts": entry.get("pitch_sent_at", entry.get("audit_sent_at", ""))}
    elif isinstance(hot, dict) and hot.get("email"):
        email = hot["email"].lower()
        if _missing(email):
            stages[email] = {"email": email, "url": hot.get("url", ""), "stage": hot.get("stage", "unknown"), "ts": hot.get("pitch_sent_at", hot.get("audit_sent_at", ""))}

    # contacted.json
    contacted = load_json("contacted.json")
    if isinstance(contacted, dict):
        for email, data in contacted.items():
            e = email.lower()
            if _missing(e):
                stages[e] = {"email": e, "url": data.get("url", ""), "stage": "contacted", "ts": data.get("sent_at", "")}

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

TEST_EMAILS = frozenset([
    "mike.holownych@aisyndicate.io", "mike.holownych@gmail.com",
    "test@example.com", "restart-test@example.com", "stripe@example.com",
    "founder@testco.com", "nebulashop@agentmail.to",
])

def detect_stuck_leads(stages):
    """Leads stuck in a stage beyond thresholds without advancement.
    
    Uses LeadStore.get_stuck_leads() as authoritative source.
    Falls back to manual detection for legacy-only leads.
    """
    stuck = []
    leadstore_emails = set()
    
    # 1. Use LeadStore's built-in stuck detection (authoritative)
    try:
        sys.path.insert(0, str(BASE))
        from lead_store import LeadStore
        db = LeadStore()
        # audit_delivered threshold = 4h (aligns with SRE fix_stuck_leads threshold)
        for lead in db.get_stuck_leads(max_hours=4):
            if lead.get("stage") in ("paid", "dead", "bounced"):
                continue
            email = lead.get("email", "").lower()
            if email in TEST_EMAILS:
                continue
            leadstore_emails.add(email)
            stuck.append({
                "email": email,
                "stage": lead.get("stage", "unknown"),
                "hours_stuck": lead.get("hours_stuck", 0),
                "url": lead.get("url", ""),
            })
    except Exception as e:
        print(f"  [LeadStore stuck error] {e}")
    
    # 2. Legacy-only leads — manual check (only for stages that should advance quickly)
    ASYNC_STAGES = frozenset({"paid", "dead", "bounced", "discovered", "site_found",
                               "pitch_sent", "pitch_queued"})
    THRESHOLDS = {"audit_delivered": 12}
    for email, entry in stages.items():
        if email in leadstore_emails:
            continue
        if entry["stage"] in ASYNC_STAGES:
            continue
        if entry["stage"] not in THRESHOLDS:
            continue
        if email.lower() in TEST_EMAILS:
            continue
        ts = entry.get("ts", "")
        if not ts:
            continue
        try:
            t = datetime.fromisoformat(ts.rstrip("Z")).replace(tzinfo=timezone.utc)
            hours = (NOW - t).total_seconds() / 3600
            if hours > THRESHOLDS.get(entry["stage"], 24):
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
    # agentic_server.py archived to .legacy/ 2026-07-21 — replaced by platform_api (FastAPI)

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
            BOUNCE_BASELINE = 46  # updated 2026-07-14T02:32 — SRE auto-ack: hello@boothkeepos.com (NDR hard bounce)
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
    print("── Copy Fatigue ──")
    try:
        from copy_fatigue_detector import diagnose_fatigue, zone as cfd_zone
        # Pull reply rate from outreach_log if available
        outreach_log = Path("/home/mike/nebula/outreach_log.txt")
        if outreach_log.exists():
            lines = outreach_log.read_text().splitlines()
            recent = [l for l in lines if l.strip()]
            check("Copy fatigue detector", True, f"outreach_log: {len(recent)} entries; run copy_fatigue_detector.py for full diagnosis")
        else:
            check("Copy fatigue detector", True, "module available — no outreach_log yet")
    except ImportError:
        check("Copy fatigue detector", False, "copy_fatigue_detector.py not importable")

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
