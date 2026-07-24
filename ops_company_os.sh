#!/usr/bin/env bash
set -euo pipefail
cd /home/mike/nebula
unset PYTHONHOME
venv/bin/python3 ops_company_os.py "$@"
