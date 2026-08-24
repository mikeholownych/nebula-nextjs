# Paid Analytics Surfaces (Phase 3) Design

Date: 2026-08-24
Status: Approved design, pending implementation plan
Phase: 3 of 5 (deeper diagnostics via funnel-wide analysis, competitor diagnostics, benchmark percentiles, remediation programs)
Supersedes: nothing. Builds on phases 1-2 (teardown claims; billing + entitlements spine).

## Problem and motivation

Subscribers currently get audits, monitors, and a kanban. The paid tier promises analytics that do not exist yet:

1. No prioritized remediation roadmap - findings carry impact/effort/quadrant but nothing sequences them into a program.
2. Competitor comparison throws findings away at the route layer and keeps only one overwritten score per rival.
3. Benchmarks show corpus aggregates but never tell a workspace where it personally stands.
4. Analysis is strictly single-URL; there is no crawler, no batch orchestration, no domain-level view.

Phase 3 delivers all four surfaces on top of the existing engine, queue, and EntitlementService.

## Product packaging (locked 2026-08-24)

| Surface | Free | Pro | Growth | Agency |
| --- | --- | --- | --- | --- |
| Remediation programs | existing kanban only | full programs | full programs | full programs |
| Competitor diagnostics | legacy score-only compare (grandfathered) | full diagnostics + history, 2 rivals | full, 5 rivals | full, 10 rivals |
| Benchmark percentiles | public medians page only | personal percentile per signal | segment-ready schema (global v1) | same as Growth |
| Funnel runs | teaser: 1 lifetime run of 3 URLs | 3 runs/calendar-month, 10 URLs/run | 10 runs/calendar-month, 25 URLs/run | unlimited runs, 100/run |

Entitlements grow four fields mirrored into `tests/billing_fixtures/plan_limits.json` and the TS config with the parity-fixture test pattern: `competitor_slots` (0/2/5/10), `funnel_runs_per_month` (0/3/10/null-unlimited), `funnel_urls_per_run` (0/10/25/100), `analytics_depth` (`none`/`basic`/`percentile`/`segment`; free=`none`, pro=`percentile`, growth+agency=`segment`). Free-tier funnel access is implemented as an explicit service-level teaser rule (exactly one lifetime run, hard-capped at 3 URLs) rather than through the per-month field, so the fixture stays honest about what each plan grants monthly.

Grandfathering: the existing free score-only competitor compare stays free; nobody loses current capability.

## Chosen architecture

Extend the existing engine, queue, and databases; add one funnel orchestrator service. Two services remain two services. Rejected: standalone analytics microservice (third deployment/auth path for marginal benefit); pure read-time modeling (competitor history and funnel runs require persistence by definition).

## Data model (additive, nebula_audit)

### funnel_runs

id, email, domain, status (`discovering`, `running`, `complete`, `complete_partial`, `failed`), requested_count, discovered_count, plan_snapshot (`teaser` or plan key), scorecard jsonb (written on completion), coverage_pct numeric nullable, created_at/completed_at. One active run per domain enforced in service logic plus partial unique index `ON funnel_runs (domain) WHERE status IN ('discovering','running')`.

### funnel_pages

id, run_id FK -> funnel_runs, url text, audit_id uuid nullable (links the per-page audit), status (`pending`, `running`, `done`, `failed`), score numeric nullable, created_at/updated_at.

### competitor_audits

id, owner_email text, competitor_url text, audit_id uuid FK -> audits, created_at. Full engine_output persists inside the linked audits row under the existing internal identity pattern; history is rows over time. Legacy three rows in nebula_platform.competitor_tracking survive as history-less entries until their next refresh links a real audit.

### benchmark_rollups

computed_at timestamptz, window_days int, sample_size int, composite jsonb {p25,p50,p75,p90}, signals jsonb {signal_key: {ok_rate, p50_score}}, segment text default 'global'. Refreshed daily by cron; endpoints serve last-computed rows with computed_at exposed.

### programs / program_steps

programs: id, email, domain, status (`active`, `completed`, `archived`), generated_at.
program_steps: id, program_id FK, seq int, stage int (1 quick wins, 2 major projects), finding_key, url, title, impact numeric, effort numeric, quadrant, status (`pending`, `active`, `done`, `verified`, `dismissed`), verified_audit_id uuid nullable, timestamps.

## Funnel orchestrator

`POST /audit/funnel/runs {domain}` (session-authenticated):

