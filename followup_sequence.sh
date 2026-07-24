#!/usr/bin/env bash
set -euo pipefail
cd /home/mike/nebula
exec venv/bin/python3 followup_sequence.py "$@"
