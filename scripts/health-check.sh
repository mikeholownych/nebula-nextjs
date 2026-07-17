#!/bin/bash
# Automated health check with Telegram alerts
# Runs every 5 minutes via cron

# Configuration
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="5920497760"
LOG_FILE="/home/mike/.hermes/cron/output/health-check.log"
ALERT_COOLDOWN=300  # 5 minutes between alerts

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Function to send Telegram alert
send_alert() {
    local message="$1"
    if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_CHAT_ID}" \
            -d text="${message}" \
            -d parse_mode="Markdown" > /dev/null 2>&1
    fi
    echo "[ALERT] $(date '+%Y-%m-%d %H:%M:%S') - ${message}" >> "$LOG_FILE"
}

# Function to log info
log_info() {
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Health checks
log_info "Starting health check cycle"

# 1. Check Next.js server
if ! curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    send_alert "🚨 *NEXT.JX DOWN*\n\nServer not responding on port 3000\nTime: $(date)"
    log_info "ALERT: Next.js server down"
    
    # Attempt restart
    cd /home/mike/nebula/.worktrees/nextjs-customer-platform/customer-portal
    npm start > /dev/null 2>&1 &
    log_info "Attempted automatic restart"
else
    log_info "Next.js server: OK"
fi

# 2. Check response times
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3000/index.html 2>/dev/null | awk '{printf "%.3f", $1}')

if (( $(echo "$RESPONSE_TIME > 1.0" | bc -l) )); then
    send_alert "⚠️ *SLOW RESPONSE*\n\nResponse time: ${RESPONSE_TIME}s\nThreshold: 1.0s\nTime: $(date)"
    log_info "ALERT: Slow response time (${RESPONSE_TIME}s)"
else
    log_info "Response time: ${RESPONSE_TIME}s - OK"
fi

# 3. Check memory usage
MEMORY_PERCENT=$(free | awk '/Mem:/ {printf "%.1f", ($3/$2)*100}')
if (( $(echo "$MEMORY_PERCENT > 90" | bc -l) )); then
    send_alert "🚨 *HIGH MEMORY*\n\nMemory: ${MEMORY_PERCENT}%\nThreshold: 90%\nTime: $(date)"
    log_info "ALERT: High memory usage (${MEMORY_PERCENT}%)"
else
    log_info "Memory usage: ${MEMORY_PERCENT}% - OK"
fi

# 4. Check disk space
DISK_PERCENT=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_PERCENT" -gt 90 ]; then
    send_alert "🚨 *LOW DISK SPACE*\n\nDisk: ${DISK_PERCENT}% used\nThreshold: 90%\nTime: $(date)"
    log_info "ALERT: Low disk space (${DISK_PERCENT}%)"
else
    log_info "Disk space: ${DISK_PERCENT}% - OK"
fi

# 5. Check Cloudflare tunnel
if ! pgrep -f "cloudflared" > /dev/null; then
    send_alert "🚨 *CLOUDFLARE TUNNEL DOWN*\n\nTunnel process not running\nTime: $(date)"
    log_info "ALERT: Cloudflare tunnel down"
else
    log_info "Cloudflare tunnel: OK"
fi

# 6. Check Platform API (if should be running)
# Uncomment if API should be active:
# if ! curl -f -s http://localhost:8769/health > /dev/null 2>&1; then
#     send_alert "⚠️ *PLATFORM API DOWN*\n\nAPI not responding on port 8769\nTime: $(date)"
#     log_info "WARNING: Platform API down"
# fi

# Summary
log_info "Health check complete - All systems nominal"

# Rotate log if too large
if [ -f "$LOG_FILE" ] && [ $(wc -l < "$LOG_FILE") -gt 10000 ]; then
    mv "$LOG_FILE" "${LOG_FILE}.old"
    log_info "Log rotated"
fi
