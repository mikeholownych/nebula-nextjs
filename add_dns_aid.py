#!/usr/bin/env python3
"""Add DNS-AID records for agent discovery"""
import json, urllib.request

with open("/home/mike/.hermes/.env", "rb") as f:
    raw = f.read()
for line in raw.split(b"\n"):
    if b"CLOUDFLARE_API_TOKEN" in line:
        token = line.split(b"=", 1)[1].strip().decode()
        break

H = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
BASE = "https://api.cloudflare.com/client/v4"

def api(method, path, data=None):
    url = f"{BASE}{path}"
    payload = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=payload, headers=H, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

# Get all zones
zones = api("GET", "/zones")
for z in zones.get("result", []):
    zname = z["name"]
    zid = z["id"]
    print(f"\n=== {zname} ===")
    
    # DNS-AID records: _a2a._agents.{domain} -> SVCB
    # SVCB record pointing to the domain with alpn
    domain_for_tunnel = zname  # Same domain, cloudflare proxied
    
    # Try to add SVCB record for _a2a._agents
    data = {
        "type": "SVCB",
        "name": f"_a2a._agents.{zname}",
        "content": f"1 . alpn=\"a2a\" port=443",
        "proxied": False,
        "ttl": 3600
    }
    r = api("POST", f"/zones/{zid}/dns_records", data)
    ok = "OK" if r.get("success") else str(r.get("errors", [{}])[0].get("message", "?"))[:60]
    print(f"  _a2a._agents: {ok}")
    
    # Also add an _index._agents for the agent skills index
    data2 = {
        "type": "SVCB",
        "name": f"_index._agents.{zname}",
        "content": f"1 . alpn=\"https\" port=443",
        "proxied": False,
        "ttl": 3600
    }
    r2 = api("POST", f"/zones/{zid}/dns_records", data2)
    ok2 = "OK" if r2.get("success") else str(r2.get("errors", [{}])[0].get("message", "?"))[:60]
    print(f"  _index._agents: {ok2}")
