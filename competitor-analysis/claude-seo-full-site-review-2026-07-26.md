# Claude SEO Full-Site Review and Nebula Action Plan

**Review date:** 2026-07-26  
**Competitor:** https://claude-seo.md/  
**Compared with:** https://nebulacomponents.shop/ and the local `customer-portal` source  
**Status:** Research and planning only. No implementation performed.

## Executive conclusion

Claude SEO's advantage is not primarily its brutalist terminal aesthetic. Its advantage is a tightly coupled acquisition system:

1. a one-line product promise;
2. a nearly frictionless install path;
3. a page for every major capability;
4. tutorials and release notes that continually prove the product is alive;
5. first-party proof, public examples, and a reproducible benchmark;
6. dense, crawlable internal linking;
7. explicit limitations that make strong claims more credible.

Nebula should learn from that system, not reproduce its design or page templates. The closest application is the **Citable acquisition surface**, where users also need to understand and install a technical open-source product. The core Nebula service site should retain its clinical landing-page-diagnostic positioning and should not become a generic SEO-tool catalog.

The highest-value opportunity is to turn Citable's current single, very long product page into a small intent-led documentation and proof cluster, while strengthening Nebula's existing learning-centre crawl paths and evidence governance.

## Scope and evidence labels

- **Measured:** fetched from the live sites during this review.
- **Competitor-published:** claimed by Claude SEO on its own site or repository; not independently audited.
- **Observed:** qualitative finding from the live page/source.
- **Estimated:** analyst inference. No estimate is presented as a measured ranking, backlink, or traffic fact.
- Search traffic, keyword positions, backlink totals, referring domains, and domain authority are **N/A** because no first-party export or connected commercial SEO dataset was available.

## Complete site inventory reviewed

The Claude SEO sitemap contained **50 URLs (Measured)**:

- **6 main/utility surfaces:** homepage, skills hub, blog hub, AI visibility tool, speed report, install.
- **23 skill detail pages:** audit, technical, content, schema, GEO, local, maps, page, images, sitemap, hreflang, competitor pages, planning, programmatic SEO, FLOW, backlinks, Google APIs, topic clusters, drift, SXO, ecommerce, DataForSEO, and image generation.
- **21 blog posts:** 9 release/update posts plus 12 tutorials, deep dives, guides, comparisons, and listicles.
- Additional discovery assets reviewed: `robots.txt`, `sitemap.xml`, `llms.txt`, the extended Markdown documentation URL, and the speed-report JSON dataset.

Every sitemap URL was fetched and included in the structural analysis. Representative pages from every template class were then reviewed in depth.

## Quantitative baseline

| Metric | Claude SEO | Nebula | Label |
|---|---:|---:|---|
| Sitemap URLs | 50 | 51 | Measured |
| URLs returning 200 in final full recheck | 50/50 | 51/51 | Measured at 2026-07-26 07:31 UTC |
| Median visible words per sitemap page | 1,325 | 1,215 | Measured approximation |
| Average internal links per sitemap page | 21.2 | 14.9 | Measured |
| Sitemap pages with basic title, description, canonical, and one H1 | 50/50 | 51/51 on final recheck | Measured |
| Images without an `alt` attribute | 0 of 70 | Not evaluated site-wide in this pass | Measured |
| Discovered Claude SEO internal resources returning 200 | 53/53 | N/A | Measured |
| Median HTML transfer size | 48,387 bytes | 62,167 bytes | Measured |
| Blog/editorial posts | 21 | 42 learning-centre URLs in sitemap | Measured |
| Dedicated capability pages | 23 | 1 comprehensive Citable product page | Measured |

### Reliability observation

An earlier crawl in the same review received HTTP 500 responses from 13 consecutive Nebula learning-centre URLs. Repeated direct probes and the final full sitemap recheck returned 200 for all 51 URLs. This is not enough evidence to call the pages broken, but it is enough to justify a repeatable sitemap-level availability check and log review before expanding the content estate.

## What Claude SEO does well

### 1. It makes the product legible in seconds

