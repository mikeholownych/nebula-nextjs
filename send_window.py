#!/usr/bin/env python3
"""send_window.py — Illingworth send-time enforcement.

Rules:
  - Only send Mon-Fri (weekday 0-4 in Python)
  - Only send 06:00–10:00 in the recipient's estimated local time
  - Falls back to US/Eastern if timezone unknown (most ICP is US)

Usage:
    from send_window import in_send_window, seconds_until_window

    if not in_send_window(recipient_email):
        wait = seconds_until_window()
        print(f"Outside send window — next open in {wait//60:.0f}m")
        sys.exit(0)

Both wave4_scraper and followup_sequence import this before the send loop.
Bypass with env SEND_WINDOW_OVERRIDE=1 (for testing).
"""

import os
import time
from datetime import datetime, timezone, timedelta


# ── Configuration ─────────────────────────────────────────────────────────────
SEND_DAYS   = {0, 1, 2, 3, 4}  # Mon=0 … Sun=6; Mon-Fri
WINDOW_OPEN = 6               # 06:00 local
WINDOW_CLOSE = 10             # 10:00 local  (exclusive)

# TZ offset guesses by common US-centric B2B SaaS/startup email domains.
# Default = Eastern (-5 / -4 DST).  Extend as needed.
_TZ_HINTS: dict[str, int] = {
    "gmail.com":     -5, "googlemail.com": -5,
    "yahoo.com":     -5, "hotmail.com":    -5, "outlook.com": -5,
    "icloud.com":    -5,
    "hey.com":       -5,
}
_DEFAULT_OFFSET_HOURS = -5   # US Eastern (non-DST; -4 in summer — close enough)


def _est_offset(email: str) -> int:
    """Return UTC offset in hours for a recipient email (rough heuristic)."""
    domain = email.lower().split("@")[-1] if "@" in email else ""
    return _TZ_HINTS.get(domain, _DEFAULT_OFFSET_HOURS)


def in_send_window(recipient_email: str = "") -> bool:
    """
    Return True iff now is inside the Tue–Thu 07:00–09:00 window
    in the recipient's estimated local timezone.
    Override with SEND_WINDOW_OVERRIDE=1 env var (for tests/manual runs).
    """
    if os.getenv("SEND_WINDOW_OVERRIDE", "0") == "1":
        return True

    offset_h = _est_offset(recipient_email)
    now_local = datetime.now(timezone.utc) + timedelta(hours=offset_h)

    if now_local.weekday() not in SEND_DAYS:
        return False
    if not (WINDOW_OPEN <= now_local.hour < WINDOW_CLOSE):
        return False
    return True


def seconds_until_window(recipient_email: str = "") -> int:
    """
    Return seconds until the next send window opens (UTC-based calculation
    using estimated recipient timezone).  Returns 0 if already in window.
    """
    if in_send_window(recipient_email):
        return 0

    offset_h = _est_offset(recipient_email)
    now_utc = datetime.now(timezone.utc)
    now_local = now_utc + timedelta(hours=offset_h)

    # Find next eligible day + 07:00
    candidate = now_local.replace(hour=WINDOW_OPEN, minute=0, second=0, microsecond=0)
    if now_local >= candidate:
        candidate += timedelta(days=1)

    # Advance to the next Tue/Wed/Thu
    for _ in range(7):
        if candidate.weekday() in SEND_DAYS:
            break
        candidate += timedelta(days=1)

    delta = (candidate - now_local).total_seconds()
    return max(0, int(delta))


def assert_send_window_or_exit(recipient_email: str = "", script_name: str = "") -> None:
    """
    Call at the top of a send script.  If outside the window, print a clear
    message and sys.exit(0) — no error, just a clean skip for cron.
    """
    import sys
    if not in_send_window(recipient_email):
        wait = seconds_until_window(recipient_email)
        tag = f"[{script_name}] " if script_name else ""
        print(f"{tag}Outside send window (Mon-Fri 06-10 local). "
              f"Next open in ~{wait // 3600}h {(wait % 3600) // 60}m — exiting.")
        sys.exit(0)


if __name__ == "__main__":
    # Quick sanity check
    in_w = in_send_window()
    wait = seconds_until_window()
    print(f"in_window={in_w}  next_open_in={wait//3600}h{(wait%3600)//60}m")
