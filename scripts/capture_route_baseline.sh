#!/bin/bash
# Route Baseline Capture — Wave 0
# Captures HTTP contracts for all Nebula routes

set -e

BASE_DIR="/home/mike/nebula/.worktrees/nextjs-customer-platform/docs/baseline"
TIMESTAMP=$(date -Iseconds)
BASELINE_FILE="$BASE_DIR/routes-${TIMESTAMP}.json"

mkdir -p "$BASE_DIR"

echo "=== ROUTE BASELINE CAPTURE ==="
echo "Timestamp: $TIMESTAMP"
echo "Output: $BASELINE_FILE"
echo ""

# Get all routes from sitemap
SITEMAP=$(curl -s http://localhost:8765/sitemap.xml 2>/dev/null)

if [ -z "$SITEMAP" ]; then
    echo "ERROR: Could not fetch sitemap"
    exit 1
fi

# Extract URLs
echo "$SITEMAP" | grep -o "<loc>[^<]*</loc>" | sed 's/<loc>\|<\/loc>//g' > /tmp/routes.txt

echo "Found $(wc -l < /tmp/routes.txt) routes"
echo ""

# Initialize JSON array
echo "[" > "$BASELINE_FILE"

FIRST=true
while read -r url; do
    # Capture route contract
    RESPONSE=$(curl -s -I -w "\nHTTP_CODE:%{http_code}" "$url" 2>/dev/null)
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    CONTENT_TYPE=$(echo "$RESPONSE" | grep -i "Content-Type:" | cut -d: -f2- | tr -d '\r')
    
    # Add comma if not first
    if [ "$FIRST" = true ]; then
        FIRST=false
    else
        echo "," >> "$BASELINE_FILE"
    fi
    
    # Add JSON object
    cat >> "$BASELINE_FILE" << ROUTE_EOF
  {
    "url": "$url",
    "status_code": $HTTP_CODE,
    "content_type": "$CONTENT_TYPE",
    "timestamp": "$TIMESTAMP"
  }
ROUTE_EOF
    
    echo "  ✓ $url ($HTTP_CODE)"
    
done < /tmp/routes.txt

echo "]" >> "$BASELINE_FILE"

# Cleanup
rm -f /tmp/routes.txt

echo ""
echo "=== BASELINE CAPTURE COMPLETE ==="
echo "Captured $(wc -l < "$BASELINE_FILE") entries"
echo "Saved to: $BASELINE_FILE"
