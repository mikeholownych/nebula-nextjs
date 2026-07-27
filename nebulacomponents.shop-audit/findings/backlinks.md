# Backlink Profile Findings — nebulacomponents.shop

Audit date: 2026-07-26
Scope: Backlink/referring-domain profile, domain-graph presence, and realistic near-term link-acquisition angles.

**Credential tier: 0 (Common Crawl + verification crawler only).** `MOZ_API_KEY` and `BING_WEBMASTER_API_KEY` are both unset, and no config exists at `/home/mike/.config/claude-seo/backlinks-api.json`. No Domain Authority, Page Authority, spam score, or referring-domain-count metric is available this run — those claims are not made anywhere below.

**Category Score: INSUFFICIENT DATA (not scored 0-100)**

Per the skill's own scoring rule, a numeric Backlink Health Score requires data on at least 4 of 7 weighted factors (referring domains, domain quality distribution, anchor naturalness, toxic-link ratio, link velocity, follow/nofollow ratio, geographic relevance). This run has real data for effectively 0-1 of those factors (the domain isn't even present in Common Crawl, so not even the domain-level proxy is available). Producing a number here would be fabricated precision on a young domain — see "What This Means" below instead.

---

## What This Means (read before the findings)

A thin-to-nonexistent backlink profile on a domain this young is **expected, not a defect**. This is not a "fix immediately" finding — it is a baseline. The useful output of this run is (1) confirming there is currently no measurable off-site authority signal to protect or worry about breaking, and (2) identifying which of the site's *existing, real* assets are the highest-leverage places to start earning links, based on what was actually observed on those assets today.

---

## What Works

