#!/bin/bash
# Setup Cloudflare tunnel for nebulacomponents.shop
# Must be run as: source /home/mike/.hermes/.env && bash setup_tunnel.sh
set -e

cd "$(dirname "$0")"

echo "=== Getting account ==="
ACCOUNT_ID=$(curl -s -H "Authorization: Bearer *** -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts" | python3 -c "
import json,sys; d=json.load(sys.stdin)
if d.get('success'): print(d['result'][0]['id'])
else: print('ERROR'); sys.exit(1)
")
echo "Account: $ACCOUNT_ID"

echo "=== Getting zone ==="
ZONE_ID=$(curl -s -H "Authorization: Bearer *** -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones?name=nebulacomponents.shop" | python3 -c "
import json,sys; d=json.load(sys.stdin)
if d.get('success') and d.get('result'): print(d['result'][0]['id'])
else:
    [print(f\"ZONE: {z['name']} {z['id']}\") for z in json.load(sys.stdin)['result']]
    sys.exit(1)
")
echo "Zone: $ZONE_ID"

echo "=== Creating tunnel ==="
TUNNEL=$(curl -s -X POST -H "Authorization: Bearer *** -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/cfd_tunnel" \
  -d '{"name":"nebula-shop","config_src":"cloudflared"}')

TUNNEL_ID=$(echo "$TUNNEL" | python3 -c "
import json,sys; d=json.load(sys.stdin)
if d.get('success'): print(d['result']['id'])
else: print('TUNNEL_ERROR'); sys.exit(1)
")
echo "Tunnel ID: $TUNNEL_ID"

echo "=== Routing DNS ==="
curl -s -X POST -H "Authorization: Bearer *** -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -d "{\"type\":\"CNAME\",\"name\":\"@\",\"content\":\"$TUNNEL_ID.cfargotunnel.com\",\"proxied\":true}" | python3 -c "import json,sys; d=json.load(sys.stdin); print('DNS:', 'OK' if d.get('success') else d)"

curl -s -X POST -H "Authorization: Bearer *** -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -d "{\"type\":\"CNAME\",\"name\":\"www\",\"content\":\"$TUNNEL_ID.cfargotunnel.com\",\"proxied\":true}" | python3 -c "import json,sys; d=json.load(sys.stdin); print('DNS www:', 'OK' if d.get('success') else d)"

echo "=== Saving credentials ==="
mkdir -p ~/.cloudflared

# Get tunnel token
TUNNEL_TOKEN=$(echo "$TUNNEL" | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['token'])")

# Save credentials JSON
python3 -c "
import json
creds = {
    \"AccountTag\": \"$ACCOUNT_ID\",
    \"TunnelSecret\": \"$TUNNEL_TOKEN\",
    \"TunnelID\": \"$TUNNEL_ID\",
    \"TunnelName\": \"nebula-shop\"
}
with open('$HOME/.cloudflared/$TUNNEL_ID.json','w') as f:
    json.dump(creds, f)
print('Credentials saved')
"

# Save config
python3 -c "
import json
config = {
    \"tunnel\": \"$TUNNEL_ID\",
    \"credentials-file\": \"$HOME/.cloudflared/$TUNNEL_ID.json\",
    \"ingress\": [
        {\"hostname\": \"nebulacomponents.shop\", \"service\": \"http://localhost:8765\"},
        {\"hostname\": \"www.nebulacomponents.shop\", \"service\": \"http://localhost:8765\"},
        {\"service\": \"http_status:404\"}
    ]
}
with open('$HOME/.cloudflared/config.yml','w') as f:
    json.dump(config, f, indent=2)
print('Config saved')
"

echo ""
echo "✅ Tunnel setup complete!"
echo "Tunnel ID: $TUNNEL_ID"
echo ""
echo "Run: cloudflared tunnel run nebula-shop"