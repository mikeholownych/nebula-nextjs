#!/usr/bin/env python3
"""Runs verify_production_services.sh on a schedule and alerts on Telegram
when it fails - the gap identified in INC-0004: the verify script already
catches drift like the obsolete nebula-site.service serving stale prod,
but nothing ran it automatically, so a 14-hour outage went unnoticed.

Silent when healthy (per repo convention - no alert = no cron delivery).
Alerts immediately on a new failure, then at most once per COOLDOWN_MINUTES
while the failure persists (to avoid spamming every 5 minutes during a
real outage), and sends one recovery notice when it goes back to healthy.
"""
import fcntl
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

BASE = Path("/home/mike/nebula")
VERIFY_SCRIPT = BASE / "scripts" / "verify_production_services.sh"
STATE_FILE = BASE / "production_health_state.json"
LOCK_FILE = BASE / "notify_production_health.lock"
TELEGRAM_TARGET = "telegram:5920497760"
COOLDOWN_MINUTES = 30


def load_state() -> dict:
    try:
        return json.loads(STATE_FILE.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {"status": "unknown", "last_alert_at": None, "consecutive_failures": 0}


def save_state(state: dict):
    tmp = STATE_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(state, indent=2))
    tmp.rename(STATE_FILE)  # atomic on same filesystem


def send_telegram(message: str) -> bool:
    try:
        result = subprocess.run(
            ["hermes", "send", "--to", TELEGRAM_TARGET, message],
            capture_output=True, timeout=15, text=True,
        )
        return result.returncode == 0
    except Exception:
        return False


def minutes_since(iso_ts: str | None) -> float:
    if not iso_ts:
        return float("inf")
    then = datetime.fromisoformat(iso_ts)
    return (datetime.now(timezone.utc) - then).total_seconds() / 60


def main() -> int:
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    result = subprocess.run(
        ["bash", str(VERIFY_SCRIPT)], capture_output=True, timeout=60, text=True,
    )
    healthy = result.returncode == 0
    output = (result.stdout + result.stderr).strip()

    state = load_state()
    was_failing = state.get("status") == "failing"

    if healthy:
        if was_failing:
            send_telegram(
                f"✅ Production health RECOVERED\n"
                f"nebulacomponents.shop is healthy again after "
                f"{state.get('consecutive_failures', '?')} failed check(s).\n\n{output}"
            )
        save_state({"status": "ok", "last_alert_at": state.get("last_alert_at"), "consecutive_failures": 0})
        return 0

    consecutive = state.get("consecutive_failures", 0) + 1
    should_alert = (not was_failing) or minutes_since(state.get("last_alert_at")) >= COOLDOWN_MINUTES

    if should_alert:
        sent = send_telegram(
            f"🚨 Production health check FAILED (check #{consecutive})\n\n{output}"
        )
        save_state({
            "status": "failing",
            "last_alert_at": now_iso if sent else state.get("last_alert_at"),
            "consecutive_failures": consecutive,
        })
    else:
        save_state({**state, "status": "failing", "consecutive_failures": consecutive})

    return 1


if __name__ == "__main__":
    BASE.mkdir(parents=True, exist_ok=True)
    lock_fd = open(LOCK_FILE, "w")
    try:
        fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        sys.exit(0)  # another run in progress
    try:
        sys.exit(main())
    finally:
        fcntl.flock(lock_fd, fcntl.LOCK_UN)
        lock_fd.close()
