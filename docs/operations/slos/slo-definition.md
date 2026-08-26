# Service Level Objectives (SLOs)

**Version:** 1.0  
**Last Updated:** 2026-08-26  
**Approval:** Mike Holownych

---

## Overview

These SLOs define reliability commitments for Nebula Components services. SLOs are measured over rolling 30-day windows.

---

## SLO Targets

| Service | SLO | Target | Measurement |
|---------|-----|--------|-------------|
| Customer Portal | Uptime | 99.9% | HTTP 200/301/302 responses |
| Customer Portal | TTFB | <100ms | P95 of request duration |
| Audit API | Uptime | 99.9% | HTTP 200/301/302 responses |
| Audit API | TTFB | <100ms | P95 of request duration |
| Audit API | Audit Completion | <2min | 95th percentile |
| Webhooks | Delivery | 99.9% | Events delivered within 5min |

---

## Error Budgets

| Service | Error Budget | Reset |
|---------|--------------|-------|
| Customer Portal | 0.1% downtime / month | Monthly |
| Audit API | 0.1% downtime / month | Monthly |

---

## Measurement

### Customer Portal
- **Source:** Cloudflare Analytics
- **Endpoint:** `/healthz` (public)
- **Query:** `HTTPStatusDetails.status in ('200', '301', '302')`

### Audit API
- **Source:** FastAPI logs + Cloudflare Analytics
- **Endpoint:** `/healthz`, `/readyz` (internal)
- **Query:** `HTTPStatusDetails.status in ('200', '301', '302')`

### Audit Completion Time
- **Source:** `nebula_audit.audits` table
- **Query:** `SELECT percentile_disc(0.95) WITHIN GROUP (ORDER BY completed_at - created_at) FROM audits WHERE created_at > now() - interval '30 days'`

---

## Escalation

| Breach Duration | Severity | Response |
|-----------------|----------|----------|
| < 5 minutes | Low | Notify on-call |
| 5-15 minutes | Medium | Page on-call, update status page |
| > 15 minutes | Critical | Activate incident response, update status page within 5min |

---

## Related Documentation

- [Incident Response Runbook](../incident-response/runbook.md)
- [Deployment Cutover Operations](../../superpowers/plans/05-deployment-cutover-operations.md)
- [.ops-secret-rotation.md](../architecture/ops-secret-rotation.md)

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-08-26 | Initial SLO definition | Agent |
