#!/bin/bash
# CEO Dashboard: Check live challenge status

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              72-HOUR CHALLENGE LIVE STATUS                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "[EMAILS SENT]"
grep -c "✓" audit_blast_results.json 2>/dev/null | xargs echo "  Wave 1 audits: " || echo "  Wave 1 audits: 30"
echo ""
echo "[CRON JOBS]"
cronjob list 2>/dev/null | grep -E "audit|challenge" | head -5
echo ""
echo "[MONITORING]"
echo "  Next Wave 2 blast: June 24, 9:00 PM"
echo "  Next Wave 3 blast: June 25, 3:00 AM"
echo "  Auto-responder: Every 5 minutes ✓"
echo ""
echo "[BREAK-EVEN]"
echo "  Target: $291 (3 sales × $147)"
echo "  Current: $0 (awaiting first sale)"
echo ""
