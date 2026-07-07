#!/usr/bin/env python3
"""
domain_registry.py — G7: Domain rotation registry with 1-10-100 ramp.

Illingworth Step 4 protocol:
  Week 1:  ≤10 sends/day/domain  (warmup)
  Week 2:  ≤25 sends/day/domain
  Week 3+: ≤50 sends/day/domain  (full ramp)

Usage:
    from domain_registry import DomainRegistry

    reg = DomainRegistry()
    inbox = reg.pick_inbox()          # returns best available inbox or None
    reg.record_send(inbox)            # call after each successful send
    reg.print_status()                # dashboard

State persisted to domain_registry.json (atomic write).
Add domains to REGISTERED_INBOXES list below.
"""

import json
import os
from datetime import datetime, timezone, date
from pathlib import Path
from typing import Optional

# ── Registered sending inboxes ────────────────────────────────────────────────
# Add new domains here as they warm up.  Format: "inbox@domain.com"
REGISTERED_INBOXES: list[str] = [
    "ops@launchcrate.io",
    # "outreach@nebulacomponents.shop",   # add when ready
    # "hello@nebulalaunch.io",            # add when ready
]

STATE_FILE = Path("/home/mike/nebula/domain_registry.json")

# Ramp limits: days_since_first_send → daily_cap
_RAMP: list[tuple[int, int]] = [
    (7,   10),   # days 1-7:   10/day
    (14,  25),   # days 8-14:  25/day
    (999, 50),   # days 15+:   50/day
]


def _today() -> str:
    return str(date.today())


def _cap_for_age(days_old: int) -> int:
    for threshold, cap in _RAMP:
        if days_old <= threshold:
            return cap
    return 50


class DomainRegistry:
    def __init__(self, state_file: Path = STATE_FILE) -> None:
        self._path = state_file
        self._state = self._load()

    def _load(self) -> dict:
        if self._path.exists():
            try:
                return json.loads(self._path.read_text())
            except Exception:
                pass
        # Bootstrap: register all known inboxes starting today
        state: dict = {}
        for inbox in REGISTERED_INBOXES:
            state[inbox] = {
                "first_send_date": _today(),
                "sends_by_date":   {},
                "paused":          False,
                "pause_reason":    "",
            }
        return state

    def _save(self) -> None:
        tmp = str(self._path) + ".tmp"
        Path(tmp).write_text(json.dumps(self._state, indent=2))
        os.rename(tmp, str(self._path))

    def _days_old(self, inbox: str) -> int:
        entry = self._state.get(inbox, {})
        first = entry.get("first_send_date", _today())
        try:
            d0 = date.fromisoformat(first)
            return (date.today() - d0).days + 1
        except Exception:
            return 1

    def _sends_today(self, inbox: str) -> int:
        entry = self._state.get(inbox, {})
        return entry.get("sends_by_date", {}).get(_today(), 0)

    def daily_cap(self, inbox: str) -> int:
        return _cap_for_age(self._days_old(inbox))

    def remaining(self, inbox: str) -> int:
        return max(0, self.daily_cap(inbox) - self._sends_today(inbox))

    def is_available(self, inbox: str) -> bool:
        entry = self._state.get(inbox)
        if not entry:
            return False
        if entry.get("paused"):
            return False
        return self.remaining(inbox) > 0

    def pick_inbox(self) -> Optional[str]:
        """
        Return the inbox with the most remaining capacity today.
        Returns None if all are exhausted or paused.
        """
        best: Optional[str] = None
        best_remaining = 0
        for inbox in REGISTERED_INBOXES:
            if not self.is_available(inbox):
                continue
            rem = self.remaining(inbox)
            if rem > best_remaining:
                best_remaining = rem
                best = inbox
        return best

    def record_send(self, inbox: str) -> None:
        """Increment today's send counter for inbox."""
        if inbox not in self._state:
            self._state[inbox] = {
                "first_send_date": _today(),
                "sends_by_date":   {},
                "paused":          False,
                "pause_reason":    "",
            }
        today = _today()
        sbd = self._state[inbox].setdefault("sends_by_date", {})
        sbd[today] = sbd.get(today, 0) + 1
        self._save()

    def pause(self, inbox: str, reason: str = "") -> None:
        """Pause an inbox (e.g. on bounce spike)."""
        if inbox in self._state:
            self._state[inbox]["paused"] = True
            self._state[inbox]["pause_reason"] = reason
            self._save()
            print(f"[domain_registry] PAUSED {inbox}: {reason}")

    def resume(self, inbox: str) -> None:
        """Resume a paused inbox."""
        if inbox in self._state:
            self._state[inbox]["paused"] = False
            self._state[inbox]["pause_reason"] = ""
            self._save()
            print(f"[domain_registry] RESUMED {inbox}")

    def register(self, inbox: str) -> None:
        """Add a new inbox (starts at day 1 of ramp)."""
        if inbox not in self._state:
            self._state[inbox] = {
                "first_send_date": _today(),
                "sends_by_date":   {},
                "paused":          False,
                "pause_reason":    "",
            }
            if inbox not in REGISTERED_INBOXES:
                REGISTERED_INBOXES.append(inbox)
            self._save()
            print(f"[domain_registry] Registered {inbox} (day 1 ramp)")

    def print_status(self) -> None:
        print(f"\n{'Inbox':<35} {'Age':>5} {'Cap':>5} {'Sent':>5} {'Left':>5} {'Paused'}")
        print("-" * 65)
        for inbox in REGISTERED_INBOXES:
            age  = self._days_old(inbox)
            cap  = self.daily_cap(inbox)
            sent = self._sends_today(inbox)
            rem  = self.remaining(inbox)
            paused = "⏸ " + self._state.get(inbox, {}).get("pause_reason", "")[:20] \
                     if self._state.get(inbox, {}).get("paused") else "✅"
            print(f"{inbox:<35} {age:>5} {cap:>5} {sent:>5} {rem:>5}  {paused}")
        print()


if __name__ == "__main__":
    reg = DomainRegistry()
    reg.print_status()
