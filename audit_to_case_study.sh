#!/usr/bin/env bash
set -euo pipefail
cd /home/mike/nebula
exec python3 audit_to_case_study.py "$@"
