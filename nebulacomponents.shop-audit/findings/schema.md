# Schema.org / Structured Data Audit — nebulacomponents.shop

Scope: all JSON-LD found across page templates (homepage, /pricing, learning-centre article template + index, /case-studies, /about + /about/team, /resources + /resources/citable, /audit). All pages fetched raw (`is_spa: false` — schema is server-rendered, no Playwright discrepancy). Every block parsed as syntactically valid JSON-LD with correct `@context: https://schema.org`.

## What Works

- **Sitewide Organization graph is well-built.** Every page carries a single `Organization` node (`@id: https://nebulacomponents.shop/#organization`) with `logo`, absolute `url`, `contactPoint`, `sameAs` (LinkedIn + GitHub), and a nested `founder` Person (`@id: .../#founder`, name "Mike Holownych"). Reused via `@id` reference (not re-declared) as `publisher`/`provider`/`author` on other pages — correct pattern.
- **`/pricing` has real, complete commercial schema.** `Service` + `Offer` + `OfferCatalog` for the $97 Fix Pack: correct `price`/`priceCurrency`/`availability`/`priceValidUntil` (ISO 8601, `2026-12-31` — matches the CLAUDE.md-documented price-lock date), absolute checkout URL, and an itemized `OfferCatalog` of deliverables. This is genuinely good `Product`/`Offer` implementation, not boilerplate.
- **Article template has core coverage.** All learning-centre articles checked (`cta-not-working`, `message-match-checklist`, `mobile-landing-page-leaks`) emit `Article` with `headline`, `description`, `datePublished`, `dateModified`, `author`, `publisher` (via `@id`), and `mainEntityOfPage`. Dates are ISO 8601.
- **`/resources` and `/resources/citable` are the most sophisticated pages on the site.** `/resources` uses `CollectionPage` + `hasPart[SoftwareApplication]`; `/resources/citable` uses an explicit `@graph` with `TechArticle` + nested `about: SoftwareApplication`, correct `license` (Apache-2.0 URL), `softwareVersion`, `downloadUrl`. No deprecated types, no placeholder text, all absolute URLs.
- **`/case-studies` correctly has no `Review`/`AggregateRating`.** The page itself states no case study exists yet ("We don't have one yet — on purpose"). Absence of testimonial/review schema here is the right call, not a gap — adding fabricated ratings would violate Google's structured-data policy on fake reviews.
- **No Microdata/RDFa found anywhere** — JSON-LD only, per best practice. `@context` is consistently `https://schema.org` (https, not http).

## Findings

### 1. HowTo schema on homepage — deprecated type, live in production
**Severity:** High
**Where:** `/` — third JSON-LD block (`HowTo` + `HowToStep`, "How to get a free landing page audit")
**Description:** Google removed HowTo rich results from Search in September 2023. This block has produced zero SERP benefit for nearly three years and only adds ~754 bytes of render-blocking-adjacent payload per homepage load. Its continued presence signals a stale SEO baseline that this audit should close out.
**Recommendation:** Remove the block outright. Do not replace it with another HowTo-shaped schema. If the 3-step "Enter URL → Get Score → See Fixes" flow needs structured representation, it does not have a supported Google rich-result type — leave it as plain HTML/CSS. Do not substitute with FAQPage either (see Finding 2 — no active rich result exists for that either).

### 2. FAQPage on /pricing — no remaining Google SERP benefit
**Severity:** Info (downgraded from prior Critical/High-tier treatment — do not action as a launch blocker)
**Where:** `/pricing` — fourth JSON-LD block, 5 Q&A pairs
**Description:** Google retired FAQ rich results for all sites on May 7, 2026. This markup is valid and well-formed (proper `Question`/`acceptedAnswer` nesting, no placeholder text) but no longer produces any SERP feature. Any residual value from LLM/AI-answer-engine citation is unconfirmed and should not be represented to stakeholders as a ranking or visibility benefit.
**Recommendation:** No action required. Do not remove it (harmless, valid, may have unconfirmed AEO/GEO value) and do not add FAQPage to any other page for Google SERP benefit. These are marketing FAQs, not user-submitted questions, so **QAPage is not the correct substitute type here** — QAPage only applies to genuine user Q&A threads, which this site does not have.