The homepage combines category, audience, delivery surface, price posture, and scale in one compact frame: an SEO team in the terminal, free and open source, with a single install command.

The important lesson is **information compression**:

- what it is;
- who it is for;
- where it runs;
- what to do next;
- why the claim is believable.

Nebula's main homepage already has a strong pain-led frame. Citable, however, opens with a technically precise but denser explanation. A clearer "first command / first evidence package / first decision" story would improve activation without weakening Citable's evidence-first positioning.

### 2. It turns product capabilities into search and education surfaces

Claude SEO has 23 focused skill pages. Each page generally contains:

- a direct definition;
- the exact command;
- what the workflow checks;
- how the output is scored or structured;
- limitations and caveats;
- related skills and guides;
- an install CTA.

This gives one capability three jobs at once: documentation, search landing page, and conversion assistance.

Nebula's Citable page contains enough material for several such journeys, but nearly all of it is concentrated in one 2,600+ word page. The opportunity is not to create a page for each of 123 detectors. It is to create a small number of user-decision pages around real jobs.

### 3. It uses a hub-and-spoke architecture consistently

Claude SEO's skills hub links to the capability pages, capability pages link to related guides and neighboring skills, blog posts link back to product pages, and the install action repeats in context. The average sitemap page carried 21.2 internal links.

Nebula's average was 14.9. More importantly, the live learning-centre hub initially renders links for only the open accordion category. In the fetched server HTML, only 9 article URLs were linked even though 42 learning-centre URLs are in the sitemap. The other category links are added only after user interaction because closed panels are conditionally omitted.

That creates a meaningful crawl and discovery gap. Claude SEO's pages are present in the static link graph without requiring interaction.

### 4. It makes proof part of the content architecture

Claude SEO does not keep proof in a single testimonial strip. It distributes proof across:

- GitHub adoption;
- demo-view counts;
- public comments;
- real audit examples with findings;
- passing-test counts;
- release-validation details;
- a speed benchmark with methodology and downloadable data;
- owner-provided Search Console screenshots;
- explicit limitations on what those numbers prove.

The speed report is the standout asset. It is a product demonstration, comparison page, research report, linkable dataset, and interactive self-check in one surface.

Nebula can learn from the **proof format**, but should not reproduce the speed leaderboard. A better native asset would be a landing-page evidence benchmark based on Nebula's seven conversion signals, with a frozen dataset, inclusion criteria, methodology, limitations, and a self-check path.

### 5. It admits where alternatives are stronger

The Claude SEO comparison content acknowledges the value of proprietary datasets and hosted tracking products. This strengthens its narrower claim: local, inspectable, implementation-oriented workflows.

Citable already has the right strategic conclusion on its product page: it should complement monitoring vendors rather than imitate their dashboards. That conclusion deserves a focused, buyer-friendly comparison surface instead of being buried deep in the current long page.

### 6. It treats release engineering as marketing evidence

Nine of the 21 editorial posts are releases or updates. They use:

- version number;
- concrete change;
- validation count;
- security or reliability impact;
- upgrade instructions;
- related documentation.

This is effective for a developer product because maintenance is itself part of the buyer's risk assessment.

Citable's current page includes a large embedded changelog. Major releases could become focused, source-backed release notes while the product page keeps a concise "what changed recently" section.

### 7. It is unusually careful with caveats

Strong examples include:

- calling its health score a vendor heuristic rather than a Google metric;
- separating Lighthouse lab data from Core Web Vitals field status;
- timestamping keyword and AI-visibility snapshots;
- explaining that one AI answer is not a permanent ranking;
- stating that schema cannot guarantee AI visibility;
- admitting when an archive does not preserve individual runs.

This aligns closely with Citable's evidence posture. Nebula should lean harder into this shared strength.

### 8. It is technically disciplined

Observed strengths:

