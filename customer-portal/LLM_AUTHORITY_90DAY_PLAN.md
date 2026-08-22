# Nebula Components - LLM Authority Plan (90-Day Merged)

**Created:** 2026-08-22 | **Horizon:** Day 90 = 2026-11-20
**Supersedes:** scheduling in `GEO_IMPLEMENTATION_ROADMAP.md` + `AEO_IMPLEMENTATION_ROADMAP.md` (both retained below as phase-level detail; banner-marked)
**Inputs merged:** external strategy review (Aug 2026) + external maturity reassessment (2026-08-22) diffed against verified repo state
**External position:** Stage 2.5 of 5 - emerging authority; methodology built, evidence moat beginning

---

## Verified Ground Truth (2026-08-22)

| Asset | State | Evidence |
|---|---|---|
| Leak Index (`/leak-index`, `/benchmarks`) | Live-derived | Server fetch of `/api/audit/stats/benchmarks`; JSON endpoint + contentUrl in schema |
| Sample-size consistency | DRIFT | `lib/brand-evidence.ts`: n=86 / 62.7 avg (hardcoded) - research page subtitle: n=131 - live endpoint: 145 |
| Claim registry | Canonical v2.0.0 | `public/claims.json`; CLM-002 = $97 One-Leak Repair Sprint; "$97 within 24 hours implementation" retired 2026-08-03 |
| Case-study evidence boundary | Active constraint | CLM-004: no evidenced customer case study approved for publication |
| Entity pages | Live | `/company/about`, `/company/team`, `/concepts` |
| Editorial standards | Live | `/editorial-standards` |
| Comparison infra | Live | `/vs/[slug]`, `/compare/[slug]` + `comparisons.ts` |
| Research study | Published | `/research/landing-page-performance-q3-2026` (single edition) |
| Machine-readable findings | Scaffolded | `content/landing-page-intelligence-stack/evidence-record.schema.json` + 5 workflow defs |
| Retrieval posture | Done | robots.txt AI crawler matrix, `llms.txt`, claims.json deployed |
| Teardown program | Live | `/teardowns/*` (instrumentation format: snapshot date + per-finding evidence + non-customer disclaimer) |
| Prompt/query registries | Split | GEO 50-prompt registry vs AEO query registry (10/100) - not merged |

## Strategic Shift

Round-1 advice said "build the framework." Round-2 assessment corrects it: the framework exists - prove it.

| Thrust | What | Why now |
|---|---|---|
| 1. Dataset scale + integrity | Leak Index as the asset; one source of truth for all cohort numbers | Dataset scored 5/10 but moat scored 8-9/10 - the gap is scale and consistency, not ideas |
| 2. Signature findings | 1-2 named empirical discoveries packaged with method + limitations | Nothing yet that "the industry knows because Nebula found it" |
| 3. External validation | Findings-first outreach; independent citations | Scored 1-2/10; self-declared authority is weak evidence |

Entity/measurement plumbing is largely built - finish it, don't rebuild it.

## P0 Reconciliation (Week 0) - blockers before any new stat publishes

**P0-1 Sample-count single source.** Three surfaces currently disagree (86 / 131 / 145). Build-time refinement: two of the three are *correctly frozen editions* (July study n=86; Q3 report edition n=131, both explicitly dated) - freezing them is the evidence discipline, not a defect. The real defects were a dead `ALL_AUDITS_BENCHMARK` constant claiming "current live dataset" while hardcoded, and no on-site reconciliation of the three scopes. Fix: registry module (`app/lib/datasets.ts`) + crawlable dataset-registry section on /benchmarks + regression tests asserting surface agreement.
Done-when: no constant claims to describe the current dataset while hardcoded; registry test passes; frozen editions keep their pinned denominators. Status: implemented 2026-08-22.

**P0-2 Claims canonicalization.** Roadmap docs carry stale claim tables contradicting `public/claims.json` v2.0.0. claims.json is the ONLY claim source for any copy; roadmap banners added 2026-08-22 point to it.
Done-when: no doc outside claims.json asserts offer terms.

**P0-3 Compliance guardrails in templates.** From claims.json `disallowed_claims` + domain glossary:
- No superlatives or placement guarantees ("best", "#1", guaranteed ranking)
- No conversion-lift promise attached to the $97 One-Leak Repair Sprint
- No customer-outcome claims until an evidenced case study is approved (CLM-004)
- Terminology: signal (not component); score (0-100 internal) vs grade (A-F display); One-Leak Repair Sprint naming
- LLM visibility language stays probabilistic ("consistent with retrieval"), never guaranteed

## North Star: Nebula Citation Share

One panel replaces two tracking efforts (GEO Phase 8 prompt testing + AEO Phase 5 controlled measurement):

