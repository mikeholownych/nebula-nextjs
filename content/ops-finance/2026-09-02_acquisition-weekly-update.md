# NEBULA ACQUISITION WEEKLY UPDATE

**Report date:** 2026-09-02
**Posture:** SYSTEM OPERATIONAL | ARCHITECTURE FROZEN | EVIDENCE ACCUMULATING

## 1. Executive Status

- **Latest canonical measurement:** `meas_20260830_canonical_w28`
- **Measurement version:** `2.0.0`
- **Decision rule set:** `ruleset_2_0_0`, active
- **Effective window:** 2026-08-03 through 2026-08-30
- **Window:** 28 finalized days
- **Completeness:** `COMPLETE`
- **Finalization:** `FINAL`
- **Measurement code commit:** `bcb5d3a5e1a51a13be399af4b42759b4c468ac61`
- **Current repository HEAD:** `a1eea1b3dac988e4820e19adb1c692498985fa4c`
- **Strategic trend:** NOT_ESTABLISHED
- **Active production experiments:** 0
- **Production recommendation class:** OBSERVE only
- **Overall posture:** CONTINUE OBSERVATION

## 2. Measurement and Source Health

- **GSC:** `SUCCESS`, HTTP 200, 91 rows received, 90 rows persisted. Status: **`UNRESOLVED_LINEAGE_GAP`**. The source-run schema records no rejection/drop reason. The 1-row gap is therefore not silently classified as an intentional exclusion.
- **GA4:** `SUCCESS`, HTTP 200, 4 rows received, 4 persisted.
- **Internal event ledger:** authoritative for product/commercial events and directly queryable, but no `internal_ledger` source-run row is recorded for this measurement.
- **PostHog:** observational only; not a canonical acquisition source run and not used to override measurement semantics.

Known measurement anomaly: `CHECKOUT_ATTRIBUTION_RESET`.

## 3. Sitewide GSC Aggregate

- Impressions: **1,072**
- Clicks: **3**
- Macro position: **44.4**
- Definition: dimensionless GSC aggregate, including anonymized/suppressed data

## 4. Observable Dimensioned Search Evidence

- Impressions: **429** across **41** visible page rows
- Definition: GSC-returned page/query-dimensioned drill-down evidence
- These values do not reconcile arithmetically to the 1,072 sitewide aggregate. The difference is not unclassified traffic; it reflects the distinct GSC aggregate versus dimensional evidence semantics.

## 5. Cohort Distribution of Observable Dimensioned Evidence

All current cohort observations are initial observations. No longitudinal cohort movement is established. Cohort impressions below sum to **429**, the observable dimensioned total, not the 1,072 sitewide aggregate.

| Cohort | Dimensioned impressions | Visible pages | Clicks |
|---|---:|---:|---:|
| problem_intent | 143 | 3 | 0 |
| commercial_comparison | 79 | 3 | 0 |
| category | 74 | 7 | 0 |
| other | 67 | 17 | 0 |
| vertical_use_case | 23 | 1 | 0 |
| resources | 17 | 5 | 0 |
| case_study | 12 | 1 | 0 |
| teardown_index | 8 | 1 | 0 |
| product_core | 4 | 2 | 0 |
| individual_teardown | 2 | 1 | 0 |

## 6. Query/Page Rows and Unique Queries

- Observable query/page rows: **90**
- Unique observable query strings: **79**
- Current measurement field `unique_visible_queries`: **79**
- Query sample is incomplete because Google suppresses portions of dimensional data.
- The earlier figure of 41 was not the current distinct-query count and should not be reused without its source definition.

## 7. Material Movement

The valid adjacent comparison is `meas_20260802_canonical_w28` versus `meas_20260830_canonical_w28`, both 28-day finalized windows with the same versioned measurement definition. The prior window had no page/query rows, so visibility is newly observed, not a ranking improvement. The deterministic sitewide recommendation remains `OBSERVE` with `TREND_NOT_ESTABLISHED`.

