#!/usr/bin/env python3
"""Add DNS record for blog.nebulacomponents.shop"""
import json, urllib.request, sys

with open("/home/mike/.hermes/.env", "rb") as f:
    raw = f.read()
for line in raw.split(b"\n"):
    if b"CLOUDFLARE_API_TOKEN" in line:
        token = line.split(b"=", 1)[1].strip().decode()
        break

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
base = "https://api.cloudflare.com/client/v4"
zone = "820070244e5503cc3565f9e6f677cdcb"

# Add DNS for blog subdomain
data = {"type": "CNAME", "name": "blog", "content": "8cfcc2e1-cf49-4d57-b412-c1ec0474ffd2.cfargotunnel.com", "proxied": True}
req = urllib.request.Request(f"{base}/zones/{zone}/dns_records", data=json.dumps(data).encode(), headers=headers, method="POST")
try:
    resp = urllib.request.urlopen(req, timeout=15)
    result = json.loads(resp.read())
    ok = "OK" if result.get("success") else "FAILED"
    print(f"DNS blog: {ok}")
    if not result.get("success"):
        print(result.get("errors", []))
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"DNS error: {e.code} {body[:200]}")
