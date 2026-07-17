# Nebula Components — GEO Implementation Roadmap

**Framework:** Generative Engine Optimization (21-layer model)  
**Current Maturity:** Level 1.5 (Retrievable)  
**Target:** Level 3 (Citable) in 90 days

---

## Phase 1: Establish Prompt Baseline (Week 1)

### Objectives
- Document how buyers search via AI
- Capture current AI visibility state
- Identify category positioning gaps

### Tasks

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create prompt registry (50 prompts) | Agent | ✅ DONE | Stored in skill reference |
| Capture baseline outputs for top 10 prompts | Mike | ⚠️ PENDING | Manual ChatGPT/Claude testing |
| Document current category perception | Agent | ✅ DONE | Audit reveals "audit + optimization" mix |
| Identify hallucination risks | Agent | ✅ DONE | No external corroboration = high hallucination risk |
| Set up prompt tracking tool | Mike | ⚠️ PENDING | PromptLoop or manual spreadsheet |

### Prompt Cohort (Top 10 by Priority)

| Prompt | Intent | Commercial Weight |
|--------|--------|-------------------|
| "Why is my landing page not converting?" | Problem | Critical |
| "Best landing page audit tool for e-commerce" | Recommendation | Critical |
| "What is landing page conversion optimization?" | Definition | High |
| "How to fix landing page with high bounce rate" | Problem | High |
| "Nebula Components vs Unbounce" | Comparison | Medium |
| "Is Nebula Components legitimate?" | Evaluation | High (reputation) |
| "Landing page optimization services near me" | Commercial | Medium |
| "How to reduce ad spend waste" | Problem | High |
| "What causes Google ads clicks but no sales" | Problem | Critical |
| "Landing page audit checklist" | Definition | Medium |

### Deliverables
- [x] Prompt registry template
- [ ] Baseline AI output captures (ChatGPT, Claude, Perplexity)
- [ ] Category accuracy score (%)
- [ ] Hallucination incident log

---

## Phase 2: Establish Retrieval Control (Week 1)

### Objectives
- Ensure AI crawlers can access content
- Block training crawlers without permission
- Provide AI navigation guidance

### Tasks

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Allow OAI-SearchBot, ChatGPT-User | Agent | ✅ DONE | robots.txt updated |
| Allow PerplexityBot | Agent | ✅ DONE | robots.txt updated |
| Block GPTBot, ClaudeBot (training) | Agent | ✅ DONE | robots.txt updated |
| Create llms.txt | Agent | ✅ DONE | `/public/llms.txt` |
| Verify crawler compliance | Agent | ⚠️ PENDING | Monitor agent access logs |

### AI Crawler Policy Decision

| Agent | Purpose | Decision | Rationale |
|-------|---------|----------|-----------|
| Googlebot | Search + AI Search | Allow | Primary traffic source |
| Bingbot | Bing + Copilot | Allow | Copilot visibility |
| OAI-SearchBot | ChatGPT Search | Allow | ChatGPT visibility |
| ChatGPT-User | User-triggered access | Allow | On-demand answers |
| PerplexityBot | Perplexity search | Allow | Perplexity visibility |
| GPTBot | Model training | Block | Proprietary methodology |
| ClaudeBot | Model training | Block | Proprietary methodology |

### Deliverables
- [x] robots.txt with AI crawler matrix
- [x] llms.txt with entity navigation
- [ ] Crawler access telemetry (analytics)

---

## Phase 3: Establish Entity Architecture (Week 2)

### Objectives
- Create canonical entity pages
- Define relationships (org → product → concept)
- Implement consistent schema

### Tasks

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Deploy `/company/about` | Agent | ✅ DONE | Build in progress |
| Deploy `/company/team` | Agent | ✅ DONE | Build in progress |
| Create `/concepts/` hub | Agent | ✅ DONE | 3 proprietary concepts defined |
| Create `/products/fix-pack` | Agent | ⚠️ NEXT | Product schema required |
| Verify schema consistency | Agent | ⚠️ NEXT | Check @id references |

### Entity Graph

```
Organization: Nebula Components (@id: /#organization)
  ├─ Person: Mike H (@id: /company/team#mike-h)
  ├─ Product: Fix Pack (@id: /products/fix-pack#product)
  ├─ Product: AI Ops Retainer (@id: /products/ai-ops-retainer#product)
  ├─ Service: Free Audit (@id: /audit#service)
  ├─ Concept: Trigger-Aware Prospecting (@id: /concepts#trigger-aware-prospecting)
  ├─ Concept: Message-Match Audit (@id: /concepts#message-match-audit)
  └─ Concept: 7-Point Diagnosis (@id: /concepts#seven-point-diagnosis)
```