Position buckets for the current 41 visible pages: 1-10: 10, 11-20: 1, 21-30: 3, 31-50: 9, 51+: 18. The highest-impression page accounts for 132 of 1,072 sitewide impressions.

## 8. Page State

No genuine page state transition is established. The 41 current page records are `INITIAL` observations because the prior finalized page-level dataset is empty.

Notable current visibility includes:

- `/why-is-my-landing-page-not-converting`: 132 impressions, `POS_51_PLUS`
- `/vs/screaming-frog`: 55 impressions, `POS_51_PLUS`
- `/best-landing-page-audit-tools`: 45 impressions, `POS_51_PLUS`
- `/case-studies`: 12 impressions, `POS_1_10`
- `/teardowns`: 8 impressions, `POS_1_10`

These are observations, not improvement claims.

## 9. Query Intelligence

The current window contains **90 observable query/page rows** representing **79 distinct query strings**, with privacy suppression. Examples of observed intent themes include:

- landing page not converting
- landing page audit
- landing pages do not convert
- comparison queries involving Screaming Frog, Sitebulb, Unbounce, Hotjar, and Semrush
- lead generation audit

`query_sample_is_incomplete = true` applies. Query-intent repeatability is not established because the prior finalized window has no observable query rows. Multi-page exposure is not classified as cannibalization.

## 10. Product and Commercial Signals

Direct internal ledger query for the current effective period, 2026-08-03 through 2026-08-30, excluding `is_synthetic = true` events:

- `audit_started`: **261 production events**
- `audit_completed`: **740 production events**
- `checkout_started`: **0 production events**
- `purchase_completed`: **0 production events**

The raw totals previously shown as 273 starts, 741 completions, 4 checkout starts, and 1 purchase mixed test events into production reporting. The purchase event is explicitly `environment=test`, `payment_mode=test`, and `is_synthetic=true`.

The starts/completions figures are event counts, not unique audit journeys. They are not a funnel conversion denominator until correlation and event ownership are reconciled. The ledger shows 261 production start events but only 20 distinct `audit_id` values, and 740 production completion events with 740 distinct `audit_id` values. The apparent ordering inversion is therefore a canonical event-semantics/identity issue, not evidence of commercial performance.

The canonical measurement stores `internal_purchases: 0`, consistent with excluding test events.

## 11. Recommendation Status

Current canonical distribution for `meas_20260830_canonical_w28`:

- `OBSERVE`: 51
  - 3 `SUFFICIENT`
  - 48 `INSUFFICIENT`
- No `INVESTIGATE`, `RUN_CONTROLLED_EXPERIMENT`, `REVIEW_*`, `CONSOLIDATE`, `RETIRE`, or `EXPAND_ADJACENCY` recommendations

One production review rejected an `OBSERVE` recommendation for intentional brand positioning, with a corresponding suppression. No deterministic recommendation class changed.

## 10. Experiments

- Active production experiments: **None**
- Eligible production experiments: **None**
- Completed production evaluations: **None verified**
- 12 evaluations exist, but all are explicitly `TEST`, `TEST`, `EVALUATED`, with `CONFOUNDED` outcome. They are excluded from production conclusions.

## 11. Learning Store

- Production learning records: 0
- No learning state was promoted, downgraded, or contradicted.
- Current learning state remains `INSUFFICIENT_EVIDENCE` for longitudinal acquisition conclusions.

## 12. AI-Assisted Interpretation

Production AI analysis runs exist and completed with:

- Provider: `MOCK`
- Model: `mock-grounded-v1`
- Generation mode: `PRODUCTION`
- Status: `SUCCESS`

This is a local deterministic interpretation layer, not live external-model reasoning. It does not override measurement, trend, recommendation, or experiment state.

## 14. Five-Check Data-Lineage Reconciliation

