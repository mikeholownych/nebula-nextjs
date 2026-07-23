#!/usr/bin/env python3
"""
Email warmup for ops@launchcrate.io
Schedule: every 2h via cron, sends 3-5 warmup exchanges per run
Strategy: send to mike@ (known engaged inbox), loop reply pattern
Week 1: 3-5/day | Week 2: 10-15/day | Week 3+: 20-30/day
"""
import os, json, random, time
from pathlib import Path
from datetime import datetime, timezone
import requests

ORG_KEY   = Path.home() / ".hermes/secrets/agentmail_org.key"
FROM      = "ops@launchcrate.io"
WARMUP_TO = "mike.holownych@aisyndicate.io"
STATE     = Path("/home/mike/nebula/warmup_state.json")

SUBJECTS = [
    "Quick check-in",
    "Following up",
    "Thoughts on this?",
    "One thing I noticed",
    "Quick note",
    "Checking in",
    "Update for you",
    "Something useful",
]

BODIES = [
    "Hey Mike — just making sure this is landing in your inbox correctly. No action needed.",
    "Hey — running a quick deliverability check. You don't need to reply to this one.",
    "Hi Mike, just a routine check. Everything on your end looking good?",
    "Hey — wanted to make sure our emails are reaching you. Ignore if so.",
    "Hi, confirming delivery. No response needed.",
]

def load_key(path):
    return Path(path).read_text().strip()

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"sends_today": 0, "total_sends": 0, "last_send": None, "day": 1, "started": str(datetime.now(timezone.utc).date())}

def save_state(s):
    tmp = str(STATE) + ".tmp"
    Path(tmp).write_text(json.dumps(s, indent=2))
    os.rename(tmp, STATE)

def daily_target(day):
    if day <= 3:   return 5
    if day <= 7:   return 15
    if day <= 14:  return 30
    return 50

def send_warmup(key, n):
    sent = 0
    for _ in range(n):
        subject = random.choice(SUBJECTS)
        body    = random.choice(BODIES)
        r = requests.post(
            f"https://api.agentmail.to/inboxes/{FROM}/messages/send",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"to": [WARMUP_TO], "subject": subject, "text": body},
            timeout=15
        )
        if r.status_code in (200, 201):
            sent += 1
            print(f"[warmup] sent: {subject}")
        else:
            print(f"[warmup] FAILED {r.status_code}: {r.text[:100]}")
        time.sleep(random.uniform(30, 90))  # space sends naturally
    return sent

def main():
    key   = load_key(ORG_KEY)
    state = load_state()

    today = str(datetime.now(timezone.utc).date())
    if state.get("last_date") != today:
        state["sends_today"] = 0
        state["last_date"]   = today
        if state.get("last_date") and state["last_date"] != today:
            state["day"] = state.get("day", 1) + 1

    target   = daily_target(state.get("day", 1))
    remaining = target - state["sends_today"]
    # Each cron run sends ~1/4 of daily target (runs every 2h, ~4 runs/day)
    this_run  = min(max(1, target // 4), remaining)

    if this_run <= 0:
        print(f"[warmup] daily target {target} already hit. Skipping.")
        return

    print(f"[warmup] day={state['day']} target={target} sends_today={state['sends_today']} this_run={this_run}")
    sent = send_warmup(key, this_run)

    state["sends_today"] = state.get("sends_today", 0) + sent
    state["total_sends"] = state.get("total_sends", 0) + sent
    state["last_send"]   = str(datetime.now(timezone.utc))
    save_state(state)
    print(f"[warmup] done. sent={sent} total={state['total_sends']}")

if __name__ == "__main__":
    main()
