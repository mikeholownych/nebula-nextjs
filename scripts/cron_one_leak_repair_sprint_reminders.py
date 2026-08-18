#!/usr/bin/env python3
"""Cron script for sending One-Leak Repair Sprint verification reminders.

Sends verification reminder emails to users who purchased the One-Leak Repair Sprint
and are due for a verification check (e.g., 3 days after purchase).

Usage:
    python scripts/cron_one_leak_repair_sprint_reminders.py

Designed to run on a cron schedule (e.g. daily):
    0 9 * * * /home/mike/nebula/venv/bin/python /home/mike/nebula/scripts/cron_one_leak_repair_sprint_reminders.py >> /var/log/nebula/cron_one_leak_repair_sprint_reminders.log 2>&1
"""

import sys
import os
from pathlib import Path
import importlib.util

# Add the project root to the path
NEBULA_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(NEBULA_DIR))

# Import the verification reminder function from stripe_webhook using importlib
def import_stripe_webhook_function():
    """Import the send_one_leak_repair_sprint_verification_reminder function from stripe_webhook."""
    stripe_webhook_path = NEBULA_DIR / ".legacy" / "python-web-server" / "stripe_webhook.py"
    spec = importlib.util.spec_from_file_location("stripe_webhook", stripe_webhook_path)
    stripe_webhook_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(stripe_webhook_module)
    return stripe_webhook_module.send_one_leak_repair_sprint_verification_reminder

# Get the function
send_one_leak_repair_sprint_verification_reminder = import_stripe_webhook_function()


def main():
    """Send verification reminders for One-Leak Repair Sprint purchases."""
    print("Starting One-Leak Repair Sprint verification reminder cron run")
    try:
        send_one_leak_repair_sprint_verification_reminder()
        print("One-Leak Repair Sprint verification reminder cron run completed")
    except Exception as e:
        print(f"Error in One-Leak Repair Sprint verification reminder cron: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()