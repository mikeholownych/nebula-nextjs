#!/bin/bash
# Performance monitoring for Nebula Next.js deployment

echo "=== Nebula Performance Monitor ==="
echo "Time: $(date)"
echo "---"

# Server health
echo "1. Server Status"
if curl -s http://localhost:3000 > /dev/null; then
  echo "   ✓ Next.js server responding"
else
  echo "   ✗ Next.js server NOT responding"
fi

# Response times
echo ""
echo "2. Response Times"
echo "   Homepage: $(curl -o /dev/null -s -w '%{time_total}s\n' http://localhost:3000/index.html)"
echo "   Checkout: $(curl -o /dev/null -s -w '%{time_total}s\n' http://localhost:3000/checkout.html)"
echo "   Dashboard: $(curl -o /dev/null -s -w '%{time_total}s\n' http://localhost:3000/dashboard)"

# Memory usage
echo ""
echo "3. Memory Usage"
free -h | grep "Mem:" | awk '{print "   Used: "$3" / Total: "$2" ("$3/$2*100"%)"}'

# Process status
echo ""
echo "4. Process Status"
ps aux | grep "next start" | grep -v grep | awk '{print "   PID: "$2", CPU: "$3"%, MEM: "$4"%"}'

# Build size
echo ""
echo "5. Build Size"
du -sh /home/mike/nebula/.worktrees/nextjs-customer-platform/customer-portal/.next 2>/dev/null | awk '{print "   .next/ : "$1}'

# Active connections
echo ""
echo "6. Active Connections"
ss -tunlp 2>/dev/null | grep ":3000" | wc -l | awk '{print "   Port 3000: "$1" connections"}'

# Uptime
echo ""
echo "7. Uptime"
uptime -p 2>/dev/null || uptime | awk '{print $1}'

echo ""
echo "=== Monitor Complete ==="
