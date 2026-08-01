#!/usr/bin/env python3
"""Ramp pipeline fill v2 — trigger-aware manual research lanes (2026-07-31).

Replaces the deprecated Apify/Reddit scrape pipeline (archived to
.legacy/2026-07-31-apify-reddit-deprecation/). Lead sources are now
HUMAN-RESEARCHED trigger lanes: founder posts with ad-spend/zero-conversion
numbers, LinkedIn engagers on CRO content, teardown candidates. Each lane is a
JSONL file in ops/lead_lanes/ with records:

    {"email": "founder@x.com", "site": "https://x.com",
     "trigger": "Saw your post: 935 impressions, 38 clicks, 0 sales",
     "source": "indiehackers", "url": "https://...", "teardown_slug": "x"}

Flow per run:
  1. Load all lanes, dedup by email across lanes + lead_state.db
  2. Skip bounced / test / already-contacted leads
  3. Register new leads (stage=discovered, source=<lane source>)
  4. Send first-touch trigger-aware outreach through the centralized gate:
       - teardown lane  -> teardown notification (value-first, teardown link)
       - audit lane     -> audit intro with self-serve link + trigger context
  5. Write ramp_pipeline_report.json + outreach_evidence.jsonl

Idempotent client_ids (campaign:ramp-<source>-<hash8>) — no auto: retry loops.
Rate-safe: MAX_PER_RUN sends per run (AgentMail ~2/5min window; runs are cron-paced).

Usage:
  venv/bin/python3 ramp_pipeline_fill.py --dry-run   # preview only
  venv/bin/python3 ramp_pipeline_fill.py             # send up to MAX_PER_RUN
"""
import argparse
import hashlib
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

BASE = Path("/home/mike/nebula")
LANES_DIR = BASE / "ops" / "lead_lanes"
REPORT = BASE / "ramp_pipeline_report.json"
EVIDENCE = BASE / "outreach_evidence.jsonl"

TEST_EMAILS = frozenset([
    "mike.holownych@aisyndicate.io",
    "mike.holownych@gmail.com",
    "mike@holownych.com",
    "test@example.com",
    "restart-test@example.com",
    "stripe@example.com",
    "founder@testco.com",
    "nebulashop@agentmail.to",
    "lead@example.com",
    "test@test.com",
    "final@smoke.test",
    "verify@nebula.test",
    "verify2@route.live",
])

# Max first-touch sends per run. The 5-min AgentMail window allows ~1-2 rapid
# sends; cron pacing (daily / 2h) keeps us far below limits.
MAX_PER_RUN = 4

sys.path.insert(0, str(BASE))

from agentmail_client import AgentMailClient  # noqa: E402


def load_lanes() -> list[dict]:
    """Load every lane record, newest lane file first, preserving order."""
    records = []
    if not LANES_DIR.exists():
        return records
    for lane in sorted(LANES_DIR.glob("*.jsonl"), reverse=True):
        for line in lane.read_text().splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                print(f"  [LANE SKIP] {lane.name}: malformed JSON line")
                continue
            rec.setdefault("_lane", lane.stem)
            if rec.get("email"):
                records.append(rec)
    return records


def existing_lead(email: str):
    import sqlite3
    try:
        conn = sqlite3.connect(BASE / "lead_state.db")
        row = conn.execute(
            "SELECT email, stage FROM leads WHERE lower(email)=lower(?)", (email,)
        ).fetchone()
        conn.close()
        return {"email": row[0], "stage": row[1]} if row else None
    except Exception as e:
        print(f"  [DB ERROR] {e}")
        return None


def register_lead(rec: dict):
    import sqlite3
    try:
        conn = sqlite3.connect(BASE / "lead_state.db")
        conn.execute(
            """INSERT OR IGNORE INTO leads (email, url, stage, source, trigger_context, discovered_at)
               VALUES (?, ?, 'discovered', ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ','now'))""",
            (rec["email"].strip().lower(), rec.get("site", ""), rec.get("source", "lane"),
             rec.get("trigger", "")),
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"  [REGISTER ERROR] {rec.get('email')}: {e}")


def already_sent(client_id: str) -> bool:
    import sqlite3
    try:
        conn = sqlite3.connect(BASE / "outbound_delivery.db")
        row = conn.execute(
            "SELECT 1 FROM delivery_events WHERE client_id=? AND allowed=1 LIMIT 1",
            (client_id,),
        ).fetchone()
        conn.close()
        return row is not None
    except Exception:
        return False


