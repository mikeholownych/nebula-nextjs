#!/usr/bin/env bash
# Wrapper for signal_watcher.py
cd /home/mike/nebula
exec uv run python signal_watcher.py "$@"
