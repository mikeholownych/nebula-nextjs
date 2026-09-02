# Acquisition Learning System: Current-State Assessment

**Phase:** Phase 1 (Discovery and Current-State Assessment)  
**Date:** September 2, 2026  
**Status:** Completed  
**Authoritative Scope:** Search Visibility (GSC), Organic Traffic (GA4), Telemetry (PostHog), Event Ledger (`analytics_event_ledger`), Route Architecture, and Baseline Measurement Integrity.

---

## 1. Executive Summary

This assessment establishes the technical and operational baseline of Nebula's acquisition ecosystem prior to implementing the Acquisition Learning System. It validates existing metric calculations, investigates historical measurement discrepancies, identifies authoritative source systems, analyzes data-quality anomalies (including the `/checkout` organic session phenomenon), and audits failure modes across all integration points.

All statements in this document are strictly categorized as `OBSERVED`, `INFERRED`, `UNKNOWN`, `RISK`, or `RECOMMENDATION`.

---

## 2. Validation of Current Calculations & Baseline Metrics

### 2.1 Current Known Baseline State
- **Period Analyzed:** 2026-08-03 to 2026-09-01 (30-day window)
- **Search Visibility (GSC Property `sc-domain:nebulacomponents.com`):**
  - Unique pages with impressions: 41
  - Total impressions: 429
  - Total clicks: 0
  - Sitewide impressions-weighted average position: 64.3 (Current Baseline v2) vs 65.6 (Previous Baseline v1)
  - Top 5 pages impression share: 64.6% (277 / 429 impressions)
- **Organic Traffic (GA4 Property `544419051`):**
  - Total organic sessions: 16 (~0.53 sessions/day)
  - Users: 16 (1:1 session-to-user ratio)
  - Top landing pages: `/` (12 sessions, 75.0%), `/checkout` (4 sessions, 25.0%)

### 2.2 Sitewide Average-Position Semantics & Discrepancy Investigation
- `OBSERVED`: In `ACQUISITION_BASELINE_PREV.md`, the sitewide average position was recorded as `65.6`. In `ACQUISITION_BASELINE.md`, it was recorded as `64.3`.
- `OBSERVED`: In `gsc_query.py`, two distinct retrieval methods exist:
  1. Dimensionless Aggregate Query (`dimensions: []`): Google Search Console calculates the sitewide average position across all search queries, including rare/anonymized queries.
  2. Dimensioned Query (`dimensions: ["query", "page"]`): Returns individual rows for visible queries and pages.
- `OBSERVED`: In `scripts/update_acquisition_baseline.py` (Measurement Version 2), `avg_pos` is calculated as an impressions-weighted average across dimensioned rows:
  $$\text{avg\_pos} = \frac{\sum (\text{row}[\text{"impressions"}] \times \text{row}[\text{"position"}])}{\sum \text{row}[\text{"impressions"}]}$$
- `INFERRED`: The historical discrepancy between 65.6 and 64.3 is caused by the difference between the GSC dimensionless API total and the script-calculated weighted average over filtered/anonymized query rows. When GSC suppresses low-volume search queries from the dimensioned breakdown to protect user privacy, the sum of dimensioned rows represents a filtered subset of total impressions.
- `RISK`: Comparing an unweighted average of page positions, a dimensionless GSC aggregate, or a dimensioned row-weighted average across different periods creates false drift signals.
- `RECOMMENDATION`: Maintain a single, strictly defined canonical formula: impressions-weighted position on dimensioned rows for cohort drill-downs, alongside the raw GSC dimensionless aggregate position for sitewide macro tracking. Store both values explicitly with metadata.

### 2.3 Date Windows and Data Lag Validation
- `OBSERVED`: Google Search Console has an inherent 3-day data finalization lag. In `gsc_query.py`, the default end date is set to `(datetime.now() - timedelta(days=3))`.
- `OBSERVED`: GA4 Data API default end date in `ga4_report.py` is set to `(datetime.now() - timedelta(days=1))`.
- `OBSERVED`: In `scripts/update_acquisition_baseline.py`, both GSC and GA4 queries specify `--days 30`. However, because GSC ends at $T-3$ days and GA4 ends at $T-1$ day, the date windows are misaligned by 2 days (GSC: $T-30$ to $T-3$, a 27-day span; GA4: $T-30$ to $T-1$, a 29-day span).
- `RISK`: Correlating GSC impressions with GA4 sessions across misaligned date windows distorts conversion rate calculations.
- `RECOMMENDATION`: Normalize all ingestion windows to explicit, matching UTC date ranges (e.g. $[T-30, T-3]$ inclusive for both services when performing cross-service attribution).

