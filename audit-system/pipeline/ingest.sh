#!/bin/bash
# pipeline/ingest.sh
# Manually submit a lead to the n8n Trigger Engine.
# Usage: ./ingest.sh "https://example.com" "founder@example.com" "reddit_explicit_pain" "spent $3k on ads, zero conversions"

URL="$1"
EMAIL="${2:-}"
SOURCE="${3:-manual}"
CONTEXT="$4"

if [ -z "$URL" ]; then
  echo "Usage: ./ingest.sh <url> [email] [source] [trigger_context]"
  exit 1
fi

curl -s -X POST "https://n8n.mikeholownych.com/webhook/audit-inbound" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$URL\",
    \"email\": \"$EMAIL\",
    \"source\": \"$SOURCE\",
    \"triggerContext\": \"$CONTEXT\"
  }" | python3 -c "import sys, json; d=json.load(sys.stdin); print('✅ Ingested:', d.get('message', d))"

echo ""
echo "Check Telegram for score and segment."
echo "Review in DB: SELECT url, icp_score, segment FROM trigger_leads ORDER BY created_at DESC LIMIT 5;"