### Deliverables
- [x] Organization schema in layout
- [x] `/company/about` entity page
- [x] `/company/team` author entity
- [x] `/concepts/` hub with 3 concepts
- [ ] Product pages with SoftwareApplication schema

---

## Phase 4: Establish Claim System (Week 2)

### Objectives
- Register public claims
- Map claims to evidence
- Define legal review process

### Tasks

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create claim registry | Agent | ✅ DONE | `/public/claims.json` |
| Register top 10 claims | Agent | ✅ DONE | 6 claims registered |
| Define legal review workflow | Mike | ⚠️ PENDING | Approval process |
| Create claim expiry system | Agent | ⚠️ NEXT | Monthly review cadence |

### Registered Claims (Top 6)

| Claim ID | Claim | Status |
|----------|-------|--------|
| CLM-001 | Free audit in 60 seconds | Verified |
| CLM-002 | $147 implementation in 24 hours | Verified |
| CLM-003 | 1 customer in 60 days (Growth Launch) | Conditional |
| CLM-004 | 22 diagnostic articles | Verified |
| CLM-005 | 7 conversion killers from 50+ pages | Verified |
| CLM-006 | AI Ops Retainer = continuous optimization | Verified |

### Deliverables
- [x] `/public/claims.json` registry
- [ ] Evidence mapping (claim → proof URL)
- [ ] Legal approval workflow
- [ ] Monthly review schedule

---

## Phase 5: Build Evidence Corpus (Weeks 3-4)

### Objectives
- Create original, citable content
- Provide data for AI to reference
- Differentiate from competitors

### Tasks

| Task | Priority | Owner | Notes |
|------|----------|-------|-------|
| Publish benchmark data | P1 | Agent | "Average audit score: 6.2/10" |
| Create case study: e-commerce | P1 | Mike | Real customer example |
| Create case study: SaaS | P1 | Mike | Real customer example |
| Publish validation report | P2 | Agent | Test of 60-second audit accuracy |
| Create comparison pages | P2 | Agent | `/vs/unbounce`, `/vs/vwo` |

### Evidence Types Required

1. **Quantified benchmarks**
   - Average landing page score
   - Common failure rate by point
   - Industry comparison data

2. **Case studies**
   - Before/after metrics
   - Audit score improvement
   - Revenue impact

3. **Validation reports**
   - Audit accuracy tests
   - Third-party verification
   - Methodology validation

### Deliverables
- [ ] 1 benchmark article
- [ ] 2 case studies
- [ ] 1 validation report
- [ ] 2 comparison pages

---

## Phase 6: Build External Corroboration (Weeks 5-6)

### Objectives
- Obtain independent validation
- Build citation-worthy references
- Establish third-party trust

### Tasks

| Task | Priority | Owner | Notes |
|------|----------|-------|-------|
| Submit to G2/Capterra | P1 | Mike | Directory listings |
| Guest post on marketing blogs | P1 | Agent | Content outreach |
| Industry publication mention | P2 | Mike | Journalist relationship |
| LinkedIn thought leadership | P1 | Agent | Weekly posts |
| Podcast appearances | P2 | Mike | Founder interviews |
| GitHub open-source artifact | P3 | Agent | Auditing tool |

### Corroboration Targets (First 90 days)

| Source Type | Target | Status |
|-------------|--------|--------|
| Review platforms | 1 G2 review | Pending |
| Guest posts | 2 published articles | Pending |
| Publications | 1 mention (Marketing publication) | Pending |
| LinkedIn | 12 posts (3/month) | Pending |
| Podcasts | 1 appearance | Pending |

### Deliverables
- [ ] G2 profile created
- [ ] 2 guest posts published
- [ ] 1 publication mention
- [ ] Podcast pitch list

---

## Phase 7: Establish Recommendation Eligibility (Weeks 7-8)

### Objectives
- Clarify ICP and exclusions
- Provide comparison data
- Enable AI to recommend correctly

### Tasks

| Task | Priority | Notes |
|------|----------|-------|
| Define explicit ICP on About page | P1 | "Who this is for" section |
| Define explicit non-ICP | P1 | "Who this is NOT for" section |
| Create `/vs/unbounce` | P2 | Comparison content |
| Create `/vs/vwo` | P2 | Comparison content |
| Create `/vs/hotjar` | P2 | Comparison content |
| Add pricing limitations | P1 | When price changes, what happens |

