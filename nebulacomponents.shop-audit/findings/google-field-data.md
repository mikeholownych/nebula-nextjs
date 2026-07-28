# Google Field Data — CrUX, GSC & GA4 (Tier 2 — Full)

**Site:** https://nebulacomponents.shop
**Date:** 2026-07-27
**Credential tier:** Tier 2 — Full (API key + Service Account + GA4), confirmed via `google_auth.py --check` (all 6 services report `available: true`: PSI, CrUX, CrUX History, GSC, Indexing API, GA4 Data API).
**Search Console property:** `sc-domain:nebulacomponents.shop` (siteOwner permission, confirmed against the account's site list).
**GA4 property:** `544419051` (config default — numeric GA4 property ID, distinct from the `G-KJ9S3450LH` measurement ID recorded in project docs; this is expected, not a discrepancy).

**This is the first pass with real Google API data for this site.** Every prior audit finding on Core Web Vitals, indexation, and organic traffic (see `findings/performance.md`, `FULL-AUDIT-REPORT.md`) was lab-only (local Unlighthouse/Lighthouse runs) or explicitly marked "unavailable — no API credentials configured." This file supersedes those numbers where they conflict, but does not delete or silently overwrite prior findings — cross-references are called out explicitly below.

---

## 1. Core Web Vitals — CrUX Field Data

**Result: no CrUX field data exists for this origin.** Both `crux_history.py https://nebulacomponents.shop --origin` and the CrUX block embedded in `pagespeed_check.py` returned the same error:

> `"No CrUX data for this origin. The site likely has insufficient Chrome traffic volume for eligibility."`

This is the standard CrUX eligibility floor (roughly a minimum popularity/traffic threshold over the trailing 28 days) — it is not a credentials or API problem (Tier 2 confirmed working; PSI and GSC calls against the same origin succeeded in the same run). **This is consistent with the GA4 finding below (3 organic sessions in 28 days) — the site simply does not yet have enough real Chrome user traffic for Google to publish a CrUX percentile.** No traffic-light CWV rating can be assigned from field data yet. Falling back to PSI lab data per the Tier 0 fallback instruction:

| Metric | Mobile (PSI Lab) | Desktop (PSI Lab) | Rating basis |
|---|---|---|---|
| Performance score | 93/100 | 100/100 | Lighthouse score, not CWV |
| LCP | 1,236 ms | 321 ms | Good / Good (both ≤2,500ms) |
| CLS | 0.160 | 0.034 | Needs Improvement / Good |
| TBT (INP proxy, no field INP exists) | 4 ms | 0 ms | Good / Good |
| FCP | 1,223 ms | 321 ms | — |

**Reconciliation note (flagged, not resolved in this pass):** these PSI lab numbers are dramatically better than the Unlighthouse lab pass recorded in `findings/performance.md` one day earlier (mobile LCP 4,139ms/TBT 828ms/CLS 0.171 on `/` there vs. LCP 1,236ms/TBT 4ms/CLS 0.160 here). Both are lab data, not field data, so neither is the "real" CWV answer — but the magnitude of the gap is large enough to need a follow-up rather than quiet acceptance of either number. Plausible causes not yet verified: (a) real production fixes shipped between the two passes (cache-header/systemd fixes referenced in `performance.md`'s finding #1 correction), (b) methodology differences (Unlighthouse's throttling profile vs. PSI's own throttling/device emulation), or (c) run-to-run lab variance. CLS is the one metric that stayed roughly consistent (~0.16-0.17 mobile) across both tools, which is a small corroborating signal that the homepage layout-shift finding in `performance.md` (#4) is real and not a fluke of one tool.

---

## 2. Search Console — Indexation Status (URL Inspection)

| URL | Verdict | Coverage state | Google canonical | User canonical | Match | Last crawl |
|---|---|---|---|---|---|---|
| `/` (homepage) | **NEUTRAL** | Duplicate, Google chose different canonical than user | `http://www.nebulacomponents.shop/` | `https://nebulacomponents.shop/` | **false** | 2026-07-25 |
| `/audit` | PASS | Submitted and indexed | `https://nebulacomponents.shop/audit` | `https://nebulacomponents.shop/audit` | true | 2026-07-23 |
| `/pricing` | PASS | Submitted and indexed | `https://nebulacomponents.shop/pricing` | `null` (no canonical detected) | null | 2026-07-15 |
| `/learning-centre/landing-page-not-converting` | PASS | Submitted and indexed | matches | matches | true | 2026-07-22 |

Live redirect chain was checked directly (`curl -I`, read-only) to see whether the homepage canonical mismatch reflects a real, currently-broken redirect: it does not — `http://www.nebulacomponents.shop/` → 301 → `https://www.nebulacomponents.shop/` → 308 → `https://nebulacomponents.shop/`, i.e. the live site correctly funnels both `www` variants to the bare-domain HTTPS canonical today. Google's index entry (last crawled 2026-07-25, 2 days before this pull) has not yet reconciled to that live behavior and is still treating `http://www...` as the chosen canonical for the homepage specifically — every other inspected page canonicalizes correctly.

Sitemap status (`gsc_query.py sitemaps`): `sitemap.xml`, last submitted 2026-07-26, **0 errors, 0 warnings**, 68 web URLs submitted. (Per the tool's own indexation_note, submitted-count is not the same as indexed-count — the URL Inspection rows above are the actual indexation truth source, and they are consistent with the sitemap being healthy.)

---

## 3. Search Console — Search Performance (28 days: 2026-06-29 to 2026-07-24)

| Metric | Value | Note |
|---|---|---|
| Clicks | 1 | `totals_complete: true` — safe to treat as the real site-wide total |
| Impressions | 34 | |
| CTR | 2.94% | |
| Avg. position | 46.6 | Page 5 of results, on average |

**Row-level data does not sum to the totals — this is expected, not an error.** All 12 individual query rows returned show `clicks: 0`, yet the site-wide total is 1 click; GSC anonymizes/omits very low-volume query rows, so the 1 real click exists somewhere Google won't attribute to a specific query. Per the skill's own guidance, only the `totals_complete: true` aggregate is being reported as a site-wide number here — the 12 rows are illustrative of query mix, not a reconcilable breakdown.

Best-performing (lowest average position) query rows observed: `why b2b saas websites dont convert` (position 8, 1 impression, page: `/learning-centre/b2b-saas-landing-page-not-converting`) and `"brand radar" ahrefs` (position 16, 1 impression). Everything else sits at position 18-97.

---

## 4. GA4 — Organic Traffic (28 days: 2026-06-29 to 2026-07-26)

| Metric | Value |
|---|---|
| Organic sessions | 3 |
| Organic users | 3 |
| Organic pageviews | 3 |
| Avg. daily sessions | 1.0 |

Only 3 of the 28 days in range recorded any organic session at all (2026-07-09, 2026-07-11, 2026-07-13 — nothing in the two weeks since). Top organic landing pages: `/` (1 session, 2 pageviews), `/7-systems.html` (1 session, 1 pageview), and `(not set)` (1 session, 0 pageviews — likely a referrer/attribution gap rather than a real page). Bounce rate 0% and engagement rate 100% on all three sessions, but the sample size (n=3) is too small to draw any behavioral conclusion from that.

---

## Findings

### 1. Organic search is producing negligible real traffic — 1 click / 34 impressions (GSC) and 3 sessions (GA4) over 28 days (High)
Both independent Google data sources agree: this site currently has almost no organic visibility or traffic. Average query position is 46.6 (page 5), and GA4 confirms only 3 organic sessions total in the last 28 days, with none in the most recent two weeks. This is the headline reality check this Tier 2 pull provides against the 10 categories of on-site/content work already audited — none of that work has yet converted into measurable search traffic. This is also *why* CrUX has no field data (see Finding 3) — the site is below Chrome's minimum traffic threshold for CWV field reporting.
**Recommendation:** Treat this as the primary KPI to move, not a bug to fix — continue content/backlink work already identified in other findings files (`content.md`, `backlinks.md`, `cluster.md`), and re-pull this same GSC/GA4 data in another 28-day cycle to establish a trend rather than a single low-volume snapshot.

### 2. Homepage's chosen Google canonical is a non-canonical, non-HTTPS URL (`http://www.nebulacomponents.shop/`) (High)
URL Inspection for `/` returns `verdict: NEUTRAL`, `coverage_state: "Duplicate, Google chose different canonical than user"`, with Google's selected canonical (`http://www.nebulacomponents.shop/`) disagreeing with the page's own declared canonical (`https://nebulacomponents.shop/`). Verified live (read-only `curl -I`) that the redirect chain today is correct end-to-end — both `http://www` and `https://www` correctly 30x-redirect to the bare HTTPS domain — so this isn't a currently-broken redirect; it's a stale canonicalization signal in Google's index (last crawled 2026-07-25) that hasn't caught up to current site behavior, and it's the *only* one of the 4 inspected URLs with this problem — `/audit`, `/pricing`, and the learning-centre article all resolve to their own correct self-referential canonical.
**Recommendation:** Request re-indexing of the homepage specifically (Indexing API is available at this tier) and re-check `gsc_inspect.py` on `/` again after the next crawl to confirm it reconciles to `https://nebulacomponents.shop/`. If it does not reconcile after a fresh crawl, investigate whether `www.nebulacomponents.shop` was ever the primary domain historically (old sitemap references, old backlinks pointing to `www`, or a stale `rel=canonical` cached from a prior deploy) since Google's canonical choice is usually driven by external signals (links, sitemaps) as much as the on-page tag.

### 3. CrUX has no field data for this origin — insufficient Chrome traffic (Medium, expected at this traffic level)
Both `crux_history.py` (origin-level) and the CrUX block inside `pagespeed_check.py` returned "No CrUX data for this origin... insufficient Chrome traffic volume for eligibility." This is not a credentials issue — every other Tier 2 service (PSI, GSC, GA4) succeeded in the same run — it's a direct consequence of Finding 1's traffic level. PSI lab data was used as the fallback (Section 1 above): mobile LCP 1,236ms/CLS 0.160/TBT 4ms, desktop LCP 321ms/CLS 0.034/TBT 0ms — both technically "Good" on LCP, CLS borderline-Needs-Improvement on mobile only.
**Recommendation:** Re-run `crux_history.py --origin` on a monthly cadence as organic traffic grows (Finding 1) — CrUX eligibility should unlock once the origin clears Chrome's minimum traffic floor, at which point CWV should be judged on field data, not PSI lab numbers.

### 4. PSI lab numbers here diverge sharply from the prior Unlighthouse lab pass in `performance.md` (Medium — flagged for reconciliation, not resolved)
This run's PSI lab data (mobile LCP 1,236ms, TBT 4ms, perf score 93) is far better than the Unlighthouse pass recorded a day earlier in `findings/performance.md` (mobile LCP 4,139ms, TBT 828ms, perf score 59, all four pages tested). Both are lab measurements from different tools with different throttling/device-emulation assumptions, so neither should be treated as ground truth over the other — CLS is the one metric that stayed roughly consistent between the two (~0.16-0.17 mobile on `/`), which corroborates `performance.md` finding #4 (real homepage layout shift) rather than the LCP/TBT gap.
**Recommendation:** Do not close out `performance.md`'s LCP/TBT findings based on this run's PSI numbers alone — re-run Unlighthouse (or PSI) again once CrUX field data becomes available (Finding 3) so there's a field-data tiebreaker between the two lab tools.

### 5. `/pricing` has no on-page canonical tag detected by URL Inspection (Low)
`user_canonical` came back `null` for `/pricing` (the only inspected page with this gap) even though Google independently resolved a correct self-referential canonical (`match: null` rather than `true`, since there's nothing to compare against). `/audit` and the learning-centre article both show an explicit matching canonical.
**Recommendation:** Confirm `/pricing` emits a `<link rel="canonical">` tag in its rendered HTML (view-source or `curl`) — if it's genuinely missing, add it for consistency with the rest of the site, even though Google is currently resolving the right URL anyway.

---

## Category Score: 58 / 100

Rationale: sitemap health and 3-of-4 page-level indexation are clean (no penalty there), and Tier 2 access itself worked flawlessly across all 6 services. The score is held down by the two substantive findings this data uniquely surfaces: real organic traffic is still negligible (Finding 1 — expected for a young site, but it is the honest baseline this audit needed and previously couldn't measure), and the homepage-specific canonical mismatch (Finding 2) is a genuine, previously-invisible indexation defect that could be diluting the homepage's own ranking signal. This score is a baseline snapshot, not a trend — its main value going forward is as the first real data point to compare future GSC/GA4/CrUX pulls against.

---

## Sources & Confidence

| Source | Confidence | Coverage this run |
|---|---|---|
| PageSpeed Insights v5 (`pagespeed_check.py`) | 0.95 | Mobile + desktop, both completed fully against the live homepage; lab data only (CrUX field block empty/errored) |
| Chrome UX Report + CrUX History API | 0.95 (of the "no data" verdict itself) | Confirmed origin is below CrUX's Chrome-traffic eligibility floor — same conclusion from two independent endpoints (PSI's embedded CrUX block and standalone `crux_history.py`) |
| Google Search Console API — URL Inspection | 0.95 | 4/4 planned URLs inspected successfully (homepage + 3 key pages), no errors |
| Google Search Console API — Search Analytics (`gsc_query.py`) | 0.90 for the `totals_complete: true` aggregate; 0.5 for the 12 individual query rows (known anonymization gap, explicitly does not sum to totals) | 28-day window, 2026-06-29 to 2026-07-24 |
| Google Search Console API — Sitemaps | 0.95 | 1 sitemap, fully read, 0 errors/warnings |
| GA4 Data API v1beta (`ga4_report.py`) | 0.85 | Organic + top-pages reports both completed against property `544419051`; confidence capped below 0.95 only because sample size (3 sessions) is too small for behavioral metrics (bounce/engagement rate) to be meaningful, not because of any query failure |
| Manual live-redirect verification (`curl -I`, read-only) | 0.95 | Used only to confirm Finding 2 is a stale index signal, not a live redirect bug — 2 requests, both against public production endpoints |

No `validate_*` pre-delivery review script was run against this specific file (none of the existing category-specific validators in this skill cover combined CrUX/GSC/GA4 output) — every numeric claim above is sourced directly from the raw JSON tool output quoted or paraphrased in the sections above, with no interpolation.
