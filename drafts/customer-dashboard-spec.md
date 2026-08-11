# Customer Dashboard - Reference Capture & Spec Draft

Status: MVP SLICES 1–4 IMPLEMENTED & VERIFIED LIVE (2026-08-01) - requirements pending from Mike (more screenshots coming).

## Implementation log
- Slice 1 Dashboard / Slice 2 Projects / Slice 3 Audit History: /workspace live (email gate via localStorage nebula_ws_email), API GET /audit/by-email?email= (registered before /{audit_id}), Next proxy /api/audits/by-email. Browser-verified tabs on 2026-08-01.
- Slice 4 Compare Audits: /workspace → Compare tab, PR-style diff (score delta /100, findings added/fixed/unchanged, evidence expansion). Browser-verified 2026-08-01.
- Slice 5 Recommendation Kanban: recommendations table, GET /audit/recommendations?email= + PATCH /audit/recommendations/{id}, proxies /api/recommendations + /api/recommendations/[id], /workspace → Recommendations tab (To Fix / Doing / Done), auto-verify on re-audit, status preserved across syncs. Browser-verified 2026-08-01.
- Slice 6 Component Lab History: lab_experiments table (email, url, label, score, grade, components jsonb, ad_copy, status saved|production), GET/POST /audit/lab-experiments + PATCH/DELETE /audit/lab-experiments/{id}, proxies /api/lab-experiments + /api/lab-experiments/[id], /workspace → Experiments tab (score /100, delta vs previous, Message/Headline/CTA chips, Mark as production, Unmark, Delete), Lab page "Save this run" block (label + email prefill from nebula_ws_email). Browser-verified full loop (lab run → save → list → production) 2026-08-01.
- Slice 7 Billing & Subscription: /api/billing/summary?email= reads nebula_platform.purchases (the webhook's DB), derives plan (fix-pack owned if any paid $97/fix-pack purchase), purchase history with fulfillment badges, Stripe customer-portal session when a customer exists for the email (graceful null otherwise), honest "unlimited audits in MVP" usage framing. /workspace → Billing tab: Plan card (owned/free), stat cards (audits/total paid/billing), purchase history table, Go further upgrade paths ($497 agency, $1,497 retainer, Monitoring coming soon). QA row cs_test_billing_qa added for the test account. Browser-verified 2026-08-01.
- Slice 8 Monitoring: monitors + monitor_events tables (email-keyed, cadence weekly|monthly, next_run_at schedule, UNIQUE(email,url)), GET/POST /audit/monitors + PATCH/DELETE /audit/monitors/{id} + POST /audit/monitors/run-due (internal runner: audits each due monitor, compares vs latest completed audit, writes event, schedules next run), proxies /api/monitors + /api/monitors/[id], /workspace → Monitoring tab (watch form, card with cadence/next run/last score/Pause/Remove, event timeline). Cron watchdog job 5b1ac2d30a32 every 30m runs ~/.hermes/scripts/monitor_runner.sh (flock'd, prints alerts only - silent when healthy; alerts to Telegram on score move ≥ 4 pts or new critical). Scale fix: engine returns 0–10, audits.score stores ×10 (0–100) - runner normalizes ×10 before compare. Browser-verified + 2 real no-change events 2026-08-01.
- Slice 8 proof - real regression 2026-08-01: created public/monitor-qa.html (good: headline/CTA/social proof) → baseline 70/100 → replaced with stripped page (no CTA/headline) → watchdog emitted `📉 Nebula Monitor - https://nebulacomponents.shop/monitor-qa / 70 → 45 (-25 pts)` and wrote event (regressed, prev 70, new 45) → cleanup (page + monitor + audits removed). Alert path proven end-to-end.
- Quirk: public/*.html files are NOT reachable at their `.html` URL (Next 404s exact single/double-word `.html` paths). Use the bare path - `/:path(\w+-\w+)` rewrite serves the file at `/monitor-qa`.
- Slice 9 Logged-in audit skip: AuditForm now sends `email: localStorage.nebula_ws_email` (if set) to /api/audit/start so the audit is owned by the workspace user from the start (no more pending@example.com for logged-in users). Processing page auto-unlocks when `nebula_ws_email` exists - POSTs /api/audit/unlock with that email, shows an "Unlocking your full report…" state, redirects to the full results page; falls back to the email form if unlock fails. Anonymous flow unchanged (email form still shown). Verified 2026-08-01: logged-in audit of example.com → full report, no email form, audit row email = workspace email; anonymous audit → email form still shows.
- Fix: CookieConsent was dynamic(ssr:false) → inline consent script never executed (React does not run dangerouslySetInnerHTML scripts injected client-side); banner permanently visible + consent-gated analytics never loaded. Restored server component + direct SSR so the script lands in initial HTML. Verified: Accept all dismisses, consent persists, GA loads. 2026-08-01.
- Scores: audits.score stored 0–100 (update_audit persists int(score*10) from engine's 0–10); audits.composite/composite_anchor stored 0–10. All UI displays /100. Delta units /100 (was: -2.0 bug fixed to -20 in Compare).
- Test account: e2e-crawler-test@example.com has 3 audits (nebulacomponents.shop ×2 at 7.5, example.com at 5.5) + 8 rec cards - use it for demo/QA.
- Auto-verify path (finding disappears on newer audit) is code-reviewed but not yet triggered with real data - needs a real site that fixes a flagged signal between audits.

## Source reference: Syndicatecode (syndicatecode.ca) - AI visibility tracker

Dark-themed customer dashboard tracking "how often AI models name your brand."

### Observed sections
1. **Overview** - greeting, status headline, empty state
2. **Monitoring** - tracker runs
3. **Prompts** - commercial prompt visibility
4. **Links** - citation source tracking
5. **AI traffic** - visits from AI assistants
6. **Blog Writer** - content generation tied to visibility

### Patterns worth stealing
- **Honest empty state**: "No data yet - the first tracker run will show how often AI models name your brand." No fake charts. Aligns with Nebula integrity rule.
- **Setup recommendations cards** (4): competitors, Yandex.Metrica, Search Console, Cloudflare - each with "Set up" + "Connect" actions.
- **Cloudflare card**: "AI crawler hits on your site (GPTBot, ClaudeBot...)" - direct tie-in to the `ai_crawler_access` engine check we just shipped.
- **Search Console card**: "Impressions and clicks from Google, including AI Overviews."
- **AI assistant input box** with suggested prompt pills ("Why did visibility drop?", "Which competitors grow faster than us?", "Which topics should we cover?", "Which sources are we missing?").
- Language toggle EN/RU (RU-market product - not needed for Nebula).

### Nebula asset map (what we already have vs need)
| Capability | Nebula status |
|---|---|
| AI visibility polling (ChatGPT/Perplexity/Gemini) | HAVE - `ai-visibility-monitor` skill |
| AI crawler policy check (robots.txt) | HAVE - engine `ai_crawler_access` dimension (shipped today) |
| Audit dataset + benchmarks | HAVE - /benchmarks, 54 completed audits |
| Per-customer visibility tracking over time | NEED - dashboard surface + scheduled runs |
| Competitor visibility comparison | NEED - poll competitors alongside customer |
| Crawler hit analytics (Cloudflare) | NEED - Cloudflare analytics API or log pull |
| AI Overviews click/impression data | NEED - Search Console API integration |
| Dashboard UI | NEED - decide surface (inside portal vs separate app) |

### Open questions for requirements phase
- Dashboard scope: audit customers only, or a paid monitoring tier?
- Data retention/privacy: per-customer visibility results are customer data - ownership model?
- Integration with the $97 Sprint's 30-day re-audit as the first dashboard milestone?

## Requirements - Customer Workspace (Mike, 2026-08-01)

Core reframe: NOT an "audit history" page. A **Customer Workspace** where audits are one module. Product becomes an ongoing optimization workspace, not a one-time report generator → retention + recurring value.

### Information Architecture
```
Workspace
├── Dashboard        ← "What should I work on today?"
├── Audits           ← immutable, Git-commit style versions
├── Component Library
├── Recommendations  ← Kanban: To Fix / Doing / Completed
├── Experiments      ← saved Component Lab runs, mark as Production
├── Reports          ← PDF/Markdown/Client Report/Share link/White-label (Pro)
├── Monitoring       ← weekly/monthly re-audits + alerts (Ahrefs/SEMrush model)
├── Billing
├── Team             ← Owner/Editor/Viewer; agency → Client Portal
└── Settings
```

### Module details (from Mike's brief)

**1. Dashboard** - answers "what should I work on today?" Cards: Overall Score (84/100, ↑+12 since last audit), Critical Issues (3 Critical / 7 Warnings / 12 Passed), Latest Audit, Score trend chart, Suggested Next Audit ("Homepage changed 6 days ago → Run Follow-up"), Subscription (12 audits remaining).

**2. Audits** - each audit is an asset. Result page tabs: Overview / Components / Evidence / Recommendations / History. Immutable versions like Git commits (v1 Jul 2: 76, v2 Jul 18: 82, v3 Jul 31: 84). Users never lose old versions.

**3. Compare Audits** - highest-value feature. Before/After per component with score movement (+4 Headline, +9 Above Fold, +11 CTA, +2 Message Match). Like a pull request diff.

**4. Saved Recommendations** - Kanban (To Fix → Doing → Completed). "Next audit checks it" - closed loop.

**5. Components** - save components (Hero, CTA, Pricing, Testimonials, FAQ, Navbar) instead of pages. Each: Score, History, AI rewrite, Examples, Benchmark. (Hero 72 → Run AI Rewrite → Compare → Export.)

**6. Component Lab** - public tool exists; inside workspace users save every experiment (Headline A 82 / B 90 / C 94), mark as Production.

**7. AI Assistant** - Ideata-style search box grounded in audit history. "Why did my score drop?", "Rewrite this CTA to pass.", "Show all messaging issues across my site.", "Which recommendation will increase score fastest?"

**8. Monitoring** - monthly recurring value. Weekly/Monthly re-audits: "Homepage 79 → 83", "No changes detected", "Your pricing page now fails Above Fold". Ahrefs/SEMrush model.

**9. Reports** - Export PDF/Markdown/Client Report/Executive Summary/Share link/White-label (Pro).

**10. Subscription** - AuditFlow-style usage visibility: plan, monthly audits included, remaining credits, billing history, invoices, payment methods, upgrade paths. White-label, scheduled monitoring, team = higher tiers.

**11. Team** - Mike (Owner), John (Editor), Sarah (Viewer). Eventually Client Portal.

**12. Projects** - instead of "My Account": Projects (Acme → Homepage/Pricing/Docs; Shopify Store → Homepage/Collection/Product). Vercel/Linear model.

**13. Activity Timeline** - every meaningful event: audit completed → headline updated → follow-up audit → CTA fixed → score increased.

**14. Achievement System** - "Above Fold passed", "CTA clarity", "Message Match", "Accessibility", "Trust Signals" → 94% "Landing Page Certified".

**15. Notifications** - monthly audit ready / score dropped / recommendation completed / subscription renewing.

### Future differentiators
Version history (forever), visual diffs, benchmark vs other users ("top 15% CTA clarity"), saved AI rewrites side-by-side, experiment tracking ("headline +8 points"), scheduled re-audits, competitor snapshots, shareable client portals with comments/approval, public certification badges ("Nebula Verified Above Fold").

### MVP build order (Mike's explicit sequence)
1. Dashboard - health score, recent activity, next recommended action
2. Projects - organize sites and landing pages
3. Audit History - immutable audit versions with scores over time
4. Follow-up Audits - re-run and compare vs previous versions
5. Recommendation Tracker - actionable checklist with completion status
6. Component Lab History - save and compare experiments
7. Billing & Subscription - plans, usage, invoices, audit credits
8. Monitoring - automated monthly/weekly re-audits with alerts

### Nebula asset map (updated)
| Capability | Status |
|---|---|
| AI visibility polling (ChatGPT/Perplexity/Gemini) | ✅ HAVE - `ai-visibility-monitor` |
| AI crawler policy check | ✅ HAVE - engine `ai_crawler_access` |
| Audit dataset + benchmarks | ✅ HAVE - /benchmarks, 54 completed |
| Audits-by-email (workspace identity) | ✅ HAVE - `get_audits_by_email` in audit_db (check route exposure) |
| Immutable versions (multiple audits same URL) | ✅ HAVE - audits table stores every run; versioning = grouping by URL+domain |
| Composite score + anchor | ✅ HAVE - shipped 2026-08-01 |
| Dashboard UI | ❌ NEED - /workspace surface |
| Projects (domain grouping) | ❌ NEED - group audits by domain |
| Compare/diff between versions | ❌ NEED - per-component delta from findings |
| Recommendation Kanban | ❌ NEED - completion state + next-audit check |
| Monitoring (scheduled re-audits + alerts) | ❌ NEED - cron + notifications |
| Sentiment/themes/citations | ❌ NEED |
| Billing/credits UI | ❌ NEED |

### Architecture decisions (current)
- Workspace lives inside customer-portal Next.js app (same brand system).
- Identity: email-based (audits already keyed by email; unlock flow captures it). No password system in MVP - email gate like the audit unlock.
- Data: audits table is source of truth; workspace reads via platform API (same proxy pattern as results page).
- Versioning: same URL across runs = versions; compare = per-component score delta between two audit_ids.

## Reference 2: Syndicatecode - Monitoring page (empty state)

### Layout anatomy (top → bottom)
1. **Top metrics cards (3):** Visibility (% of AI answers mention brand) · Position in niche (place among tracked brands) · Sentiment (how AI talks about brand, 0–100)
2. **Quick stats row (4 small):** Share of voice · Average position · Citation share · Prompts per run
3. **Trend chart card** with toggle: `Visibility` / `Citation share`
4. **You and competitors card** (from latest run)
5. **Engines × brands matrix** - visibility in every answer engine over the window
6. **Audience prompts panel** + **"What you are named for" (AI wording/themes)**
7. **What changed** - compared with previous run
8. **Citation & source analysis (3):** Top cited · Source types · Your pages in answers
9. **Latest mentions** - answer snippets mentioning the brand

### Empty-state copy worth stealing (all honest, all actionable)
- "The chart appears after the second run: points go by day with daily monitoring and by week with rare runs." - explains data cadence up front, no fake charts
- "No competitors set - no one to compare with" + **Add competitors** button - empty state drives setup action
- "Until competitors are set, share of voice and position are counted from you alone." - honest math
- "Answer engines do not cite your site yet. **That is the growth point** - content for the prompts in your panel." - ties empty state to an action
- "What changed: After the second run you will see where you started and stopped being named."
- Export button, Main/Additional tabs.

### Nebula asset map (updated)
| Capability | Status |
|---|---|
| AI visibility polling (ChatGPT/Perplexity/Gemini) | ✅ HAVE - `ai-visibility-monitor` |
| AI crawler policy check | ✅ HAVE - engine `ai_crawler_access` |
| Audit dataset + benchmarks | ✅ HAVE - /benchmarks, 54 completed |
| **Engines × brands matrix** | 🟡 PARTIAL - we poll engines; need per-brand matrix + runs over time |
| **What changed / deltas between runs** | 🟡 PARTIAL - need run-diff storage |
| **Sentiment (0–100) + themes ("what you're named for")** | ❌ NEED - new extraction from answer text |
| **Competitor visibility comparison** | ❌ NEED - poll competitors alongside customer |
| **Citation/source analysis** | ❌ NEED - extract cited domains from answers |
| Per-customer tracking over time | ❌ NEED - dashboard surface + scheduled runs |
| Dashboard UI | ❌ NEED - surface TBD |
