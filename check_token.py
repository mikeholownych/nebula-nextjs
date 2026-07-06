#!/usr/bin/env python3
"""Debug: check token format"""
with open('/home/mike/.hermes/.env', 'rb') as f:
    raw = f.read()

# Find the line with CLOUDFLARE_API_TOKEN
lines = raw.split(b'\n')
for line in lines:
    if b'CLOUDFLARE_API_TOKEN' in line:
        parts = line.split(b'=', 1)
        if len(parts) == 2:
            token = parts[1].strip()
            print(f"Token bytes: {token}")
            print(f"Token decoded: {token.decode()}")
            print(f"Token length: {len(token)}")
            print(f"First 8 chars: {token[:8]}")
            print(f"Last 8 chars: {token[-8:]}")
        break
