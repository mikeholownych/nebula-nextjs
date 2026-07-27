# Search Experience (SXO) Findings — nebulacomponents.shop

**Scope:** SERP-backwards analysis of the 5 highest-commercial-value pages/keyword clusters: `/audit`, `/pricing`, and 3 `/learning-centre` symptom articles (`google-ads-quality-score-low`, `landing-page-not-converting`, `high-cpc-low-conversion`).

**Method:** Pages fetched with `render_page.py` (raw + forced `--mode always` for `/audit` to confirm post-hydration DOM) and parsed with `parse_html.py`. SERP composition inferred from live WebSearch results for 5 queries (7-9 organic results each), classified against `page-type-taxonomy.md`.

**SXO Gap Score: 47 / 100** (separate from, and not to be confused with, the SEO Health Score elsewhere in this audit)

---

## Lead Finding: `/audit` presents as a tool but is invisible as one to search/AI systems

`/audit` is the single highest-leverage page in the funnel (it's the free-tier hook that's supposed to compete directly with Roastd, Adamigo, NxCode, MyWebAudit for "free landing page audit tool" intent), and it is the page with the clearest, most fixable SERP mismatch. See Finding 1 below — this should be read first.

---

## What Works

- **`/learning-centre/landing-page-not-converting` is close to a perfect page-type match.** The SERP for "landing page not converting" is dominated (~83%) by numbered-listicle blog posts ("9 Tips," "14 Fixes," "6 Reasons," "5 Mistakes"). Nebula's article structures itself as "5 Leaks" with a repeating Symptom → What it looks like → Self-check → Fix pattern per leak — this is functionally the same winning format, just better-templated than most competitors.
- **`/learning-centre/high-cpc-low-conversion` and `landing-page-not-converting` both carry full `Article` + `FAQPage` schema** with real `datePublished`/`dateModified` (2026-07-16 / 2026-07-21) — correctly targets the PAA-style questions ("Why is my Google Ads CPC high?", "Is high CPC a targeting problem or a landing page problem?") that structure the actual SERP for these queries.
- **`/pricing` carries `Service` + `Offer` + `FAQPage` schema** with a real price (`$97`), `priceValidUntil`, and an `OfferCatalog` of deliverables — more structured commercial markup than several of the agency Service Pages it's implicitly competing against (SiteTuners, Onilab) for "conversion rate audit tool"-adjacent queries.
- **The FAQ content on `/pricing` correctly pre-empts the trust objections a skeptical buyer would search for** ("Why prompts instead of you implementing the fixes?", "Do I need a retainer?") — this maps directly to the anti-retainer, anti-agency-access positioning in `llms-full.txt`.
- **After full JS render, `/audit`'s tool genuinely works** — a real `<input type="url" placeholder="https://yoursite.com/landing-page">` and `<form>` are present post-hydration, and no email is required to see the initial score. The underlying UX promise ("no signup to see results") is honestly delivered to a human visitor, even though it isn't visible to a crawler that doesn't execute JS.

---

## Findings

### Finding 1 — `/audit` is a Tool-intent page with zero indexable tool signals (CRITICAL)

**Severity:** CRITICAL — this is the page-type mismatch with the highest commercial cost, because `/audit` is Nebula's direct competitive entry against Roastd, Adamigo, NxCode, and MyWebAudit for "free landing page audit tool" / "landing page audit tool free" queries.

**SERP evidence:** Of 7 organic results for "landing page audit tool free," ~5 (NxCode, Roastd, Adamigo, MyWebAudit, and effectively WisdmLabs for the adjacent "conversion rate audit tool" query) are genuine Tool/Interactive pages per the taxonomy — several explicitly show example/sample output content or a generated report format on the page itself, "no signup required," instant AI analysis. Google's own results here reward pages that demonstrate output, not just describe it.

