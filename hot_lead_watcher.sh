#!/usr/bin/env bash
# Wrapper for hot_lead_watcher.py
cd /home/mike/nebula
exec python3 hot_lead_watcher.py "$@"