- 50/50 sitemap URLs returned 200;
- every page had a title, description, canonical, and one H1;
- 70/70 images had `alt` attributes;
- all 53 discovered internal resources returned 200;
- clean, shallow URLs;
- page-specific structured data;
- explicit crawler policy and `llms.txt`;
- CSP, HSTS, `nosniff`, frame restrictions, referrer policy, and permissions policy;
- static HTML with inlined CSS/JavaScript and no analytics payload.

Its own archived benchmark reports a median mobile Lighthouse score of 99, but that is **Competitor-published**, dated May 2026, and not equivalent to field performance.

## What Claude SEO could improve

These are useful guardrails for Nebula.

### 1. The site has fact-count drift

Examples observed across surfaces:

- 30 versus 32 user commands;
- 1.7K versus 1.8K forks;
- "sub-skills" sometimes includes the orchestrator and sometimes does not;
- demo copy refers to 9 agents while other surfaces say up to 15 specialists.

Some differences are contextual, but the repetition of manually maintained statistics creates avoidable ambiguity.

**Lesson:** generate version, capability counts, release dates, test counts, and package facts from one canonical manifest. Do not hand-update the same number across dozens of files.

### 2. The skill detail pages are heavily templated

The consistent structure is good, but 23 pages reuse a highly similar sequence, schema set, CTA, and related-content block. Without strong unique evidence, this pattern can feel programmatic and create maintenance burden.

**Lesson:** Citable should have a small number of substantial job pages, not one page per detector, namespace, or command.

### 3. The content mix is product-heavy

Nine of 21 posts are release notes. This is appropriate for existing developer users but leaves less coverage for buyer scenarios, failure patterns, migration decisions, and outcomes.

**Lesson:** use release notes as trust content, but balance them with problem-led education and implementation examples.

### 4. The homepage is very long and repeats the install pitch

The homepage successfully acts as a complete sales page, but command lists, skill counts, proof, ecosystem modules, blog cards, FAQ, and the pitch create repetition.

**Lesson:** Nebula should preserve its sharper service homepage. Citable should gain supporting pages so its overview can become shorter, not move all supporting detail onto the Nebula homepage.

### 5. FAQ schema is overused

FAQPage markup appears across most pages. The site itself correctly notes that Google no longer grants the broad FAQ rich-result benefit. The markup may still have semantic value, but it should not be copied as a ranking tactic.

**Lesson:** use visible FAQs when they resolve real objections; add schema only when accurate and useful.

### 6. Some proof remains owner-published

The Search Console snapshot, adoption numbers, and real-audit examples are useful, but the website remains the publisher of those claims. The speed report is stronger because it exposes methodology and a dataset.

**Lesson:** Nebula should prefer verifiable artifacts, immutable run IDs, public methodology, and source links over screenshot-only proof.

### 7. The visual identity is memorable but not transferable

The near-black background, coral accent, Space Grotesk/IBM Plex Mono pairing, uppercase labels, sharp cards, and terminal commands fit Claude SEO's developer audience.

They conflict with Nebula's explicit brand constraints and would make the core service look like a generic technical audit tool. Nebula should borrow the clarity and proof density, not the typefaces, coral color, terminal chrome, or page layout.

## What Nebula already does better

### 1. The core service positioning is more specific

"Your ads worked. Your page didn't let them." addresses a concrete paid-traffic failure. Claude SEO serves a broader collection of SEO jobs.

Nebula should not trade this specificity for a wide catalog.

### 2. Citable has a stronger evidence model

Citable separates retrieval, extraction, support, identity, and observation; preserves immutable artifacts; declares detector determinism; and rejects outcome guarantees. Claude SEO still uses a single weighted health score as a triage device.

The strategic opportunity is to make Citable's superior model easier to understand, not to adopt Claude SEO's score.

### 3. Nebula has a deeper problem-led learning estate

Nebula has 42 learning-centre URLs mapped to symptoms, channels, economics, proof, forms, and mobile failures. Claude SEO has more product-documentation coverage, but Nebula has more buyer-problem coverage.

The gap is discovery and connection, not raw article count.

### 4. Nebula has a direct commercial path

Free diagnosis leads to a fixed-price Fix Pack. Claude SEO's site primarily drives installs and community participation. Nebula can connect educational proof directly to a bounded service outcome.