1. Gate: paid plans count runs in the calendar month (matching audit-quota semantics) against `funnel_runs_per_month`; free checks the lifetime teaser rule (zero prior runs with `plan_snapshot='teaser'`, URL cap 3). Denials return the standard upgrade shape. Atomic count check on creation race.
2. Discovery: fetch `https://<domain>/sitemap.xml`, parse locs (same XML approach as the GSC sitemap route), normalize, dedupe, drop non-HTML suffix patterns. Missing sitemap fails the run fast with an actionable message (homepage-crawl fallback is a later refinement).
3. Cap to `funnel_urls_per_run`, create run + page rows, fan pages through the existing queue (`audit_runner.kick()`). One active run per domain.
4. Completion sweep rides the existing hourly heartbeat cron: when all pages terminal, aggregate scorecard onto the run - domain average, per-signal pass rates across pages, worst-five pages, recurring quick-win findings (appearing on more than one page).
5. Permanently failed pages (after engine retries) yield `complete_partial` with coverage percentage noted in the scorecard.

Concurrency honesty: the global queue runs two audits in flight; large runs occupy it accordingly (a 25-page run is roughly 15-20 minutes). Documented on the run object.

## Competitor diagnostics

Adding or re-running a rival persists the full audit under the existing internal identity pattern (findings retained) and inserts a `competitor_audits` link row; re-runs accumulate history. Slot counts enforce at add time.

`GET /audit/analytics/competitors/{rival_id}/comparison` returns: your latest domain audit vs the rival's latest - per-signal side-by-side pass/fail, your-edge list (rival fails where you pass), threat list (you fail where rival passes), and score-over-time series for both parties for charting.

## Benchmark mechanics

Daily cron computes from completed non-internal audits over a 90-day window: composite percentiles and per-signal ok-rates into `benchmark_rollups`. `GET /audit/analytics/benchmarks/me?domain=` returns the workspace's latest-audit percentile rank overall and per signal. Depth gating per packaging table; free retains the existing public medians page untouched.

## Remediation programs

`GET /audit/analytics/program?domain=` derives and persists a sequenced roadmap from open recommendations/findings:

- Stage 1 Quick Wins: `quick_win` quadrant sorted by impact descending.
- Stage 2 Major Projects: impact descending, effort ascending within impact.
- Step completion derives automatically from existing systems: recommendation reaching done/verified, or a fix_implementations row for that finding. The existing verify loop flips regressed steps back to active.
- Program progress percentage; regeneration rebuilds remaining steps preserving done/verified history. Dismissal removes a step permanently.
- Free accounts keep today's kanban only.

## Frontend

- Add `recharts` as the pinned chart dependency (four new visualization surfaces: funnel scorecard, competitor timelines, percentile bars, program progress).
- Tabs: new paid Program tab; Competitor Intel upgraded in place; benchmarks surface gains personal positioning; new Funnel tab visible to free with locked depth. All mounted via `planGate.tsx` TAB_ACCESS_REQUIREMENTS + LockedTab.
- Content rules: no em-dashes; accent `#c7ff2f` only; no `warning` class.

## Failure modes

| Failure | Behavior |
| --- | --- |
| Funnel page fails permanently after retries | Run completes `complete_partial`, coverage pct recorded in scorecard |
| Sitemap missing or unparsable | Run fails fast, message states sitemap requirement |
| Teaser/paid race on run creation | Atomic count check (same advisory pattern as monitor caps) |
| Stale benchmark rollups | Endpoints serve last-computed data exposing computed_at |
| Queue starvation | Funnel pages are FIFO alongside normal audits; documented |
| EntitlementService outage | Free reads degrade open; premium analytics mutations fail closed (phase 2 rules) |

## Verification plan

1. Unit: percentile math; program sequencing order and completion derivation; grown entitlement matrix incl. teaser lifetime rule and slot counts; URL normalization/capping.
2. Integration: orchestrator fan-out against mocked queue with synthetic completions incl. partial failure; competitor persistence and slot enforcement; rollup refresh idempotency; comparison endpoint gap-list correctness.
3. E2E: real funnel run against nebulacomponents.com; competitor add/re-run/compare using Nebula-owned domains; program generated from live findings with one step driven to verified.
4. DoD artifacts: deploy statuses; per-plan tab gating checks (founder agency live, other tiers via unit matrix); journals clean on both units; no live purchase required (gates proven via founder seed + matrix).

Ship order within phase 3: entitlement fields + migrations; competitor persistence; benchmark rollups + endpoint; programs; funnel orchestrator; frontend tabs; E2E; DoD.

## Out of scope (later phases)

Homepage-crawl fallback discovery; industry/vertical segments with real tagging; CWV/timing-based deeper diagnostics; tech-stack detection; collaboration/team seats (phase 4); productized API keys and exports (phase 5); card-display list payload enrichment carried from phase 1 backlog.
