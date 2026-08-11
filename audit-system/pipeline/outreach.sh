#!/bin/bash
# pipeline/outreach.sh - preview or send outreach for a qualified lead
# Usage:
#   ./outreach.sh <email>            # preview (dry-run)
#   ./outreach.sh <email> --send     # actually send via AgentMail

EMAIL="$1"
if [ -z "$EMAIL" ]; then echo "Usage: ./outreach.sh <email> [--send]"; exit 1; fi

cd /home/mike/nebula

if [ "$2" = "--send" ]; then
    venv/bin/python3 audit-system/pipeline/send_outreach.py "$EMAIL"
else
    venv/bin/python3 audit-system/pipeline/send_outreach.py "$EMAIL" --dry-run
fi
