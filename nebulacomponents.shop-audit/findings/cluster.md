# Semantic Clustering & Content Architecture Audit - nebulacomponents.shop /learning-centre

Audit date: 2026-07-26
Scope: SERP-overlap cannibalization check, hub/pillar reality test, internal link matrix, topical-relevance of off-cluster content, hub-and-spoke restructuring proposal.
Method: Raw HTML fetch (no JS execution, matching a non-interactive crawler) of the hub page and 28 individual articles to extract the real server-rendered link graph; WebSearch SERP-overlap comparison (shared top-10 organic URLs) for the highest-risk cannibalization candidates.

**Category Score: 48 / 100**

The taxonomy *design* (13 named leak categories) is genuinely good information architecture, and the emergent pillar page has real, substantial organic inbound link concentration - but the hub's category system is not actually crawlable for 21 of 26 articles (JS-state-gated accordion, not server-rendered anchors), three published articles are fully orphaned and topically unrelated to the cluster, and several single-article categories have zero inbound links from any other page in the cluster. Where the architecture *is* wired up, SERP-overlap testing shows the differentiation between spokes is mostly sound - only one confirmed cannibalization pair was found.

---

## What Works

- **A real, organically-emerged pillar exists.** `/learning-centre/landing-page-not-converting` receives inbound links from essentially every other article in the cluster (confirmed in 22+ of 26 fetched pages) - this is exactly the link-equity concentration pattern a pillar page should have, and it happened without a forced "related posts" widget, i.e., writers are already treating it as the canonical anchor concept.
- **The hub's taxonomy intent is sound.** `/learning-centre` groups content into 13 labeled categories (Landing Page Leaks, Google Ads Leaks, Meta Ads Leaks, TikTok Ads Leaks, LinkedIn Ads Leaks, Paid Traffic Economics, Budget Leaks, Conversion Copy, Message Match, Trust Leaks, Form Leaks, Mobile Leaks, Industry Specific) - this is a coherent, non-arbitrary content model, not a flat chronological dump.
- **SERP-overlap testing confirms most spokes are genuinely distinct queries, not cannibalizing each other**, despite thematic closeness:
  - `google-ads-clicks-no-sales` vs. `google-ads-quality-score-low`: **0 shared top-result URLs** (zenweb.my/cometly/cubikey/gencomm vs. benly.ai/clicksgeek/genpage/get-ryze) - well-differentiated.
  - `facebook-ads-no-leads` vs. `retargeting-ads-not-converting`: **0 shared URLs** - well-differentiated despite both being "Meta ads not converting" symptoms.
  - `b2b-saas-landing-page-not-converting` vs. the generic pillar query: **0 shared URLs** (exitfive.com/cortes.design/saasify.sh vs. forbes/seedprod/apexure/optimizepress) - the SaaS vertical has a genuinely distinct SERP, not just a distinct title.
  - `pricing-page-not-converting` vs. the generic pillar: **0 shared URLs** (chrislema.com/optimizely/hubspot/userpilot) - distinct.
  - `no-testimonials-on-landing-page` vs. the generic pillar: **0 shared URLs** - distinct.
- **Body-content cross-linking within thematic sub-groups is real and bidirectional where it exists** - e.g., the Google Ads quartet (`google-ads-clicks-no-sales`, `google-ads-quality-score-low`, `google-ads-disapproved-ads-still-spending`, `high-cpc-low-conversion`) all link to each other and to `message-match-checklist`; the Trust/Copy group (`cta-not-working`, `proof-before-cta`, `no-testimonials-on-landing-page`, `message-match-checklist`) does the same. This is genuine spoke-to-spoke interlinking, not just spoke-to-pillar.

---

## Findings

