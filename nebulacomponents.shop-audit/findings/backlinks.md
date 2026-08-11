# Backlink Profile Findings - nebulacomponents.shop

Audit date: 2026-07-27 (supersedes the 2026-07-26 Tier-0 pass)
Scope: Backlink/referring-domain profile, domain-graph presence, and realistic near-term link-acquisition angles.

**Credential tier: 2 - Full Free (Moz + Bing + Common Crawl + Verify).** `backlinks_auth.py --check` now reports Moz and Bing Webmaster credentials configured and available at `~/.config/claude-seo/backlinks-api.json`. This run replaces the prior Tier-0 pass's Common-Crawl-only estimate with real Moz Link Explorer metrics (DA/PA/spam score/referring domains/anchors) and real Bing Webmaster Tools inbound-link data for this verified property. **This supersedes the 2026-07-26 report in full** - do not treat the two as complementary; this file is now the authoritative backlink-profile record.

**Category Score: INSUFFICIENT DATA (not scored 0-100) - but for a different, more informative reason than the Tier-0 pass.**

At Tier 0, the domain simply hadn't been crawled by Common Crawl yet, so nothing could be concluded either way. At Tier 2, two independent authoritative sources - Moz Link Explorer and Bing Webmaster Tools (a verified property, not a third-party guess) - now **positively confirm** a near-zero backlink profile rather than leaving it ambiguous. Per the skill's scoring rule, a numeric score still requires real data on 4+ of 7 weighted factors. Of the 7, only **referring-domain count** and **toxic-link ratio** have a real, confirmed answer this run (both: zero/none) - domain-quality distribution, anchor-text naturalness, follow/nofollow ratio, and geographic relevance all have nothing to measure because there are currently no referring domains to distribute, classify, or geolocate, and link-velocity trend requires DataForSEO (not part of this tier). That's 2/7 real factors - still short of the 4-factor threshold, so a numeric score would still be fabricated precision. The upgrade from Tier 0 is **certainty**, not a number: this is now a confirmed-empty profile, not an unmeasured one.

---

## What This Means (read before the findings)

A confirmed near-zero backlink profile on a domain this young remains **expected, not a defect** - the difference from the last pass is that it's now confirmed rather than merely unmeasured. Moz's own crawler has actually indexed `nebulacomponents.shop` (it returned real, non-null metrics, just at floor values) and Bing Webmaster Tools - which only reports on properties the account has verified ownership of - returned a clean, complete zero-link response with no errors or partial-data warnings. There is nothing broken or hidden here; the site currently has no measurable external link equity to protect, and the priority list from the prior pass (fix the two zero-cost owned-profile links, pursue the five link-acquisition angles) is unchanged and still the correct next step.

---

## What Works

- **The `citable` open-source CLI repo on GitHub still genuinely links back to the site**, re-verified this run (`github.com/mikeholownych/citable` → `nebulacomponents.shop/resources/citable`, `status: verified`, anchor text `nebulacomponents.shop/resources/citable`, `rel="noopener noreferrer nofollow"`). Source: verification crawler, direct observation (confidence: 0.95). No change from the prior pass.
- **The site is a real, verified property in Bing Webmaster Tools.** The `bing_webmaster.py links` call returned `"complete": true"` with zero warnings and zero partial errors - this is a clean, authoritative "zero" from Bing's own crawl index, not a missing-data gap. Source: Bing Webmaster Tools API (confidence: 0.70).
- **Moz's crawler has indexed the domain and returned real (if floor-level) metrics** rather than an unindexed/no-data response - DA 1, PA 1, 0 external links, 0 linking root domains. A DA/PA of 1 is the expected floor value for a domain with no measurable inbound authority yet, not an error or a penalty. Source: Moz Link Explorer API (confidence: 0.85).
- **The site exposes a genuine agent/LLM discovery surface** (`llms.txt`, `.well-known/agent.json`, `mcp/server-card.json`, `openapi.json`, etc. - confirmed resolving 200 by the technical-SEO pass), still a legitimate "build in public" / GEO-adjacent talking point independent of backlink mechanics.
- **The Case Studies page is honest about having no case studies yet** rather than fabricating one. Still a good trust signal and a future linkable asset once a real case study exists.

