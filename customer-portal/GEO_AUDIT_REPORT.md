# Nebula Components — GEO Audit Report

**Date:** 2025-07-15  
**Framework:** Generative Engine Optimization (21-layer model)  
**Current Maturity:** Level 1 (Retrievable → Entity Resolution in progress)

---

## Executive Summary

**Overall Score:** 35/100 — **Level 1.5** (Retrievable + some Entity work)

**Critical Gaps:**
1. No prompt corpus — zero tracking of generative queries
2. No claim registry — unmanaged public claims
3. Zero external corroboration — no third-party validation
4. Missing AI crawler policies — robots.txt treats all bots identically
5. No llms.txt — AI-specific navigation not implemented
6. Zero GEO measurement — no cross-engine monitoring

**Immediate Risks:**
- Generative engines may hallucinate about Nebula's offerings
- No control over category positioning in AI responses
- Zero visibility into whether AI systems cite Nebula correctly

---

## Layer-by-Layer Assessment

### 1. Prompt & Demand Intelligence — **0%**

| Requirement | Status | Gap |
|-------------|--------|-----|
| Prompt corpus | ❌ MISSING | Zero prompts tracked |
| Intent classification | ❌ MISSING | No buyer journey mapping |
| Prompt variants | ❌ MISSING | No variant testing |
| Commercial weight | ❌ MISSING | No business value assigned |

**Required prompts Nebula should track:**

| Prompt Type | Example Prompt | Priority |
|-------------|----------------|----------|
| Definition | "What is landing page conversion optimization?" | High |
| Problem | "Why is my landing page not converting?" | Critical |
| Category | "What are landing page audit tools?" | High |
| Comparison | "Nebula Components vs Unbounce" | Medium |
| Recommendation | "Best landing page audit tools for e-commerce" | Critical |
| Evaluation | "Is Nebula Components legitimate?" | High |
| Objection | "Why not use Google Optimize instead?" | Medium |
| Adversarial | "Nebula Components scam" | High (reputation) |

**Action:** Create prompt registry with 50+ tracked prompts across 8 classes.

---

### 2. Retrieval Eligibility — **85%** ✅

| Requirement | Status | Notes |
|-------------|--------|-------|
| Public URLs | ✅ PASS | All pages publicly accessible |
| HTTP 200 | ✅ PASS | Verified with curl |
| Valid TLS | ✅ PASS | HTTPS enforced |
| Indexable HTML | ✅ PASS | Server-rendered |
| Correct canonical | ⚠️ PARTIAL | Some pages missing canonical |
| No accidental noindex | ✅ PASS | Verified |
| Snippet eligibility | ✅ PASS | robots meta allows index/follow |
| Sitemap inclusion | ✅ PASS | `/app/sitemap.ts` created |

**Gaps:**
- `/company/about` and `/company/team` need deployment (built, not live yet)
- Case studies (450+) may cause index bloat → need curation

---

### 3. Entity Resolution — **30%** ⚠️

| Entity Type | Status | Gap |
|--------------|--------|-----|
| Organization schema | ✅ DONE | `Organization` + `WebSite` in layout |
| Product entities | ❌ MISSING | No `SoftwareApplication` or `Service` schema |
| Person entities | ⚠️ CREATED | `/company/team` page created, not deployed |
| Concept entities | ❌ MISSING | No proprietary concept documentation |
| Category definition | ❌ MISSING | "landing page optimization" not defined |
| Founder bio | ⚠️ CREATED | `/company/about` created, not deployed |

**Critical Entity Gaps:**

1. **"Nebula Components" is not defined as an entity:**
   - No canonical category in schema
   - No product family relationship
   - No explicit "what this is" definition page

2. **Proprietary concepts undefined:**
   - "Trigger-aware prospecting" (ICP methodology)
   - "Message-match audit" (audit framework)
   - "7-Point Landing Page Diagnosis" (diagnostic method)

