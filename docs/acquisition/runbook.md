# Acquisition Learning System: Operator Runbook

This runbook provides step-by-step operational instructions for maintaining, running, diagnosing, and reviewing the Acquisition Learning System.

---

## 1. Normal Weekly Operation

The canonical acquisition pipeline executes automatically every Monday morning via cron:

```bash
# Production Crontab Entry (UTC)
0 6 * * 1 cd /home/mike/nebula && /usr/bin/flock -n /tmp/acq_pipeline.lock /home/mike/.local/bin/uv run --project /home/mike/nebula python scripts/acquisition_cli.py run --days 28 >> /home/mike/nebula/logs/acquisition_pipeline.log 2>&1
```

### Weekly Execution Lifecycle:
1. Synchronizes canonical routes from `customer-portal` route manifest to `page_registry`.
2. Validates source connectivity for GSC, GA4, PostgreSQL, and event ledger.
3. Ingests GSC and GA4 telemetry across the 28-day finalized window.
4. Normalizes and persists measurement facts to `acquisition_measurements`.
5. Computes rolling window deltas and state transitions.
6. Evaluates deterministic decision rules to generate candidate recommendations.
7. Generates weekly observation reports and decision reviews.

---

## 2. Manual Ingestion Run

To execute a manual measurement run:

```bash
cd /home/mike/nebula

# 1. Standard 28-day finalized window run
uv run python scripts/acquisition_cli.py run --days 28

# 2. Explicit date range run
uv run python scripts/acquisition_cli.py run \
  --start-date 2026-08-03 \
  --end-date 2026-08-30 \
  --prefix canonical

# 3. Dry-run without database commit
uv run python scripts/acquisition_cli.py run --days 28 --dry-run
```

---

## 3. Source Failure Diagnosis and Recovery

### A. Validate Source Health
```bash
uv run python scripts/acquisition_cli.py validate-sources
```

Expected output:
```json
{
  "database": {"status": "OK", "page_count": 51},
  "gsc": {"status": "OK", "details": "available"},
  "ga4": {"status": "OK", "details": "available"}
}
```

### B. Google Search Console Failures
If GSC fails due to authentication or rate limits:
1. Verify Google Cloud Service Account credentials in `$HOME/.hermes/.env`.
2. Check GSC property access for `sc-domain:nebulacomponents.com`.
3. Re-run ingestion when resolved. GSC data is retained for 16 months, so historical windows remain recoverable.

### C. PostgreSQL Database Connection Failure
If database connectivity fails:
1. Verify Postgres service status:
   ```bash
   sudo systemctl status postgresql@16-main
   ```
2. Verify port 5433 socket access:
   ```bash
   psql -U postgres -p 5433 -h /var/run/postgresql -d nebula_platform -c "SELECT 1;"
   ```

---

## 4. Route Synchronization

When new pages or routes are added to `customer-portal`:

```bash
uv run python scripts/acquisition_cli.py sync-routes
```

This ensures `page_registry` matches public routes and classifies cohort assignments declaratively.

---

## 5. Recommendation Review Workflow

To inspect and disposition generated recommendations:

```bash
# 1. List pending recommendations
uv run python scripts/acquisition_cli.py recommendations-list --environment PRODUCTION

# 2. Inspect a specific recommendation
uv run python scripts/acquisition_cli.py recommendation-inspect --rec-id rec_observe_site_20260830

# 3. Submit human review disposition
uv run python scripts/acquisition_cli.py recommendation-review \
  --rec-id rec_observe_site_20260830 \
  --action ACCEPT \
  --reviewed-by "mike" \
  --notes "Accepting passive observation recommendation."

# 4. Bridge an accepted recommendation into a controlled experiment draft
uv run python scripts/acquisition_cli.py recommendation-create-experiment-draft \
  --rec-id rec_observe_site_20260830 \
  --change-id chg_20260902_001 \
  --direction INCREASE
```

---

## 6. Controlled Experiment Lifecycle

```bash
# 1. Inspect experiment details and eligibility
uv run python scripts/acquisition_cli.py exp-inspect --exp-id exp_20260902_001

# 2. Approve experiment
uv run python scripts/acquisition_cli.py exp-approve --exp-id exp_20260902_001 --approved-by "mike"

# 3. Activate experiment (locks holdout dates)
uv run python scripts/acquisition_cli.py exp-activate --exp-id exp_20260902_001

# 4. Run confounding check
uv run python scripts/acquisition_cli.py confound-check --exp-id exp_20260902_001

# 5. Evaluate finalized experiment
uv run python scripts/acquisition_cli.py exp-eval \
  --exp-id exp_20260902_001 \
  --post-measurement-id meas_20260927_canonical_w28
```

---

## 7. AI Interpretation Operations

```bash
# 1. Execute an AI analysis run
uv run python scripts/acquisition_cli.py ai-analysis-run \
  --measurement-id meas_20260830_canonical_w28 \
  --analysis-type SITE_SUMMARY

# 2. Inspect AI runs
uv run python scripts/acquisition_cli.py ai-analysis-inspect \
  --measurement-id meas_20260830_canonical_w28

# 3. Submit human review for AI analysis
uv run python scripts/acquisition_cli.py ai-analysis-review \
  --run-id airun_site_summary_meas_20260830_canonical_w28_... \
  --status ACCEPTED_AS_ANALYSIS \
  --reviewed-by "mike" \
  --notes "Grounding verified against telemetry."

# 4. Regenerate markdown appendices
uv run python scripts/acquisition_cli.py ai-analysis-weekly --measurement-id meas_20260830_canonical_w28 --output-path docs/acquisition/observations/2026-09-02_weekly_decision_review_ai_appendix.md
uv run python scripts/acquisition_cli.py ai-analysis-28d --measurement-id meas_20260830_canonical_w28 --output-path docs/acquisition/observations/2026-09-02_28d_decision_review_ai_appendix.md
uv run python scripts/acquisition_cli.py ai-analysis-84d --measurement-id meas_20260830_canonical_w28 --output-path docs/acquisition/observations/2026-09-02_84d_strategic_review_ai_appendix.md

# 5. Synchronize longitudinal learning store
uv run python scripts/acquisition_cli.py ai-learning-sync
```

---

## 8. Report Regeneration

To re-render baseline and weekly observation reports from PostgreSQL:

```bash
uv run python scripts/acquisition_cli.py render-baseline
uv run python scripts/acquisition_cli.py render-weekly --measurement-id meas_20260830_canonical_w28
```