### 2.4 Timezone Handling
- `OBSERVED`: Google Search Console Search Analytics operates in Pacific Time (America/Los_Angeles / PT).
- `OBSERVED`: GA4 property reporting operates in the configured property timezone.
- `OBSERVED`: PostgreSQL database (`nebula_platform.analytics_event_ledger`) stores timestamps in UTC (`timestamptz`).
- `OBSERVED`: Python scripts execute with system local time (UTC) without timezone conversion when constructing date strings (`YYYY-MM-DD`).
- `INFERRED`: A UTC date string passed to GSC API queries Pacific Time calendar days, shifting the reporting boundary by 7 or 8 hours depending on Daylight Saving Time.
- `RECOMMENDATION`: Establish explicit timezone transformation in all ingestion pipelines. Document the boundary convention in the measurement protocol.

### 2.5 Position Distribution Calculation Bug in Legacy Script
- `OBSERVED`: In `scripts/update_acquisition_baseline.py` lines 230-231:
  ```python
  report += f"| Positions 11-50 | {data['pages_count'] - data['bucket_1_10']} | {data['pages_count'] / data['pages_count'] * 100 - data['bucket_1_10'] / data['pages_count'] * 100:.1f}% |\n"
  report += f"| Positions 50+ | {data['pages_count'] - data['bucket_1_10']} | N/A |\n"
  ```
- `OBSERVED`: The script outputs `27` for Positions 11-50 and `27` for Positions 50+ because both lines evaluate `data['pages_count'] - data['bucket_1_10']` (41 - 14 = 27). The script does not calculate true 11-50 and 50+ buckets.
- `RISK`: Historical baseline position distribution tables contain invalid bucket counts.
- `RECOMMENDATION`: Refactor the script to iterate over page stats and categorize best positions into exact buckets: `1-10`, `11-20`, `21-50`, and `50+`.

### 2.6 Cohort Assignment Overlap & Logic Errors
- `OBSERVED`: In `scripts/update_acquisition_baseline.py` lines 108-135, cohort classification relies on sequential `if/elif` substring checks:
  - Line 118: `elif "lead-generation" in page or "teardowns" in page or "pricing" in page: cohorts["vertical"] += data["impressions"]`
  - Line 124: `elif page == "/teardowns": cohorts["teardown"] += data["impressions"]`
  - Line 127: `elif "/teardowns/" in page: cohorts["teardown"] += data["impressions"]`
- `OBSERVED`: Because `"teardowns"` is matched under `vertical` at line 118, the conditions for `teardown` at lines 124 and 127 are unreachable for teardown pages.
- `OBSERVED`: In `scripts/log_change.py`, cohort definitions use a different mapping (`"Teardown": "/teardowns, /teardowns/*"`).
- `RISK`: Cohort impressions reported in `ACQUISITION_BASELINE.md` misallocate teardown impressions to vertical.
- `RECOMMENDATION`: Replace substring checks with an authoritative, declarative route-to-cohort registry linked directly to the site route definitions.

---

## 3. Authoritative Systems Review

