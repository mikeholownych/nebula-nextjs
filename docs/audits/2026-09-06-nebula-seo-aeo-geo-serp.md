# Nebula Components SEO, AEO, GEO, and SERP Analysis

## Technical SEO Audit

### Crawlability
**Observed:**
- robots.txt exists at https://nebulacomponents.com/robots.txt
- Explicitly allows AI answer/search crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
- Blocks AI training crawlers (Google-Extended, CCBot, Bytespider, etc.)
- Standard crawlers (*) allowed but with specific disallows:
  - Disallow: /api/
  - Disallow: /audit/*/results
  - Disallow: /workspace/
  - Disallow: /checkout/
  - Disallow: /audit/*/processing
  - Disallow: /dashboard/
  - Disallow: /lead-dashboard/
  - Disallow: /audit-dashboard/
- Sitemap specified: https://nebulacomponents.com/sitemap.xml
- NebulaSEOBot (first-party diagnostic crawler) explicitly allowed

**Issues Observed:**
- When attempting to fetch the sitemap, received documentation content instead of XML sitemap
- This suggests either:
  1. The sitemap endpoint is misconfigured and returning wrong content
  2. There's a broader content delivery issue affecting XML endpoints
  3. The sitemap doesn't actually exist at the specified location

### Indexability
**INDETERMINATE** - Due to content delivery issues preventing access to actual page content for most URLs, proper indexability assessment cannot be completed.

**Based on Available Evidence:**
- Homepage appears to be serving correct content
- Robots.txt shows proper crawling permissions for search engines
- No obvious noindex directives observed in robots.txt
- Cannot verify meta robots tags, X-Robots-Tag, or canonical tags on individual pages due to content delivery issue

### Metadata
**INDETERMINATE** - Due to content delivery issues preventing access to actual page content for most URLs, proper metadata assessment cannot be completed.

**Homepage Analysis (from initial fetch):**
- Title: "Landing Page Audit for Paid Traffic Not Converting | Nebula"
- Appears to have proper OpenGraph metadata (based on sharing cards visible in homepage)
- Cannot verify meta description, header structure, or schema markup due to content delivery issue affecting most pages

## SERP Analysis

**INDETERMINATE** - Due to content delivery issues preventing access to blog/learning centre content and lack of external SERP research tools in this environment, proper SERP analysis cannot be completed.

**Likely Target Keywords Based on Service Description:**
- landing page audit
- landing page analyzer
- landing page teardown
- conversion audit
- CRO audit
- landing page conversion audit
- landing page optimization
- landing page checker
- landing page grader
- website conversion audit
- paid traffic landing page audit
- Google Ads landing page audit
- landing page UX audit
- landing page SEO audit
- AI landing page audit
- website AI readiness
- AI visibility audit
- AEO audit
- GEO audit
- generative engine optimization
- AI search optimization
- website audit tool
- conversion rate optimization tool

**Expected SERP Features:**
Based on service nature, likely to see:
- Featured snippets for "what is a landing page audit" type queries
- People Also Ask (PAA) boxes related to conversion diagnostics
- Potential for local results if targeting geographic modifiers
- Video results possibly from tutorial content
- Image results possibly from infographics or diagnostic visuals

## AEO — Answer Engine Optimization

**Assessment Based on Available Evidence:**

**Strengths for AEO:**
1. **Clear Question-Answer Format:** Service directly addresses questions like "Why is my landing page not converting?"
2. **Definitional Content:** Clear documentation of what a landing page audit is
3. **Specific, Observable Criteria:** 9 well-defined signals with pass/fail criteria
4. **Evidence-Based Approach:** Findings tied to actual page evidence, not opinion
5. **Structured Data Potential:** API documentation shows structured approach to audit data
6. **Open Source Verification:** Citable provides verifiable foundation for claims

**Areas Needing Verification (INDETERMINATE):**
- Whether FAQPage schema is implemented on relevant pages
- Whether content uses question-format headings that match natural language queries
- Whether definitional content is easily extractable by answer engines
- Whether entity clarity is sufficient for answer engine understanding
- Whether citation-worthy content exists (methodology docs, benchmark stats, etc.)

