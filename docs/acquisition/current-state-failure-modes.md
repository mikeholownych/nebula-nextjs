# Acquisition Learning System: Current-State Failure Modes & Risk Analysis

**Phase:** Phase 1 (Discovery and Current-State Assessment)  
**Date:** September 2, 2026  
**Status:** Completed  
**Scope:** Exhaustive vulnerability, edge-case, and failure-mode audit of acquisition measurement and data pipelines.

---

## 1. External API Failures & Quota Exhaustion

### 1.1 Google Search Console API
- **Failure Mode:** Service account token expiration, API rate limiting, property permission revocation, or temporary Google 503 outage.
- **Current Behavior:** `gsc_query.py` catches exceptions and returns `{"error": "..."}` or exits with code 1. In `update_acquisition_baseline.py`, an unhandled JSON error causes the script to exit immediately with an incomplete run.
- **Risk:** Automated weekly baseline crons fail silently or abort midway, leaving stale baseline files.
- **Mitigation Requirement:** Implement exponential backoff, retry loops with jitter, structured error logging to `logs/acquisition_errors.log`, and alerting via production health watchdog.

### 1.2 GA4 Data API Token Bucket Limits
- **Failure Mode:** GA4 Data API enforces hourly and daily project/property token quotas. Excessive automated queries exhaust the token quota.
- **Current Behavior:** `ga4_report.py` inspects `property_quota` returned in the response, but does not throttle calls or back off if tokens are low.
- **Risk:** Exhausting GA4 tokens breaks all scheduled reporting scripts until quota resets.
- **Mitigation Requirement:** Persist retrieved metrics to PostgreSQL so that multiple analytics consumers read from local database snapshots rather than repeatedly querying GA4 APIs.

### 1.3 PostHog Ingestion Availability & Ad-Blockers
- **Failure Mode:** Client-side ad-blockers (e.g. uBlock Origin, Brave Shields) block `https://us.i.posthog.com` and `/ingest/static/array.js`. Server-side PostHog API outages cause event loss.
- **Current Behavior:** Server-side `posthog-server.ts` uses non-blocking `void ph.flush().catch(() => undefined)` to prevent customer-facing request disruption. Client-side PostHog simply fails to initialize.
- **Risk:** Client-side event counts in PostHog undercount raw traffic by 15% to 35% compared to server logs.
- **Mitigation Requirement:** Use PostgreSQL `analytics_event_ledger` as the single authoritative source of truth for funnel counts, treating PostHog as a supplementary diagnostic view.

---

## 2. Data Latency, Revisions & Timezone Desynchronization

### 2.1 Search Console 3-Day Ingestion Lag
- **Failure Mode:** GSC search analytics data for date $T$ is not available or finalized until $T+3$ days. Querying date ranges that include the last 3 days returns zero impressions or incomplete data.
- **Current Behavior:** `gsc_query.py` hardcodes an end date offset of 3 days (`now - timedelta(days=3)`).
- **Risk:** Attempting real-time day-over-day search visibility comparisons results in false negative alert alarms.
- **Mitigation Requirement:** Standardize the GSC acquisition measurement window to $[T-33, T-3]$ for 30-day rollups, and prohibit automated comparisons on data newer than 72 hours.

### 2.2 Google Search Analytics Retroactive Data Revisions
- **Failure Mode:** Google periodically updates and recalculates historical search analytics data up to 30 days retroactively as spam filters and query logs are processed.
- **Current Behavior:** In the legacy markdown approach, baseline numbers are written once to `ACQUISITION_BASELINE.md` and never refreshed for that historical period.
- **Risk:** Permanent divergence between stored baseline numbers and Google's official revised historical data.
- **Mitigation Requirement:** Implement periodic rolling historical reconciliation in the acquisition database (e.g. re-syncing the previous 30 days during weekly runs).

### 2.3 Multi-Platform Timezone Mismatch
- **Failure Mode:** GSC operates strictly in Pacific Time (America/Los_Angeles); GA4 operates in property reporting time; the platform database and server operate in UTC.
- **Current Behavior:** Scripts format queries using UTC system dates (`datetime.now().strftime("%Y-%m-%d")`) without converting to Pacific Time for GSC.
- **Risk:** A 7-8 hour boundary discrepancy between UTC dates and GSC Pacific dates attributes impressions to adjacent calendar days.
- **Mitigation Requirement:** Ingestion scripts must explicitly normalize date boundaries to America/Los_Angeles for GSC queries and UTC for storage.

---

## 3. Metric Drift, Anonymization & Calculation Inconsistencies

### 3.1 Search Query Anonymization
- **Failure Mode:** Google anonymizes "rare" search queries to protect user privacy. In GSC Search Analytics, the sum of rows from a dimensioned query (`dimensions: ["query", "page"]`) is smaller than the dimensionless total (`dimensions: []`).
- **Current Behavior:** `gsc_query.py` executes a dimensionless query to obtain true site totals, but `update_acquisition_baseline.py` re-sums dimensioned rows to calculate average position.
- **Risk:** Confusion between the sitewide macro average position (from dimensionless aggregate) and the cohort-weighted average position (from dimensioned query).
- **Mitigation Requirement:** Explicitly record both metrics in the database schema: `dimensionless_aggregate_position` and `dimensioned_weighted_avg_position`.

