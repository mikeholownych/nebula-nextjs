#!/usr/bin/env bash
set -euo pipefail
cd /home/mike/nebula
exec venv/bin/python3 ih_authority_scheduler.py "$@"
