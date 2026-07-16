# Nebula Components — AEO Audit Report

**Date:** 2026-07-15  
**Framework:** Answer Engine Optimization (14-layer model)  
**Current Maturity:** Level 1.5 (Eligible → Retrievable)  
**Target:** Level 3 (Citable) in 90 days

---

## Summary Assessment

| Layer | Score | Gap Severity |
|-------|-------|--------------|
| 1. Query Intelligence | 15% | **Critical** |
| 2. Technical Retrievability | 85% | Low |
| 3. Entity & Authority | 40% | Medium |
| 4. Citation-Grade Content | 30% | **High** |
| 5. External Corroboration | 5% | **Critical** |
| 6. Freshness & Lifecycle | 20% | High |
| 7. Internal Linking | 50% | Medium |
| 8. Structured Data | 65% | Low |
| 9. Measurement | 10% | **Critical** |
| 10. Governance | 15% | **Critical** |
| 11. Content Automation | 0% | N/A |
| 12. Provenance | 0% | **Critical** |
| 13. Page Acceptance | 40% | High |
| 14. Maturity Model | Level 1.5 | — |

---

## Layer-by-Layer Analysis

### 1. Query Intelligence (15%)

**Requirement:** Controlled corpus of 200–500 commercially material questions with taxonomy.

**Current State:**
- ❌ No formal query registry
- ❌ No question taxonomy (intent class, funnel stage, audience)
- ❌ No citation difficulty scoring
- ⚠️ Some question-format content exists in `/cta-optimization`, `/headline-optimization`
- ❌ No adversarial formulations
- ❌ No jurisdiction/role variants

**Found:**
- ~10 question-format pages (What is, How to, Why does)
- 1 comparison page (`/ai-sdr-vs-audit`)
- 420 case study pages (untapped query potential)

**Gap:** No systematic query discovery or tracking.

**Recommendation:** Build query registry with 100 priority questions across 5 intent classes (definition, comparison, implementation, problem, recommendation).

---

### 2. Technical Retrievability (85%)

**Requirement:** Crawlable, indexable, stable technical foundation.

**Current State:**
- ✅ `robots.txt` with AI crawler policy (Googlebot, Bingbot, OAI-SearchBot, PerplexityBot)
- ✅ Dynamic sitemap at `/sitemap.xml`
- ✅ All pages return HTTP 200
- ✅ Canonical URLs present
- ✅ Server-rendered HTML (Next.js SSR)
- ⚠️ Multiple `package-lock.json` files (Next.js warning)
- ✅ No authentication requirements
- ✅ No cookie walls
- ⚠️ Performance: Not measured (needs Core Web Vitals audit)

**Gap:** Speed audit, CWV validation, structured sitemap segmentation.

**Recommendation:** Audit Core Web Vitals, segment sitemap by content class (knowledge, research, products, case-studies).

---

### 3. Entity & Authority (40%)

**Requirement:** Canonical entity pages with stable naming, relationships, external corroboration.

**Current State:**
- ✅ Organization page: `/company/about` (HTTP 200)
- ✅ Team page: `/company/team` with Person schema
- ⚠️ Author biographies exist on team page but not linked to articles
- ❌ No dedicated concept pages
- ❌ No methodology page
- ❌ No editorial policy page
- ❌ No correction policy page
- ❌ No glossary/page taxonomy

**Gap:** Entity pages exist but lack connectivity to content.

**Recommendation:** Link authors to articles, create `/concepts` pages for proprietary terms, add editorial standards page.

---

### 4. Citation-Grade Content (30%)

**Requirement:** Direct answer blocks, explicit definitions, atomic claims, evidence-adjacent, comparison tables, procedures.

**Current State:**
- ⚠️ Some articles have answer blocks but inconsistent placement
- ❌ No explicit definition pattern (**[Term] is [definition]**)
- ❌ Claims often buried in prose, not atomic
- ⚠️ Evidence exists in case studies but not linked to claims
- ⚠️ One comparison page exists (`/ai-sdr-vs-audit`) but lacks comparison table
- ❌ No comparison tables with structured markup
- ❌ No explicit step-by-step procedures
- ❌ No boundary conditions stated

**Gap:** Content is informational but not citation-extractable.

**Recommendation:** Restructure top 20 pages with direct answer blocks, comparison tables, explicit definitions.

---

### 5. External Corroboration (5%)

**Requirement:** Independent third-party validation across multiple domains.

**Current State:**
- ❌ No G2/Captera listings
- ❌ No guest posts on industry publications
- ❌ No conference presentations
- ❌ No podcast mentions
- ❌ No academic citations
- ⚠️ Reddit mentions exist (39 leads from manual Reddit pivot) but not structured

**Gap:** Zero external authority signals reachable by answer engines.

**Recommendation:** Focus on 3–5 high-value corroboration sources (G2, Product Hunt, guest post on MarketingProfs/HubSpot, 2–3 podcast interviews).

---

### 6. Freshness & Lifecycle (20%)

**Requirement:** Review intervals, content owners, change history.

**Current State:**
- ❌ No review dates on content
- ❌ No content owner assignment
- ❌ No change history tracking
- ❌ No stale-statistic detection
- ❌ No lastmod updates in sitemap (dynamic but not versioned)

**Gap:** No lifecycle governance.

**Recommendation:** Add `review_date` frontmatter, assign owners to top 50 pages, implement change log.

---

### 7. Internal Linking (50%)

**Requirement:** Topic hierarchy, descriptive anchors, no orphans.

