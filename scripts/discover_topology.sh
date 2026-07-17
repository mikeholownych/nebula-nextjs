#!/bin/bash
# Topology Discovery — Wave 0
# Captures current service bindings for migration planning

set -e

echo "=== NEBULA TOPOLOGY DISCOVERY ==="
echo "Date: $(date -Iseconds)"
echo ""

TOPOLOGY_DIR="/home/mike/nebula/.worktrees/nextjs-customer-platform/docs/topology"
mkdir -p "$TOPOLOGY_DIR"

echo "1. Service Ports"
echo "---"
ss -tlnp 2>/dev/null | grep -E "8765|8000|8080|5432|6379" || echo "Port check: no matches"
echo ""

echo "2. Cloudflare Tunnel Status"
echo "---"
ps aux | grep cloudflared | grep -v grep || echo "No cloudflared process found"
echo ""

echo "3. Caddy Status"
echo "---"
systemctl status caddy --no-pager 2>/dev/null | head -10 || echo "Caddy not found"
echo ""

echo "4. Python Services"
echo "---"
ps aux | grep -E "agentic_server|webhook_server" | grep -v grep || echo "No Python services found"
echo ""

echo "5. Current Route Bindings"
echo "---"
curl -s http://localhost:8765/sitemap.xml 2>/dev/null | grep -o "<loc>[^<]*</loc>" | head -20 || echo "Sitemap not available"
echo ""

echo "=== END TOPOLOGY DISCOVERY ==="
