# Measurement Protocol

**Last updated:** September 2, 2026  
**Baseline period:** August 3 - September 1, 2026  
**Next comparison:** October 1 - October 30, 2026

## Core Principle

Do not compare absolute values between different measurement periods. Compare only when all conditions are identical:

1. **Date window:** Same number of days (28-30 day windows recommended)
2. **GSC property:** Same property ID and filters
3. **Page cohorts:** Same cohort definitions
4. **Position calculation:** Same weights (impressions-weighted vs simple avg)
5. **Bot/internal exclusion:** Same traffic filtering
6. **GA4 attribution:** Same channel grouping and session model
7. **Site changes:** Documented and accounted for

## Measurement Versioning & Drift Detection

Each baseline includes version metadata to distinguish "site changed" from "measurement changed":

| Field | Description |
|-------|-------------|
| `measurement_version` | Script schema version (current: 2) |
| `query_window` | Date range for GSC/GA4 data |
| `source_filters` | GSC property, dimensions, and filters |
| `cohort_definition_version` | Page cohort classification schema |
| `generated_at` | Timestamp when baseline was generated |
| `git_commit` | Commit hash of baseline script |

Example from baseline header:
```
**Period:** 2026-08-03 - 2026-09-01 (30 days)
**Generated:** 2026-09-02 12:47:37
**Git Commit:** a78846b75992aa41ed845b75ad62a6a90ac6be33
**Measurement Version:** 2
```

### When Values Drift

| Observation | Likely Cause | Action |
|-------------|--------------|--------|
| Metric changed, git_commit same | Site content/structure changed | Investigate site changes |
| Metric changed, git_commit different | Measurement methodology changed | Review script changes |
| Different measurement_version | Schema update required | Recalculate historical baselines |
| Same metric, different values | Query/filter drift | Verify GSC/GA4 filters match |

## Canonical Position Metrics

The system distinguishes between two complementary position measures and never uses generic "average position":

1. **`gsc_aggregate_position` (Macro Sitewide Search Position):**
   Retrieved directly from the GSC dimensionless aggregate query (`dimensions: []`). Represents Google's official aggregate ranking across all queries, including anonymized long-tail volume.
   ```python
   # GSC dimensionless aggregate position
   sitewide_macro_pos = gsc_data["totals"]["position"]
   ```

2. **`dimensioned_impression_weighted_position` (Cohort & Page Drill-Down Position):**
   Calculated as the impressions-weighted average across returned dimensioned (query, page) rows:
   ```python
   # Impressions-weighted position across non-anonymized visible rows
   total_weighted_pos = sum(row["impressions"] * row["position"] for row in rows)
   drilldown_pos = total_weighted_pos / total_impressions if total_impressions > 0 else 0
   ```

### Why Both Metrics Are Retained?

- `gsc_aggregate_position` captures the true sitewide macro trend without being biased by Google's query anonymization filter.
- `dimensioned_impression_weighted_position` enables accurate drill-down attribution across specific pages, cohorts, and search queries.

## Weekly Baseline Update Script

Run weekly (automated via cron):

```bash
python3 /home/mike/nebula/scripts/update_acquisition_baseline.py
```

This script:
1. Fetches GSC data (last 30 days)
2. Fetches GA4 organic traffic (last 30 days)
3. Compares against previous baseline
4. Outputs delta report
5. Updates `ACQUISITION_BASELINE.md` with new period

## Comparison Checklist

Before declaring improvement, verify:

- [ ] Impressions grew AND position improved (not just more low-position impressions)
- [ ] New pages entered top 30/20/10 (coverage improvement)
- [ ] Existing pages moved to better positions (depth improvement)
- [ ] CTR increased (SERP presentation quality)
- [ ] Impressions grew for same queries (demand)
- [ ] GA4 organic sessions increased proportionally (acquisition)
- [ ] Audit starts/checkout events increased (conversion)

## Change Log Template

| Date | Change | Affected Cohort/Page | Expected Impact | Deployed Commit |
|------|--------|---------------------|-----------------|-----------------|
| 2026-09-02 | Added Service schema to repair-sprint pages | Teardown | Neutral (technical SEO) | 1e6aeb9 |
| 2026-09-02 | Updated case-studies headings | Case-study | Neutral (internal only) | 1e6aeb9 |

Format for automated entries (run after each deploy):
```bash
python3 /home/mike/nebula/scripts/log_change.py --change "Update Service schema" --cohort Teardown --commit $(git rev-parse HEAD)
```

## Anomalies & Data Quality Gates

**Stop interpreting data or tag with KNOWN_ATTRIBUTION_BEHAVIOR if:**

1. `/checkout` sessions appear in GA4 organic acquisition (classified as `KNOWN_ATTRIBUTION_BEHAVIOR`; excluded from search-entry landing models)
2. Bounce rate < 15% or > 95% (measurement instrumentation issue)
3. Pageviews per session < 1.1 or > 50 (telemetry anomaly)
4. Zero GSC impressions but GA4 organic landing sessions exist (indexing / attribution issue)
5. GSC impressions increased but position got worse (content quality / relevancy issue)
6. Observation window includes data < 3 days old (unfinalized GSC data lag)

## Export Commands

### GSC Export (manual verification)
```bash
"$HOME/.claude/skills/seo/bin/claude-seo" run gsc_query.py query \
  --property sc-domain:nebulacomponents.com --days 30 --json \
  > /tmp/gsc_export_$(date +%Y%m%d).json
```

### GA4 Export (manual verification)
```bash
"$HOME/.claude/skills/seo/bin/claude-seo" run ga4_report.py \
  --property 544419051 --report organic --days 30 --json \
  > /tmp/ga4_export_$(date +%Y%m%d).json
```

### PostHog Export (daily)
```bash
# See customer-portal/posthog_queries/ for existing dashboards
```

## Deterministic Recommendations & Decision Reviews (Phase 6)

### 1. Generating Deterministic Recommendations
```bash
uv run python scripts/acquisition_cli.py recommendations-generate --measurement-id meas_20260830_canonical_w28
```

### 2. Decision Review & Provenance Workflows
```bash
# Reconcile canonical page coverage (Invariant: unaccounted == 0)
uv run python scripts/acquisition_cli.py reconcile-coverage --measurement-id meas_20260830_canonical_w28

# Human decision review
uv run python scripts/acquisition_cli.py recommendations-review --rec-id <REC_ID> --action ACCEPT --reviewed-by "mike" --notes "Valid hypothesis"

# Bridge accepted candidate to Phase 5 experiment draft
uv run python scripts/acquisition_cli.py recommendation-create-experiment-draft --rec-id <REC_ID> --change-id <CHG_ID>

# Decision review reports (with complete provenance headers)
uv run python scripts/acquisition_cli.py decision-review-weekly --measurement-id meas_20260830_canonical_w28 --environment PRODUCTION --generation-mode PRODUCTION
uv run python scripts/acquisition_cli.py decision-review-28d --measurement-id meas_20260830_canonical_w28 --environment PRODUCTION --generation-mode PRODUCTION
uv run python scripts/acquisition_cli.py decision-review-84d --measurement-id meas_20260830_canonical_w28 --environment PRODUCTION --generation-mode PRODUCTION
```