def send_first_touch(rec: dict) -> dict:
    email = rec["email"].strip().lower()
    domain = (rec.get("site") or "").replace("https://", "").replace("http://", "").split("/")[0]
    source = rec.get("source", "lane")
    hash8 = hashlib.sha1(f"{email}|{rec.get('trigger','')}".encode()).hexdigest()[:8]
    client_id = f"campaign:ramp-{source}-{hash8}"

    slug = rec.get("teardown_slug")
    if slug:
        subject = f"Your numbers: {rec.get('trigger','')[:48]} — I audited {domain}"
        body = (
            f"{rec.get('trigger', '')} — so I put {domain} through our audit engine.\n\n"
            f"{rec.get('notes', '')}\n\n"
            f"Full teardown with evidence: https://nebulacomponents.shop/teardowns/{slug}\n\n"
            "No ask. If it finds something worth fixing, the $97 One-Leak Repair Sprint "
            "implements the highest-impact finding.\n"
        )
        labels = ["targeted-outreach", f"teardown-{slug}"]
    else:
        subject = f"Saw your post about {rec.get('trigger','')[:44]} — here's what your page says"
        body = (
            f"{rec.get('trigger', '')} — that's exactly the signal we built our audit engine for.\n\n"
            "Same engine that powers our public teardowns. Free, no signup, results in under two minutes:\n"
            "https://nebulacomponents.shop/audit\n\n"
            "If it finds a real leak, the $97 One-Leak Repair Sprint implements the highest-impact "
            "finding — with a 30-day re-audit included.\n"
        )
        labels = ["targeted-outreach", "ramp-audit-intro"]

    result = AgentMailClient().send(
        to=[email],
        subject=subject,
        text=body,
        client_id=client_id,
        labels=labels,
    )
    result["client_id"] = client_id
    return result


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--max", type=int, default=MAX_PER_RUN)
    args = ap.parse_args()

    records = load_lanes()
    print(f"[ramp-v2] lanes loaded: {len(records)} record(s) from ops/lead_lanes/")

    to_send, skipped = [], []
    for rec in records:
        email = rec["email"].strip().lower()
        if email in TEST_EMAILS:
            skipped.append({"email": email, "reason": "test_email"})
            continue
        existing = existing_lead(email)
        if existing:
            skipped.append({"email": email, "reason": f"known_stage={existing['stage']}"})
            continue
        from lead_store import LeadStore
        try:
            if LeadStore().is_bounced(email):
                skipped.append({"email": email, "reason": "bounced"})
                continue
        except Exception:
            pass
        to_send.append(rec)

    print(f"[ramp-v2] new: {len(to_send)}  skipped: {len(skipped)}")
    for s in skipped:
        print(f"  SKIP {s['email']} — {s['reason']}")

    sent, failed, blocked = [], [], []
    for rec in to_send[: args.max]:
        email = rec["email"].strip().lower()
        register_lead(rec)
        if args.dry_run:
            print(f"  [DRY-RUN] WOULD SEND → {email} ({rec.get('source')})")
            continue
        client_id = f"campaign:ramp-{rec.get('source','lane')}-" + \
            hashlib.sha1(f"{email}|{rec.get('trigger','')}".encode()).hexdigest()[:8]
        if already_sent(client_id):
            print(f"  SKIP {email} — already sent (client_id {client_id})")
            continue
        result = send_first_touch(rec)
        if result.get("_error"):
            blocked.append({"email": email, "reason": result.get("_reason", result["_error"])})
            print(f"  BLOCKED {email} — {result.get('_reason', result['_error'])}")
        else:
            sent.append({"email": email, "client_id": client_id,
                         "message_id": result.get("message_id")})
            print(f"  ✓ SENT {email} [{client_id}]")
            with EVIDENCE.open("a") as f:
                f.write(json.dumps({
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "action": "ramp_v2_first_touch",
                    "contact": email,
                    "source": rec.get("source"),
                    "client_id": client_id,
                    "message_id": result.get("message_id"),
                    "status": "sent",
                }) + "\n")
        if len(sent) + len(blocked) < len(to_send[: args.max]):
            time.sleep(3)

    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "engine": "ramp_pipeline_fill v2 (lanes)",
        "lanes_loaded": len(records),
        "new": len(to_send),
        "sent": len(sent),
        "blocked": len(blocked),
        "skipped": len(skipped),
        "dry_run": args.dry_run,
    }
    REPORT.write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
