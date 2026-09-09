# Nebula Business Observability

Generated: `2026-09-09T20:09:59.244001+00:00`
Period: `daily` 2026-09-08 to 2026-09-09

**Primary state:** `visits_no_conversion`
**Conversion class:** `didnt_convert`
**Active states:** visits_no_conversion
**Search status:** `OBSERVED`

**Intervention:** Traffic arrives. Proposition or offer is failing. Do not treat as an outage.

## Chain

search_visibility -> acquisition -> landing_experience -> audit_journey -> determination -> repair_intent -> checkout -> revenue -> reobservation

## Metrics

| Metric | Value | Classification | Source |
|---|---:|---|---|
| impressions | 1063 | OBSERVED | gsc |
| clicks | 3 | OBSERVED | gsc |
| organic_sessions | 16 | OBSERVED | ga4 |
| ctr | 0.002822 | DERIVED | derived_ctr |
| audit_completed | 14 | OBSERVED | analytics_event_ledger |
| audit_result_viewed | 105 | OBSERVED | analytics_event_ledger |
| checkout_started | 0 | OBSERVED | analytics_event_ledger |
| checkout_creation_failed | 0 | OBSERVED | analytics_event_ledger_commercial |
| checkout_creation_failed_events | 33 | OBSERVED | analytics_event_ledger |
| purchase_completed | 0 | OBSERVED | analytics_event_ledger |

## Funnel attention

- `RESULT_UNLOCKS_DROPPED_TO_ZERO`
- `NO_PURCHASE_SIGNAL`

## Layer coverage

in_place=3 partial=20 missing=1 of 24

| ID | Layer | Status | Gap |
|---:|---|---|---|
| 1 | external_availability | partial | HTTP 200 is not a synthetic landing-to-checkout journey |
| 2 | real_user_monitoring | partial | no p95 segmentation by browser/geo on checkout |
| 3 | application_performance | partial | RED histograms not first-class for every service |
| 4 | distributed_tracing | partial | no OpenTelemetry span graph across CDN, API, Stripe, email |
| 5 | logging | partial | not every worker/CDN/WAF stream is joined on trace_id |
| 6 | metrics | partial | latency uses averages/counts more than histograms |
| 7 | network_and_edge | partial | no regional IPv4/IPv6 synthetic split |
| 8 | dependency_observability | partial | provider vs own-failure not complete for email/SMS/model APIs |
| 9 | deployment_and_change | partial | error-rate overlays on deploy SHA are not automatic |
| 10 | product_analytics | in_place |  |
| 11 | acquisition_observability | partial | no persistent GSC/GA4 time-series table; browser attribution incomplete |
| 12 | search_observability | partial | keep OBSERVED GSC/GA4 separate from ESTIMATED AEO/GEO scores |
| 13 | conversion_observability | in_place | classifier is period-aggregate; per-journey didn't vs couldn't still lives in funnel_diagnostics |
| 14 | revenue_and_financial | partial | company_brain can go stale vs ledger; no Stripe vs ledger auto-reconcile job |
| 15 | customer_lifecycle_and_support | partial | no post-purchase health score joined to journey_id |
| 16 | security_observability | partial | no dedicated SIEM; security events not joined to journey_id |
| 17 | privacy_and_consent | partial | unknown jurisdiction must not silently become consent; not yet a first-class signal |
| 18 | data_pipeline_observability | partial | ingestion lag/duplicates/schema violations are not SLI'd |
| 19 | data_quality_and_provenance | in_place |  |
| 20 | slos_slis_error_budgets | partial | Grafana tracking not implemented; no payment-success SLO on live data |
| 21 | alerting_and_anomaly_detection | partial | not every alert has owner+runbook; funnel flags are reports not incidents |
| 22 | incident_problem_change_correlation | partial | deploy SHA is not auto-joined to checkout_creation_failed spikes |
| 23 | cost_and_capacity | missing | no cost-per-audit or token/API spend attribution |
| 24 | business_kpi | partial | executive numbers must derive from this correlator, not a separate dashboard |
