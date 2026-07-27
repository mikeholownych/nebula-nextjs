# Content Quality Findings — nebulacomponents.shop

Scope: E-E-A-T substantiation, thin-content/word-count audit of all live `/learning-centre` articles, cannibalization risk, readability sample, AI citation readiness, and a content-integrity (mojibake/control-char) sanity check. Read-only analysis of the live production site, 2026-07-26.

**Category Score: 52 / 100** (Moderate-Weak — structurally sound but under-substantiated and unevenly thin)

---

## What Works

- **No content-integrity corruption found.** Sampled 33 pages (homepage, /about, /about/team, /case-studies, /pricing, /audit, /learning-centre index, llms.txt, llms-full.txt, and all 25 live learning-centre articles) for the mojibake/block-character class (`▀-▟`, `�`, `■-◿`) and control characters (`\x00-\x08`, `\x0B-\x0C`, `\x0E-\x1F`, `\x7F`). Zero hits anywhere. The pre-commit content-integrity gates this codebase enforces appear to be holding on production.
- **Honest scarcity beats fabricated authority.** `/case-studies` and `/about` both state plainly "We don't have one yet — on purpose," explicitly defining what a real case study requires (named client, verifiable before/after number, checkable dates) rather than inventing one. This is a genuine Trustworthiness asset and fits the brand's "diagnostic equipment, not a lifestyle brand" positioning — quality raters reward this kind of restraint over vague/inflated claims.
- **Strong passage-level structure in the well-developed article batch.** Articles dated 2026-07-21 (9 of the 25 live articles, e.g. `landing-page-not-converting` at 2,289 words / 37 headings, `paid-traffic-leak-map` at 2,206 words / 17 headings, `mobile-landing-page-leaks`, `ecommerce-landing-page-not-converting`) open with a short, self-contained, quotable definitional paragraph, then use frequent H2/H3 breaks (roughly one heading per 100-150 words) with short declarative claims. This is close to ideal AI-citation shape — a summarization engine can lift a paragraph cleanly with its header as context.
- **Clear taxonomy/breadcrumb eyebrows** (e.g. "Google Ads Leaks · Clicks Without Conversions", "Trust Leaks · Proof Before CTA") give the hub a real topic-cluster structure in the well-developed batch, which supports both internal linking and topical-authority signals.
- **Domain-appropriate technical vocabulary used correctly** (CPC, CTR, Quality Score, retargeting frequency, message-match) — no evidence of factual/terminology errors in the sampled articles.

---

## Findings

### 1. Flagship "50+ landing pages" experience claim exists only in the AI-crawler-facing files, invisible to human visitors
**Severity: High**

`llms.txt` and `llms-full.txt` both state: *"Mike Holownych founded Nebula Components after observing the same seven conversion failure patterns repeat across 50+ landing pages"* / *"Built 50+ landing pages, identified 7 recurring conversion killers."* This is the single strongest first-hand Experience claim on the entire site. It does **not** appear anywhere a human visitor or a Google quality rater would look: not on the homepage, not on `/about`, not on `/about/team`, not on `/case-studies`. I grepped rendered text on all five for "50+ landing", "50 landing", "seven conversion failure pattern" and "conversion failure pattern" — zero matches outside the two llms.txt-family files.

This is a QRG-relevant inconsistency, not just a missed opportunity: Google's raters evaluate the page as a human sees it, and per Sept 2025 QRG guidance, content presented differently to crawlers/AI systems than to human visitors is itself a trust concern (cloaking-adjacent optics), independent of intent. As-is, the claim functions as an unverifiable assertion aimed only at AI answer engines, with zero on-page corroboration (no year range, no client list, no methodology writeup, no linked evidence) even in the file where it does appear.

**Recommendation:** Move a version of this claim onto `/about` and `/about/team` with at least one corroborating detail (rough date range, types of businesses, or a link to the 7-signal framework as public methodology). Keep llms.txt as a summary of what's already stated on-page, not the sole location of the claim.

### 2. Founder bio is 45 words with no credentials, no methodology, and a truncated name inconsistent with llms.txt
**Severity: High**

