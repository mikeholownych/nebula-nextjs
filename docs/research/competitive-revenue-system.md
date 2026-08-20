# Competitive Revenue System Matrix

**Retrieved:** 2026-08-20 UTC
**Sources:** public pages listed in `competitor-landscape.md`, DataForSEO SERP, live Nebula ledger (production rows only unless noted)

Production ledger snapshot (psql `analytics_event_ledger`, 2026-08-20):

| Event | Production n |
|---|---:|
| landing_page_view | 733 |
| audit_cta_exposed | 73 |
| audit_cta_clicked | 0 |
| audit_url_submitted | 3 |
| audit_accepted | 63 |
| audit_started | 66 |
| audit_submission_rejected | 62 |
| audit_failed | 10 |
| audit_completed | 3 |
| audit_result_viewed | 16 |
| repair_sprint_exposed | 2 |
| checkout_started | 0 |
| checkout_creation_failed | 40 |
| purchase_completed | 0 |

`audit_cta_clicked = 0` while hero is the primary CTA is a **measurement defect**, not proof of zero intent. Instrumented 2026-08-20 on homepage hero (exposure + click). Pre-fix numbers remain the baseline.

---

## Normalized matrix

| Dimension | LandingBoost | LandingScore | Cruelx | Fibr | Attention Insight | Unbounce | HubSpot Grader | **Nebula** |
|---|---|---|---|---|---|---|---|---|
| Acquisition | SEO + directories + founder social | SEO cluster (CRO+GEO how-tos) | SEO resources + AI-visibility SKU | Sales + case studies + free tools | Trial SEO + Figma plugin + case studies | SEO + paid (Labs intersections) + trial | Domain authority + free tool | Trigger outbound + site. **No SERP occupancy** |
| Free offer | Scan, axes, bottleneck named | Full dual-lens report claimed free | First look | Free CRO tool (separate) | 14-day trial | 14-day builder trial | Full grade after email | URL audit, no login |
| Time to value | Seconds on homepage | ~60s, no signup | Minutes + questions | Demo | Seconds after signup | Hours (build a page) | Seconds after email | Audit run, then **second submit on /audit** |
| Signup friction | None for scan | None | Questions, no card | Sales | Trial account | Trial account | **Email required** | None for scan. Email later for unlock/buy |
| Lead capture | After paid unlock / pack | Email for "custom strategy" | After free look / paywall $8.99 | Demo form | Signup for trial | Trial form | Email-before-value | Optional until checkout |
| Qualification | Behavioral (scan, rescan) | None obvious | Firmographic questions | Sales demo | Seat/credit usage | Traffic volume | Email + site | Trigger + leftover failed conditions |
| Activation | First Edit visible after $9 | Instant PDF | Dashboard + 45pp PDF | Onboarding / implementation | First heatmap | First published page | Score page | Results page. `repair_sprint_exposed` = 2 |
| Nurture | Rescan + regression email on $49 | Unknown | Unknown | Sales + newsletter | Unknown | Product email (not captured) | HubSpot nurture (not captured) | Post-purchase drip exists, **unexercised** ($0) |
| Sales assist | None on homepage | Consultation form | Agency SKU | Primary motion | Demo Calendly | Concierge/Agency | CRM AE | None. $97 self-serve |
| Pricing metric | Page / one-time pack | Free (opaque) | Report / scan one-time | Contact sales | Credits + seats | Monthly visitors | Free lead magnet | One leak / $97. Subscription schema blocked |
| Proof | Named X before/after | "45k pages", "40%+" | Sample report + anonymous quotes | Named logos + $50M+ | Named quantified case studies | G2 4.3/386 | HubSpot brand | Inspectable DOM evidence. No sale proof |
| Differentiation | First Edit + public rank | CRO+GEO dual lens | Roast tone + white-label | Agentic personalization | Pre-traffic attention | Builder + Smart Traffic | Free SEO grade | Failed-condition leftover + $97 implementation |
| Expansion | $9 → $49 monitor 3 pages | Consultation | Agency portfolio | Enterprise | Credits/seats | Traffic tiers + services | CRM suite | D3/D7/D14 drip. Subscription insert blocked |
| Referral loop | Public leaderboard + badges | None observed | Share links (agency) | None observed | Shareable analysis links | Agency directory | Viral grader forwards | None observed |
| Measurement | Score + rescan delta | Score | Score / 5 areas | Session/revenue claims | Attention % | Visitor/conversion logs | Grade 0-100 | Ledger live. Hero CTA was blind. Checkout failures visible |

