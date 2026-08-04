# Becoming the De Facto Leader in Landing Page Optimization

Date: 2026-08-04
Status: Adopted (Mike: "Proceed")
Owner: Hermes (CEO agent) + Mike
Context: PostHog traffic ~104 uniques/30d, $0 documented client outcomes, FunnelCanary launching a paid funnel-checker ($4.99 → $19.99/mo).

## Thesis

De facto leadership is a **consequence** of owning four assets, not a goal you declare:

1. **Category ownership** — the phrase people use when they search
2. **Data moat** — the aggregate dataset nobody else can cite
3. **Proof (receipts)** — documented before/after outcomes with attribution
4. **Distribution** — agencies, content, backlinks, AI citations

Nobody cites the leader's opinions; they cite the leader's **data and receipts**. We already have the engine for two of these. The plan below builds the other two and compounds all four.

## The 5 Plays

### Play 1 — Own the data asset: The Landing Page Leak Index

**What:** Publish aggregate benchmark data from every audit run — scores by signal, failure rates, "the average landing page fails X of 9 conversion signals." This is the *citable* thing journalists, founders, and AI engines reference.

**Status: PARTIALLY BUILT — EXECUTED 2026-08-04.**
- Backend: `platform_api/services/audit_db.py::get_benchmarks()` — real aggregates from completed audits; `/audit/stats/benchmarks` live; 87 audits, avg 6.3/10, Above Fold failing 100%.
- Frontend: `/benchmarks` page renders real data, empty state is honest, `/api/audit/stats/benchmarks` proxy (5-min revalidate), in sitemap.
- **Done this sprint (2026-08-04):** branded as **The Landing Page Leak Index**; backend now returns `avg_failures_per_page` (4.4) + `top_leak` + `generated_at`; server-rendered data so crawlers see real numbers; **methodology section** (collection, pass standards, privacy, freshness); **JSON-LD Dataset + BreadcrumbList schema** for AI citation; `/leak-index` alias → 308 permanent redirect to `/benchmarks`; footer link relabeled "Leak Index". Deployed + verified live (title, H1, stat cards, distribution, methodology all render).

**Compounding:** more audits → better data → more citations → more audits. Update weekly. Methodology page must be public so the dataset is verifiable.

### Play 2 — Close the proof loop: every engagement becomes a receipt

**What:** Every $97 Fix Pack and $1,497 retainer must produce a documented before/after: audit → leak found → fix → measured change. With an attribution standard (flagged Jul 26, not yet closed).

**Status: EXECUTED 2026-08-04 (mechanism ready; ledger empty until first paid engagement).**
- Standard: `docs/outcomes/receipts/README.md` — attribution standard, score-based conclusion ladder (confirmed ≥ +1.0 / suggested +0.5–1.0 / no_change < 0.5 / decline ≤ -0.5 / insufficient_data), receipt lifecycle (draft → confirmed → published), triggers, and the rule that score receipts may never claim conversion lift (analytics method + SOP-005 required for conversion claims).
- Template: `docs/outcomes/receipts/RECEIPT_TEMPLATE.md` (JSON schema + field rules).
- Generator: `scripts/receipt_draft_from_monitor.py` — drafts score-based receipts from `monitored_pages.baseline_score` vs `last_score` + `monitoring_events`; connect/query timeouts, duplicate guard, `--dry-run`.
- Tests: `tests/test_receipt_drafts.py` — 9 tests passing (ladder, ID sequencing, draft shape).
- Verified end-to-end with a temp monitor row (4.0 → 6.5 = improvement_confirmed), then cleaned up DB + ledger. Runtime ledger: `ops/outcomes/receipts/receipts.jsonl` (gitignored, append-only, starts empty).
- **Trigger wiring (pending first engagement):** Fix Pack delivered → draft immediately (baseline = delivered audit); monitor `improved` event after fix → run the script; retainer/agency completion → draft with both methods where possible.

### Play 3 — Win the phrase before FunnelCanary does

