#!/usr/bin/env bash
# Wrapper for signal_watcher.py
cd /home/mike/nebula
exec python3 signal_watcher.py "$@"
