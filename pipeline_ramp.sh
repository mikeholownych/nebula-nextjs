#!/usr/bin/env bash
set -euo pipefail
cd /home/mike/nebula
exec uv run python ramp_pipeline_fill.py "$@"