**Likely AEO-Target Questions:**
- What is a landing page audit?
- How do I know why my landing page is not converting?
- How do I audit a landing page?
- What should I check above the fold?
- What makes a landing page convert?
- How do I audit a Google Ads landing page?
- What should a landing page audit include?
- What is AI readiness for a landing page?
- What is the difference between SEO audit and conversion audit?
- What is the best landing page audit tool?

## GEO — Generative Engine Optimization

**Assessment Based on Available Evidence:**

**Entity Clarity Strengths:**
1. **Clear Service Definition:** Explicitly states what Nebula Components is and is not (not a UI component library)
2. **Well-Defined ICP:** Founders spending on Google/Meta/LinkedIn ads with low conversions
3. **Specific Value Proposition:** Landing page conversion diagnostics for paid traffic
4. **Transparent Methodology:** Clear 9-signal framework with evidence requirements
5. **Open Source Verification:** Citable component allows independent verification
6. **Live Dataset Transparency:** Publishes real audit statistics
7. **Clear Boundaries:** Explicitly states what audit cannot prove (no conversion guarantees)

**Retrieval Quality Indicators:**
1. **Machine-Readable API:** OpenAPI spec shows structured data approach
2. **Agent-First Design:** Model Context Protocol tools for AI integration
3. **Structured Findings:** Audit results returned in structured JSON format
4. **Documented Specifications:** Diagnostic specification v1 available
5. **Component Lab:** Interactive tool for testing specific signals
6. **Benchmarks Page:** Published performance statistics (when accessible)

**Citation-Worthiness Indicators:**
1. **Open Source Core:** Citable provides verifiable evidence layer
2. **Documented Methodology:** Clear pass/fail criteria for each signal
3. **Live Statistics:** Real-world audit data from 293+ audits
4. **Transparent Limitations:** Clear statement of what cannot be proven
5. **Defined Signals:** 9 specific, observable conversion signals
6. **Repair Verification:** 30-day re-audit to validate fixes

**Areas Needing Verification (INDETERMINATE):**
- Whether structured data (Schema.org) is implemented on public pages
- Whether llms.txt file exists and contains appropriate context (referenced in robots.txt)
- Whether entity consistency exists across web properties and directories
- Whether authoritative third-party sources reference Nebula's methodology
- Whether public research or reproducible experiments exist beyond live stats
- Whether glossary/definitions of conversion terms exist and are accessible

**Generative Query Testing (INDETERMINATE due to access limitations):**
- "What are the best tools for auditing landing pages?"
- "What tools can tell me why a landing page is not converting?"
- "What is Nebula Components?"
- "Compare Nebula Components to [competitor]."
- "What tools audit landing pages for paid traffic?"
- "What tools evaluate AI readiness of landing pages?"

## Recommendations

**IMMEDIATE (P0/P1):**
1. Fix content delivery/routing issue preventing access to page-specific content
2. Verify and fix sitemap.xml endpoint to return valid XML
3. Ensure all public pages return appropriate, unique content
4. Implement proper meta tags (title, description) on all pages
5. Add structured data (Schema.org) for Organization, Service, and WebApplication where appropriate
6. Create/verify llms.txt file with appropriate context for LLMs

**MEASURE/INVESTIGATE (P2):**
1. Conduct keyword research to understand actual search demand for service terms
2. Analyze SERP performance for key conversion audit queries
3. Develop AEO-optimized content targeting question-format searches
4. Create GEO-focused content that enhances entity clarity and citation-worthiness
5. Implement hreflang if serving multiple languages/regions
6. Develop content strategy addressing top-of-funnel educational needs

**OBSERVE/[←] (P3):**
1. Monitor rich result appearance in SERPs
2. Track brand mentions and entity recognition in AI systems
3. Measure click-through rates from SERPs and adjust meta tags accordingly
4. Monitor Core Web Vitals and user experience signals