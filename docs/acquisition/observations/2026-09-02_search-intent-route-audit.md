# Search Intent and Route Audit

**Date:** 2026-09-02
**Mode:** Read-only strategy audit
**Production changes:** None
**Source boundary:** Local repository, route inventory, `docs/seo/keyword-map.md`, and `ACQUISITION_BASELINE.md`. No ranking or revenue claim is inferred beyond the recorded measurements.

## Executive finding

The supplied SEO article is useful as a page-selection principle, not as proof that Nebula can rank number one quickly.

Nebula already has the product wedge the article recommends: a real free diagnostic instrument. The immediate SEO problem is not missing tool functionality. It is query-to-page alignment, route ownership, and authority acquisition.

Do not create another generic SEO tool or change the frozen homepage. Resolve the strategy map first, then test one narrow search intent against measured GSC and SERP data.

## Measured current baseline

From `ACQUISITION_BASELINE.md`, generated 2026-09-02 for the finalized 28-day window 2026-08-05 through 2026-08-30:

- 41 indexable pages had impressions.
- 1,063 total impressions.
- 3 total clicks.
- Aggregate average position: 44.6.
- 8 pages had a best observed position in positions 1-10.
- 19 pages had a best observed position of 51+.
- `/why-is-my-landing-page-not-converting` was the largest impression page at 130 impressions, best position 59.1.
- `/landing-page-message-match` had best position 12.2 from 7 impressions.
- `/ads-getting-clicks-but-no-sales` had 7 impressions, best position 37.5.
- `/lead-generation-landing-page-audit` had 23 impressions, best position 91.6.

These are exposure measurements, not evidence of ranking success, conversion impact, or commercial demand.

## Existing route coverage

The live repository contains dedicated routes for:

- problem intent: `/why-is-my-landing-page-not-converting`, `/ads-not-converting-two-percent`
- diagnostic mechanisms: `/landing-page-message-match`, `/landing-page-cta-audit`, `/landing-page-trust-signals`, `/mobile-landing-page-audit`
- buyer contexts: `/saas-landing-page-audit`, `/ecommerce-landing-page-audit`, `/lead-generation-landing-page-audit`
- commercial/product intent: `/audit`, `/conversion-rate-optimization-audit`, `/pricing`
- category education: `/what-is-landing-page-audit`, `/best-landing-page-audit-tools`

The repository therefore already implements most of the article's proposed page formats. More page production is not yet justified.

## Strategy-map defects

### 1. Retired domain in the canonical keyword map

`docs/seo/keyword-map.md` still declares `nebulacomponents.com` as the domain and canonical URL in its opening rows. Nebula's operational canonical is `nebulacomponents.com`.

This is a documentation and governance defect. It can cause future SEO work to target the wrong canonical even if the public pages are currently correct.

**Action:** update the internal map in a separately governed documentation change. Do not change public metadata as part of this audit.

### 2. Route inventory and keyword map are not synchronized

The route inventory contains `/ads-not-converting-two-percent`, but the keyword map excerpt does not include it. The map also needs to be checked against all current route directories before new pages are proposed.

**Action:** generate a route-to-query reconciliation from the current filesystem and canonical metadata.

### 3. Existing documentation contains stale “missing” states

`docs/seo/implementation-baseline.md` describes several routes as missing even though the current repository contains them, including the problem-intent page and vertical audit pages.

**Action:** classify each discrepancy as `implemented`, `deferred`, `retired`, or `unknown`, with a checked timestamp. Do not use stale planning docs as evidence for new builds.

### 4. Potential intent overlap needs measured query data

The following pages are adjacent enough to require query-level evidence before any optimization:

- `/why-is-my-landing-page-not-converting`
- `/ads-not-converting-two-percent`
- `/ads-getting-clicks-but-no-sales`
- `/learning-centre/google-ads-clicks-no-sales`
- `/learning-centre/facebook-ads-no-leads`
- `/learning-centre/linkedin-ads-not-converting`
- `/learning-centre/tiktok-ads-not-converting`

This is not proof of cannibalization. It is a reconciliation candidate. GSC query and landing-page rows are required before merging, redirecting, or rewriting anything.

## Application of the five-step article

### Step 1: keyword choice

Use the trigger as the filter:

- active paid traffic
- clicks or spend present
- weak or absent conversion outcome
- live landing page

Candidate intent families are hypotheses only:

- ads getting clicks but no sales
- landing page not converting
- paid traffic landing page audit
- landing page message match
- mobile landing page audit

No volume, difficulty, or number-one opportunity is asserted here because current measured keyword metrics were not retrieved in this audit.

### Step 2: format choice

Validate the current SERP before changing a page. The expected format differs by intent:

- problem query: diagnostic guide with a direct audit path
- tool query: usable free audit surface
- mechanism query: evidence-backed explanatory page
- commercial query: offer and scope page

The existing route set supports these formats. The next decision is ownership, not production volume.

### Step 3: free tool

Already satisfied by `/audit`. Do not build a second generic tool to chase the article's example. A new tool would increase maintenance and dilute the diagnostic instrument unless a specific adjacent trigger is proven.

### Step 4: on-page optimization

Use natural query alignment in title, H1, opening explanation, internal links, and structured page purpose. Do not stuff keywords into every heading, image alt attribute, or CTA. Alt text describes images; it is not a keyword insertion field.

### Step 5: links and authority

Nebula's strongest linkable assets are original audit data, the published diagnostic specification, public teardowns, and repair-verification observations. Prefer corroboration and research distribution over generic guest-post volume.

## AI search boundary

Google GSC data and AI visibility data must remain separate datasets.

- Google: impressions, clicks, position, CTR, indexed state.
- AI systems: retrieval, brand mention, canonical citation, cited page, answer context, and corroboration.

Neither dataset should be converted into a single ranking score. An AI citation is not evidence of Google rank, and a Google impression is not evidence of AI citation.

## Recommended next bounded action

Create a read-only route/query reconciliation with this output per route:

```text
route
page type
primary intent
supporting intents
canonical URL
current indexability
GSC impressions/clicks/position
query overlap candidates
AI mention/citation state
recommended action: retain, observe, consolidate, or investigate
```

Acceptance criteria:

- every indexable relevant route appears exactly once;
- no `.shop` canonical remains in the strategy map;
- every “missing” state is checked against the current route inventory;
- every query metric is labeled measured or N/A;
- no public copy, visual design, CTA, information architecture, or conversion flow changes;
- no conclusion about SEO success is made until a bounded window has attributable purchase data.

## Decision

**Status:** `observe / reconcile`

Do not ship a public SEO change from this article yet. The article supports a future narrow, measurable search experiment, but the current evidence supports fixing the internal map and reconciling existing pages first.
