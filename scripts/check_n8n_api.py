#!/usr/bin/env python3
"""Check the n8n API without executing during pytest collection."""
import json
import os
import sys
import urllib.error
import urllib.request

BASE = "https://n8n.mikeholownych.com/api/v1"


def main() -> int:
    key = os.environ.get("N8N_API_KEY", "").strip()
    if not key:
        print("N8N_API_KEY is not configured", file=sys.stderr)
        return 2

    request = urllib.request.Request(
        f"{BASE}/workflows",
        headers={"X-N8N-API-KEY": key, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            data = json.loads(response.read())
    except urllib.error.HTTPError as error:
        print(f"HTTP {error.code}: {error.read().decode()[:300]}", file=sys.stderr)
        return 1
    except Exception as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    workflows = data.get("data", [])
    print(f"Workflows: {len(workflows)}")
    for workflow in workflows:
        print(f"  - {workflow.get('name')} (id: {workflow.get('id')}) active={workflow.get('active')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