---

## Funnel reconstructions (observed)

### LandingBoost

```
SEARCH / SOCIAL / DIRECTORY
  → homepage URL field ("Find my first edit free")
  → free scan (4 axes)
  → paywall: exact First Edit $9
  → optional $49 Launch Pack (monitor + MCP)
  → rescan loop
```

Economic logic: cheap unlock of the unresolved remainder. OBSERVED.

### Cruelx

```
URL
  → qualifying questions (who/what/goal)
  → free first look
  → $8.99 full PDF  /  $19.99 AI scan
  → agency white-label
```

Economic logic: context questions raise specificity, then sell the rest of the report. OBSERVED.

### HubSpot Grader (DO NOT COPY capture timing)

```
URL + EMAIL
  → score
  → HubSpot CRM
  → product nurture (INFERRED, sequence not captured)
```

### Unbounce

```
SEO/ads
  → trial signup
  → build page
  → traffic-tier subscription
  → concierge/services
```

### Nebula (live)

```
landing_page_view (733)
  → hero URL (UNMEASURED until 2026-08-20)
  → /audit?url=  (second submit required)
  → audit_started (66) / rejected (62)
  → audit_completed (3) vs result_viewed (16)  [event undercount]
  → repair_sprint_exposed (2)
  → checkout_creation_failed (40) / checkout_started (0 prod)
  → purchase (0)
```

---

## Offer architecture comparison

| Company | Free leaves unresolved? | Paid resolves? | Monetization trigger |
|---|---|---|---|
| LandingBoost | Yes (First Edit hidden) | DIY prompt, not implementation | Curiosity after scan |
| LandingScore | Unclear (claims full free) | Consultation | Weak / opaque |
| Cruelx | Yes (preview vs 45pp PDF) | More pages of advice, still DIY | Report completeness |
| Attention Insight | Trial cap | More credits | Volume of designs |
| Unbounce | Trial ends | Hosted pages + traffic | Need to keep pages live |
| HubSpot Grader | Grade without HubSpot | CRM/marketing hub | Email list |
| **Nebula** | Yes (failed conditions leftover) | $97 sprint (implementation path) | Leftover conditions |

Nebula's commercial idea is closer to Grammarly than to Unbounce: **knowing what is wrong is free; fixing it is paid.** LandingBoost is the nearest productized clone, cheaper, DIY.

---

## Lead capture timing

| Company | Identity asked | When |
|---|---|---|
| LandingBoost | No for scan | At $9 checkout |
| LandingScore | No for report | Email for strategy |
| Cruelx | After preview / at pay | $8.99 |
| PageAudit | Signup | Before audit |
| HubSpot Grader | Email | Before score |
| Attention Insight | Account | Before trial use |
| Fibr | Demo form | Before product |
| **Nebula** | No for scan | Checkout / unlock |

Preserve Nebula's late identity. Reject PageAudit and Grader.

---

## Pricing weaknesses Nebula can exploit

OBSERVED:

- Unbounce: traffic caps + overages + geo unavailability
- VWO: no public price (demo tax)
- Fibr: contact sales
- Hotjar: session caps freeze data
- LandingBoost: $9 DIY leaves implementation to the founder (same leftover Nebula sells)
- Cruelx: $8.99 buys a long PDF, not a shipped fix
- LandingScore: no paid depth, so no reason to come back

Nebula $97 is **higher than diagnostic PDFs and lower than Unbounce/VWO monthly**. It is not "too cheap vs Unbounce." It is expensive vs LandingBoost $9 **unless implementation is real**.

If fulfillment is a prompt pack, LandingBoost wins on price. If fulfillment is a done repair of leftover conditions, $97 is the correct metric.

---

## Instrumentation notes (capability, not shopping list)

| Company | Observable capability |
|---|---|
| Unbounce | Trial + billing + visitor metering |
| Hotjar | Session-based packaging + free forever |
| Attention Insight | Credit ledger + share links |
| LandingBoost | Scan → paywall → rescan state machine |
| HubSpot Grader | Email as primary key |
| **Nebula** | `analytics_event_ledger` with stages. Hero CTA was not on it. Checkout failures are. |

Do not add HubSpot because Unbounce "uses marketing automation." Implement the **state machine** on the existing ledger.