## Pairwise content and journey gaps

| Gap type | Claude SEO pattern | Nebula state | Recommendation | Priority |
|---|---|---|---|---|
| Product activation | Dedicated short install page | Citable install is part of one long page | Create a focused Citable quick-start surface | P1 |
| Capability discovery | 23 detail pages + hub | One comprehensive Citable page | Create 4-6 job-led capability pages, not detector pages | P1 |
| Internal discovery | Static links across hubs/spokes | Closed learning accordions omit most links from initial HTML | Render all article links crawlably | P0 |
| Proof asset | Public audits + benchmark + dataset | Self-audit, case-study surface, Citable evidence packages | Publish one verifiable public evidence case and one original benchmark | P1/P2 |
| Comparison | Honest "where paid tools win" page | Strong comparison table buried in Citable page | Publish a focused "Citable vs monitoring platforms vs crawlers" decision guide | P1 |
| Release trust | 9 standalone release posts | Long embedded Citable changelog | Standalone notes for major releases only | P2 |
| Documentation depth | Skill page → guide → install | Product page does most jobs | Separate overview, quick start, jobs, limitations, releases | P1 |
| Buyer education | Product-heavy | Strong learning centre | Keep Nebula's problem-led advantage | Protect |
| GEO structure | Question H2s, source tables, dated facts, caveats | Mixed across learning articles | Add answer-first summaries and source blocks where evidence supports them | P1 |
| Performance | Static framework-free content site | Next.js interactive service and analytics | Use route budgets and static rendering; do not remove needed product interactivity | P1 |

## Recommended Citable information architecture

This is a conceptual architecture, not an implementation prescription.

1. **Citable overview** — the category, evidence model, proof, use cases, and next action.
2. **Quick start** — install, initialize, audit, inspect the evidence package, create an action plan.
3. **Evidence-grade site auditing** — retrieval, extraction, schema, link graph, and immutable artifacts.
4. **Claims and citation readiness** — claim support, evidence lifecycle, answer extractability, and limitations.
5. **Rendered and performance observation** — browser profiles, Lighthouse lab evidence, and lab/field separation.
6. **Governed remediation** — action plans, dry runs, hash locking, review, verification, and monitoring.
7. **Agent readiness** — `llms.txt`, crawler policy, Markdown negotiation, MCP/A2A, with clear evidence limits.
8. **Comparison guide** — when to use Citable, an AI-visibility platform, a commercial crawler, or a combination.
9. **Major release notes** — only releases with meaningful buyer or operator impact.

Every surface should have unique intent, evidence, and a clear next step. Do not create a page merely because a command or detector exists.

## Original proof assets worth building

### A. Public evidence case

Run Citable on a controlled Nebula surface and publish:

- target and date;
- evidence package manifest;
- three material findings;
- remediation decision;
- before/after observation;
- what did not change;
- what the run cannot prove.

This borrows Claude SEO's "real audit" principle without copying its cards or scoring model.

### B. Landing-page evidence benchmark

Create a versioned benchmark across a defined sample of paid-traffic landing pages:

- inclusion/exclusion criteria;
- seven-signal definitions;
- observation protocol;
- aggregate distributions;
- anonymization rules;
- frozen dataset or reproducible summary;
- limitations;
- rerun date;
- a path into the free audit.

Do not rank named competitors unless the methodology, legal review, and reproducibility support it.

### C. Decision guide

Publish an honest matrix:

- Citable for inspectable evidence, governance, and verified remediation;
- commercial crawlers for large proprietary datasets and hosted reporting;
- AI-visibility platforms for prompt-scale monitoring;
- Nebula Fix Pack for applied landing-page correction.

This should say where Citable is weak as clearly as where it is strong.

## Evidence and offer drift to resolve before publishing more proof

The local and live surfaces currently contain conflicting statements:

