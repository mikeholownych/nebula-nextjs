#!/usr/bin/env python3
"""
bounce_scan_cron.py - Periodic inbox scan for NDR/bounce messages.
Runs every 30m via cron. Supplements inline SMTP bounce detection.
"""
import sys, json
from pathlib import Path

NEBULA = Path("/home/mike/nebula")
sys.path.insert(0, str(NEBULA))

from bounce_detector import scan_inbox_for_bounces, log_bounce_event, report_bounce_stats

def load_agentmail_client():
    """Import and instantiate the AgentMail client."""
    from agentmail_client import AgentMailClient
    return AgentMailClient()

def main():
    try:
        am = load_agentmail_client()
    except Exception as e:
        print(f"bounce-scan ERROR: Cannot init AgentMail client: {e}")
        sys.exit(1)

    bounces = scan_inbox_for_bounces(am, max_messages=50)

    if bounces:
        # Only emit output (= Telegram/origin notification) when there are new bounces
        print(f"⚠️ Bounce scan - {len(bounces)} new bounce(s):")
        for b in bounces:
            print(f"  • {b['target_email']} - {b['subject'][:60]}")
            log_bounce_event(b)
        stats = report_bounce_stats()
        print(f"  Total: {stats['hard_bounces']} hard / {stats['soft_bounces']} soft")
    # Else: silent - empty stdout = no notification

if __name__ == "__main__":
    main()