### 1. The hub's category system is not actually crawlable for 21 of 26 articles - link data lives only in a client JSON payload, not server-rendered anchors
**Severity:** Critical
**Description:** Fetching `/learning-centre` with no JS execution (matching how a non-interactive crawler sees the page) shows only **5** real `<a href="/learning-centre/...">` anchor tags in the DOM: `above-fold-landing-page`, `landing-page-bounce-rate-high`, `landing-page-load-time-slow`, `landing-page-not-converting` (the "Landing Page Leaks" category, expanded by default), plus one featured `paid-traffic-leak-map` CTA link. All 21 other articles across the other 12 categories exist only as an escaped JSON string embedded in the page's React hydration payload (e.g. `\"slug\\\":\\\"cta-not-working\\\"`) - the accordion sections for those categories render their contents into the DOM only after a client-side click event fires a `useState` toggle. There is no server-rendered HTML anchor for them at all, collapsed or otherwise (this is not a CSS-`display:none` hidden-but-present pattern, which Google does index; it's a not-yet-rendered pattern).
Googlebot's rendering pass does not simulate clicking UI controls, so in practice **the hub page provides zero real crawl-discoverable links to 21 of 26 learning-centre articles**, despite displaying accurate-looking category names and counts. This compounds (but is architecturally distinct from) the sitemap gaps already flagged in `sitemap.md` Finding #1 - even the 5 articles missing from `sitemap.xml` are *also* unreachable from the hub unless already indexed by some other path.
**Recommendation:** Server-render the full article list for every category (e.g., render all `<div>` contents in the DOM and use `max-height`/`hidden` attribute purely for visual collapse, or ship all categories expanded with a "show more" progressive-enhancement pattern that doesn't gate the initial HTML). At minimum, add a flat, fully-linked sitemap-style list of all 26 articles somewhere in the page (footer or a "Browse all guides" expanded view) so the hub has at least one real, complete crawl path independent of accordion state.

### 2. Three published articles are fully orphaned from the cluster and topically unrelated to it
**Severity:** High
**Description:** `founder-second-brain`, `linkedin-skill-engine`, and `specialist-ai-agent-library` were fetched and confirmed to be about founder productivity systems, LinkedIn content-creation workflow, and AI agent tooling - none are about landing-page conversion, paid traffic, or ad performance, which is the singular theme of every other article in the cluster (confirmed by the hub's own positioning copy: "Free conversion guides for founders getting clicks but no sales"). These three:
- Have **zero outbound links** to any other `/learning-centre/` article (only a generic "← Learning Centre" breadcrumb).
- Receive **zero inbound links** from any of the 26 conversion-topic articles checked.
- Are **absent from the hub's own category JSON entirely** - they don't even appear as an uncategorized bucket; the hub's data model doesn't know they exist.
- Are also missing `meta.json` in the repo (per `sitemap.md` Finding #2), which is the direct cause of their sitemap fragility.
These pages are true content islands: no link equity flows in or out, they dilute the topical-relevance signal Google uses to associate `/learning-centre` with "landing page conversion," and they provide no clustering value to either their own (nonexistent) topic or the conversion cluster.
**Recommendation:** Do not leave these under `/learning-centre`. Either (a) relocate them to a distinctly separate path with its own small hub (e.g. `/playbooks/` or `/resources/founder-systems/`) if they serve a real purpose (they read like internal content-ops tooling docs, possibly supporting Nebula's own LinkedIn output rather than customer education), each cross-linked to the other two so they at least form their own 3-post cluster; or (b) prune/noindex them if they're leftover scaffolding with no traffic or business purpose. Do not add them to the Learning Centre taxonomy as-is - there is no coherent category for them there.

### 3. Pillar page's outbound linking covers only 5 of ~25 spokes - mandatory bidirectional spoke↔pillar linking is broken in one direction
**Severity:** High
**Description:** `landing-page-not-converting` is the confirmed de facto pillar (inbound-linked from nearly every spoke), but it only links out to `facebook-ads-no-leads`, `google-ads-clicks-no-sales`, `high-cpc-low-conversion`, `landing-page-bounce-rate-high`, and `landing-page-load-time-slow`. It does **not** link to `proof-before-cta`, `message-match-checklist`, `cta-not-working`, `no-testimonials-on-landing-page`, `mobile-landing-page-leaks`, `paid-traffic-leak-map`, `traffic-but-no-form-fills`, `before-you-raise-ad-budget`, `landing-page-conversion-rate-benchmark`, any of the 4 Industry Specific pages, `google-ads-quality-score-low`, `google-ads-disapproved-ads-still-spending`, `meta-ads-high-frequency-not-converting`, `retargeting-ads-not-converting`, `tiktok-ads-not-converting`, `linkedin-ads-not-converting`, or `above-fold-landing-page`. Link equity is flowing up to the pillar from the whole cluster but not being redistributed back down - the pillar is acting as a sink, not a hub.
**Recommendation:** Add a "Diagnose your specific leak" section to the pillar page that links out to at least one representative article per category (mirroring the hub's own 13-category taxonomy), so the pillar functions as the true top-of-funnel dispatcher it's already earning the link equity to be.

### 4. Confirmed cannibalization risk: `landing-page-not-converting` vs. `ecommerce-landing-page-not-converting`
**Severity:** Medium
**Description:** SERP-overlap check on the two natural-language query variants shows **4 of ~7 top organic results are identical URLs**: `forbes.com/councils/forbesagencycouncil/.../7-reasons-why-your-landing-pages-arent-converting/`, `seedprod.com/landing-page-not-converting/`, `apexure.com/blog/why-your-landing-page-is-not-converting-and-how-to-fix-it`, and `optimizepress.com/landing-page-not-converting/` all rank for both queries. This is a ~55-60% overlap - the "same cluster, differentiate strongly or consolidate" tier, not the "distinct query" tier that `b2b-saas-landing-page-not-converting` and `pricing-page-not-converting` cleanly land in (0% overlap each, see What Works). Google is not currently treating "ecommerce landing page not converting" as a meaningfully distinct query from the generic version, which puts the two Nebula pages at risk of competing against each other for the same ranking opportunity rather than each owning a distinct SERP.
**Recommendation:** Either strengthen `ecommerce-landing-page-not-converting` with ecommerce-specific unique evidence (product-page-specific proof, cart-abandonment-specific data, PDP-vs-landing-page distinctions) that the generic pillar doesn't cover, to justify a separate page - or fold its unique ecommerce-specific content into a dedicated section of the pillar and 301 the standalone page if it can't be meaningfully differentiated. Do not treat this as identical risk for the other Industry Specific pages (b2b-saas, pricing, coach-consultant), which tested as genuinely distinct.

### 5. Single-article categories are structurally orphaned - 0 inbound links despite being presented as legitimate categories
**Severity:** Medium
**Description:** The hub presents `TikTok Ads Leaks` (1 article: `tiktok-ads-not-converting`) and `LinkedIn Ads Leaks` (1 article: `linkedin-ads-not-converting`) as peer categories to the well-linked Google/Meta Ads groups. Cross-referencing the full link graph shows **neither article receives a single inbound link from any other page in the cluster** - not from the pillar, not from `facebook-ads-no-leads` or `retargeting-ads-not-converting` (the nearest thematic neighbors), not from each other. The same is true of `coach-consultant-landing-page` in the Industry Specific category (0 inbound links) and `landing-page-conversion-rate-benchmark` in Paid Traffic Economics (only 1 inbound link, from `before-you-raise-ad-budget`). These four pages are reachable only by direct URL/hub-accordion-click, and two of them (`linkedin-ads-not-converting`, `tiktok-ads-not-converting`) aren't even in `sitemap.xml` - compounding into near-total undiscoverability.
**Recommendation:** Add the Meta-ads trio (`facebook-ads-no-leads`, `meta-ads-high-frequency-not-converting`, `retargeting-ads-not-converting`) as cross-links from `tiktok-ads-not-converting` and `linkedin-ads-not-converting` (all five are "paid social ads not converting" variants and belong in one cross-linked cluster regardless of platform-category labels). Add reciprocal links across the 4 Industry Specific pages (`b2b-saas`, `ecommerce`, `pricing`, `coach-consultant`) so each references the others as "see also: other business models" - currently they form a weak chain, not a cluster.

---

## Proposed Hub-and-Spoke Restructuring

The existing 13-category taxonomy is directionally correct but too fragmented for the link-equity math to work (several 1-article "categories" can never accumulate internal authority). Consolidate into 6 real clusters, keep `landing-page-not-converting` as pillar, and fix the two structural breaks above (accordion crawlability, pillar fan-out).

| Cluster | Posts | Pillar link (mandatory) | Notes |
|---|---|---|---|
| **Pillar** | `landing-page-not-converting` | - | Must link out to all 6 cluster leads below |
| 1. Landing Page Fundamentals | `above-fold-landing-page`, `landing-page-bounce-rate-high`, `landing-page-load-time-slow`, `mobile-landing-page-leaks` | bidirectional | Already the best-linked cluster; keep as template |
| 2. Google Ads Leaks | `google-ads-clicks-no-sales`, `google-ads-quality-score-low`, `google-ads-disapproved-ads-still-spending`, `high-cpc-low-conversion` | bidirectional | Well-differentiated per SERP check; keep |
| 3. Paid Social Ads Leaks | `facebook-ads-no-leads`, `meta-ads-high-frequency-not-converting`, `retargeting-ads-not-converting`, `tiktok-ads-not-converting`, `linkedin-ads-not-converting` | bidirectional | Merge the current 3 fragmented single-platform categories (Meta/TikTok/LinkedIn) into one cluster so link equity accumulates |
| 4. Conversion Copy & Trust | `cta-not-working`, `message-match-checklist`, `no-testimonials-on-landing-page`, `proof-before-cta` | bidirectional | Already well-interlinked; add pillar link-back |
| 5. Industry-Specific Pages | `b2b-saas-landing-page-not-converting`, `ecommerce-landing-page-not-converting`, `pricing-page-not-converting`, `coach-consultant-landing-page` | bidirectional | Add full cross-linking (currently a weak chain); resolve Finding #4 cannibalization on the ecommerce page before scaling this cluster further |
| 6. Traffic Economics & Budget | `before-you-raise-ad-budget`, `paid-traffic-leak-map`, `landing-page-conversion-rate-benchmark`, `traffic-but-no-form-fills` | bidirectional | Give `landing-page-conversion-rate-benchmark` at least 2 more inbound links from Cluster 2/3 articles |
| **Relocate - not part of this cluster** | `founder-second-brain`, `linkedin-skill-engine`, `specialist-ai-agent-library` | none | Move to a separate hub/path or prune (Finding #2) |

### Minimum viable internal-link fixes (in priority order)
1. Server-render all 26 article links in the hub page DOM (Finding #1) - highest leverage single fix, unlocks discovery for 21 pages at once.
2. Add pillar → cluster-lead links from `landing-page-not-converting` to one representative article in each of the 6 clusters above (Finding #3).
3. Cross-link the Paid Social Ads quintet and the Industry-Specific quartet so no article in those groups has fewer than 3 inbound links (Finding #5).
4. Resolve the ecommerce/generic cannibalization pair (Finding #4).
5. Relocate or prune the 3 off-topic orphans (Finding #2).