1. **Missing internal-ledger source run:** **UNRESOLVED.** The measurement is marked `COMPLETE` and `FINAL`, but only GSC and GA4 source-run rows exist. The ledger itself is queryable and was used directly, but its ingestion lineage is absent.
2. **Duplicate recommendation review/suppression writes:** **CONFIRMED DUPLICATE PATTERN, NOT DECISION MOVEMENT.** Two page targets have repeated reviews, with 14 and 8 reviews respectively. Their corresponding suppression targets have 8 and 4 rows. This requires operational deduplication review; it does not change the deterministic recommendation class.
3. **41 versus 50 visible pages:** **RESOLVED AS ARTIFACT INCONSISTENCY.** PostgreSQL canonical `meas_20260830_canonical_w28` stores 41 visible pages. `docs/acquisition/final-validation.md` reports 50 for the same measurement ID and also reports a different dimensioned weighted position. The Phase 8 document is therefore stale or generated from a noncanonical snapshot. The database row and measurement-linked page rows are authoritative. No measurement revision is justified from the artifact alone.
4. **273 starts versus 741 completions:** **RESOLVED AS MIXED-ENVIRONMENT AND EVENT-SEMANTICS ERROR.** The earlier totals included 12 test starts, 1 test completion, 4 test checkout starts, and 1 test purchase. Production-only counts are 261 starts, 740 completions, 0 checkout starts, and 0 purchases. These remain event counts, not unique journeys: starts have 20 distinct audit IDs while completions have 740. They are not a valid funnel denominator until correlation and event ownership are reconciled.
5. **91 GSC rows received versus 90 persisted:** **UNRESOLVED DROP REASON.** The source-run table records the count delta but has no rejection reason or row-level disposition. The report must expose the gap; it must not label the row as duplicate, noncanonical, or intentionally excluded without source payload evidence.

These are reporting and lineage investigations only. They do not authorize acquisition, content, architecture, or decision-rule changes.

## 15. What Should Remain Untouched

- Do not change pages based on initial visibility observations.
- Do not treat 1,072 impressions as broad site improvement.
- Do not calculate rank deltas from the prior zero-observation window.
- Do not intervene against `OBSERVE` recommendations with insufficient evidence.
- Do not use the test purchase event as commercial validation.
- Do not activate an experiment without a valid deterministic recommendation and eligibility evidence.
- Keep architecture and measurement semantics frozen.

## 16. Unknowns and Evidence Still Required

- 28-day longitudinal ranking trend after the next valid finalized window
- 84-day strategic trend, not yet eligible
- Query-intent repeatability across finalized windows
- CTR quality and search-to-audit relationship
- Broad versus concentrated visibility persistence
- Real purchase movement and search-to-purchase attribution
- Internal ledger source-run finalization lineage for this measurement
- Exact GSC disposition for the 91st received row
- Whether repeated recommendation review/suppression writes are caused by duplicate processing or intentional repeated review
- Valid event-level correlation between audit starts and completions

## 17. Human Attention Required

- Add or recover internal-ledger source-run lineage for the canonical measurement.
- Investigate the duplicate recommendation review/suppression writes.
- Retire or clearly mark `docs/acquisition/final-validation.md` as noncanonical because its same-ID values conflict with PostgreSQL.
- Add row-level GSC rejection/disposition evidence to future source-run reporting.
- Reconcile event ownership and correlation before using audit events as a commercial funnel.

## 18. Next Evidence Checkpoint

- **7-day:** Continue operational ingestion and anomaly detection.
- **28-day:** `meas_20260927_canonical_w28`, first contiguous post-baseline comparison checkpoint.
- **84-day:** `meas_20261025_canonical_w28`, earliest mathematically eligible three-window strategic checkpoint.

## Final Weekly Question

**Did the evidence this week justify changing anything?**

**NO. Continue observation.**

The current evidence establishes search visibility, not sustained ranking improvement, repeatable query demand, commercial attribution, or a validated acquisition intervention.