3. **Cross-platform inconsistency risk:**
   - LinkedIn says: "Landing page conversion optimization"
   - Website says: "Free landing page audit"
   - Need: Canonical entity declarations

**Action:** Create `/concepts/` section with 3-5 proprietary concept definitions.

---

### 4. Claim & Knowledge Architecture — **0%**

| Requirement | Status | Notes |
|-------------|--------|-------|
| Claim registry | ❌ MISSING | No tracking of public claims |
| Claim ID system | ❌ MISSING | No version control |
| Evidence mapping | ❌ MISSING | Claims unconnected to proof |
| Legal review | ❌ MISSING | No claim approval process |
| Expiry system | ❌ MISSING | No freshness monitoring |

**Sample Claims Nebula Should Register:**

| Claim ID | Claim | Evidence | Status |
|----------|-------|----------|--------|
| CLM-001 | "Free audit in 60 seconds" | Audit tool demo | ✅ Verifiable |
| CLM-002 | "Find the leak, fix it for $147" | Stripe pricing | ⚠️ Needs fix details |
| CLM-003 | "24-hour turnaround" | Service process doc | ❌ Missing evidence |
| CLM-004 | "1 paying customer in 60 days" | Growth Launch guarantee | ⚠️ Needs case studies |

**Action:** Create `/public/claims.json` registry.

---

### 5. Generative-Ready Content — **45%** ⚠️

| Requirement | Status | Notes |
|-------------|--------|-------|
| Direct definitions | ⚠️ PARTIAL | Some pages fluffy, others clear |
| Atomic claims | ⚠️ PARTIAL | Learning centre articles good |
| Evidence adjacency | ❌ MISSING | Claims without supporting proof |
| Explicit relationships | ❌ MISSING | Product → Org not explicit |
| Controlled terminology | ⚠️ PARTIAL | Multiple terms for same concept |
| Falsifiability | ❌ MISSING | Claims not testable |
| Original information gain | ✅ GOOD | Proprietary diagnostic method |

**Content Quality Issues:**

1. **Homepage uses marketing fluff:**
   ```
   ❌ "Your landing page is bleeding money"
   ✅ Should be: "Landing pages with <2% conversion waste 80% of ad spend on non-converting visitors."
   ```

2. **Pricing page lacks comparison:**
   - No explicit "who this is for"
   - No "who this is NOT for"
   - No competitor comparison table

3. **Learning centre lacks evidence:**
   - Articles give advice without proof
   - No case study links
   - No data citations

**Action:** Restructure top 10 pages with generative-ready format.

---

### 6. External Corroboration — **5%** ❌

| Source Type | Status | Gap |
|--------------|--------|-----|
| Industry publications | ❌ NONE | No media coverage |
| Independent reviews | ❌ NONE | No G2/Capterra presence |
| Customer testimonials | ⚠️ WEAK | Landing page mentions "testimonials needed" |
| Partner directories | ❌ NONE | No integration partners |
| GitHub presence | ❌ NONE | No open-source artifacts |
| Conference talks | ❌ NONE | No speaking engagements |
| Podcast mentions | ❌ NONE | No podcast appearances |

**Critical Gap:** Zero third-party validation means generative engines have zero external signals to corroborate Nebula's claims.

**Action:** Begin aggressive corroboration campaign (case studies, testimonials, guest content).

---

### 7. Recommendation Eligibility — **20%** ⚠️

| Requirement | Status | Notes |
|-------------|--------|-------|
| Target customer | ⚠️ IMPLIED | ICP defined in strategy, not on site |
| Non-target customer | ❌ MISSING | No exclusions stated |
| Problem solved | ✅ CLEAR | "Landing page not converting" |
| Product category | ⚠️ FUZZY | "Audit" + "optimization" mixed |
| Deployment model | ✅ CLEAR | SaaS (audit) + service (implementation) |
| Pricing | ✅ CLEAR | Public pricing |
| Evidence | ❌ MISSING | No case studies |
| Limitations | ❌ MISSING | No "when this doesn't work" |
| Differentiation | ❌ MISSING | No competitor comparison |

