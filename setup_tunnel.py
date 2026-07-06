#!/usr/bin/env python3
"""Setup Cloudflare tunnel using the Cloudflare adapter.
This module now delegates all raw HTTP handling to nebula.adapters.cloudflare.
"""
import os, json, sys
from nebula.adapters.cloudflare import CloudflareAdapter
from nebula.errors.app_error import AppError

# Load token from .env (same logic as before, but now raise AppError on failure)
with open('/home/mike/.hermes/.env', 'rb') as f:
    raw = f.read()
idx = raw.find(b'CLOUDFLARE_API_TOKEN=')
if idx < 0:
    raise AppError('ENV_NOT_FOUND', 'CLOUDFLARE_API_TOKEN not found in .env')
start = idx + len(b'CLOUDFLARE_API_TOKEN=')
end = raw.find(b'\n', start)
if end < 0:
    token = raw[start:].decode().strip()
else:
    token = raw[start:end].decode().strip()
if not token or token == '***':
    raise AppError('INVALID_TOKEN', f"Invalid token value (got '{token[:10]}...')")

adapter = CloudflareAdapter(token)

# 1. Get account
print("\n1. Getting account...")
account = adapter.get_account()
print(f"   Account: {account}")

# 2. Get zone
print("2. Getting zone nebulacomponents.shop...")
zone = adapter.get_zone('nebulacomponents.shop')
print(f"   Zone: {zone}")

# 3. Create or reuse tunnel
print("3. Creating tunnel 'nebula-shop'...")
tunnel_id, tunnel_token = adapter.ensure_tunnel(account, 'nebula-shop')
print(f"   Tunnel ID: {tunnel_id}")

# 4. DNS records
print("4. Setting DNS records...")
for name in ["@", "www"]:
    success = adapter.set_cname_record(zone, name, f"{tunnel_id}.cfargotunnel.com")
    print(f"   {name}.nebulacomponents.shop -> {'OK' if success else 'FAIL'}")

# 5. Save credentials locally
print("5. Saving credentials...")
adapter.save_credentials(tunnel_id, tunnel_token, account)
print(f"\n✅ DONE! Tunnel {tunnel_id} configured.")
print("   Config: ~/.cloudflared/config.yml")
print("   Run:    /tmp/cloudflared tunnel run nebula-shop")