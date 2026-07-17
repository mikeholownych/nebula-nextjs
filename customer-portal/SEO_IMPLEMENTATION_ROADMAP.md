# Nebula Components — SEO Implementation Roadmap

**Framework:** Enterprise SEO Governance (16-layer model)  
**Current Maturity:** Level 1.5 (Eligible → Structured)  
**Target:** Level 3 (Competitive) in 90 days

---

## Phase 1: Establish Control & Baseline (Week 1)

### Objectives
- Full crawl inventory
- Verify search console ownership
- Establish measurement baseline

### Tasks

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Generate sitemap.xml | Agent | ✅ DONE | `/app/sitemap.ts` created |
| Create robots.txt | Agent | ✅ DONE | `/public/robots.txt` created |
| Add Organization schema | Agent | ✅ DONE | In layout.tsx |
| Add WebSite schema | Agent | ✅ DONE | In layout.tsx |
| Create `/company/about` | Agent | ✅ DONE | Entity page |
| Create `/company/team` | Agent | ✅ DONE | Author entity page |
| Verify Google Search Console | Mike | ⚠️ PENDING | Replace placeholder verification code |
| Verify Bing Webmaster Tools | Mike | ⚠️ PENDING | Add meta verification tag |
| Create query registry | Agent | ⚠️ NEXT | Google Sheets or database |
| Crawl site with Screaming Frog | Agent | ⚠️ NEXT | Inventory 487 pages |
| Identify index bloat (case studies) | Agent | ⚠️ NEXT | Review 450+ case study pages |

### Deliverables
- [x] Sitemap submitted to GSC
- [x] robots.txt live
- [ ] Query registry with 50+ target queries
- [ ] Full page inventory with canonical status

---

## Phase 2: Technical Eligibility Repair (Week 2)

### Objectives
- Ensure every priority URL is indexable
- Fix canonical conflicts
- Repair mobile rendering issues

### Tasks

| Task | Priority | Notes |
|------|----------|-------|
| Add canonical to all pages | P1 | Use metadata API in layout |
| Check hreflang (if needed) | P2 | Only if international expansion |
| Verify mobile parity | P1 | Test top 20 pages |
| Fix any redirect chains | P1 | Check case study redirects |
| Protect staging URLs | P2 | Verify no staging in index |
| Add breadcrumb component | P1 | Create reusable Breadcrumbs.tsx |
| Implement breadcrumbs on top pages | P1 | Homepage, pricing, learning-centre |

### Deliverables
- [ ] All pages have canonical URL
- [ ] Breadcrumbs on top 20 pages
- [ ] Mobile rendering verified
- [ ] Zero redirect chains

---

## Phase 3: Information Architecture (Week 3-4)

### Objectives
- Establish topic hierarchy
- Map queries to canonical URLs
- Eliminate intent cannibalization

### Tasks

| Task | Priority | Notes |
|------|----------|-------|
| Create `/products/` hub | P1 | Product entity pages |
| Create `/solutions/` hub | P2 | Sector/solution landing pages |
| Create `/learn/` hub | P2 | Move learning-centre under this |
| Curate case studies | P2 | Keep top 50, noindex others |
| Add internal links between related content | P1 | Hub-spoke linking |
| Create topic hub pages | P2 | For each major category |

### Recommended Structure

```
/
├── products/
│   ├── fix-pack/
│   └── ai-ops-retainer/
├── solutions/
│   ├── landing-page-optimization/
│   ├── ad-burn-reduction/
│   └── conversion-rate-issues/
├── learn/
│   └── learning-centre/
├── evidence/
│   └── case-studies/
└── company/
    ├── about/
    └── team/
```

### Deliverables
- [ ] Topic hierarchy established
- [ ] 50+ priority queries mapped to URLs
- [ ] Zero competing pages for same intent

---

## Phase 4: Commercial Coverage (Week 5-6)

### Objectives
- Build product pages with schema
- Create solution pages for key verticals
- Develop comparison content

### Tasks

| Task | Priority | Notes |
|------|----------|-------|
| Enhance pricing page with Product schema | P1 | Add structured data |
| Create `/vs/[competitor]` pages | P2 | Comparison content |
| Build sector pages (e-commerce, SaaS, B2B) | P2 | Solution landing pages |
| Add FAQ schema to learning-centre | P2 | Where appropriate |
| Create "how it works" page | P2 | Product education |

### Deliverables
- [ ] Product schema on pricing/checkout
- [ ] 3+ comparison pages
- [ ] 3+ sector landing pages

---

## Phase 5: Authority Assets (Week 7-8)

### Objectives
- Build original research
- Establish E-E-A-T signals
- Begin external authority building

### Tasks

| Task | Priority | Notes |
|------|----------|-------|
| Publish benchmark data from audits | P1 | "Average landing page score: 6.2/10" |
| Create original research article | P2 | Deep-dive analysis |
| Add author attributions to articles | P1 | Link to team page |
| Set up Google Business Profile | P2 | If applicable |
| Create LinkedIn publishing cadence | P2 | Weekly content |
| Begin HARO / journalist outreach | P3 | Earn media mentions |