- **The `citable` open-source CLI repo on GitHub genuinely links back to the site** (`github.com/mikeholownych/citable` → `nebulacomponents.shop/resources/citable`), confirmed by direct crawl, not assumed. This is a real, live, already-existing asset with legitimate link equity potential (open-source dev tooling directories/awarenesses tend to route real traffic and links to a project's homepage) — it just isn't being pointed at from anywhere else yet (see Finding 2).
- **The site exposes a genuine agent/LLM discovery surface** (`llms.txt`, `.well-known/agent.json`, `mcp/server-card.json`, `openapi.json`, etc. — confirmed resolving 200 by the technical-SEO pass) which is unusual for a site this size and is itself a legitimate "build in public" / GEO-adjacent talking point that could be pitched to AI-tooling and dev-tool newsletters as a story, independent of backlink mechanics.
- **The Case Studies page is honest about having no case studies yet** rather than fabricating one (`nebulacomponents.shop/case-studies`: *"We don't have one yet — on purpose."*). This is good trust-signal practice and, from a link-building lens, means the first real case study — when it exists — is a legitimate, citable, linkable asset rather than a stretched claim nobody will link to.

---

## Findings

### INFO

**1. Domain is not yet present in the Common Crawl web graph (expected for a young domain — not a ranking judgment)**
- **Evidence**: `commoncrawl_graph.py nebulacomponents.shop --json` against the current release (`cc-main-2026-jan-feb-mar`) returned `"in_crawl": false, "in_rankings": false"`, with `pagerank`, `pagerank_rank`, `harmonic_centrality`, and `n_hosts` all `null`. Per the skill's own interpretation rule, this must **not** be read as "low authority" — it means Common Crawl has not indexed the domain in this graph release at all, consistent with a domain that is new and has very few (if any) inbound links from other crawled sites yet. Source: Common Crawl web graph (domain-level, confidence: 0.50). Freshness: quarterly release, see https://commoncrawl.org/web-graphs.
- **Recommendation**: No action needed to "fix" this — it will resolve naturally as inbound links accumulate and a future quarterly CC release picks the domain up. Re-check after 2-3 quarters or after the link-building angles below produce a handful of real referring domains.

**2. WHOIS-based domain history is inconclusive (no creation date returned)**
- **Evidence**: `domain_history.py nebulacomponents.shop --json` returned `"whois_source": "fallback"`, `"created": null`, `"risk": "unknown"`, with the note `"no creation date in whois response"`. This is a tooling/registrar-response limitation, not a finding about the domain itself — domain age could not be established either way this run. Source: WHOIS fallback lookup (confidence: 0.50, and effectively "no data" here).
- **Recommendation**: No action required. If domain age ever needs to be verified (e.g., for a partner/press pitch claiming "how long we've been building"), pull it from registrar records directly rather than public WHOIS.

**3. The `citable` GitHub repo link back to the site is `rel="nofollow"` (expected GitHub behavior, not a bug)**
- **Evidence**: `verify_backlinks.py` confirmed the link exists (`status: verified`, anchor text `nebulacomponents.shop/resources/citable`) but carries `rel="noopener noreferrer nofollow"`. GitHub auto-applies `nofollow` to essentially all outbound README/repo-description links, so this is not something Nebula can fix on its end and is not a sign of a deliberately weak link. Source: verification crawler, direct observation (confidence: 0.95).
- **Recommendation**: None needed for this specific link. Don't expect it to pass PageRank-style authority, but it is still valid for referral traffic and for discovery by anyone browsing the repo — keep the README link in place.

**4. GitHub personal profile does not point to nebulacomponents.shop or the citable repo — it points to an unrelated domain**
- **Evidence**: `verify_backlinks.py` against `github.com/mikeholownych` returned `status: link_removed` (i.e., no link to the target found), `http_status: 200`. Direct fetch of the profile page confirms the profile's website field is set to `https://aisyndicate.io`, not `nebulacomponents.shop`, even though `citable` — Nebula's own open-source project — is the pinned/highlighted repo on that same profile. Source: direct crawl observation (confidence: 0.95).
- **Recommendation**: Zero-cost fix — update the GitHub profile website field to `https://nebulacomponents.shop` (or the `/resources/citable` page specifically), since the profile is already the front door to the one asset (citable) most likely to attract organic developer links.

**5. ✅ RESOLVED — was testing the wrong slug, not a broken page.** `linkedin.com/company/nebula-components` (hyphenated) returned HTTP 404 on direct check; the real, valid company page is `linkedin.com/company/nebulacomponents` (no hyphen), confirmed by the site owner 2026-07-27. This was exactly the ambiguity flagged below when this finding was filed — the canonical slug differed from what was checked, not a missing/unpublished page. Fixed all internal references (`organizationSchema.sameAs` in `app/lib/schema.ts`, `Footer.tsx`, `llms.txt`, `llms-full.txt`) to the correct slug.
- **Evidence (original, now superseded)**: `verify_backlinks.py` recorded `status: lost, http_status: 404` for the hyphenated URL. Automated re-verification of the corrected URL isn't possible — LinkedIn returns HTTP 999 (its standard bot-block response) to unauthenticated automated fetches regardless of whether a page exists, per Finding 6 below. Confirmed via the site owner's direct, logged-in check instead.

**6. Personal LinkedIn profile and X/Twitter profile could not be verified by automated crawl (platform bot-gating, not evidence of a missing link)**
- **Evidence**: `linkedin.com/in/mikeholownych` returned `http_status: 405` (Method Not Allowed) rather than page content. `x.com/NebulaCRO` returned `http_status: 200` but the raw HTML is X's logged-out interstitial (`"Sign up now to get your own personalized timeline!"`), not the actual profile bio — both LinkedIn and X require an authenticated/JS-rendered session to serve real profile content to automated fetches. The report's own validator (`validate_backlink_report.py`) flags exactly this pattern (200 + social-media domain marked as a missing link) as a likely false negative — flagging it here rather than asserting "no link exists" on either profile.
- **Recommendation**: Check both manually (logged in) to confirm whether the LinkedIn and X bio links currently point to nebulacomponents.shop; if not, this is another zero-cost fix. Do not rely on automated crawling for social-profile link auditing going forward — these two platforms are structurally unverifiable that way.

**7. No Moz or Bing Webmaster credentials configured — DA/PA, spam score, and a real referring-domain count are all unavailable**
- **Evidence**: `MOZ_API_KEY` and `BING_WEBMASTER_API_KEY` are both unset; no config file exists at `/home/mike/.config/claude-seo/backlinks-api.json`. This isn't a finding about the site — it's a tooling gap that caps this run at Tier 0.
- **Recommendation**: Sign up for the Moz API free tier (moz.com/products/api, 2,500 rows/month, no charge, card required) and Bing Webmaster Tools (bing.com/webmasters, free, requires verifying the property) to get real DA/PA, spam score, and referring-domain counts on the next run. At this domain's current size, the free tiers alone would likely capture the large majority of its actual link profile (per the skill's own free-source coverage notes, free sources capture 50%+ of the meaningful profile for sites under ~500 backlinks).

