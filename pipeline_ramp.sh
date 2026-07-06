#!/usr/bin/env bash
set -euo pipefail
cd /home/mike/nebula
exec python3 ramp_pipeline_fill.py "$@"
