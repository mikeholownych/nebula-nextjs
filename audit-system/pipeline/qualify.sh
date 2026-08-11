#!/bin/bash
# pipeline/qualify.sh - qualification gate for a specific email
# Usage: ./qualify.sh <email>

EMAIL="$1"
if [ -z "$EMAIL" ]; then echo "Usage: ./qualify.sh <email>"; exit 1; fi

echo "=== Qualification Check: $EMAIL ==="
echo ""

sudo -u postgres psql -p 5433 -d nebula_audit -c "
SELECT
  a.email,
  a.url,
  a.score,
  a.grade,
  a.status,
  jsonb_array_length(a.findings) as finding_count,
  a.completed_at::date as audited
FROM audits a
WHERE a.email = '$EMAIL'
  AND a.status = 'completed'
ORDER BY a.completed_at DESC
LIMIT 1;" 2>/dev/null

echo ""
echo "--- Top findings ---"
sudo -u postgres psql -d nebula_audit -t -c "
SELECT
  '  [' || (f->>'quadrant') || '] ' || (f->>'label') || ' - impact ' || (f->>'impact') || '/5: ' || LEFT(f->>'issue', 80)
FROM audits a,
  jsonb_array_elements(a.findings) f
WHERE a.email = '$EMAIL'
  AND a.status = 'completed'
  AND (f->>'impact')::numeric >= 3.0
ORDER BY (f->>'impact')::numeric DESC
LIMIT 5;" 2>/dev/null

echo ""
echo "--- Qualification gates ---"
SCORE=$(sudo -u postgres psql -d nebula_audit -t -c "SELECT score FROM audits WHERE email='$EMAIL' AND status='completed' ORDER BY completed_at DESC LIMIT 1;" 2>/dev/null | tr -d ' ')
HAS_QUICKWIN=$(sudo -u postgres psql -d nebula_audit -t -c "SELECT COUNT(*) FROM audits a, jsonb_array_elements(a.findings) f WHERE a.email='$EMAIL' AND a.status='completed' AND (f->>'impact')::numeric >= 4.0 AND f->>'quadrant' = 'quick_win';" 2>/dev/null | tr -d ' ')

[ "$SCORE" -lt 60 ] 2>/dev/null && echo "  ✅ Score $SCORE < 60 (real problems exist)" || echo "  ❌ Score $SCORE >= 60 (page is healthy)"
[ "$HAS_QUICKWIN" -gt 0 ] 2>/dev/null && echo "  ✅ Has quick_win finding with impact >= 4.0" || echo "  ❌ No quick_win finding at impact >= 4.0"

echo ""
echo "To advance: UPDATE prospects SET lifecycle_state = 'commercially_qualified' WHERE email = '$EMAIL';"
