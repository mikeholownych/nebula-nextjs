# Nebula Business Observability Model

**Status:** Operational  
**Owner:** CEO / ops-finance  
**Code:** `scripts/business_observability.py`  
**Snapshot:** `reports/business_observability/latest.md`

This is the correlation layer, not a dashboard catalog.

## Chain

Search Visibility -> Acquisition -> Landing Experience -> Audit Journey -> Determination -> Repair Intent -> Checkout -> Revenue -> Re-observation

Technical health, deployment revision, consent state, and evidence provenance attach to that chain. They do not replace it.

## Four states

These are mutually exclusive as the *primary* state. They require different interventions.

| Primary state | Evidence | Intervention |
|---|---|---|
| `not_discovered` | impressions = 0 | Indexation / query coverage. Not conversion copy. |
| `discovered_no_visits` | impressions > 0, clicks = 0, sessions = 0 | Titles, snippets, position. Not checkout. |
| `visits_no_conversion` | visits or audits, zero checkout start, zero checkout failure | Proposition / offer. Not an outage. |
| `system_prevents_conversion` | checkout_creation_failed > 0 and checkout_started = 0 | Fix the pay path before buying traffic. |

`didn't_convert` vs `couldn't_convert` is the commercial split of the last two states.

Missing search data is `UNKNOWN`, never treated as zero discovery.

## Provenance

Every number in the snapshot is one of:

- `OBSERVED` (GSC, GA4, `analytics_event_ledger`)
- `DERIVED` (CTR, rates)
- `ESTIMATED` (AEO/GEO modeled scores; excluded from this classifier)
- `UNKNOWN` (source missing)

Do not flatten those into equally authoritative dashboard tiles.

## What already exists

Do not add a second monitoring stack. Reuse:

- Event registry: `customer-portal/config/analytics-registry.json`
- Ledger: `nebula_platform.analytics_event_ledger` (`journey_id`, `build_revision`)
- Funnel health: `scripts/funnel_health_monitor.py`
- Journey reconstruction: `scripts/funnel_diagnostics.py`
- Route health: `scripts/health-check.sh`, `/api/readyz`
- Search: GSC baseline, citation tracker
- SRE: `pipeline_health_check.py` / `sre_responder.py`

The 24-layer coverage table lives in the snapshot. Most layers are `partial`. Filling them with vendor APM is not the next revenue action.

## How to run

```bash
cd /home/mike/nebula
./venv/bin/python scripts/business_observability.py
```

Cron: `nebula-business-observability` daily 03:00 UTC, `no_agent`, local delivery.

## Proof boundary

This snapshot proves the *commercial state* from existing artifacts.

It does not prove:

- live Stripe vs ledger reconciliation
- a synthetic landing -> signup -> checkout journey
- per-browser checkout p95
- cost per audit
