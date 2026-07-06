#!/usr/bin/env bash
# Wrapper for pipeline_health_check.py
cd /home/mike/nebula
exec python3 pipeline_health_check.py "$@"
