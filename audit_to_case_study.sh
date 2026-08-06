#!/usr/bin/env bash
set -euo pipefail
cd /home/mike/nebula
exec uv run python audit_to_case_study.py "$@"