| Question | Authoritative System / Status | Description & Verification |
| :--- | :--- | :--- |
| **1. Canonical application database** | `nebula_platform` (PostgreSQL 16 on port 5433) | Holds users, memberships, organizations, platform features, and `analytics_event_ledger`. `nebula_audit` serves as the diagnostic audit execution database. |
| **2. Event system for product journey** | `analytics_event_ledger` in `nebula_platform` | Single authoritative append-only PostgreSQL ledger with database-level immutability trigger (`trg_prevent_mutation_ledger`). PostHog and GA4 are downstream client/server projections. |
| **3. Canonical event registry scope** | `customer-portal/config/analytics-registry.json` | Currently defines 18 events across 9 stages. Contains only 1 acquisition event (`landing_page_view`). Needs structured expansion for SERP metrics, channel snapshots, and search ingestion. |
| **4. Page routes and canonical URLs** | Next.js App Router in `customer-portal/app/` | Canonical base: `https://nebulacomponents.com`. Sitemap generator: `customer-portal/app/sitemap.ts`. Route inventory validated via `check-sitemap-routes.mjs`. |
| **5. Scheduled jobs execution** | System Crontab (`crontab -l`) via `uv run` | Python scripts run on cron with file locking (`flock`) and output logging in `ledgers/` and `logs/`. Long-running daemons run via systemd user/system services. |
| **6. Internal reporting / dashboards** | Ad-hoc Python scripts & PostHog | `scripts/funnel_benchmark.py`, `metrics_puller.py`, `ledger_metrics.py`, and PostHog project dashboards. No centralized acquisition learning dashboard currently exists. |
| **7. Authority of markdown files** | Generated artifacts & documentation | `ACQUISITION_BASELINE.md` is a generated artifact. `CHANGE_LOG.md` is an append-only log. `MEASUREMENT_PROTOCOL.md` is operational documentation. MDX/content files are source copy. |
| **8. Analytics credentials / integrations** | Active & Verified | Google OAuth Service Account credentials in `~/.claude/skills/seo/scripts/google_auth.py` (GSC & GA4 property `544419051`). PostHog key in env. Stripe live key in `~/.hermes/.env`. |
| **9. Structured persistent storage for acquisition** | **NONE** (Critical Gap) | GSC and GA4 acquisition metrics are queried on-demand and dumped into markdown files. No PostgreSQL tables currently store historical GSC/GA4 time-series snapshots. |

---

## 4. Deep-Dive: The `/checkout` GA4 Organic Sessions Anomaly

### 4.1 Observed Evidence
- `OBSERVED`: In GA4 reporting for the baseline period, 4 of 16 organic sessions (25.0%) reported `/checkout` as their initial `landingPage`.
- `OBSERVED`: `/checkout` in `customer-portal/app/checkout/page.tsx` explicitly sets:
  ```typescript
  export const metadata: Metadata = {
    alternates: { canonical: 'https://nebulacomponents.com/checkout' },
    robots: { index: false, follow: false },
  }
  ```
- `OBSERVED`: GSC performance queries confirm that `https://nebulacomponents.com/checkout` received 0 impressions, 0 clicks, and is not indexed in Google Search.
- `OBSERVED`: In `scripts/update_acquisition_baseline.py` line 280, the report generation code hardcoded the homepage `/` session count as:
  $$\text{homepage\_sessions} = \text{total\_organic\_sessions} - \text{checkout\_sessions} = 16 - 4 = 12$$
  This masked any other potential landing pages.

### 4.2 Root Cause Analysis
1. **Stripe Return / Cancellation Flow:**
   When a user initiates checkout, they are redirected to Stripe Hosted Checkout (`checkout.stripe.com`). If they cancel or navigate back, Stripe redirects to `https://nebulacomponents.com/checkout?from=stripe_cancel&audit_id=...`. If more than 30 minutes elapsed while on Stripe, or if the browser cross-domain navigation severed session context, GA4 starts a new session upon landing at `/checkout`. Under GA4's default Last Non-Direct Click attribution model, this new session inherits the user's prior organic search attribution.
2. **Session Timeout on Checkout Tab:**
   A visitor who arrived via organic search, ran an audit, opened `/checkout`, and left the tab inactive for > 30 minutes triggers a new session when re-engaging with the page. The landing page for that new session is recorded as `/checkout`.
3. **Direct Return within Attribution Lookback Window:**
   If a user originally found the site via organic search and later typed the checkout URL directly or reopened a saved tab within GA4's 30-day lookback window, GA4 attributes the direct session to Organic Search.

### 4.3 Conclusion & Handling
`/checkout` is **not** an organic acquisition landing page. It is a downstream conversion surface receiving session restarts that carry historical organic search attribution.

`RECOMMENDATION`:
- Do not treat `/checkout` as an acquisition surface in the Acquisition Learning System.
- Configure GA4 cross-domain measurement and referral exclusions for Stripe (`checkout.stripe.com`).
- Track true first-touch landing pages separately from mid-funnel session resets in `analytics_event_ledger`.

---

## 5. Classification of Architecture Components

The following categorization defines how existing assets should be treated in subsequent implementation phases:

### 5.1 REUSE
1. **Google OAuth Client Integration (`google_auth.py` / GSC & GA4 API helpers):**
   *Justification:* Fully functional, authenticated, and tested service account integration for GSC Search Analytics and GA4 Data API v1beta.
