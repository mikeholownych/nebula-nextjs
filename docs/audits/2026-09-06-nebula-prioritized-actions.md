# Nebula Components Prioritized Actions

## IMMEDIATE ACTIONS (ACT_NOW)

### 1. Fix Content Delivery/Routing Issue
**Priority:** P0 - Critical
**Issue:** Multiple public pages (/about, /pricing, /learning-centre, /blog, /teardowns, etc.) return identical documentation content instead of page-specific information
**Impact:**
- Severely undermines user trust and transparency
- Prevents access to critical information (pricing, company details, legal policies)
- Destroys SEO performance due to duplicate content across multiple URLs
- Breaks user journey at key decision points
- Affects service credibility as users cannot verify offerings
**Evidence:** Direct observation across multiple page fetches returning identical content
**Action:**
- Investigate routing logic, CMS/templates, or server configuration
- Ensure each URL path returns appropriate, unique content
- Verify fix by fetching each affected page and confirming correct content type
**Validation:**
- Fetch /about, /pricing, /learning-centre, etc. and verify unique content
- Check that homepage remains correctly formatted
- Confirm sitemap.xml returns valid XML (not documentation content)
- Test that internal navigation works correctly

### 2. Fix Sitemap Endpoint
**Priority:** P1 - High
**Issue:** Sitemap endpoint (https://nebulacomponents.com/sitemap.xml) returns documentation content instead of XML sitemap
**Impact:**
- Prevents search engines from properly discovering site content
- Undermines SEO efforts and crawl efficiency
- May signal technical incompetence to search engines
**Evidence:** Direct observation of sitemap returning wrong content type
**Action:**
- Correct sitemap generation and endpoint configuration
- Ensure sitemap.xml returns valid XML with proper URL set
- Include all important public pages in sitemap
**Validation:**
- Fetch sitemap.xml and validate XML structure
- Submit sitemap to Google Search Console and check for processing errors
- Verify URLs in sitemap correspond to actual accessible pages

## MEASURE-REQUIRED ACTIONS

### 3. Implement Structured Data (Schema.org)
**Priority:** P1 - High (but requires baseline measurement first)
**Opportunity:** Enhance search visibility and AI understanding
**Impact:**
- Improve rich result eligibility in SERPs
- Enhance entity clarity for AI systems
- Support better click-through rates from search
**Evidence:** Standard best practice for service websites; API shows structured approach
**Action:**
- Implement Organization schema on homepage and relevant pages
- Add WebApplication schema for the audit service
- Include Service schema for free audit and Repair Sprint offerings
- Consider FAQSchema for question-based content
**Validation:**
- Test with Google's Rich Results Test
- Monitor appearance of rich results in SERPs
- Check impressions and CTR changes in Search Console

### 4. Develop AEO/GEO-Optimized Content
**Priority:** P2 - Measure-Required
**Opportunity:** Improve visibility in answer engines and AI systems
**Impact:**
- Increase likelihood of being cited as source for conversion audit questions
- Improve visibility in AI Overviews and similar features
- Enhance brand authority in the conversion diagnostic space
**Evidence:** Service naturally addresses question-based queries; open-source foundation supports citability
**Action:**
- Identify high-value question queries related to landing page audits
- Create/content optimize content that directly answers these questions
- Ensure definitional content is clear and easily extractable
- Strengthen entity signals across web properties
**Validation:**
- Test question queries in AI systems (ChatGPT, Claude, Perplexity)
- Monitor for citations and brand mentions in AI responses
- Track appearance in AI Overviews where available
- Measure referral traffic from AI platforms

### 5. Enhance Trust Signals Through Verifiable Evidence
**Priority:** P2 - Measure-Required
**Opportunity:** Build stronger trust through third-party validation
**Impact:**
- Increase conversion rates from skeptical buyers
- Improve perceived reliability and authority
- Support enterprise and agency sales efforts
**Evidence:** Current transparency is strong but lacks external validation
**Action:**
- Publish verifiable case studies with before/after metrics
- Seek third-party reviews or certifications
- Consider security audits or SOC reports if handling sensitive data
- Share more detailed methodology validation studies
**Validation:**
- Conversion rate on trust-sensitive pages
- Feedback from sales conversations about trust barriers
- Third-party validation obtained or in progress

## DEFERRED ACTIONS

### 6. Expand Service Beyond Single-Page Fixes
**Priority:** P3 - Deferred (Wrong timing or weak leverage)
**Rationale:** Core value proposition is focused and clear; expansion risks diluting positioning
**Consider for Future:**
- Only after resolving critical content delivery issues
- Only if clear demand exists from target ICP
- Only if expansion enhances rather than confuses core offering
**Potential Future Considerations (to be validated later):**
- Multi-page funnel analysis for advanced customers
- Integration with popular ad platforms for automatic triggering
- Agency/team features for collaborative workflows
- Industry-specific audit playbooks
- Historical trend tracking for same page over time

### 7. Develop Tiered Pricing or Packaging
**Priority:** P3 - Deferred (Wrong timing or weak leverage)
**Rationale:** Current $97 One-Leak Repair Sprint is well-positioned for founder ICP; complexity risks reducing conversion
**Consider for Future:**
- Only after validating strong demand for more comprehensive services
- Only if tiering enhances rather than confuses value proposition
- Only if clear segmentation exists in target market
**Potential Future Considerations (to be validated later):**
- Diagnostic-only tier (audit without fix)
- Comprehensive audit tier (more signals or deeper analysis)
- Ongoing monitoring subscription
- Agency/white-label licensing

## OBSERVE ONLY

### 8. Monitor Core Web Vitals and Performance
**Priority:** P3 - Observe
**Rationale:** Important but secondary to fixing core content accessibility issues
**Action:**
- Continue monitoring LCP, INP, CLS via available tooling
- Address only if thresholds are consistently failed
- Prioritize after content delivery and SEO fundamentals are fixed

### 9. Expand Social Media and Content Distribution
**Priority:** P3 - Observe
**Rationale:** Valuable but ineffective if users cannot access content when they arrive
**Action:**
- Maintain baseline presence on relevant platforms
- Increase investment only after site content is reliably accessible
- Focus on driving traffic to fixable, conversion-optimized pages

## COMPETITIVE RESPONSE FRAMEWORK

**For Competitor Capabilities:**
- **ADOPT:** Only if enhances core evidence-based, transparent positioning
- **ADAPT:** Only if solves verified customer need in target ICP
- **WATCH:** Most competitor features (observe for validated demand)
- **IGNORE:** Features that encourage black-box promises or vague guarantees
- **DELIBERATELY_REJECT:**
  - Conversion lift or revenue guarantees
  - Fake testimonials or social proof
  - Overly complex reports lacking actionable priority
  - Claims beyond observable HTML/CSS/JS evidence
  - Lack of transparent service boundaries

## VALIDATION METRICS FOR ALL ACTIONS

**Before implementing any action, define:**
- Specific observation that validates the problem
- Expected mechanism of improvement
- Primary metric to measure success
- Validation method and timeline
- Potential downside or failure mode to monitor

**After implementation, verify:**
- Problem observation is resolved
- Expected improvement metric shows positive change
- No unintended negative consequences observed
- Cost/complexity justified by measured improvement