**AI Cannot Recommend What It Cannot Classify:**

```
Question: "What's the best landing page audit tool for a DTC brand?"

AI Engine Sees:
- Nebula: "audit" + "optimization" + "free" + "landing page"
- Unbounce: "landing page builder" + "optimization"
- Hotjar: "analytics" + "heatmaps"
- VWO: "A/B testing" + "optimization"

AI Classification: Nebula is a "landing page audit service" (correct)
                  OR "marketing optimization tool" (incorrect)

Risk: AI may not recommend Nebula because category is ambiguous
```

**Action:** Create `/vs/[competitor]` pages + explicit category declaration.

---

### 8. Narrative & Reputation Control — **5%** ❌

| Requirement | Status | Gap |
|-------------|--------|-----|
| Narrative baseline | ❌ MISSING | No approved answers document |
| Contradiction monitoring | ❌ MISSING | No AI output tracking |
| Correction process | ❌ MISSING | No incident runbook |
| Sentiment tracking | ❌ MISSING | No brand mention monitoring |

**Risk:** If ChatGPT says "Nebula Components is a marketing agency" (wrong category), there's no detection or correction mechanism.

**Action:** Set up PromptLoop or manual weekly GEO monitoring.

---

### 9. Cross-Engine Measurement — **0%**

| Metric | Status | Tool |
|--------|--------|------|
| Brand mention rate | ❌ NOT TRACKED | Needs PromptLoop/Brandwatch |
| Citation rate | ❌ NOT TRACKED | Needs manual testing |
| Recommendation rate | ❌ NOT TRACKED | Needs prompt cohort |
| Narrative accuracy | ❌ NOT TRACKED | Needs scoring rubric |

**Required:** Weekly automated testing across ChatGPT, Claude, Perplexity, Gemini, Copilot.

---

### 10. Governance & Lifecycle — **0%**

| Requirement | Status | Gap |
|-------------|--------|-----|
| GEO owner | ❌ UNDEFINED | No accountable person |
| Claim owner | ❌ UNDEFINED | No approval process |
| Entity owner | ❌ UNDEFINED | No steward |
| Incident process | ❌ UNDEFINED | No SEV-1/2/3 classification |

---

## Maturity Model Progress

| Level | Name | Status | Evidence |
|-------|------|--------|----------|
| 0 | Unobserved | ✅ PASSED | Basic SEO exists |
| 1 | Retrievable | ✅ PASSED | Pages indexed, schema started |
| 2 | Understandable | ⚠️ 30% | Entity structure started, needs completion |
| 3 | Citable | ❌ FAILED | No original evidence, no corroboration |
| 4 | Recommendable | ❌ FAILED | No ICP clarity, no comparisons |
| 5 | Category Authority | ❌ FAILED | Zero market association |

**Current Level:** 1.5 (Retrievable + entity work in progress)

---

## Immediate Actions (Week 1)

| Priority | Action | Owner | Est. Time |
|----------|--------|-------|-----------|
| P1 | Deploy `/company/about` + `/company/team` pages | Agent | Build running |
| P1 | Create `llms.txt` for AI crawler guidance | Agent | 15 min |
| P1 | Define 3 proprietary concepts in `/concepts/` | Agent | 30 min |
| P2 | Create prompt registry (50 prompts) | Agent | 1 hour |
| P2 | Build claim registry skeleton | Agent | 30 min |
| P3 | Set up weekly GEO monitoring | Mike | Select tool |

---

## Success Metrics (90-day target)

| Metric | Current | Target |
|--------|---------|--------|
| Entity resolution | 30% | 90% |
| Claim registration | 0% | 50% |
| External corroboration | 5% | 30% |
| Prompt corpus size | 0 | 200 |
| Cross-engine visibility | Unknown | 50% brand mention rate |
| Category accuracy | Unknown | 90% correct classification |

---

**Last Updated:** 2025-07-15  
**Next Review:** 2025-07-22