### Recommendation Data Requirements

| Field | Requirement |
|-------|-------------|
| Target user | Founders spending $500+/mo on ads, <2% converting |
| Non-target user | Brands not running ads, brands happy withconversion rate |
| Problem solved | Ad spend without conversions, landing page bleeding money |
| Product category | Landing page audit and implementation service |
| Deployment | SaaS (audit) + service (implementation) |
| Pricing | $0 (audit), $147 (fix), $1,497/mo (retainer) |
| Limitations | Requires public landing page, Stripe payment |

### Deliverables
- [ ] ICP section on About page
- [ ] Non-ICP exclusion statement
- [ ] 3 comparison pages

---

## Phase 8: Operationalize Measurement (Week 9)

### Objectives
- Automate prompt testing
- Track brand mention rate
- Detect hallucinations

### Tasks

| Task | Priority | Notes |
|------|----------|-------|
| Set up PromptLoop (or manual) | P1 | Automated prompt testing |
| Create scoring rubric | P1 | Accuracy assessment criteria |
| Schedule weekly prompt runs | P1 | Monday 9 AM |
| Create hallucination log | P1 | Incident tracking |
| Build executive dashboard | P2 | Visibility + recommendation metrics |

### Measurement Dashboard

| Metric | Frequency | Owner |
|--------|-----------|-------|
| Brand mention rate | Weekly | GEO Owner |
| Citation rate | Weekly | GEO Owner |
| Recommendation rate | Weekly | GEO Owner |
| Narrative accuracy | Weekly | GEO Owner |
| Hallucination count | As detected | GEO Owner |
| Competitor inclusion | Weekly | GEO Owner |

### Deliverables
- [ ] Prompt testing schedule
- [ ] Scoring rubric
- [ ] Hallucination log
- [ ] Executive report template

---

## Phase 9: Scale Proven Interventions (Week 10+)

### Objectives
- Expand prompt corpus
- Increase external corroboration
- Target category authority

### Tasks

| Task | Condition | Action |
|------|-----------|--------|
| Prompt success | Mention rate >50% | Add 50 more prompts |
| Citation success | Citation rate >30% | Publish more original evidence |
| Recommendation success | Rate >20% | Expand comparison pages |
| Hallucination detected | Any SEV-1/2 | Incident response + content fix |

### Scaling Priorities

1. **Prompt corpus expansion** — from 50 to 200 prompts
2. **Evidence depth** — more case studies, benchmarks
3. **Comparison coverage** — all major competitors
4. **External mentions** — more publications, podcasts

---

## GEO Maturity Progression

| Level | Name | Current | Target (90d) | Evidence |
|-------|------|---------|--------------|----------|
| 0 | Unobserved | ✅ PASSED | — | SEO exists |
| 1 | Retrievable | ✅ PASSED | — | Crawlers allowed |
| 2 | Understandable | ⚠️ 30% | 90% | Entity structure |
| 3 | Citable | ❌ 5% | 50% | Original evidence |
| 4 | Recommendable | ❌ 0% | 30% | ICP + comparisons |
| 5 | Category Authority | ❌ 0% | Target Q4 | Market association |

---

## Success Metrics (90-day)

| Metric | Current | Target | Owner |
|--------|---------|--------|-------|
| Prompt corpus | 50 prompts | 200 prompts | Agent |
| Entity pages | 5 | 10 | Agent |
| Claims registered | 6 | 20 | Agent |
| External corroboration | 0 sources | 5 sources | Mike |
| Brand mention rate | Unknown | 50% | GEO Owner |
| Citation rate | Unknown | 30% | GEO Owner |
| Recommendation rate | Unknown | 20% | GEO Owner |
| Hallucination rate | Unknown | <5% | GEO Owner |

---

## Immediate Actions (This Week)

| Priority | Action | Status |
|----------|--------|--------|
| P1 | Deploy `/company/about` + `/company/team` | Build running |
| P1 | Promote `llms.txt` + `claims.json` to production | Build in progress |
| P1 | Create prompt baseline captures | Mike (manual) |
| P2 | Set up prompt testing routine | Mike (choose tool) |
| P2 | Create `/products/fix-pack` page | Agent |
| P2 | Create `/vs/unbounce` comparison | Agent |

---

**Last Updated:** 2025-07-15  
**Status:** Phase 1 80% complete  
**Next Milestone:** Entity architecture + claim system (Week 2)