---

## Findings

### INFO

**1. Moz confirms zero referring domains and zero external links (real data, not a tooling gap)**
- **Evidence**: `moz_api.py metrics https://nebulacomponents.shop --json` returned `domain_authority: 1`, `page_authority: 1`, `spam_score: -1` (Moz's "not yet calculable" value, expected when a domain has too few links to score spam risk), `links: 0`, `external_links: 0`, `linking_root_domains: 0`. `moz_api.py domains`, `moz_api.py anchors`, and `moz_api.py pages` all returned empty result sets (0 referring domains, 0 anchor texts, 0 top pages by external link count). Source: Moz Link Explorer API (confidence: 0.85). Freshness: Moz's link index is typically refreshed on a multi-week cycle; no `last_crawled` timestamp was returned this run (empty string), so treat this as current-as-of-index rather than real-time.
- **Recommendation**: No fix needed - this is an accurate reflection of the site's current off-site link footprint, not a data problem. Re-run after the link-acquisition angles below (directory listings, Show HN, guest posts) have had a few weeks to land and Moz to re-crawl.

**2. Bing Webmaster Tools confirms zero inbound links for the verified property**
- **Evidence**: `bing_webmaster.py links https://nebulacomponents.shop --json` returned `count_page: 0`, `total_returned: 0`, `links: []`, with `"complete": true"` and no warnings or partial errors - i.e., Bing completed a full, successful query against its index for this verified property and found nothing, as opposed to failing or timing out. Source: Bing Webmaster Tools API, verified site (confidence: 0.70).
- **Recommendation**: No action needed on Bing's end specifically. This corroborates Moz's finding rather than adding a new, independent link count - treat the two as agreeing, not additive.

**3. Common Crawl still does not have the domain in its current web-graph release (unchanged from prior pass, now corroborated rather than contradicted by Moz/Bing)**
- **Evidence**: `commoncrawl_graph.py nebulacomponents.shop --json` against `cc-main-2026-jan-feb-mar` again returned `"in_crawl": false, "in_rankings": false"`, all metrics null. This is now consistent with, rather than merely unexplained by, the Moz/Bing zero-link findings above - three independent sources agree the domain currently has effectively no external link graph. Source: Common Crawl web graph (domain-level, confidence: 0.50). Freshness: quarterly release, see https://commoncrawl.org/web-graphs.
- **Recommendation**: No action needed. Will resolve naturally as the link-acquisition angles below produce real referring domains and CC's next quarterly release, and Moz's next crawl, pick them up.

**4. The `citable` GitHub repo link back to the site remains `rel="nofollow"` (expected GitHub behavior, re-confirmed, no change)**
- **Evidence**: Re-verified this run via `verify_backlinks.py` - `status: verified`, `rel="noopener noreferrer nofollow"`, unchanged from the prior pass. Source: verification crawler, direct observation (confidence: 0.95).
- **Recommendation**: None needed. Keep the README link in place; it won't pass PageRank-style authority but remains valid for referral traffic and discovery.

**5. GitHub personal profile still does not point to nebulacomponents.shop or the citable repo - still open, not yet fixed**
- **Evidence**: Re-verified this run - `verify_backlinks.py` against `github.com/mikeholownych` again returned `status: link_removed` (no link to target found), `http_status: 200`. This is the same open issue from the prior pass; it has **not** been resolved and requires the site owner's GitHub account login to fix (cannot be automated from this environment). Source: direct crawl observation (confidence: 0.95).
- **Recommendation**: Unchanged - zero-cost fix, still needs the site owner to log in and update the GitHub profile website field to `https://nebulacomponents.shop` (or the `/resources/citable` page specifically). Not re-flagging this as newly discovered; it is the same tracked open item.

**6. Personal LinkedIn profile and X/Twitter profile still could not be verified by automated crawl (platform bot-gating, unchanged)**
- **Evidence**: Not re-tested this run (no change expected in platform bot-gating behavior since the last pass); carried forward from the prior report. `linkedin.com/in/mikeholownych` and `x.com/NebulaCRO` remain structurally unverifiable by automated fetch per the prior pass's findings.
- **Recommendation**: Unchanged - check manually (logged in) to confirm whether the bio links point to nebulacomponents.shop.

**7. (Resolved, not re-flagged) LinkedIn company page - confirmed fixed, correct slug in use**
- Per context supplied for this run: the `linkedin.com/company/nebula-components` (hyphenated) 404 from the prior pass was a wrong-slug testing artifact, not a real broken page. The correct company page is `linkedin.com/company/nebulacomponents` (no hyphen), already confirmed valid by the site owner and already corrected in all internal site references (`organizationSchema.sameAs`, `Footer.tsx`, `llms.txt`, `llms-full.txt`). Not re-tested this run per instruction; no automated re-verification is possible against LinkedIn regardless (HTTP 999 bot-block on unauthenticated fetches). Listed here only for completeness/traceability, not as an open finding.

---

## Realistic Near-Term Link-Acquisition Angles (unchanged from prior pass - still current and still the right priority order)

Now backed by a confirmed (not just unmeasured) zero-link baseline, so progress on these is directly trackable via Moz/Bing re-runs going forward:

1. **Submit `citable` to open-source and AI-agent-skill directories/awesome-lists.** Real, public, versioned repo (`v1.13.1`). Target: `awesome-claude-code`-style lists, Claude Code skill directories, dev-tool aggregators, "awesome-seo-tools"/"awesome-cli-tools" GitHub lists. Each accepted listing is a durable, topically-relevant referring domain - the first ones to show up in the next Moz/Bing/CC re-run.
2. **Building-in-public content tied to the `citable` release cadence and the free `/audit` tool**, on X (`@NebulaCRO`) and cross-posted to Hacker News "Show HN", Indie Hackers, r/SaaS or r/PPC. Genuine showable artifacts exist (working free audit tool, versioned open-source CLI).
3. **Guest posts / contributed pieces on PPC- and CRO-adjacent publications**, pitched using the existing Learning Centre content as writing samples.
4. **Fix the two zero-cost owned-profile links (Findings 5-6) before pursuing anything else.** The GitHub profile fix is still outstanding and still requires the site owner's login - it remains the single highest-priority, zero-cost action.
5. **Publish the first real case study the moment one exists**, and treat it as a linkable asset.

---

## Sources & Confidence

| Source | Confidence | Coverage this run |
|---|---|---|
| Moz Link Explorer API (`metrics`, `domains`, `anchors`, `pages`) | 0.85 | DA 1, PA 1, spam score not calculable (`-1`), 0 links, 0 external links, 0 linking root domains, 0 anchor texts, 0 top pages by external link - all real, queried live |
| Bing Webmaster Tools API (`links`) | 0.70 | Verified property; complete query, 0 inbound links, no warnings/partial errors |
| Common Crawl web graph | 0.50 | Domain still not found in current release (`cc-main-2026-jan-feb-mar`) - corroborates, does not contradict, Moz/Bing |
| Verification crawler (`verify_backlinks.py`) | 0.95 | 2 candidate links re-checked directly this run: citable repo (verified, nofollow), GitHub profile (still not pointing to target - open) |
| WHOIS fallback | 0.50 (effectively no data) | Not re-run this pass; no change expected |

Validated via `validate_backlink_report.py` prior to delivery - status: **PASS** (1 info-level note on Common Crawl interpretation, 0 errors, 0 warnings). See Pre-Delivery Review below.

---

## Pre-Delivery Review

Ran `validate_backlink_report.py` against the collected Moz, Bing, Common Crawl, and verification-crawler data (`scoring_factors: {total_factors: 7, factors_with_data: 2, score: null}`). Result: **PASS**, 1 info-level issue (Common Crawl absence must not be read as "low authority" - reflected in Finding 3's phrasing), 0 errors, 0 warnings. The health-score-sufficiency check confirmed a null/no numeric score is correct given only 2 of 7 factors have real data this run, even at Tier 2 - consistent with this report's "INSUFFICIENT DATA" framing above. Manual checks also confirmed: every claim above carries a source label and confidence value; the GitHub-profile and LinkedIn/X findings are stated as still-open/carried-forward rather than newly discovered; the LinkedIn company-page item is recorded as resolved per site-owner confirmation and was not re-tested against the old hyphenated slug, per instruction.