**Description:** Raw HTML/RSC payload for `/audit` (`--mode auto`, `is_spa: false`) contains **zero** `<input>`, `<form>`, `WebApplication`, or `SoftwareApplication` occurrences anywhere in the document — confirmed by direct grep of the fetched payload. Forcing a full Playwright render (`--mode always`) confirms the real `<input id="url">` and `<form>` do exist and hydrate correctly for a human visitor — so the tool is not fake, but:
1. There is still **no `WebApplication` or `SoftwareApplication` schema** anywhere, even post-render — the taxonomy lists this as a *required* element for Tool pages, and it's what lets Google (and AI answer engines) classify the page as a tool rather than a landing page describing one.
2. There is **no static/pre-rendered example output** anywhere on the page (no sample score, no "Your Score: 62/100" example, no annotated finding). Every one of the 5 comparable Tool results in the SERP demonstrates its output somewhere in crawlable content; `/audit` only describes the 3-step process ("Enter URL → We Analyze → Get Results") without ever showing a result.
3. Only `Organization` and `WebSite` schema are present — the same generic org-level schema used on every other page on the site, providing no page-specific signal at all.

**Recommendation:**
- Add `WebApplication` (or `SoftwareApplication`) schema to `/audit` with `applicationCategory: "BusinessApplication"`, `offers` (free), and `featureList` mapping to the 7 signals already named in the copy ("headline message-match, trust signal placement, mobile layout integrity, form friction score, page load time impact, CTA clarity, compliance signals").
- Add a static, always-rendered **example report section** below the tool (e.g., "Sample finding: Nebulacomponents.shop scored 4/7 — headline message-match: FAIL") so crawlers and AI Overview systems have real output content to cite, not just marketing copy about a process.
- Consider a lightweight SSR fallback that pre-fills one canonical demo URL's results server-side, so the "Get Results" step has content in the initial HTML payload rather than depending entirely on client-side interaction.

---

### Finding 2 — `/pricing` and `/learning-centre/landing-page-not-converting` make contradictory claims about what customers are buying (HIGH)

**Severity:** HIGH — this is a direct, citable trust/message-match failure, made more damaging by the fact that Nebula's own content teaches this exact failure mode (there is a sibling article literally titled "ad-says-one-thing-page-says-another").

**Evidence (verbatim, both live on the site right now):**
- `/pricing` FAQ schema, "Why prompts instead of you implementing the fixes?": *"...you're not waiting on us or trusting a stranger to touch your live page. Each prompt is built from what we actually found... you keep control of implementation."* And "How long does it take?": *"generated and emailed within minutes of payment — it is not a manual, multi-day process."*
- `/learning-centre/landing-page-not-converting` FAQ schema, "How long does it take to fix a non-converting landing page?": *"...Nebula's $97 Fix Pack implements all identified fixes from the audit within 48 hours."*