`/about/team`'s entire content: "Mike H — Founder, Nebula Components. Nebula Components publishes evidence-backed landing-page conversion guidance and implementation services. Automated audit scoring runs across 7 conversion signals." Plus an email address. That's the full page (45 words, 2 headings). No photo reference, no prior work history, no LinkedIn link (LinkedIn is only listed in llms.txt, not on the team page itself), no explanation of how the "7 conversion signals" framework was derived. The name itself is inconsistent: "Mike H" on-site vs. full "Mike Holownych" in llms.txt/llms-full.txt — a small but real authorship-transparency gap since it makes the on-page byline harder to verify against any external presence (LinkedIn, published work, etc.) a rater or user might check.

**Recommendation:** Expand to the About-page minimum (400 words per this skill's quality gates) with real methodology narrative, use the full name consistently everywhere, and link out to any verifiable external presence (LinkedIn, GitHub for the `citable` open-source project already referenced in llms.txt).

### 3. Weighted E-E-A-T score ≈ 41/100 (Weak band), driven by Expertise and Authoritativeness gaps
**Severity: High**

| Factor | Weight | Score | Basis |
|---|---|---|---|
| Experience | 20% | 35 | Only substantiated claim (50+ pages) is off human-visible pages (Finding 1); no case studies, no before/after data, no screenshots |
| Expertise | 25% | 30 | 45-word bio, no credentials, no methodology depth, inconsistent naming (Finding 2) |
| Authoritativeness | 25% | 25 | No external citations, press mentions, client logos, or case studies (explicitly and transparently absent — see What Works) |
| Trustworthiness | 30% | 68 | Working contact email, privacy/terms/data-rights pages present, HTTPS, honest scarcity framing, clear "who we work with / not for" scoping |
| **Weighted total** | | **~41** | Weak band (30-49) per the E-E-A-T scoring guide |

Trust is genuinely the strongest pillar here (consistent with Google's own framing that trust matters most), but Expertise and Authoritativeness are thin enough to cap the overall score. The site's honesty about not having case studies is a reasonable interim stance, but it means Authoritativeness has essentially no path upward until real client evidence exists.

**Recommendation:** Prioritize Authoritativeness and Expertise fixes — even one real case study (the page already commits to publishing one "when a real client outcome exists") would move both factors meaningfully; a substantive founder bio would fix Expertise independent of that.

### 4. 9 of 25 live learning-centre articles are under 500 words — thin by any informational-content standard
**Severity: High**

Word counts (via full boilerplate-stripped extraction, not the CLI's truncated summary):

| Article | Words | 
|---|---|
| `specialist-ai-agent-library` | 297 |
| `meta-ads-high-frequency-not-converting` | 341 |
| `founder-second-brain` | 361 |
| `retargeting-ads-not-converting` | 367 |
| `linkedin-skill-engine` | 415 |
| `no-testimonials-on-landing-page` | 404 |
| `b2b-saas-landing-page-not-converting` | 455 |
| `google-ads-disapproved-ads-still-spending` | 460 |
| `pricing-page-not-converting` | 479 |

A 10th, `google-ads-quality-score-low`, is borderline at 604 words. This skill's quality-gates.md sets the blog-post floor at 1,500 words (topical-coverage floor, not a ranking factor per se, but a proxy for depth); even against a much looser 600-800-word informational-article bar, 9 articles fail outright. Several of these (`specialist-ai-agent-library` at 14 headings across only 297 words) read as skeletal outlines — a heading roughly every 20 words — rather than developed diagnostic content.

**Recommendation:** Either expand these 9-10 articles to genuine diagnostic depth matching the site's stronger batch (800-2,000+ words with the same evidence density), or consolidate the thinnest, most overlapping ones into the relevant pillar article (see Finding 6) rather than leaving them as standalone thin pages.

### 5. Visible bifurcation between a strong content batch (2026-07-21) and a weaker batch (2026-01-01) with a templating leak
**Severity: Medium**

`htmldate`-detected publication dates cluster into two groups. Nine well-developed articles (1,100-2,300 words) are dated 2026-07-21. Seven of the nine thinnest articles — `google-ads-disapproved-ads-still-spending`, `google-ads-quality-score-low`, `no-testimonials-on-landing-page`, `pricing-page-not-converting`, `retargeting-ads-not-converting`, `meta-ads-high-frequency-not-converting`, `specialist-ai-agent-library` — carry a `2026-01-01` fallback date, suggesting no real publish-date metadata was ever set on these pages (a freshness-signal gap in its own right — see quality-gates.md's "publication date visible" requirement).

This older/thinner batch also has a live templating bug: the category eyebrow on `meta-ads-high-frequency-not-converting` renders the raw URL slug verbatim — **"Meta Ads Leaks · meta-ads-high-frequency-not-converting"** — instead of a humanized label, while sibling pages in the same batch show partially humanized but not title-cased text ("Google Ads Leaks · google ads quality score low"). This is a concrete, fixable content-pipeline defect, not a style choice.

**Recommendation:** Fix the slug-to-label humanization/title-casing for the affected eyebrows, and set a real `datePublished` (and `dateModified` if edited) on the 2026-01-01-dated batch — both for user trust and for the freshness signals raters and AI systems use.

### 6. Cannibalization risk is real but concentrated in a specific subset, not the whole hub
**Severity: Medium**

Most of the 25 articles are differentiated by a genuinely distinct trigger or platform (e.g. `google-ads-disapproved-ads-still-spending` vs. `retargeting-ads-not-converting` vs. `landing-page-load-time-slow` target different searcher intents even though they funnel to the same fix). That pattern is defensible topic-cluster design, not cannibalization, provided each page is developed (several currently aren't — see Finding 4).

The real overlap risk is a cluster of four articles converging on the same "trust/CTA sequencing" sub-theme with thin differentiation: `cta-not-working` (1,108 words), `proof-before-cta` (891), `message-match-checklist` (805), and `no-testimonials-on-landing-page` (404). All four make essentially the same core argument (the page asks for commitment before earning trust) from slightly different entry points, and the thinnest of the four (`no-testimonials-on-landing-page`) is largely a compressed subset of `proof-before-cta`'s argument. There's also a broad-vs-narrow overlap between the pillar `landing-page-not-converting` (2,289 words, positioned as the "7 Conversion Signals" hub article) and the much thinner vertical variants `b2b-saas-landing-page-not-converting` (455 words) and `pricing-page-not-converting` (479 words) — the vertical pages don't yet carry enough unique vertical-specific depth to justify existing separately from the pillar for overlapping queries.

**Recommendation:** Either deepen `no-testimonials-on-landing-page` with content genuinely distinct from `proof-before-cta` (or merge it in as a section + redirect), and give the two thin vertical pages real vertical-specific evidence (B2B SaaS demo-flow specifics, pricing-tier specifics) that the pillar page doesn't cover — otherwise consolidate.

### 7. Three articles are topically off-hub and appear to be reused/external content, diluting the hub's topical authority
**Severity: Medium**

`founder-second-brain` (361 words), `linkedin-skill-engine` (415 words), and `specialist-ai-agent-library` (297 words) are filed under `/learning-centre` (whose stated purpose, per its own index page, is "free conversion guides for founders getting clicks but no sales") but their actual subject matter is content-production systems and AI-agent-orchestration patterns — unrelated to landing-page conversion diagnosis. `specialist-ai-agent-library`'s own eyebrow text reads **"AI Ops Systems · extracted from NipPro AI"** — an explicit on-page admission that this content originated from a different product/brand ("NipPro AI") and was repurposed here. Combined with being the single thinnest article on the site (297 words), this is a topical-authority and content-provenance concern: it signals to both users and search engines that the hub isn't tightly scoped to its stated purpose, and it's the one piece of content on the site that isn't presented as first-hand Nebula-specific insight.

**Recommendation:** Either move these three to a clearly separate content vertical (if there's a genuine reason to publish founder/content-ops advice) or remove them from `/learning-centre` and its sitemap/internal links to keep the hub's topical focus tight — a 25-article hub with 3 off-topic, thin, externally-sourced entries measurably weakens the "diagnostic equipment for landing pages" positioning.

### 8. Readability sample: well-developed batch is appropriately scannable; thin batch reads as choppy outline fragments
**Severity: Low**

Qualitative pass on a representative sample (homepage, `/about`, `landing-page-not-converting`, `cta-not-working`, `specialist-ai-agent-library`): the well-developed articles use short paragraphs (2-4 sentences), active voice, and concrete numeric claims stated plainly ("Enterprise buyers are 57% through the purchase process before they engage with sales" — `b2b-saas-landing-page-not-converting`), which reads at roughly a 9th-11th grade level — appropriate for a B2B/founder audience and easy for an LLM to parse into a discrete citable fact. The thin batch, by contrast, has headings landing every ~20-40 words with only one or two sentences of substance under each (e.g. `specialist-ai-agent-library`: 14 headings / 297 words) — technically "scannable" but too shallow per heading to read as a developed argument; each section reads as a label rather than a passage.

**Recommendation:** No urgent readability fix needed for the strong batch. For the thin batch, either flesh out each heading's section to 2-4 real sentences or reduce heading count to match actual content depth — a sub-100-word "section" under a heading undermines both readability and AI-citation quality (nothing substantive to quote).

### 9. Numeric claims are frequent and specific, but attribution/sourcing is inconsistent — a mixed AI-citation-readiness picture
**Severity: Low**

Specific stats appear throughout ("Enterprise buyers are 57% through the purchase process before they engage with sales"; "80% of mobile visitors..." on the learning-centre index; "A bounce rate above 70% on paid traffic..."). These are exactly the kind of quotable, passage-level facts AI answer engines look to lift — but none observed in this sample carry an inline source/citation for the underlying number (industry study, internal audit data, etc.), which matters both for E-E-A-T (unsourced statistics read as asserted rather than evidenced) and for citation trust (an AI system citing an unsourced number attributes credibility it can't verify).

**Recommendation:** Add inline sourcing (internal audit-data reference, or an external study link) for the headline statistics in the well-developed articles — this is a relatively low-effort fix that would meaningfully strengthen both Expertise and Authoritativeness.

### 10. `above-fold-landing-page` is live, well-developed (1,637 words), and internally linked from the Learning Centre index — but missing from sitemap.xml
**Severity: Low (cross-reference to technical audit)**

Confirmed live (HTTP 200) and linked from `/learning-centre`'s own index copy ("Above The Fold: The 3-Second Window That Determines If Paid Traffic Converts"), but absent from the 33-URL `sitemap.xml`. This is primarily a technical-SEO/indexing item (flagging here since it surfaced during the content pass) — worth reconciling with whichever specialist owns sitemap coverage so this genuinely good piece of content isn't under-discovered.

---

## Summary Table: Learning Centre Word Counts (25 live articles)

| Bucket | Count | Articles |
|---|---|---|
| Under 500 words (thin) | 9 | specialist-ai-agent-library, meta-ads-high-frequency-not-converting, founder-second-brain, retargeting-ads-not-converting, linkedin-skill-engine, no-testimonials-on-landing-page, b2b-saas-landing-page-not-converting, google-ads-disapproved-ads-still-spending, pricing-page-not-converting |
| 500-999 words | 3 | google-ads-quality-score-low (604), traffic-but-no-form-fills (753), message-match-checklist (805) |
| 1,000-1,499 words | 6 | proof-before-cta (891), cta-not-working (1,108), facebook-ads-no-leads (1,299), landing-page-load-time-slow (1,283), landing-page-bounce-rate-high (1,326), high-cpc-low-conversion (1,375) |
| 1,500+ words | 7 | before-you-raise-ad-budget (1,485), google-ads-clicks-no-sales (1,420), above-fold-landing-page (1,637), mobile-landing-page-leaks (1,870), ecommerce-landing-page-not-converting (1,891), paid-traffic-leak-map (2,206), landing-page-not-converting (2,289) |

(Note: task brief referenced "~27 articles"; 25 are currently live. Several additional article slugs referenced in the repo's uncommitted working tree — e.g. `cpc-break-even-landing-page`, `ghost-variant-ab-test`, `confessions` — return HTTP 404 on production and were excluded from this audit as not-yet-published.)

---

## Category Score: 52 / 100

Rationale: technical content hygiene is clean (no corruption, decent structure, honest tone), and the top-tier article batch is genuinely strong and AI-citation-ready. But the score is capped by (a) a Weak-band weighted E-E-A-T score (~41/100) driven by an unsubstantiated-on-page flagship experience claim and a near-empty founder bio, (b) over a third of the content hub being thin (9/25 under 500 words), and (c) a topical-authority dilution problem (3 off-topic, externally-sourced articles) plus a confirmed content-pipeline defect (raw slug leaking into visible UI). None of these are difficult fixes individually, but collectively they represent real, fixable ground between the current state and a genuinely strong content asset.
