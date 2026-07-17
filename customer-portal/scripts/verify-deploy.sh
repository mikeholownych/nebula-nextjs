#!/bin/bash
# Nebula Components - Deploy Verification
# Checks all critical routes after deployment

set -e

BASE_URL="https://nebulacomponents.shop"

# Critical routes to verify
ROUTES=(
  "/"
  "/terms"
  "/privacy-policy"
  "/pricing"
  "/learning-centre"
  "/learning-centre/google-ads-clicks-no-sales"
  "/learning-centre/facebook-ads-no-leads"
  "/learning-centre/landing-page-not-converting"
  "/case-studies"
  "/company/about"
  "/company/team"
  "/sitemap.xml"
  "/robots.txt"
)

echo "🚀 Verifying deployment at $BASE_URL"
echo ""

FAILED=0
PASSED=0

for route in "${ROUTES[@]}"; do
  URL="$BASE_URL$route"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" --max-time 10 2>/dev/null || echo "000")
  
  if [ "$STATUS" = "200" ]; then
    echo "✅ $route → $STATUS"
    PASSED=$((PASSED + 1))
  else
    echo "❌ $route → $STATUS"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "==================================="
echo "Passed: $PASSED | Failed: $FAILED"
echo "==================================="

if [ $FAILED -gt 0 ]; then
  echo ""
  echo "⚠️  DEPLOYMENT VERIFICATION FAILED"
  echo "Some routes are not responding correctly."
  exit 1
else
  echo ""
  echo "✅ ALL ROUTES VERIFIED"
  exit 0
fi