**What:** The category to own is **"conversion leak detection"** — not "audit" (Screaming Frog), not "optimization" (Unbounce). Use "leak" + "evidence" consistently across site, guides, widget, schema.

**Status: PARTIAL.** "leak" language already in `/paid-traffic-leak-scorecard`, `/vs`, compare pages, `mobile-landing-page-audit`. FunnelCanary is trying to own "funnel leaks." We are ahead on content; content seizes the phrase. Standardize: audits = "leak detection," results = "leaks found," fixes = "leak repairs." Leak Index naming directly serves this.

### Play 4 — Agencies as the distribution layer

**What:** The $497 embeddable widget is the highest-leverage distribution asset: 10 agencies × their clients = audits without ad spend; each embed = "Powered by Nebula" backlink. Marvlus data says show the score *before* the paywall.

**Status: BUILT + VERIFIED 2026-08-04 (MVP live; partner recruitment next).**
- Spec: `docs/superpowers/specs/2026-08-04-embeddable-audit-widget.md` (unchanged).
- Widget JS: `public/widget/audit.js` — vanilla JS + shadow DOM, dark/light themes, form → processing → score ring → top-3 findings → "See full report" (partner-attributed), "Powered by Nebula" in all states, multi-instance support, graceful error handling.
- API: `app/api/widget/audit/route.ts` — validates partner via `GET /audit/partners/{id}` (platform API), CORS allowlist enforced per partner domain, rate limits (10/hr per partner, 3/day per IP via `widget_usage` in lead_state.db), SSRF guard, runs the same engine as /api/audit/start, records `source=widget` + `partner_id` on the audit row AND a lead in lead_state.db (`source_partner` column added).
- Backend: `partners` table + `source`/`partner_id` columns on `audits` (migration `20260804_add_widget_partners.sql`); `audit_db.get_partner/create_partner/add_partner_domain`; platform route `GET /audit/partners/{partner_id}` (before the `/{audit_id}` catch-all).
- Registration: `scripts/register_partner.py` (id/name/domains/plan → prints embed code).
- Demo + verification: `/widget/demo` (dark + light themes) — verified live in a rendered browser: score cards 6.9/B (stripe) and 5.9/C (linear), report links carry `?partner=agency_demo`, leads attributed at both DB layers, CORS denial (403, no ACAO) and unknown-partner (403) verified, rate limit 429 verified.
- **Next: recruit 3 agencies manually to seed; auto-registration from Stripe webhook is future work.**

### Play 5 — Content at scale: teardowns + comparisons + programmatic

**What:** "X landing page teardown" for the 200 most-advertised SaaS brands + vs-pages. Each teardown = lead magnet + backlink magnet. Weekly cadence, UTM-tagged distribution.

**Status: SEEDED.** HubSpot + Mailchimp teardowns live; distribution drafts in `ops/teardown_distribution_hubspot_mailchimp_2026-08-04.md`. Next: pipeline the teardown generation (engine already runs on any URL), target queue in the ops doc.

## Sequencing & leverage

| Priority | Play | Why now | Effort |
|---|---|---|---|
| 1 | Leak Index | Compounds with every audit; citable; buildable this week | Small (this sprint) |
| 2 | Proof receipts | Required for authority + conversion; no dependency | Medium |
| 3 | Phrase ownership | Cheap; do alongside 1 (language) | Tiny |
| 4 | Agency widget | Highest distribution leverage; spec exists | Large (next sprint) |
| 5 | Content scale | Compounds; run alongside 4 | Ongoing |

## What NOT to do

- Do not try to lead all of "landing page optimization" — owned by decade-old brands. Win the narrow lane (leak detection) first, then expand.
- Do not buy traffic for authority. Authority = data + proof + citations, which compound free.
- Do not publish case studies without receipts (integrity rule).

## Definition of "de facto leader" (measurable)

- AI engines (ChatGPT/Perplexity/Gemini) cite nebula Leak Index data when asked about landing page conversion stats.
- Top-3 organic for "landing page audit," "landing page leak," "why is my landing page not converting" (already ranking work in progress).
- ≥5 published receipts with attribution.
- ≥10 agency embeds live.
