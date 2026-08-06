#!/usr/bin/env bash
set -euo pipefail
cd /home/mike/nebula
unset PYTHONHOME
exec uv run python ops_company_os.py "$@"