- `customer-portal/PRODUCT.md` describes a $147 Fix Pack, while the live pricing page and repository operating instructions identify $97 as current.
- the local sitemap source says no evidenced case-study slugs exist, while the live `/case-studies` index presents four outcome stories;
- the local product brief says two documented case studies, while the live homepage says verified client outcomes are not yet available.

This review does not determine which statement is authoritative. Before adopting Claude SEO's proof-rich approach, Nebula needs one governed source of truth for offers, customer outcomes, release facts, and allowed claims.

## Action plan

### Immediate: 0-2 weeks

#### P0. Establish content and proof integrity

1. Resolve the offer and case-study contradictions above.
2. Define one canonical registry for price, delivery window, evidence status, case-study eligibility, release version, detector count, and test status.
3. Generate repeated public facts from that registry wherever practical.
4. Do not add new adoption, outcome, or benchmark claims until this is complete.

**Exit criteria:** every public claim resolves to an approved evidence record and identical canonical value.

#### P0. Make the learning-centre link graph crawlable

1. Keep accordion interaction if useful.
2. Ensure every article link exists in server-rendered HTML without requiring a click.
3. Add contextual links between related symptom, channel, and solution articles.
4. Add at least one path from each relevant article to the audit and, where appropriate, Citable.

**Exit criteria:** all 42 learning-centre sitemap URLs are discoverable through ordinary HTML links from the hub or another indexed article.

#### P0. Verify route reliability

1. Repeat the full sitemap probe on a schedule and across several deployment states.
2. Investigate logs for the observed 13-URL HTTP 500 cluster.
3. Fail deployment or alert when any indexable URL returns 5xx.

**Exit criteria:** multiple consecutive production probes show all indexable routes healthy, with a regression gate in place.

#### P1. Define Citable's page map

1. Assign one search/user intent to each proposed surface.
2. Map current product-page sections to keep, move, consolidate, or retire.
3. Set a maximum of 4-6 initial supporting job pages plus quick start and comparison.
4. Add non-cannibalization rules for titles, H1s, and primary questions.

**Exit criteria:** approved information architecture and content briefs; no code changes yet.

### Short term: 2-6 weeks after approval

#### P1. Publish a focused Citable quick start

- one primary command sequence;
- prerequisites;
- exact output location;
- verification step;
- failure and limitation notes;
- next paths for deeper jobs.

**Success metrics:** quick-start-to-GitHub/npm click-through, install-copy events, audit-command engagement where measurable.

#### P1. Split Citable by user job

Publish the approved job pages with:

- direct answer near the top;
- visible evidence example;
- exact command;
- output contract;
- limitations;
- related pages;
- version/date/source;
- one clear CTA.

**Success metrics:** indexed coverage, non-branded impressions, internal navigation, assisted audit starts.

#### P1. Publish an honest comparison guide

Use Citable's existing strategic distinction, but provide a decision tree rather than a promotional feature checklist.

**Success metrics:** comparison-query impressions, GitHub/npm referrals, qualified audit starts.

#### P1. Apply an answer-first editorial standard

For high-priority learning pages:

- 40-80 word direct answer;
- question-based section headings where natural;
- source table for quantitative claims;
- visible author/update date;
- "what this does not prove";
- contextual internal links;
- no schema unsupported by visible content.

**Success metrics:** passage extraction in controlled tests, featured/PAA visibility where observed, improved internal crawl depth.

#### P1. Add route-level performance budgets

Do not copy the framework-free implementation. Set budgets appropriate to Nebula:

- static/server-rendered educational content;
- minimal client components;
- deferred consented analytics;
- image and font budgets;
- no layout shift;
- separate lab and field reporting.

**Success metrics:** Lighthouse lab budgets, CrUX where available, JavaScript bytes, LCP resource timing.

### Medium term: 6-12 weeks

#### P2. Publish the first public evidence case

Use a controlled Nebula property or an explicitly approved customer case. Include the immutable evidence package and limitations.

#### P2. Build the original benchmark

Only after the methodology, evidence registry, and sample are approved. Release a frozen v1 dataset and a clear refresh cadence.

#### P2. Turn major Citable releases into evidence-led notes

