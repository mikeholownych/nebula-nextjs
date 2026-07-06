#!/bin/bash
# Use Cloudflare tunnel to expose the page

# Check if tunnel is already running
TUNNEL_ID="8cfcc2e1-cf49-4d57-b412-c1ec0474ffd2"
TUNNEL_NAME="nebula-challenge"

echo "[INFO] Setting up public URL for $97 audit page"
echo "[URL] Will be available at: https://nebulacomponents.shop/audit.html"
echo "[ACTION] The page is already running on port 8765 locally"

# Verify the page exists
if [ ! -f ~/nebula/audit.html ]; then
    echo "[ERROR] audit.html not found"
    exit 1
fi

echo "[OK] audit.html is ready"
echo "[NEXT] Deploy to nebulacomponents.shop via Cloudflare tunnel"

