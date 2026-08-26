# Error Budgets

**Version:** 1.0  
**Last Updated:** 2026-08-26

---

## Error Budget Calculation

### Customer Portal

**SLO:** 99.9% uptime  
**Error Budget:** 0.1% downtime = 43.2 minutes/month

```
Monthly Error Budget = (30 days × 24 hours × 60 minutes) × 0.001 = 43.2 minutes
```

### Audit API

**SLO:** 99.9% uptime  
**Error Budget:** 0.1% downtime = 43.2 minutes/month

---

## Error Budget Burn Rate

| Burn Rate | Action |
|-----------|--------|
| < 1x | Healthy - no action needed |
| 1x | Monitor - prepare for alerting |
| 2x | Review - identify trends |
| 5x+ | Emergency - activate incident response |

---

## Error Budget Reset

- **Frequency:** Monthly (1st of each month)
- **Tracking:** Grafana dashboard (to be implemented)
- **Approval:** Mike Holownych

---

## Related Documentation

- [SLO Definition](./slo-definition.md)
- [Incident Response Runbook](../incident-response/runbook.md)