### 3. Article schema is missing `image` — required for Top Stories / article rich results
**Severity:** Medium
**Where:** Learning-centre article template (confirmed on `cta-not-working`, `message-match-checklist`, `mobile-landing-page-leaks` — templated, so likely all ~27 articles)
**Description:** Google's Article structured-data guidelines require an `image` property (1200px-wide minimum recommended) for the headline/thumbnail to be eligible for Top Stories and other article-image-bearing rich results. None of the three articles checked include one.
**Recommendation:** Add `image` to the Article block, pointing at each article's actual hero/OG image (absolute URL, not a shared placeholder).
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "CTA Not Working? Fix Commitment, Clarity, And Timing",
  "description": "Your CTA fails when it asks for more than the page has earned. Learn the 4 CTA failure modes, the commitment ladder, and the copy formula that converts.",
  "image": [
    "https://nebulacomponents.shop/og/learning-centre/cta-not-working.png"
  ],
  "author": {
    "@id": "https://nebulacomponents.shop/#founder"
  },
  "datePublished": "2026-07-21",
  "dateModified": "2026-07-21",
  "publisher": { "@id": "https://nebulacomponents.shop/#organization" },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://nebulacomponents.shop/learning-centre/cta-not-working"
  }
}
```
(Note: the `author` field here also fixes Finding 4 below by referencing the canonical founder `@id` instead of re-declaring a Person inline. Replace the placeholder `image` URL with the article's real OG asset before shipping.)

### 4. Article `author` re-declares the founder with a different name and no `@id` — entity fragmentation
**Severity:** Medium
**Where:** Same article template as Finding 3
**Description:** Every article's `author` is inlined as `{"@type": "Person", "name": "Mike H", "url": "https://nebulacomponents.shop/about/team"}`. This is a *different* name string ("Mike H") than the canonical founder entity declared sitewide as `"name": "Mike Holownych"` (`@id: https://nebulacomponents.shop/#founder`). Google and LLM crawlers reconcile entities primarily by name + URL + sameAs; a name mismatch between ~27 duplicated inline Person nodes and the one canonical founder node makes it harder for Search/Knowledge Graph and AI answer engines to confidently merge these into a single author entity, diluting E-E-A-T signal instead of reinforcing it.
**Recommendation:** Replace the inline Person object in every article's `author` field with a reference to the existing canonical entity:
```json
"author": { "@id": "https://nebulacomponents.shop/#founder" }
```
This requires the founder `Person` node (currently only nested inside the sitewide `Organization` block) to remain present on every page that also carries an Article block — it already is, since the Organization block is sitewide. No other change needed; this is a one-line template fix once applied at the source.

### 5. No BreadcrumbList anywhere on the site
**Severity:** Medium
**Where:** Sitewide — checked homepage, /pricing, learning-centre index, article template, /case-studies, /about, /about/team, /resources, /resources/citable, /audit
**Description:** Unlike HowTo/FAQPage, `BreadcrumbList` is an actively supported Google rich result (breadcrumb trail replacing the raw URL in SERP snippets) and is not deprecated. It is entirely absent across every template checked, despite the site having real hierarchical paths (`/learning-centre` → `/learning-centre/{article}`, `/resources` → `/resources/citable`, `/about` → `/about/team`).
**Recommendation:** Add `BreadcrumbList` to the learning-centre article template and to `/resources/citable` and `/about/team` at minimum (the pages with a genuine parent). Example for an article:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://nebulacomponents.shop/" },
    { "@type": "ListItem", "position": 2, "name": "Learning Centre", "item": "https://nebulacomponents.shop/learning-centre" },
    { "@type": "ListItem", "position": 3, "name": "CTA Not Working? Fix Commitment, Clarity, And Timing", "item": "https://nebulacomponents.shop/learning-centre/cta-not-working" }
  ]
}
```

### 6. /learning-centre index has no CollectionPage/ItemList of its ~27 articles
**Severity:** Low-Medium
**Where:** `/learning-centre` (article index) — currently only carries the sitewide `Organization` + `WebSite` blocks, nothing page-specific
**Description:** `/resources` demonstrates the site already knows this pattern (`CollectionPage` + `hasPart[SoftwareApplication]`), but it isn't applied to the much larger and more content-rich `/learning-centre` index. An explicit `ItemList`/`CollectionPage` gives Google and AI crawlers an unambiguous, low-cost manifest of every article URL plus title, independent of on-page link discovery.
**Recommendation:**
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://nebulacomponents.shop/learning-centre",
  "name": "Learning Centre — Nebula Components",
  "url": "https://nebulacomponents.shop/learning-centre",
  "publisher": { "@id": "https://nebulacomponents.shop/#organization" },
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "url": "https://nebulacomponents.shop/learning-centre/cta-not-working"
      }
    ]
  }
}
```
(Populate `itemListElement` with all ~27 published articles, in publish order or index order — position values must be sequential integers, not placeholders.)