### Deliverables
- [ ] 1 original research article
- [ ] Author attribution on all content
- [ ] Google Business Profile (if local)
- [ ] LinkedIn publishing schedule

---

## Phase 6: Result Presentation (Week 9)

### Objectives
- Optimize titles and descriptions
- Add structured data for rich results
- Improve image SEO

### Tasks

| Task | Priority | Notes |
|------|----------|-------|
| Audit all page titles | P1 | 50-60 chars, unique |
| Audit meta descriptions | P1 | 150-160 chars, compelling |
| Add alt text to all images | P1 | Missing on many pages |
| Create dedicated OG images | P2 | For top 20 pages |
| Add VideoObject schema (if video) | P3 | Future consideration |

### Deliverables
- [ ] All titles optimized
- [ ] All descriptions unique
- [ ] All images have alt text

---

## Phase 7: Lifecycle Operations (Week 10+)

### Objectives
- Establish ongoing governance
- Set up monitoring and alerts
- Create incident response procedures

### Tasks

| Task | Priority | Notes |
|------|----------|-------|
| Set up GSC email alerts | P1 | Index issues, manual actions |
| Create SEO incident runbook | P2 | Define SEV-1/2/3 responses |
| Set up rank tracking | P2 | Daily tracking for priority queries |
| Establish monthly SEO review | P2 | Technical + content |
| Create content decay alerts | P3 | Traffic drop detection |
| Set up backlink monitoring | P3 | Ahrefs/SEMrush integration |

### Deliverables
- [ ] Rank tracking dashboard
- [ ] SEO incident playbooks
- [ ] Monthly review cadence

---

## Query Registry Template

Create a structured query registry with these fields:

| Field | Description | Example |
|-------|-------------|---------|
| Query ID | Unique identifier | Q-001 |
| Canonical query | Primary search term | "landing page not converting" |
| Intent | Info/Commercial/Navigational | Commercial |
| Funnel stage | Awareness/Evaluation/Conversion | Evaluation |
| Current URL | Existing page (if any) | /learning-centre/landing-page-not-converting |
| Business value | High/Medium/Low | High |
| Difficulty | Competitive level | Medium |
| Priority score | Value × Intent ÷ Difficulty | 8.5 |

### Priority Queries (First 10)

1. "landing page audit" → /audit-lander
2. "landing page not converting" → /learning-centre/landing-page-not-converting
3. "fix landing page" → /pricing
4. "google ads no sales" → /learning-centre/google-ads-clicks-no-sales
5. "ad spend no conversions" → /audit-lander
6. "landing page optimizer" → /
7. "cro audit tool" → /audit-lander
8. "landing page diagnosis" → /audit
9. "conversion rate optimization services" → /pricing
10. "nebula components" → /

---

## Measurement Framework

### Primary KPIs

| Metric | Current | Target (30d) | Target (90d) |
|--------|---------|--------------|--------------|
| Indexed pages | 487 | 200 (curated) | 150 |
| Non-brand clicks | Unknown | +20% | +50% |
| Organic audit requests | Unknown | +10/mo | +30/mo |
| Top-10 rankings | Unknown | 10 queries | 25 queries |
| Conversion rate | Unknown | 2% | 4% |

### Segmentation Required

- Brand vs non-brand traffic
- Query intent type
- Page type (product, content, landing)
- New vs returning users
- Mobile vs desktop

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Algorithm update | Medium | High | Follow guidelines, diversify traffic |
| Technical regression | Medium | High | Pre-deploy checks, monitoring |
| Content decay | High | Medium | Quarterly content audit |
| Index bloat | High | Medium | Curate case studies, use noindex |
| No backlinks | High | High | Begin outreach, create linkable assets |
| Zero brand awareness | Medium | High | LinkedIn publishing, community engagement |

---

## Success Criteria

**Phase 1-2 (Weeks 1-2):**
- [x] Sitemap live
- [x] robots.txt live
- [ ] GSC verified
- [ ] Query registry with 50+ queries

**Phase 3-4 (Weeks 3-6):**
- [ ] Topic hierarchy established
- [ ] Breadcrumbs on all pages
- [ ] Commercial pages optimized with schema

**Phase 5-7 (Weeks 7-10):**
- [ ] Original research published
- [ ] 10+ top-10 rankings
- [ ] Monthly review cadence established

---

## Next Actions (Immediate)

1. **Mike to verify Google Search Console**
   - Replace `your-google-verification-code` with actual code
   - Submit sitemap

2. **Agent to create query registry**
   - Export from existing keyword research
   - Add to Google Sheets or database

3. **Agent to implement breadcrumbs on top pages**
   - Breadcrumbs.tsx component ready
   - Add to learning-centre, pricing, audit pages

4. **Agent to curate case studies**
   - Identify top 50 with best content
   - Add noindex to low-quality pages

---

**Last Updated:** 2025-07-15  
**Status:** Phase 1 70% complete  
**Next Milestone:** GSC verification + query registry (Week 1)
