#!/usr/bin/env python3
"""Add DNS-AID records for all our domains"""
import json, urllib.request

with open("/home/mike/.hermes/.env", "rb") as f:
    raw = f.read()
for line in raw.split(b"\n"):
    if b"CLOUDFLARE_API_TOKEN" in line:
        token = line.split(b"=", 1)[1].strip().decode()
        break

H = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
BASE = "https://api.cloudflare.com/client/v4"

def add_svcb(zone_name, record_name):
    zones_r = urllib.request.Request(f"{BASE}/zones?name={zone_name}", headers=H)
    zones = json.loads(urllib.request.urlopen(zones_r, timeout=15).read())
    if not zones.get("result"):
        print(f"  Zone {zone_name} not found")
        return
    zid = zones["result"][0]["id"]
    
    data = {"type": "SVCB", "name": record_name, "data": {"priority": 1, "target": ".", "value": 'alpn="https" port=443'}, "ttl": 3600}
    
    # Check if already exists
    check_r = urllib.request.Request(f"{BASE}/zones/{zid}/dns_records?type=SVCB&name={record_name}", headers=H)
    existing = json.loads(urllib.request.urlopen(check_r, timeout=15).read())
    if existing.get("result"):
        print(f"  {record_name}: already exists")
        return
    
    req = urllib.request.Request(f"{BASE}/zones/{zid}/dns_records", data=json.dumps(data).encode(), headers=H, method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        result = json.loads(resp.read())
        ok = "OK" if result.get("success") else "FAIL"
        print(f"  {record_name}: {ok}")
    except urllib.error.HTTPError as e:
        print(f"  {record_name}: {e.code}: {e.read().decode()[:100]}")

for domain in ["nebulacomponents.shop", "launchcrate.io"]:
    print(f"\n--- {domain} ---")
    add_svcb(domain, f"_a2a._agents.{domain}")
    add_svcb(domain, f"_index._agents.{domain}")

print("\nDone")
