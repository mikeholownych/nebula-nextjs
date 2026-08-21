#!/bin/bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PYTHONPATH="$ROOT"
exec venv/bin/python3 -m uvicorn platform_api.main:app --host 127.0.0.1 --port 8001