**Description:** One page explicitly says Nebula does **not** implement fixes (delivers AI prompts for the customer to run themselves, minutes not days, precisely because Nebula never touches the customer's site). The other page explicitly says Nebula **does** implement the fixes, within 48 hours. A skeptical evaluator persona comparing pages before paying — or a Google AI Overview / ChatGPT synthesizing both pages, which both carry `FAQPage` schema and are equally citable — will surface a direct contradiction about the core deliverable. This is also flagged as a known drift risk in the project's own `CLAUDE.md` ("Drift surfaces: $97, 48 hours... verify against canonical before commit"), meaning this is a live instance of an already-identified risk pattern, not a hypothetical one.

**Recommendation:** Reconcile immediately — pick one canonical description of the deliverable (prompts-for-self-implementation appears to be the current/intended model per `/pricing`) and correct the `landing-page-not-converting` FAQ answer to match. Grep all `/learning-centre` articles and `/pricing` for "implements," "48 hours," and "we fix" to find any other instances of the same drift before the next content push.

---

### Finding 3 — `/learning-centre/google-ads-quality-score-low` is missing the schema and FAQ structure its sibling articles already have (HIGH)

**Severity:** HIGH

**SERP evidence:** The SERP for "google ads quality score low landing page" is ~78% long-form Blog Post/guide content from very high-authority domains (Wordstream, Semrush, Adalysis, and Google's own support/business resources), several of which structure content as direct-answer Q&A blocks that feed PAA and AI Overview citations.

**Description:** Unlike `landing-page-not-converting` and `high-cpc-low-conversion` (both carrying full `Article` + `FAQPage` schema, real `datePublished`/`dateModified`, and a dedicated "Frequently asked questions" H2), `google-ads-quality-score-low` has **only** `Organization` + `WebSite` schema — no `Article`, no `FAQPage`. Its heading structure has no FAQ section at all. Its `publication_date` resolves to the site-wide fallback `2026-01-01` rather than a real, page-specific `datePublished`/`dateModified` — meaning it also can't signal freshness the way its two siblings can (`2026-07-16` / `2026-07-21`). Given that this exact keyword cluster is dominated by Q&A-structured competitor content, this article is competing with one hand behind its back relative to its own sibling pages on the same site.

**Recommendation:** Bring this article up to the same template as `landing-page-not-converting`/`high-cpc-low-conversion`: add `Article` schema with real author/date fields, add a "Frequently asked questions" section targeting the same question patterns already proven to work on the sibling articles (e.g., "What is Google Ads Quality Score and how does it affect CPC?", "Can fixing my landing page reduce my CPC?" — both already answered well on `high-cpc-low-conversion` and could be cross-linked/adapted), and add `FAQPage` schema.

---

### Finding 4 — Zero content images across all 5 sampled pages (HIGH)

**Severity:** HIGH

**Description:** `parse_html.py`'s `images: []` returned empty for `/audit`, `/pricing`, and all three learning-centre articles sampled. Direct grep confirms only 5-6 small inline `<svg>` icons per page (checkmarks/UI glyphs) — zero `<img>` tags, zero diagrams, zero annotated screenshots anywhere. This is a real gap for a product whose entire premise is *visual* landing-page diagnosis (headline placement, CTA visibility, mobile layout breaks, trust-signal position). Every learning-centre article describes visual page problems ("mobile experience breaks the message," "CTA does not match where the visitor is") in pure prose with no supporting image. Competing SERP content in the "google ads quality score low" and "landing page not converting" clusters (Wordstream, Semrush, SeedProd) regularly uses annotated screenshots and charts — both a ranking-adjacent engagement signal and a prerequisite for Google Images / AI Overview visual citation.

**Recommendation:** Add at minimum: (1) one annotated "before/after" landing-page screenshot per learning-centre article illustrating the specific leak described, (2) a visual example of the `/audit` score output (also solves part of Finding 1), (3) descriptive `alt` text on all of the above tied to the target keyword. This is the single highest-ROI content fix available across the sample — it's currently at zero, so any investment here is pure upside.

---

### Finding 5 — `/pricing` reads as a productized-service Landing Page but the SERP for its commercial cluster rewards Service Page authority signals it doesn't carry (MEDIUM)

**Severity:** MEDIUM

**SERP evidence:** For "conversion rate audit tool," ~29% of results (SiteTuners, Onilab) are classic Service Pages — process/methodology sections, case studies, team credentials — and even the Blog Post results in that cluster (Unbounce's own CRO-audit guide, notably from a named "not us" competitor in Nebula's own `llms-full.txt`) lean on demonstrated expertise and named case examples.

**Description:** `/pricing` links to `/case-studies` in the nav but embeds no case study, testimonial, or "our process" content on the page itself — a skeptical evaluator persona (comparing against Unbounce/VWO/Hotjar/CXL, all explicitly named as reference points in Nebula's own positioning doc) lands on a pricing page with an offer, an `OfferCatalog`, and an FAQ, but no proof that the "50+ landing pages" pattern-recognition claim (from `llms-full.txt`'s founder bio) is demonstrated anywhere near the buy decision. This is partly a deliberate positioning choice (anti-agency, no heavy case-study theater) but it under-serves the specific trust signal this SERP cluster consistently rewards.

**Recommendation:** Pull 1-2 concrete before/after examples (even anonymized) directly onto `/pricing` above the FAQ — a `Review` or `AggregateRating` schema addition would also close a real gap versus the Service Page competitors, none of which Nebula currently carries anywhere in the sampled pages.

---

## SERP Consensus by Keyword Cluster

| Keyword / cluster | Dominant page type (confidence) | Nebula's target page | Type match |
|---|---|---|---|
| "landing page audit tool free" | Tool/Interactive (~70%), Comparison listicle (~30%) | `/audit` | **Mismatch (schema/output signals missing)** |
| "conversion rate audit tool" | Blog/Guide (~57%), Service Page (~29%), Tool (~14%) | `/pricing` | Partial — Landing Page/Hybrid, missing Service Page proof elements |
| "google ads quality score low landing page" | Blog Post/Guide (~78%, high-DA), Forum (~22%) | `/learning-centre/google-ads-quality-score-low` | Aligned type, but missing schema/FAQ its siblings have |
| "landing page not converting" | Blog Post/Listicle (~83%), Forum (~17%) | `/learning-centre/landing-page-not-converting` | **Best-aligned page in the sample** |
| "high cpc low conversion rate" | Blog Post/Guide (~71%), Presentation deck (~29%) | `/learning-centre/high-cpc-low-conversion` | Aligned |

---

## User Stories (derived from SERP signals)

1. **As a founder who just checked Google Ads and saw "Below Average" landing page experience,** I want to paste my URL somewhere and get an immediate score, because I don't have time to read a 2,000-word guide right now, but I'm blocked by not knowing whether `/audit`'s output will actually show me anything concrete before I commit an email address.
   *(Source: "Landing Page Experience" language appears verbatim in Google's own Quality Score documentation ranking for "google ads quality score low"; competing Tool results for "landing page audit tool free" all promise instant, no-signup output.)*

2. **As a budget-conscious founder comparing free tools,** I want to see what a "finding" actually looks like before I trust the tool with my URL, because free-tool SERPs are crowded and I've been burned by lead-gen forms disguised as tools before, but I'm blocked by `/audit` having no example output anywhere in its content.
   *(Source: Roastd/Adamigo/NxCode SERP listings emphasize "no signup," "instant," "seconds" — the absence of proof-of-output on `/audit` is a direct gap against this exact promise.)*

3. **As a skeptical evaluator weighing Nebula against Unbounce/VWO/CXL,** I want to know exactly what I get for $97 before I pay, because I've seen vague "we'll fix it" service pitches before, but I'm blocked by `/pricing` and `landing-page-not-converting` giving me two different answers about whether Nebula implements the fix or hands me prompts to do it myself.
   *(Source: Finding 2's direct FAQ-schema contradiction; llms-full.txt explicitly frames Unbounce/VWO/CXL as the comparison set this persona is drawn from.)*

4. **As a PPC/Google Ads manager diagnosing a Quality Score problem,** I want a clear breakdown of the three Quality Score components and which one is my landing page's fault, because my agency/boss is asking why CPC went up, but I'm blocked by `google-ads-quality-score-low` lacking the FAQ-formatted direct answers that Wordstream/Semrush/Google itself provide for the same query.
   *(Source: dominant Blog/Guide SERP for this query is Q&A-structured; sibling article `high-cpc-low-conversion` already has the exact FAQ answers this persona needs but they're not present on `google-ads-quality-score-low`.)*

5. **As a founder mid-decision reading "5 Leaks" to self-diagnose,** I want to see what leak #4 (mobile layout) actually looks like on a real page, because I'm a visual thinker and the leak is inherently visual, but I'm blocked by every learning-centre article being pure prose with zero images.
   *(Source: Finding 4 — zero images across all 5 sampled pages; competing "landing page not converting" listicles at SeedProd/Apexure use screenshots for exactly this kind of diagnosis.)*

---

## Persona Scores

| Persona | Relevance | Clarity | Trust | Action | Total | Rating |
|---|---|---|---|---|---|---|
| Founder Buyer (ads spend, zero/low conversion, awareness→decision) | 20/25 | 15/25 | 12/25 | 18/25 | 65/100 | Good |
| Budget-Conscious Self-Fixer ("free tool" seeker, awareness) | 16/25 | 10/25 | 8/25 | 14/25 | 48/100 | Needs Work |
| Skeptical Evaluator (vs. Unbounce/VWO/Hotjar/CXL, decision stage) | 18/25 | 14/25 | 9/25 | 15/25 | 56/100 | Needs Work |
| PPC/Google Ads Manager (technical, consideration stage) | 19/25 | 12/25 | 14/25 | 16/25 | 61/100 | Good |

### Weakest Persona: Budget-Conscious Self-Fixer (48/100)
**Top issue:** Lands on `/audit` expecting the same instant, provable output as every competing free tool in the SERP, finds no example/sample result anywhere in the page's content, and has no way to build trust in the tool before submitting a real URL.
**Recommended fix:** Ship the static example-output section from Finding 1 and the `WebApplication` schema — this single change moves both Clarity and Trust for this persona.

### Systemic Issues
- **Trust** is the weakest dimension across all four personas (avg. 10.75/25) — driven by Finding 2's cross-page contradiction and Finding 5's missing proof elements on `/pricing`.
- **Clarity** is the second-weakest (avg. 12.75/25) — driven by Finding 4 (no visual support for inherently visual claims) and Finding 1 (no demonstrated tool output).

### Priority Actions
1. Fix the Finding 2 contradiction (cheap, immediate, removes an active trust liability).
2. Ship example output + `WebApplication` schema on `/audit` (Finding 1) — highest-leverage fix, addresses the weakest persona directly.
3. Add `Article`/`FAQPage` schema to `google-ads-quality-score-low` to match its siblings (Finding 3).
4. Add real images to at least the top 3 highest-traffic learning-centre articles and `/audit` (Finding 4).
5. Add 1-2 embedded proof points to `/pricing` (Finding 5).

---

## Gap Analysis (7 dimensions, blended across the 5-page sample)

| Dimension | Score | Evidence |
|---|---|---|
| Page Type (0-15) | 7/15 | `/audit` mismatched (Finding 1); `/pricing` partial; learning-centre articles well-matched |
| Content Depth (0-15) | 9/15 | Learning-centre word counts solid (704-2397); `/audit` (465) and `/pricing` (424) thin relative to Tool/Service competitors |
| UX Signals (0-15) | 9/15 | Tool hydrates correctly and is genuinely no-signup (confirmed via forced render); soft email gate on full report is minor friction. Mobile/device-level UX not independently tested — see Limitations |
| Schema (0-15) | 7/15 | Good `Service`/`Offer`/`FAQPage`/`Article` coverage on `/pricing`, `landing-page-not-converting`, `high-cpc-low-conversion`; missing entirely on `/audit` (Tool schema) and `google-ads-quality-score-low` (Article/FAQ schema) |
| Media (0-15) | 3/15 | Zero `<img>` content across all 5 pages sampled (Finding 4) |
| Authority (0-15) | 6/15 | Competing directly against Wordstream/Semrush/Google/Forbes-level domains for informational clusters; no case studies/proof embedded near the buy decision (Finding 5); thin author-entity depth beyond "Mike H" byline |
| Freshness (0-10) | 6/10 | `landing-page-not-converting`/`high-cpc-low-conversion` have real, recent `dateModified` (2026-07-21); `google-ads-quality-score-low` and `/audit` fall back to the site-wide `2026-01-01` default with no real date signal |
| **Total** | **47/100** | |

---

## Limitations

- SERP analysis used WebSearch text results (7-9 organic listings per query), not a full rendered SERP screenshot — ad copy, People Also Ask boxes, related searches, and AI Overview presence/citations could not be directly observed and are inferred from result composition only.
- No rank-tracking data was available; this analysis cannot state where Nebula's pages currently place for these queries, only how well-matched they are to what currently ranks.
- Mobile-viewport rendering and Core Web Vitals were not independently measured as part of this SXO pass (covered elsewhere in the audit if in scope).
- `/audit`'s actual scoring logic/output quality was not exercised end-to-end (no real URL was submitted through the live tool); the finding is about the *absence of indexable/example output*, not the accuracy of the tool itself.
- Only 5 of the ~27 learning-centre articles were sampled; the schema/FAQ inconsistency found on `google-ads-quality-score-low` (Finding 3) should be spot-checked across the remaining ~24 articles rather than assumed to be isolated.

## Cross-Skill Referrals

- **`/seo schema`** — generate `WebApplication` schema for `/audit` and backfill `Article`/`FAQPage` schema for `google-ads-quality-score-low` (Findings 1 & 3).
- **`/seo content`** — deeper E-E-A-T pass on the learning-centre articles competing against Wordstream/Semrush/Google-authority domains (Authority dimension, 6/15).
- **`/seo page`** — page-level audit of `/audit` specifically for the thin-content/no-example-output issue (Finding 1) and `/pricing`'s missing proof elements (Finding 5).

---

*Generate a PDF report? Use `/seo google report`*
