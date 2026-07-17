#!/bin/bash
# Nebula Components - Health Monitor
# Checks critical routes and alerts on failures

BASE_URL="https://nebulacomponents.shop"

# Critical routes
ROUTES=(
  "/"
  "/terms"
  "/privacy-policy"
  "/pricing"
  "/learning-centre"
  "/case-studies"
)

FAILED_ROUTES=""

for route in "${ROUTES[@]}"; do
  URL="$BASE_URL$route"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" --max-time 10 2>/dev/null || echo "000")
  
  if [ "$STATUS" != "200" ]; then
    FAILED_ROUTES="$FAILED_ROUTES\n- $route → HTTP $STATUS"
  fi
done

if [ -n "$FAILED_ROUTES" ]; then
  echo "⚠️ NEBULA HEALTH ALERT"
  echo ""
  echo "Failed routes:"
  echo -e "$FAILED_ROUTES"
  exit 1
else
  echo "✅ All routes healthy"
  exit 0
fi