| Spec | Value |
|---|---|
| Panel file | `data/citation-share-panel.json` - deduped merge of GEO 50 prompts + AEO query registry, target 100 questions |
| Cadence | Monthly, fixed day, clean browser profiles/accounts |
| Engines | ChatGPT Search, Perplexity, Gemini, Claude, Google AI Overviews/AI Mode |
| Metrics per question | mentioned / cited / primary source / competitor cited / claim fidelity (accurate/partial/false) |
| Incident path | hallucination + misquotation log feeds correction policy |
| Publication | Methodology published at `/research/citation-share-methodology` - measuring publicly is itself citable evidence |

Baseline run due by Day 14. All later interventions are judged against this number.

## Phase Plan

### Phase A - Reconciliation + entity completion (Wks 1-2)

| Task | Source | Owner | Done-when |
|---|---|---|---|
| P0-1..P0-3 above | This plan | Agent + Mike | Drift greps clean |
| Methodology page | AEO Ph2 | Agent | Live; links 9 signals, grade bands, engine version |
| Correction policy page | AEO Ph2 | Agent | Live; incident log wired |
| Author attribution | AEO Ph2 | Agent | Named author + Person schema on all research/editorial pages |
| Citation Share panel file | GEO Ph1 + AEO Ph1 | Agent | 100 questions committed, deduped |
| Baseline Citation Share run | This plan | Mike | Results logged by Day 14 |

Note: legacy "/products/fix-pack" task renamed - any product page uses One-Leak Repair Sprint naming.

### Phase B - Evidence corpus at real scale (Wks 3-6)

| Task | Source | Notes |
|---|---|---|
| Quarterly research series | Extends Q3 study | Recurring editions; versioned methodology section each time |
| Per-signal prevalence stats | GEO Ph5 | Failure % per signal from anonymized cohort aggregates (existing infra; never PII) |
| Machine-readable findings | Ext. advice #3 | Extend `evidence-record.schema.json` publishing; finding-level blocks server-rendered, no JS-only evidence |
| Claim-to-evidence mapping | GEO Ph4 | Every active claim ID maps to proof URLs in claims.json |
| Answer-page corpus (20-30) | AEO Ph3 | Definitions/problems/comparisons/implementations/evidence classes; extractable answer block first 50-100 words; extend existing routes only |
| Teardown cadence | Validated externally | Keep instrumentation format |

Case-study gate: aggregate outcomes may publish once evidenced; individual customer cases wait for CLM-004 to change.

### Phase C - External corroboration sprint (Wks 5-8, parallel)

Highest-leverage gap (independent citations 1-2/10).

| Task | Target |
|---|---|
| G2 listing | 1 profile live |
| Product Hunt launch | 1 launch |
| Guest posts pitched AS dataset findings ("We analyzed N landing pages...") | 2 published |
| Reddit case-study threads | 5 posts |
| Podcast pitches to appearances | 2 recorded |
| LinkedIn founder cadence | 3/month |
| Founder entity hygiene | Consistent bio string everywhere, ORCID, sameAs graph complete |

Rule: pitch findings, never product. Prevalence stats earn citations; launch announcements do not.

### Phase D - Measurement ops + scale gates (Wks 9-12)

| Task | Trigger/cadence |
|---|---|
| Monthly Citation Share runs | Fixed day; delta vs baseline reported |
| Hallucination incidents | Log + correction-policy response |
| Expansion gates | Definition pages cited -> build 20 more; comparison pages cited -> build 10 more |
| Benchmark edition #2 | Next quarter, larger n, same methodology version |
| Observatory-scale decision | Revisit dataset infra only at >= 1,000 organic audits |

## Explicitly Rejected or Deferred

| Item | Verdict | Reason |
|---|---|---|
| 100k-page observatory | Deferred | Organic pipeline first; prevalence stats don't require it; revisit >= 1,000 audits |
| New /cro/* encyclopedia namespace | Rejected | Duplicates indexed routes (/concepts, /benchmarks, /research, /vs); consolidates entity strength instead of splitting it |
| Further llms.txt investment | Closed | Shipped and adequate; matches low-priority guidance |
| Guaranteed-placement framing | Rejected | Violates claims.json disallowed_claims; platforms state placement cannot be guaranteed |
| Individual experiment case studies now | Gated | Blocked by CLM-004 until evidenced customers exist |

## Success Metrics (Day 90)

| Metric | Baseline 2026-08-22 | Target |
|---|---|---|
| Cohort count consistency | 86 / 131 / 145 conflict | Single-sourced everywhere |
| Citation Share baseline | Not measured | Measured monthly from Day 14 |
| Independent corroborating sources | 0 | >= 5 |
| Extractable answer pages | Partial | 20-30 live |
| Claims with mapped evidence URLs | Partial | 100% of active claims |
| Author attribution on research pages | None | 100% |
| Hallucination log | None | Live with incident process |

## Ownership

| Owner | Scope |
|---|---|
| Mike | Manual Citation Share runs, outreach/PR, approvals, podcasts/G2/ORCID |
| Agent | P0 technical fixes, schema, content drafts, answer-page corpus, measurement plumbing |

---

**Last Updated:** 2026-08-22
**Next Milestone:** P0 reconciliation + baseline Citation Share run by Day 14 (2026-09-05)
