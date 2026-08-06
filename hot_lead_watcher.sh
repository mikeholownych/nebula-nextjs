#!/usr/bin/env bash
# Wrapper for hot_lead_watcher.py
cd /home/mike/nebula
exec uv run python hot_lead_watcher.py "$@"
