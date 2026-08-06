#!/usr/bin/env bash
# Wrapper for pipeline_health_check.py
cd /home/mike/nebula
exec uv run python pipeline_health_check.py "$@"