### 7. /about/team has no dedicated, enriched Person schema for the founder
**Severity:** Medium
**Where:** `/about/team` — carries only the sitewide `Organization`(+nested founder)/`WebSite` blocks; no page-specific schema at all despite being the founder's dedicated bio page
**Description:** The task brief specifically asked whether /about has Person schema "distinct from the homepage's" — it does not. The founder Person node that exists sitewide is minimal (`name`, `jobTitle`, `url`, `sameAs`, `worksFor`) and identical on every page. The one page where a fuller entity profile is warranted (image/headshot, `knowsAbout`, `alumniOf` if applicable, `description`) carries nothing beyond that same minimal shared node.
**Recommendation:** On `/about/team` specifically, extend the existing `#founder` node (same `@id` — do not create a second, conflicting Person entity) with a richer profile:
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://nebulacomponents.shop/#founder",
  "name": "Mike Holownych",
  "jobTitle": "Founder",
  "url": "https://nebulacomponents.shop/about/team",
  "image": "https://nebulacomponents.shop/team/mike-holownych.jpg",
  "description": "Founder of Nebula Components, running evidence-backed landing-page conversion audits for founders and operators spending on paid traffic.",
  "sameAs": [
    "https://www.linkedin.com/in/mikeholownych",
    "https://github.com/mikeholownych"
  ],
  "worksFor": { "@id": "https://nebulacomponents.shop/#organization" }
}
```
Replace the `image` placeholder with the real headshot URL used on the page before shipping.

### 8. /audit (free tool) has no WebApplication/SoftwareApplication schema
**Severity:** Low
**Where:** `/audit` — only sitewide `Organization`/`WebSite` blocks; no tool-specific schema
**Description:** The site already uses `SoftwareApplication` correctly elsewhere (`/resources/citable`, for the npm package). The free audit tool at `/audit` is functionally a web application (URL input → automated score → report) and is currently invisible as a distinct entity in structured data — it's only described in prose.
**Recommendation:**
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": "https://nebulacomponents.shop/audit#app",
  "name": "Nebula Free Landing Page Audit",
  "url": "https://nebulacomponents.shop/audit",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Any (browser-based)",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "provider": { "@id": "https://nebulacomponents.shop/#organization" }
}
```

## Deprecated/Retired Types — Compliance Check
- **HowTo:** present (homepage) — flagged as Finding 1. Not present elsewhere.
- **SpecialAnnouncement:** not found anywhere. Compliant.
- **CourseInfo / EstimatedSalary / LearningVideo:** not found anywhere. Compliant.
- **FAQPage:** present (`/pricing` only) — flagged as Finding 2, Info severity per current Google policy (retired May 7, 2026). No new FAQPage recommended anywhere in this report.

## Validation Summary
| Page template | Blocks | Valid JSON-LD | Deprecated types present | Notable gaps |
|---|---|---|---|---|
| Homepage (/) | 3 | Yes | HowTo (Finding 1) | — |
| /pricing | 4 | Yes | FAQPage (Info, Finding 2) | none in Service/Offer block |
| Article template (learning-centre/*) | 3 | Yes | none | missing `image` (F3), author entity fragmentation (F4) |
| /learning-centre (index) | 2 | Yes | none | no CollectionPage/ItemList (F6) |
| /case-studies | 2 | Yes | none | none (correctly no fake reviews) |
| /about | 2 | Yes | none | — |
| /about/team | 2 | Yes | none | no enriched Person for founder (F7) |
| /resources | 3 | Yes | none | none |
| /resources/citable | 3 (via @graph) | Yes | none | none |
| /audit | 2 | Yes | none | no WebApplication schema (F8) |
| Sitewide | — | — | — | no BreadcrumbList anywhere (F5) |

## Category Score: 76/100

**Rationale:** The site has a genuinely above-average structured-data foundation for its size — a correctly `@id`-linked Organization/founder/WebSite graph, real (not templated-placeholder) Service/Offer schema on the commercial page, a working Article template across the entire learning-centre, and the most sophisticated block on the site (`/resources/citable`'s `@graph` TechArticle+SoftwareApplication) is genuinely well engineered. Points are held back by: one concrete deprecated-schema relic still live in production (HowTo, Finding 1), a site-wide Article template gap (missing `image`, Finding 3) that costs eligibility for an active rich-result feature, an entity-consistency defect that duplicates the founder under a different name on every article (Finding 4), and the complete absence of BreadcrumbList — a supported, zero-risk rich result — anywhere on the site (Finding 5). These are all templated, one-time fixes rather than page-by-page rework, so the path to a 90+ score is short.