2. **PostgreSQL Database Infrastructure (`nebula_platform`):**
   *Justification:* Production-grade PostgreSQL 16 cluster with connection pooling (`customer-portal/app/lib/db.ts` and `platform_api/db.py`).
3. **Canonical Event Ledger Pattern (`analytics_event_ledger`):**
   *Justification:* Append-only immutability, session/journey propagation, synthetic test isolation, and deduplication rules are production-proven.
4. **Canonical Sitemap Generator (`customer-portal/app/sitemap.ts`):**
   *Justification:* Authoritative source of all 68+ published routes, priorities, and canonical URLs.
5. **Standardized Cron Execution Pattern (`crontab` + `uv run`):**
   *Justification:* Consistent with production operations doctrine and isolated virtual environments.

### 5.2 EXTEND
1. **Canonical Event Registry (`customer-portal/config/analytics-registry.json`):**
   *Justification:* Must be expanded to define structured acquisition events (`gsc_page_performance_recorded`, `ga4_channel_traffic_recorded`, `serp_ranking_observed`) with strict privacy classifications and bounded properties.
2. **PostgreSQL Schema (`nebula_platform`):**
   *Justification:* Add dedicated tables for acquisition snapshots:
   - `acquisition_daily_metrics` (macro GSC / GA4 totals)
   - `acquisition_page_snapshots` (per-page impressions, clicks, position)
   - `acquisition_query_snapshots` (per-query impressions, clicks, position)
   - `acquisition_cohort_metrics` (cohort-level aggregations)
   - `acquisition_changes` (structured change-log entries linked to commits)
3. **Measurement Protocol (`MEASUREMENT_PROTOCOL.md`):**
   *Justification:* Update to specify automated snapshot schedules, exact timezone conversions (UTC vs PT), and unified date window alignments.

### 5.3 REFACTOR
1. **Baseline Update Script (`scripts/update_acquisition_baseline.py`):**
   *Justification:* Fix position bucket logic bug (lines 230-231), fix cohort overlap bug (line 118), remove hardcoded `/` landing page math (line 280), align date window queries, and write to PostgreSQL rather than only markdown.
2. **Change Logger (`scripts/log_change.py`):**
   *Justification:* Connect change logging directly to the PostgreSQL acquisition changes table and link changes to cohort IDs.
3. **Client Analytics Runtime (`customer-portal/app/components/AnalyticsRuntime.tsx`):**
   *Justification:* Ensure initial referrer classification and UTM parameter extraction are captured consistently on first visit.

### 5.4 REPLACE
1. **Two-File Markdown State Swap (`ACQUISITION_BASELINE.md` vs `PREV.md`):**
   *Justification:* Overwriting a single previous file destroys longitudinal time series and makes multi-week trend analysis impossible. Replace with database-backed multi-period time-series storage from which markdown reports can be generated on demand.
2. **Substring-Based Cohort Classification:**
   *Justification:* Fragile regex and substring matching in scripts must be replaced with a declarative route-to-cohort registry derived from `sitemap.ts` and `content_taxonomy.json`.

### 5.5 RETIRE
1. **Legacy Domain References in Scripts:**
   *Justification:* Retire references to `nebulacomponents.shop` in legacy check scripts (e.g. `check-sitemap-routes.mjs` default fallback) to prevent canonical host confusion.
2. **Unweighted Sitewide Average Position Metrics:**
   *Justification:* Discard any unweighted or simple average position calculations to eliminate metric drift.

---

## 6. Synthesis: Readiness for Phase 2

- `OBSERVED`: Existing acquisition measurement relies on manual/semi-automated Python scripts outputting to untracked markdown files.
- `OBSERVED`: Core infrastructure (PostgreSQL, GSC API, GA4 API, PostHog, Next.js sitemap, canonical domain) is operational and healthy.
- `OBSERVED`: No persistent acquisition data model currently exists in PostgreSQL.
- `RISK`: Building acquisition learning algorithms on raw GSC/GA4 API calls without intermediate structured persistence would create high API quota consumption, data loss on schema changes, and unrepeatable analyses.
- `RECOMMENDATION`: Phase 2 must begin with the database schema definition for acquisition time series and the declarative route-cohort registry.
