#!/usr/bin/env python3
"""
hot_lead_watcher.py — watches HOT_LEAD.json for warm leads needing audit delivery.

Run this every 5 minutes via cron or as a one-shot after inbox_monitor.py.
Logic:
  1. Check HOT_LEAD.json for leads in state "warm" (not yet delivered)
  2. For each warm lead, run deliver_audit.py
  3. Update status to "delivered" in HOT_LEAD.json
  4. Log all actions to ledger

Usage:
  python3 hot_lead_watcher.py
  python3 hot_lead_watcher.py --dry-run
"""

import argparse
import json
import subprocess
import sys
import os
from datetime import datetime, timezone
from pathlib import Path

HOT_LEAD_FILE = "/home/mike/nebula/HOT_LEAD.json"
DELIVER_SCRIPT = "/home/mike/nebula/deliver_audit.py"
VENV_PYTHON    = "/home/mike/nebula/venv/bin/python3"
WATCHER_LOG    = "/home/mike/nebula/ledgers/hot_lead_watcher.log"

def log(msg):
    ts = datetime.now(timezone.utc).isoformat()
    line = f"[{ts}] {msg}"
    print(line)
    os.makedirs(os.path.dirname(WATCHER_LOG), exist_ok=True)
    with open(WATCHER_LOG, "a") as f:
        f.write(line + "\n")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    log("hot_lead_watcher: starting")

    if not Path(HOT_LEAD_FILE).exists():
        log("HOT_LEAD.json not found — nothing to process")
        return

    with open(HOT_LEAD_FILE) as f:
        raw = json.load(f)

    leads = raw if isinstance(raw, list) else [raw]
    changed = False
    actionable = 0

    for idx, hot in enumerate(leads):
        if not isinstance(hot, dict):
            log(f"Skipping malformed HOT_LEAD entry #{idx}: {type(hot).__name__}")
            continue

        status = hot.get("status", "")
        stage  = hot.get("stage", "")
        action = hot.get("action", "")

        # Only act on warm leads that explicitly need audit delivery.
        # Already-delivered audits wait for followup_sequence.py to pitch at pitch_due_at.
        if not (stage in ("warm_reply", "warm", "pending_audit") or action == "deliver_audit"):
            log(f"HOT_LEAD #{idx} stage='{stage}' action='{action}' — no action needed")
            continue
        if status not in ("warm", "pending", "pending_audit", ""):
            log(f"HOT_LEAD #{idx} status='{status}' — no action needed")
            continue

        sender    = hot.get("sender", "")
        thread_id = hot.get("thread_id", "")
        message_id = hot.get("message_id", "")
        lead_url  = hot.get("url", "")

        if not thread_id:
            log(f"HOT_LEAD #{idx}: no thread_id — cannot deliver")
            hot["status"] = "needs_thread_id"
            changed = True
            continue

        # Do NOT guess gmail.com/outlook.com domains. If no site URL exists, wait for URL/scheduled call.
        if not lead_url:
            log(f"HOT_LEAD #{idx}: warm lead has no site URL; marked awaiting_url_or_schedule")
            hot["status"] = "awaiting_url_or_schedule"
            hot["stage"] = "awaiting_url_or_schedule"
            hot["updated_at"] = datetime.now(timezone.utc).isoformat()
            changed = True
            continue

        # Derive the lead email from sender or explicit email
        import re
        email_match = re.search(r'<([^>]+)>', sender)
        lead_email = hot.get("email") or (email_match.group(1) if email_match else sender.strip())

        log(f"WARM LEAD detected: thread={thread_id[:16]}... email={lead_email} url={lead_url}")
        actionable += 1

        trigger_context = hot.get("trigger_context") or hot.get("trigger") or hot.get("source_trigger")
        cmd = [VENV_PYTHON, DELIVER_SCRIPT, lead_url, lead_email, "--thread-id", thread_id]
        if message_id:
            cmd.extend(["--message-id", message_id])
        if trigger_context:
            cmd.extend(["--trigger-context", str(trigger_context)])

        if args.dry_run:
            log(f"DRY RUN: would run {' '.join(cmd)}")
            continue

        log(f"Running: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        stdout = result.stdout.strip()
        stderr = result.stderr.strip()

        if result.returncode == 0:
            log(f"Audit delivered successfully:\n{stdout}")
            hot["status"] = "delivered"
            hot["stage"] = "audit_delivered"
            hot["delivered_at"] = datetime.now(timezone.utc).isoformat()
            changed = True
            log(f"HOT_LEAD #{idx} → status: delivered")
        else:
            log(f"DELIVERY FAILED (exit {result.returncode}):\nSTDOUT: {stdout}\nSTDERR: {stderr}")
            hot["status"] = "delivery_failed"
            hot["error"]  = (stderr or stdout)[:300]
            changed = True

    if changed:
        with open(HOT_LEAD_FILE, "w") as f:
            json.dump(leads if isinstance(raw, list) else leads[0], f, indent=2)

    log(f"hot_lead_watcher: done; actionable={actionable}; changed={changed}")

if __name__ == "__main__":
    main()
