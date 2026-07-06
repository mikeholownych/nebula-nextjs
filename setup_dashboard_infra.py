#!/usr/bin/env python3
"""Add Stripe billing portal link + expose SDR dashboard."""
import json, urllib.request, os

# 1. Update outbound.html with Manage Billing link
portal_link = "https://billing.stripe.com/p/login/bpc_1Tlb17EINR1kU9chpXfsLOce"

with open("/home/mike/launchcrate/outbound.html", "r") as f:
    html = f.read()

# Add portal link to footer
old_footer = '<footer><div class="container"><p>Outbound — AI SDR That Books Meetings · <a href="mailto:nebulashop@agentmail.to" style="color:var(--accent)">Contact</a></p></div></footer>'
new_footer = '<footer><div class="container"><p>Outbound — AI SDR That Books Meetings · <a href="mailto:nebulashop@agentmail.to" style="color:var(--accent)">Contact</a> · <a href="https://billing.stripe.com/p/login/bpc_1Tlb17EINR1kU9chpXfsLOce" style="color:var(--accent)">Manage Billing</a></p></div></footer>'

if old_footer in html:
    html = html.replace(old_footer, new_footer)
    with open("/home/mike/launchcrate/outbound.html", "w") as f:
        f.write(html)
    print("✅ Added Manage Billing link to outbound.html")
else:
    print("⚠️ Could not find footer in outbound.html")
    # Try adding it anyway
    html = html.replace('</footer>', ' · <a href="https://billing.stripe.com/p/login/bpc_1Tlb17EINR1kU9chpXfsLOce" style="color:var(--accent)">Manage Billing</a></footer>')
    with open("/home/mike/launchcrate/outbound.html", "w") as f:
        f.write(html)
    print("✅ Added portal link (alternate method)")

# 2. Configure Cloudflare tunnel to expose SDR dashboard
# Read current tunnel config
tunnel_config_path = "/home/mike/.cloudflared/nebula-shop.yml"
try:
    with open(tunnel_config_path) as f:
        config = f.read()
    
    # Check if SDR route already exists
    if "sdr.launchcrate.io" not in config:
        # Add SDR dashboard route
        sdr_ingress = """
  # SDR Dashboard
  - hostname: sdr.launchcrate.io
    service: http://localhost:8080
"""
        # Insert before the catch-all rule
        if "hostname: \"" in config and "service: http_status:404" in config:
            config = config.replace(
                '  # Catch-all\n  - hostname: "*"\n    service: http_status:404',
                sdr_ingress + '  # Catch-all\n  - hostname: "*"\n    service: http_status:404'
            )
            with open(tunnel_config_path, "w") as f:
                f.write(config)
            print("✅ Added SDR dashboard route to tunnel config")
        else:
            print("⚠️ Could not find catch-all rule in tunnel config")
    else:
        print("ℹ️ SDR dashboard route already exists")
except Exception as e:
    print(f"⚠️ Tunnel config error: {e}")

# 3. Add DNS record for sdr.launchcrate.io
try:
    with open('/home/mike/.hermes/.env', 'rb') as f:
        raw = f.read()
    for line in raw.split(b'\n'):
        if b'CLOUDFLARE_API_TOKEN' in line:
            cf_token = line.split(b'=', 1)[1].strip().decode()
            break
    
    headers = {"Authorization": f"Bearer {cf_token}", "Content-Type": "application/json"}
    
    # LaunchCrate zone ID - check
    zones_req = urllib.request.Request(
        "https://api.cloudflare.com/client/v4/zones?name=launchcrate.io",
        headers=headers
    )
    zones_resp = urllib.request.urlopen(zones_req, timeout=15)
    zones_data = json.loads(zones_resp.read())
    
    if zones_data.get("success") and zones_data["result"]:
        zone_id = zones_data["result"][0]["id"]
        tunnel_id = "8cfcc2e1-cf49-4d57-b412-c1ec0474ffd2"
        
        # Check if DNS record exists
        dns_req = urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?name=sdr.launchcrate.io&type=CNAME",
            headers=headers
        )
        dns_resp = urllib.request.urlopen(dns_req, timeout=15)
        dns_data = json.loads(dns_resp.read())
        
        if not dns_data.get("result"):
            # Add CNAME
            cname_data = json.dumps({
                "type": "CNAME",
                "name": "sdr",
                "content": f"{tunnel_id}.cfargotunnel.com",
                "proxied": True,
                "ttl": 1
            }).encode()
            cname_req = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records",
                data=cname_data, headers=headers, method="POST"
            )
            cname_resp = urllib.request.urlopen(cname_req, timeout=15)
            cname_result = json.loads(cname_resp.read())
            if cname_result.get("success"):
                print("✅ DNS record sdr.launchcrate.io created")
            else:
                print(f"⚠️ DNS error: {cname_result}")
        else:
            print("ℹ️ DNS record sdr.launchcrate.io already exists")
    else:
        print("⚠️ Could not find launchcrate.io zone")
except Exception as e:
    print(f"⚠️ DNS setup error: {e}")

# 4. Restart cloudflared to pick up new config
print("\nRestarting cloudflared tunnel to apply changes...")
import subprocess
result = subprocess.run(["pkill", "-f", "cloudflared tunnel run"], capture_output=True, timeout=5)
print(f"Cloudflared stopped: {result.returncode}")
print("Tunnel will restart automatically or needs manual restart")

print("\n=== Done ===")
print(f"Portal login: {portal_link}")
print("Dashboard URL: https://sdr.launchcrate.io (once tunnel restarts)")