### 3.2 Position Distribution Bucketing Errors
- **Failure Mode:** The script `update_acquisition_baseline.py` had a logic defect in lines 230-231 where Positions 11-50 and Positions 50+ both used the expression `pages_count - bucket_1_10`.
- **Risk:** Corrupted position distribution history in generated markdown files.
- **Mitigation Requirement:** Replace ad-hoc script math with PostgreSQL SQL aggregation queries operating on validated page snapshot tables.

### 3.3 Cohort Definition Collision
- **Failure Mode:** Keyword matching for page cohorts in `update_acquisition_baseline.py` has overlapping conditions (`teardowns` matched under `vertical` before reaching `teardown`).
- **Risk:** Impression metrics are misallocated across cohorts, skewing cohort comparison reports.
- **Mitigation Requirement:** Replace string-matching heuristics with a strict, declarative route-to-cohort mapping file derived from `customer-portal/app/sitemap.ts`.

---

## 4. Attribution Anomalies & Mid-Funnel Session Resets

### 4.1 The `/checkout` Organic Landing Page Phenomenon
- **Failure Mode:** GA4 classifies downstream visits to `/checkout` as new organic search sessions.
- **Root Causes:**
  1. Stripe cancel/return redirect (`/checkout?from=stripe_cancel&audit_id=...`) starting a new session after cross-domain referral from Stripe.
  2. Session timeout (>30 min idle) on checkout tab triggering a session restart with landing page `/checkout`.
  3. Direct return / bookmark re-engagement within GA4's 30-day Last Non-Direct Click lookback window.
- **Risk:** Treating `/checkout` as a high-performing organic acquisition surface distorts content ROI and acquisition strategy.
- **Mitigation Requirement:**
  - Exclude `checkout.stripe.com` from GA4 referral sources.
  - Track true entry points via `landing_path` on the initial `journey_id` creation in `analytics_event_ledger`.
  - Discard `/checkout` as an organic landing candidate in acquisition models.

### 4.2 Synthetic Test Traffic & Bot Contamination
- **Failure Mode:** Internal testing, automated health checks, Lighthouse audits, and search bot crawlers inflate pageview and session counts.
- **Current Behavior:** `analytics_event_ledger` includes an `is_synthetic` flag and filters out test sessions from canonical funnel queries. However, GA4 and PostHog do not automatically filter internal developer visits unless the consent banner is explicitly rejected.
- **Risk:** Skewed conversion rates during active deployment and testing periods.
- **Mitigation Requirement:** Enforce synthetic headers on all automated runners, and implement developer IP / cookie exclusions in GA4 and PostHog.

---

## 5. Architectural & Pipeline Failure Modes

### 5.1 Destructive Two-File Markdown History
- **Failure Mode:** `update_acquisition_baseline.py` updates the baseline by renaming `ACQUISITION_BASELINE.md` to `ACQUISITION_BASELINE_PREV.md` and overwriting the primary file.
- **Risk:** Only 1 historical step is preserved in markdown. Any two consecutive runs in a short window wipe out historical baseline records permanently.
- **Mitigation Requirement:** Store all baseline runs as immutable rows in a dedicated PostgreSQL table (`acquisition_daily_metrics` and `acquisition_page_snapshots`). Generate markdown baseline reports dynamically from the database.

### 5.2 Canonical Host Drift (`.shop` vs `.com`)
- **Failure Mode:** Legacy scripts and documentation historically referenced `nebulacomponents.shop` (e.g. `check-sitemap-routes.mjs` default fallback, Cloudflare tunnel naming).
- **Risk:** Crawlers or check scripts inspecting the wrong host generate false error alerts or split ranking equity.
- **Mitigation Requirement:** Standardize all scripts, tests, and configuration to `https://nebulacomponents.com`.

### 5.3 Route Renames & Orphaned Canonical URLs
- **Failure Mode:** Content pages are renamed or moved without updating sitemaps and setting up permanent 301 redirects.
- **Risk:** 404 errors, loss of accumulated search impressions, and broken links from search engines.
- **Mitigation Requirement:** Require that any route modification in `customer-portal` includes a corresponding update to `sitemap.ts` and automated validation via `check-sitemap-routes.mjs`.

---

## 6. Summary Matrix: Risk Severity & Phase 2 Mitigation

| Failure Mode | Severity | Likelihood | Phase 2 Mitigation |
| :--- | :--- | :--- | :--- |
| **API Quota Exhaustion (GA4/GSC)** | Medium | High | Cache all API responses in PostgreSQL snapshot tables. |
| **Destructive Markdown History** | High | High | Move time-series storage to PostgreSQL; generate reports on demand. |
| **Cohort Logic Overlap Bug** | Medium | Certain | Declarative route-to-cohort registry linked to `sitemap.ts`. |
| **Position Bucketing Script Defect** | Medium | Certain | Calculate distribution buckets via SQL on page snapshot tables. |
| **Date Window Alignment Offset** | Medium | Certain | Synchronize ingestion spans to matching UTC calendar dates. |
| **`/checkout` Attribution Carryover** | High | Certain | Separate journey entry landing pages from session resets in ledger. |
| **Pacific vs UTC Timezone Shift** | Low | Certain | Normalize query windows to America/Los_Angeles before calling GSC. |
| **Stale GSC Revisions** | Low | Medium | Implement 30-day rolling historical reconciliation. |
