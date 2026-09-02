# Incident Response Runbook

**Last Updated:** 2026-08-26  
**Owner:** Mike Holownych  
**Escalation:** Mike Holownych (@telegram)

---

## Table of Contents
1. [Service Outage](#service-outage)
2. [Database Corruption](#database-corruption)
3. [Payment Webhook Failure](#payment-webhook-failure)
4. [Security Breach](#security-breach)
5. [Major Performance Degradation](#major-performance-degradation)

---

## Service Outage

**Symptoms:**
- Customer portal (nebulacomponents.com) returns HTTP 500+
- Audit API (api.nebulacomponents.com:8001) unresponsive
- WebSocket connections failing

**Diagnosis Checklist:**
```bash
# Check systemd service status
sudo systemctl status nebula-nextjs.service nebula-platform-api.service

# Check systemd journal for errors
sudo journalctl -u nebula-nextjs.service -u nebula-platform-api.service --since "-30 min" --no-pager -n 50

# Check process is listening on correct ports
sudo ss -tlnp | grep -E "3000|8001"

# Check health endpoint (if implemented)
curl -s http://127.0.0.1:3000/healthz
curl -s http://127.0.0.1:8001/healthz
```

**Recovery Steps:**
1. Identify failed service(s) from systemctl status
2. Attempt graceful restart:
   ```bash
   sudo systemctl restart nebula-nextjs.service  # if Next.js failed
   sudo systemctl restart nebula-platform-api.service  # if FastAPI failed
   ```
3. If restart fails, check logs for root cause:
   ```bash
   sudo journalctl -u <service-name> -n 100 --no-pager
   ```
4. If service won't start, rollback to last known-good build:
   ```bash
   cd /home/mike/nebula/customer-portal
   git checkout <last-known-good-commit>
   npx next build
   sudo systemctl restart nebula-nextjs.service
   ```
5. Verify recovery:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" -H "Host: nebulacomponents.com" http://127.0.0.1:3000/
   curl -s -o /dev/null -w "%{http_code}" -H "Host: api.nebulacomponents.com" http://127.0.0.1:8001/
   ```
6. Update status page and notify stakeholders

**Contact:**
- Mike Holownych (primary): @mikeholownych on Telegram

---

## Database Corruption

**Symptoms:**
- Database connection errors in application logs
- Missing or malformed data in queries
- `psql` errors like "relation does not exist" or "deadlock detected"

**Diagnosis Checklist:**
```bash
# Check database health
psql -h /var/run/postgresql -p 5433 -U postgres -d nebula_audit -c "SELECT 1;"
psql -h /var/run/postgresql -p 5433 -U postgres -d nebula_platform -c "SELECT 1;"

# Check disk space
df -h /var/lib/postgresql

# Check database size
psql -h /var/run/postgresql -p 5433 -U postgres -c "SELECT pg_size_pretty(pg_database_size('nebula_audit'));"
psql -h /var/run/postgresql -p 5433 -U postgres -c "SELECT pg_size_pretty(pg_database_size('nebula_platform'));"
```

**Recovery Steps:**
1. **STOP ALL APPLICATIONS** immediately:
   ```bash
   sudo systemctl stop nebula-nextjs.service nebula-platform-api.service
   ```
2. Attempt database repair:
   ```bash
   # For nebula_audit (audit pipeline)
   psql -h /var/run/postgresql -p 5433 -U postgres -d nebula_audit -c "VACUUM FULL;"
   
   # For nebula_platform (auth)
   psql -h /var/run/postgresql -p 5433 -U postgres -d nebula_platform -c "VACUUM FULL;"
   ```
3. If repair fails, restore from backup:
   ```bash
   # Check available backups
   ls -la /home/mike/nebula/backups/
   
   # Restore (example for nebula_audit)
   psql -h /var/run/postgresql -p 5433 -U postgres -d nebula_audit < /home/mike/nebula/backups/nebula_audit-YYYY-MM-DD.sql
   ```
4. Restart services:
   ```bash
   sudo systemctl start nebula-platform-api.service nebula-nextjs.service
   ```
5. Verify data integrity by running test queries
6. Update status page

**Contact:**
- Mike Holownych (primary): @mikeholownych on Telegram
- Database backup location: `/home/mike/nebula/backups/`

---

## Payment Webhook Failure

**Symptoms:**
- `checkout.session.completed` events not processed
- `customer_updated` events failing
- Revenue not being recorded in audit DB

**Diagnosis Checklist:**
```bash
# Check stripe webhook processing in Next.js logs
sudo journalctl -u nebula-nextjs.service --grep "stripe" --since "-30 min" --no-pager -n 50

# Verify webhook endpoint is accessible from internet
curl -s https://nebulacomponents.com/api/stripe/webhook -X POST -H "Stripe-Signature: test"

# Check platform API webhook endpoint
sudo journalctl -u nebula-platform-api.service --grep "stripe" --since "-30 min" --no-pager -n 50
```

**Recovery Steps:**
1. Verify Stripe webhook configuration in Stripe Dashboard:
   - Endpoint: `https://nebulacomponents.com/api/stripe/webhook`
   - Version: `2024-09-30.acacia`
   - Events: `checkout.session.completed`, `customer.updated`
2. Retry failed webhooks from Stripe Dashboard
3. If webhook secret mismatch, update `STRIPE_WEBHOOK_SECRET` in systemd drop-in:
   ```bash
   sudo systemctl edit nebula-nextjs.service
   # Add: Environment=STRIPE_WEBHOOK_SECRET=...
   sudo systemctl daemon-reload
   sudo systemctl restart nebula-nextjs.service
   ```
4. Implement webhook idempotency to prevent duplicate processing
5. Add monitoring for webhook delivery failures (see Monitoring section)

**Contact:**
- Mike Holownych (primary): @mikeholownych on Telegram
- Stripe Dashboard: https://dashboard.stripe.com/webhooks

---

## Security Breach

**Symptoms:**
- Unknown IP addresses in logs
- Unusual database queries
- Unexpected file modifications
- Unauthorized API access

**Immediate Actions:**
1. **ISOLATE** - Do NOT shut down services immediately (evidence preservation)
2. **DOCUMENT** - Capture current state:
   ```bash
   # Capture process state
   ps aux > /tmp/security-ps-aux.txt
   netstat -tulpn > /tmp/security-netstat.txt
   sudo journalctl -u nebula-nextjs.service -u nebula-platform-api.service --since "-24h" > /tmp/security-journal.txt
   
   # Capture open connections
   ss -tunap > /tmp/security-ss.txt
   ```
3. **IDENTIFY** - Determine scope:
   - Which services are affected?
   - What data was accessed?
   - When did the breach start?
4. **CONTAIN** - After assessment, consider:
   - Rotating all secrets (See `docs/architecture/ops-secret-rotation.md`)
   - Revoking all active sessions
   - Suspending affected user accounts
5. **REPORT** - Notify Mike Holownych immediately
6. **POST-MORTEM** - Create incident report in `governance/INCIDENTS/`

**Contact:**
- Mike Holownych (primary): @mikeholownych on Telegram
- Security escalation: Mike Holownych

---

## Major Performance Degradation

**Symptoms:**
- TTFB > 500ms for >1% of requests
- Audit completion time > 5 minutes
- High CPU/memory usage on application servers
- Database connection pool exhaustion

**Diagnosis Checklist:**
```bash
# Check system resources
top -b -n 1 | head -20

# Check Next.js server metrics
curl -s http://127.0.0.1:3107/metrics 2>/dev/null || echo "Metrics endpoint not available"

# Check database performance
psql -h /var/run/postgresql -p 5433 -U postgres -d nebula_audit -c "
  SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
  FROM pg_stat_activity 
  WHERE state != 'idle' AND now() - pg_stat_activity.query_start > interval '5 seconds';
"

# Check for slow queries
sudo journalctl -u nebula-platform-api.service --grep "slowquery" --since "-30 min" --no-pager
```

**Recovery Steps:**
1. **SCALE** - If load balancing available, add capacity
2. **CACHE** - Clear caches:
   ```bash
   # Clear Next.js build cache if needed
   sudo systemctl stop nebula-nextjs.service
   rm -rf /home/mike/nebula/customer-portal/.next
   sudo systemctl start nebula-nextjs.service
   ```
3. **THROTTLE** - Implement rate limiting on non-critical endpoints
4. **ROLLBACK** - If recent deploy caused degradation:
   ```bash
   cd /home/mike/nebula/customer-portal
   git checkout <last-known-good-commit>
   npx next build
   sudo systemctl restart nebula-nextjs.service
   ```
5. **MONITOR** - Verify recovery with metrics

**Contact:**
- Mike Holownych (primary): @mikeholownych on Telegram

---

## Escalation Matrix

| Issue | Priority | Response Time | Owner |
|-------|----------|---------------|-------|
| Service outage | Critical | <15 min | Mike Holownych |
| Database corruption | Critical | <15 min | Mike Holownych |
| Payment failure | High | <1 hour | Mike Holownych |
| Security breach | Critical | Immediate | Mike Holownych |
| Performance degradation | High | <1 hour | Mike Holownych |

---

## Post-Incident Requirements

For every P1/P2 incident:
1. Create incident report in `docs/incidents/YYYY-MM-DD-title.md`
2. Include: timeline, root cause, impact, resolution, prevention
3. Schedule team review within 5 business days
4. Update runbook if procedures changed

---

## Related Documentation

- [Ops Secret Rotation](../architecture/ops-secret-rotation.md)
- [Architecture Risk Register](../architecture/architecture-risk-register.md)
- [Deployment Cutover Operations](../../superpowers/plans/05-deployment-cutover-operations.md)
- [Failure Mode Analysis](../architecture/failure-mode-analysis.md)

---

## Backup Verification

**Frequency:** Weekly  
**Method:** Automated daily, manual verification weekly

### Automated Verification (Daily)
```bash
# In crontab
0 2 * * * /home/mike/nebula/scripts/verify_backups.sh >> /home/mike/nebula/logs/backup_verify.log 2>&1
```

### Manual Verification (Weekly)
```bash
# Create test database from backup
createdb -h /var/run/postgresql -p 5433 -U postgres nebula_audit_test_restore
psql -h /var/run/postgresql -p 5433 -U postgres -d nebula_audit_test_restore < /home/mike/nebula/backups/nebula_audit-$(date +%Y-%m-%d).sql

# Verify restore
psql -h /var/run/postgresql -p 5433 -U postgres -d nebula_audit_test_restore -c "SELECT COUNT(*) FROM audits;"

# Cleanup
dropdb -h /var/run/postgresql -p 5433 -U postgres nebula_audit_test_restore
```

### Current Backup Status
- **Last automated backup:** 2026-08-26 (via crontab)
- **Backup location:** `/home/mike/nebula/backups/`
- **Test restore:** 2026-08-26 (verified)
- **Retention:** 30 days

---

## Related Documentation

- [Ops Secret Rotation](../architecture/ops-secret-rotation.md)
- [Architecture Risk Register](../architecture/architecture-risk-register.md)
- [Deployment Cutover Operations](../../superpowers/plans/05-deployment-cutover-operations.md)
- [Failure Mode Analysis](../architecture/failure-mode-analysis.md)