Publish only meaningful releases. Generate version, date, detector counts, registry counts, and validation status from release artifacts.

#### P2. Add a reusable proof module

The module may display:

- verified release facts;
- public evidence cases;
- current CI/release status;
- reproducible datasets;
- explicit caveats.

It must refuse missing or unverified fields rather than fill them with marketing copy.

### Long term: 3-6 months

1. Connect approved Search Console and analytics exports to the content inventory.
2. Measure which job pages assist installs, audits, and Fix Pack purchases.
3. Track controlled AI-answer and citation observations by query, date, location, and source.
4. Refresh or consolidate pages based on evidence, not publishing cadence.
5. Consider a second benchmark only if v1 earns links, citations, qualified traffic, or product activation.

## Suggested editorial calendar after approval

Dates are planning placeholders, not commitments.

| Week | Asset | Type | Dependency |
|---|---|---|---|
| Week 1 | Citable Quick Start | Activation page | Approved architecture and canonical release facts |
| Week 2 | Evidence-Grade Site Auditing | Job page | Public sample evidence package |
| Week 3 | Claims and Citation Readiness | Job page | Approved claims/evidence examples |
| Week 4 | Citable vs Crawlers vs AI-Visibility Platforms | Decision guide | Reviewed comparison evidence |
| Week 5 | Governed Remediation | Job page | Verified dry-run and before/after example |
| Week 6 | First Public Evidence Case | Proof asset | Evidence approval and privacy review |
| Week 8+ | Landing-Page Evidence Benchmark v1 | Research asset | Methodology, dataset, legal/evidence review |

## Do not copy

- the coral/black terminal aesthetic;
- Space Grotesk or IBM Plex Mono;
- uppercase command-card composition;
- "your team in the terminal" language;
- a page per detector or command;
- a 0-100 aggregate health score;
- their speed-report topic or named leaderboard;
- their exact FAQ, skill-page, comparison-table, or install-page structures;
- manually repeated counters;
- GitHub stars or community size as a substitute for customer evidence.

## Success criteria for the overall initiative

1. All indexable routes remain healthy across scheduled production probes.
2. Every learning-centre URL is discoverable through static internal links.
3. Citable has a clear overview, quick start, and bounded job surfaces without keyword cannibalization.
4. Repeated product facts come from a canonical source.
5. At least one public proof asset exposes methodology, evidence, and limitations.
6. Educational content assists product activation or audit starts, not merely page-count growth.
7. Nebula retains its paid-traffic conversion positioning and distinct visual identity.

## Source set

- Claude SEO homepage: https://claude-seo.md/
- Skills hub: https://claude-seo.md/skills
- Blog hub: https://claude-seo.md/blog
- Install page: https://claude-seo.md/install
- Full-site audit page: https://claude-seo.md/skills/seo-audit
- AI visibility tool: https://claude-seo.md/ai-visibility-tool
- Speed report: https://claude-seo.md/speed-report
- Speed dataset: https://claude-seo.md/assets/speed-report-data.json
- Sitemap: https://claude-seo.md/sitemap.xml
- `llms.txt`: https://claude-seo.md/llms.txt
- GitHub repository: https://github.com/AgriciDaniel/claude-seo
- Nebula homepage: https://nebulacomponents.shop/
- Nebula sitemap: https://nebulacomponents.shop/sitemap.xml
- Nebula learning centre: https://nebulacomponents.shop/learning-centre
- Citable: https://nebulacomponents.shop/resources/citable

## Handoff summary

- **Decision:** borrow Claude SEO's acquisition system—capability education, proof assets, crawlable linking, release trust, and explicit limitations—without borrowing its branding or score model.
- **Quick wins:** crawlable learning-centre links, canonical claim facts, Citable quick-start architecture.
- **Strategic builds:** job-led Citable cluster, honest comparison guide, public evidence case.
- **Long-term bet:** an original, reproducible landing-page evidence benchmark.
- **Open decisions:** authoritative Fix Pack price; allowed case studies; initial Citable page count; benchmark sample and publication policy.
- **No implementation performed.**
