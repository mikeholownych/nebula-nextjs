#!/usr/bin/env python3
"""Test n8n API with correct header"""
import json, urllib.request, sys

with open("/tmp/n8n_key") as f:
    raw = f.read().strip()

BASE = "https://n8n.mikeholownych.com/api/v1"
headers = {"X-N8N-API-KEY": raw, "Content-Type": "application/json"}

req = urllib.request.Request(f"{BASE}/workflows", headers=headers)
try:
    resp = urllib.request.urlopen(req, timeout=15)
    data = json.loads(resp.read())
    print(f"Workflows: {data.get('data', {}).get('count', 0)}")
    for w in data.get('data', []):
         print(f"  - {w.get('name')} (id: {w.get('id')}) active={w.get('active')}")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"HTTP {e.code}: {body[:300]}")
except Exception as e:
    print(f"Error: {e}")
"""
Note: corrected API request based on n8n error.
"""