**Current State:**
- ✅ Breadcrumbs component exists
- ⚠️ Learning-centre has category structure
- ❌ No topic hub pages
- ❌ No systematic cross-linking between related content
- ⚠️ Case studies (420 pages) likely orphaned from topic hierarchy

**Gap:** Topic architecture needs hub pages and cross-links.

**Recommendation:** Create `/topics/[topic]` hub pages, link case studies to problems and solutions.

---

### 8. Structured Data (65%)

**Requirement:** Schema matching visible content, validation, stable @id.

**Current State:**
- ✅ Organization schema in layout
- ✅ Website schema in layout
- ✅ Breadcrumb schema
- ⚠️ CaseStudy schema exists on case study pages
- ❌ No Article schema on learning-centre content
- ❌ No TechArticle schema on implementation content
- ❌ No FAQPage schema (and shouldn't add without real FAQs)
- ❌ No Schema validation in CI/CD

**Gap:** Missing Article/TechArticle schema on editorial content.

**Recommendation:** Add Article schema to learning-centre, validation in CI.

---

### 9. Measurement (10%)

**Requirement:** Citation presence, share, fidelity tracking across engines.

**Current State:**
- ❌ No citation tracking
- ❌ No query-level monitoring
- ❌ No ChatGPT referral tracking (`utm_source=chatgpt.com`)
- ❌ No Bing Webmaster Tools AI Performance setup
- ❌ No answer fidelity review

**Gap:** Zero visibility into answer engine citations.

**Recommendation:** Implement PromptLoop or manual spreadsheet, track ChatGPT referrals, set up Bing AI Performance.

---

### 10. Governance (15%)

**Requirement:** AEO product owner, technical SEO owner, domain expert, editorial owner, incident owner.

**Current State:**
- ❌ No AEO owner assigned
- ❌ No citation monitoring process
- ❌ No incident response for misquotation
- ❌ No competitor manipulation monitoring
- ❌ No content approval workflow for claims

**Gap:** Zero governance structure.

**Recommendation:** Assign AEO owner (likely Mike H), create incident playbook.

---

### 11. Content Automation (0%)

**Requirement:** Safe automation with human verification before publication.

**Current State:**
- N/A — No automation currently

**Gap:** Not implemented (may be intentional).

**Recommendation:** When adding automation, implement provenance checks, duplicate detection, claim validation before publication.

---

### 12. Provenance (0%)

**Requirement:** Source provenance register for every material claim.

**Current State:**
- ❌ No claim registry
- ❌ No source tracking
- ❌ No reuse basis documentation

**Gap:** Zero provenance tracking.

**Recommendation:** Create claim registry (started at `/public/claims.json` but not integrated).

---

### 13. Page Acceptance (40%)

**Requirement:** Checklist before publication.

**Current State:**
- ✅ Most pages pass technical checks (200, indexable, canonical)
- ⚠️ Some content checks passed (author, dates)
- ❌ No explicit acceptance checklist in workflow

**Gap:** No formal QC gate.

**Recommendation:** Implement minimum acceptance checklist in PR template.

---

### 14. Maturity Model

**Level 0: Invisible** — Blocked or thin content  
**Level 1: Eligible** — Indexable, basic SEO  
**Level 2: Retrievable** — Topic architecture, entity pages, monitoring  
**Level 3: Citable** — Original evidence, external corroboration, provenance  
**Level 4: Competitive** — Measured citation share, experiments  
**Level 5: Category Authority** — Terminology ownership, sustained citations

**Current:** Level 1.5 (Eligible → approaching Retrievable)

**Gap:** Need query corpus, citation-grade content, external corroboration to reach Level 3.

---

## Priority Actions (39 Identified)

### Critical (5)
1. Build query registry (100 priority questions)
2. Restructure top 20 pages for citation extraction
3. Launch external corroboration program (G2, guest post, podcast)
4. Implement citation measurement (PromptLoop or manual)
5. Create provenance register for claims

### High (12)
6. Segment sitemap by content class
7. Audit Core Web Vitals
8. Create topic hub pages
9. Add Article/TechArticle schema to content
10. Link authors to articles
11. Create `/concepts` definition pages
12. Add comparison tables to comparison pages
13. Implement review dates on content
14. Assign content owners
15. Create editorial standards page
16. Create correction policy page
17. Set up Bing AI Performance

### Medium (22)
18–39. Various implementation details (see roadmap)

---

## Recommended Implementation Sequence

See `AEO_IMPLEMENTATION_ROADMAP.md` for 6-phase plan.

---

## Appendix: Code-to-Content Audit

**Files audited:**
- `app/company/about/page.tsx` — Organization entity ✅
- `app/company/team/page.tsx` — Author entities ✅
- `app/concepts/page.tsx` — Empty structure ⚠️
- `app/ai-sdr-vs-audit/page.tsx` — Comparison page (good, needs table) ⚠️
- `app/cta-optimization/page.tsx` — Question format ✅
- `app/headline-optimization/page.tsx` — Question format ✅
- `app/case-studies/*` — 420 case studies (orphaned) ❌
- `public/robots.txt` — AI crawler policy ✅
- `app/sitemap.ts` — Dynamic sitemap ✅
- `app/lib/schema.ts` — Schema helpers ✅

**Total pages:** 487 static pages built  
**Citation-ready pages:** ~10 (2%)  
**Entity pages:** 2 (about, team)  
**Evidence pages:** 420 case studies (unlinked)

---

**Audit completed:** 2026-07-15  
**Next audit:** Quarterly or on major content changes