---

## Realistic Near-Term Link-Acquisition Angles (grounded in what this business actually has)

Generic "build backlinks" advice is not useful for a single-founder, pre-case-study, month(s)-old productized service. These five are scoped to assets confirmed to exist on the site/founder's accounts today:

1. **Submit `citable` to open-source and AI-agent-skill directories/awesome-lists.** It's a real, public, versioned repo (`v1.13.1` per the `/resources/citable` page) with a specific, defensible positioning ("evidence layer for defensible SEO/AEO/GEO audits" — not a generic wrapper). Target: `awesome-claude-code`-style lists, Claude Code skill directories, dev-tool aggregators (e.g. Product Hunt for the CLI itself), and any "awesome-seo-tools" / "awesome-cli-tools" GitHub lists. Each accepted PR/listing is a durable, topically-relevant referring domain at near-zero cost, and directly fixes the gap in Finding 4 by giving the repo a second discovery path beyond the founder's own profile.
2. **Building-in-public content tied to the `citable` release cadence and the free `/audit` tool**, published on X (`@NebulaCRO`) and cross-posted to a dev-audience venue (Hacker News "Show HN", Indie Hackers, r/SaaS or r/PPC where allowed). The product already has two genuinely showable artifacts (a working free audit tool and a versioned open-source CLI) — that is real "Show HN" material, not vapor. Each successful HN/IH thread historically generates a cluster of small, topically relevant referring domains (blogs that cover the discussion, aggregator sites) even when the submission itself doesn't hit the front page.
3. **Guest posts / contributed pieces on PPC- and CRO-adjacent publications, pitched using the Learning Centre content as writing samples.** The site already has a working content engine (`/learning-centre` — confirmed live and indexable by the technical-SEO pass) covering landing-page-conversion topics (message match, CTA placement, mobile leaks). That existing body of work is the credibility artifact needed to pitch guest contributions to CRO/PPC blogs and newsletters (e.g. publications covering paid-acquisition or landing-page optimization) — a single accepted guest post from a real industry publication is worth more than dozens of directory links at this stage.
4. **Fix the two zero-cost owned-profile links identified in Findings 4-6 before pursuing anything else.** The GitHub profile website field pointing to `aisyndicate.io` instead of `nebulacomponents.shop`, plus unverified LinkedIn/X bio links, are literally free — no outreach, no content, no waiting on someone else's editorial calendar. This should happen this week, not as part of a future campaign.
5. **Publish the first real case study the moment one exists, and treat it as a linkable asset, not just testimonial copy.** The site's own `/case-studies` page states there are no case studies yet, on principle (real client, real number, checkable dates). That principle is also what makes the eventual first one link-worthy: it's the kind of concrete, dated, source-linked write-up that CRO/PPC publications and directories are willing to cite and link to, unlike generic "we helped a client" claims. This is a near-term angle in the sense that it should be planned for the first paying client's outcome, not treated as a someday item.

---

## Sources & Confidence

| Source | Confidence | Coverage this run |
|---|---|---|
| Common Crawl web graph | 0.50 | Domain not found in current release — no PageRank/harmonic-centrality/host-count data |
| WHOIS fallback (`domain_history.py`) | 0.50 (effectively no data) | No creation date returned |
| Verification crawler (`verify_backlinks.py`) | 0.95 | 5 candidate owned-profile links checked directly; 1 verified, 1 confirmed missing, 1 confirmed 404, 2 unverifiable due to platform bot-gating |
| Moz API | N/A | Not configured — `MOZ_API_KEY` missing |
| Bing Webmaster | N/A | Not configured — `BING_WEBMASTER_API_KEY` missing |

Validated via `validate_backlink_report.py` prior to delivery (see Pre-Delivery Review below).

---

## Pre-Delivery Review

Ran `validate_backlink_report.py` against the collected Common Crawl and verification-crawler data. It correctly flagged that the initial `x.com/NebulaCRO` result (HTTP 200 + no link found) should be reported as **unverifiable due to JS/login-gating**, not as a confirmed missing link — this is reflected in Finding 6 above rather than being stated as a hard negative. It also confirmed the Common Crawl "not found" result must not be interpreted as "low authority" — reflected in Finding 1's phrasing. No numeric health score was produced, consistent with the validator's health-score-sufficiency check (1 of 7 factors had data).
