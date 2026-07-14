#!/bin/bash
cd /home/mike/nebula/.worktrees/nextjs-customer-platform
export PYTHONPATH=/home/mike/nebula/.worktrees/nextjs-customer-platform
exec venv/bin/python3 -m uvicorn platform_api.main:app --host 127.0.0.1 --port 8769
