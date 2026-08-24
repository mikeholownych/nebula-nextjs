# Paid Analytics Surfaces (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship four paid analytics surfaces - remediation programs, full competitor diagnostics with history, personal benchmark percentiles, and multi-page funnel runs - gated through the phase 2 EntitlementService.

**Architecture:** Six additive tables in `nebula_audit` back the surfaces. Competitor audits stop discarding findings (persist via existing internal identity + link rows). A funnel orchestrator discovers URLs from sitemaps, fans pages through the existing queue, and rolls up scorecards on the hourly heartbeat. Benchmark percentiles refresh daily into a rollup table. Programs derive a sequenced roadmap from existing findings/fix state. All gates flow through `EntitlementService.resolve_sync`.

**Tech Stack:** FastAPI + asyncpg (nebula_audit), SQLAlchemy models untouched this phase except entitlements dataclass, Next.js App Router workspace tabs + recharts (new pinned dependency), cron scripts per the phase 2 heartbeat pattern.

**Spec:** `docs/superpowers/specs/2026-08-24-paid-analytics-design.md`

## Global Constraints

- Production doctrine: LIVE service, LIVE Stripe. Never echo/log/stage secrets. Redact qa emails are fine (`qa-billing@invalid.nebulacomponents.com` class).
- Locked packaging: Free {kanban only, legacy score-compare, public medians, teaser 1 lifetime run of 3 URLs}; Pro {programs, 2 rivals, percentiles, 3 runs/mo x 10 URLs}; Growth {5 rivals, segment-schema depth, 10 runs/mo x 25 URLs}; Agency {10 rivals, unlimited x 100}.
- Entitlements changes MUST update BOTH `tests/billing_fixtures/plan_limits.json` AND `customer-portal/app/lib/subscription-plans.ts` config surface consumed by parity tests.
- Fail rules inherited: free reads fail open; premium analytics mutations fail closed; `status='error'` treated as free.
- DSNs never mixed: analytics tables live in `nebula_audit`; auth/org tables stay in `nebula_platform`.
- Tests: `uv run --project /home/mike/nebula python -m pytest <file> -v`; portal `npx jest <path>` + `npx tsc --noEmit`.
- Restarts: `sudo systemctl restart nebula-platform-api.service nebula-nextjs.service`; homepage 200 invariant; journalctl `-p err` clean after each restart.
- Content rules: NO em-dashes; accent `#c7ff2f` only; no `warning` class; homepage frozen; `$97`, `48 hours`, `7 conversion signals` untouched.
- Push only `nebula-origin` with Mike go.

---

### Task 0: Analytics domain glossary

**Blocks:** none
**Demoable:** CONTEXT.md carries the phase 3 vocabulary.

**Files:**
- Modify: `CONTEXT.md`

**Interfaces:**
- Produces terms used verbatim by Tasks 1-9: **funnel run**, **funnel page**, **teaser rule**, **competitor slot**, **rival link**, **benchmark rollup**, **program step**, **analytics depth**.

- [ ] **Step 1: Append glossary**

Append to CONTEXT.md after the billing section:

```markdown

## Paid Analytics Glossary (2026-08-24)

- **Funnel run**: a batch audit of one domain's pages discovered from its sitemap,
  stored in `nebula_audit.funnel_runs` + `funnel_pages`. One active run per domain.
- **Teaser rule**: every workspace email may run exactly ONE lifetime funnel run
  capped at 3 URLs regardless of plan; enforced by counting prior
  `plan_snapshot='teaser'` runs.
- **Rival link**: row in `competitor_audits` mapping a workspace owner_email to a
  persisted competitor audit. History = rows over time.
- **Benchmark rollup**: daily-refreshed percentile/ok-rate aggregates in
  `benchmark_rollups`; served stale-with-computed_at when refresh lags.
- **Program step**: one sequenced remediation item in `program_steps`;
  completion derives from recommendation done/verified or fix_implementations rows.
- **Analytics depth**: `none|basic|percentile|segment` on Entitlements;
  free=none, pro=percentile, growth+agency=segment.
```

- [ ] **Step 2: Commit**

```bash
git add CONTEXT.md && git commit --no-verify -m "docs: paid analytics domain language"
```

---

### Task 1: Analytics schema migration

**Blocked by:** Task 0
**Demoable:** `\d` shows all six tables in nebula_audit with the exact columns/indexes below.

**Files:**
- Create: `platform_api/migrations/20260824090000_paid_analytics.sql`

**Interfaces:**
- Produces tables consumed by Tasks 3-7 services. UUIDs via gen_random_uuid().

- [ ] **Step 1: Write migration**

Create `platform_api/migrations/20260824090000_paid_analytics.sql`:

```sql
-- Phase 3 paid analytics surfaces. Additive only.

CREATE TABLE IF NOT EXISTS funnel_runs (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email            text NOT NULL,
    domain           text NOT NULL,
    status           text NOT NULL DEFAULT 'discovering'
                     CHECK (status IN ('discovering','running','complete','complete_partial','failed')),
    requested_count  int NOT NULL DEFAULT 0,
    discovered_count int NOT NULL DEFAULT 0,
    plan_snapshot    text NOT NULL,
    scorecard        jsonb,
    coverage_pct     numeric(5,2),
    created_at       timestamptz NOT NULL DEFAULT now(),
    completed_at     timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_funnel_runs_active_domain
    ON funnel_runs (domain) WHERE status IN ('discovering','running');

CREATE INDEX IF NOT EXISTS idx_funnel_runs_email ON funnel_runs (email);

CREATE TABLE IF NOT EXISTS funnel_pages (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id     uuid NOT NULL REFERENCES funnel_runs(id) ON DELETE CASCADE,
    url        text NOT NULL,
    audit_id   uuid REFERENCES audits(id),
    status     text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','running','done','failed')),
    score      numeric(5,1),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funnel_pages_run ON funnel_pages (run_id);

CREATE TABLE IF NOT EXISTS competitor_audits (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_email    text NOT NULL,
    competitor_url text NOT NULL,
    audit_id       uuid NOT NULL REFERENCES audits(id),
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitor_audits_owner
    ON competitor_audits (owner_email, competitor_url);

CREATE TABLE IF NOT EXISTS benchmark_rollups (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    computed_at  timestamptz NOT NULL DEFAULT now(),
    window_days  int NOT NULL DEFAULT 90,
    sample_size  int NOT NULL,
    composite    jsonb NOT NULL,
    signals      jsonb NOT NULL,
    segment      text NOT NULL DEFAULT 'global'
);

CREATE TABLE IF NOT EXISTS programs (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email        text NOT NULL,
    domain       text NOT NULL,
    status       text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','completed','archived')),
    generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_programs_active_email_domain
    ON programs (email, domain) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS program_steps (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id        uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    seq               int NOT NULL,
    stage             int NOT NULL CHECK (stage IN (1,2)),
    finding_key       text NOT NULL,
    url               text NOT NULL,
    title             text NOT NULL,
    impact            numeric(4,1),
    effort            numeric(4,1),
    quadrant          text,
    status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','active','done','verified','dismissed')),
    verified_audit_id uuid REFERENCES audits(id),
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_program_steps_program ON program_steps (program_id, seq);
```

- [ ] **Step 2: Apply and verify**

```bash
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" \
  -f platform_api/migrations/20260824090000_paid_analytics.sql
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" -c "\dt" | grep -E "funnel|competitor_audits|benchmark_rollups|program"
```

Expected: six new tables listed.

- [ ] **Step 3: Commit**

```bash
git add platform_api/migrations/20260824090000_paid_analytics.sql \
  && git commit --no-verify -m "feat: paid analytics schema"
```

---

### Task 2: Entitlements growth

**Blocked by:** Task 0
**Demoable:** Fixture, dataclass, and TS config all carry the four new fields; parity tests green.

**Files:**
- Modify: `tests/billing_fixtures/plan_limits.json`
- Modify: `platform_api/services/entitlements.py`
- Modify: `customer-portal/app/lib/subscription-plans.ts`
- Test: `tests/test_entitlements.py` (extend)

**Interfaces:**
- Produces on `Entitlements`: `competitor_slots int`, `funnel_runs_per_month int|None`, `funnel_urls_per_run int`, `analytics_depth str`. Consumed by Tasks 3-7.

- [ ] **Step 1: Fixture**

Update `tests/billing_fixtures/plan_limits.json` adding per-plan keys:

```json
{
  "free":   {"auditsPerMonth": 1,    "monitoredUrls": 0,    "minIntervalHours": null, "paidOnlyMonitors": true,
             "competitorSlots": 0, "funnelRunsPerMonth": 0, "funnelUrlsPerRun": 0, "analyticsDepth": "none"},
  "pro":    {"auditsPerMonth": 20,   "monitoredUrls": 3,    "minIntervalHours": 720,  "paidOnlyMonitors": true,
             "competitorSlots": 2, "funnelRunsPerMonth": 3, "funnelUrlsPerRun": 10, "analyticsDepth": "percentile"},
  "growth": {"auditsPerMonth": null, "monitoredUrls": 10,   "minIntervalHours": 168,  "paidOnlyMonitors": true,
             "competitorSlots": 5, "funnelRunsPerMonth": 10, "funnelUrlsPerRun": 25, "analyticsDepth": "segment"},
  "agency": {"auditsPerMonth": null, "monitoredUrls": null, "minIntervalHours": 168,  "paidOnlyMonitors": true,
             "competitorSlots": 10, "funnelRunsPerMonth": null, "funnelUrlsPerRun": 100, "analyticsDepth": "segment"}
}
```

- [ ] **Step 2: Dataclass**

In `platform_api/services/entitlements.py`: extend `Entitlements` with the four fields (defaults preserving old constructor calls: `competitor_slots=0, funnel_runs_per_month=0, funnel_urls_per_run=0, analytics_depth="none"`), extend `_limits_for` to return them from the fixture, and thread through `_entitlements_from_rows` + both resolve paths. Extend the fixture-parity test to assert the new fields for every plan, plus `test_teaser_constants_documented` asserting a module constant `TEASER_FUNNEL_URLS = 3` exists (used by Task 6).

- [ ] **Step 3: TS mirror**

In `customer-portal/app/lib/subscription-plans.ts` add to each plan object: `competitorSlots`, `funnelRunsPerMonth` (null for agency), `funnelUrlsPerRun`, `analyticsDepth` matching the fixture exactly. If a shared type declares plan shape, update it.

Verify: `cd customer-portal && npx tsc --noEmit && npx jest __tests__ --silent | tail -1` and Python suite green.

- [ ] **Step 4: Commit**

```bash
git add tests/billing_fixtures/plan_limits.json platform_api/services/entitlements.py \
  tests/test_entitlements.py customer-portal/app/lib/subscription-plans.ts \
  && git commit --no-verify -m "feat: analytics entitlement fields across spine"
```

---

### Task 3: Competitor persistence and comparison v2

**Blocked by:** Tasks 1, 2
**Demoable:** Adding a rival persists a full audit + rival link; re-running appends history; comparison endpoint returns side-by-side signals, edge/threat lists, and score series.

**Files:**
- Modify: `platform_api/competitor/routes.py` (persist instead of discard; slots)
- Create: `platform_api/services/competitor_analytics.py`
- Test: `tests/test_competitor_analytics.py`

**Interfaces:**
- Consumes: existing `/audit/run` internal call pattern in `_run_competitor_audit` (returns full audit JSON incl findings/engine_output - verify by reading `platform_api/routes/audit_api.py` run endpoint response shape first); `resolve_for_email`-style entitlement read for the OWNER email (add owner-email parameter threading through routes which currently only have user_id).
- Produces:
  - On each completed rival audit: INSERT INTO competitor_audits (owner_email, competitor_url, audit_id) - requires the route to capture the created audit id from /audit/run response.
  - Slot enforcement at add: count DISTINCT competitor_url per owner vs `competitor_slots`.
  - `competitor_comparison(owner_email, tracking_id) -> {you: {...}, rival: {...}, your_edge: [finding_keys], threats: [finding_keys], history: [{date, you, rival}]}` in services/competitor_analytics.py: latest audits both sides from nebula_audit (yours via audits.email = owner email ORDER BY created_at DESC LIMIT 1 for that domain... NOTE: define "your domain" as the most recent non-internal audit for the owner), signal pass maps from engine_output.findings/signal results - read one real audits row to learn the exact findings/signal shape before coding the extraction helper.

- [ ] **Step 1: Failing tests**

Create `tests/test_competitor_analytics.py` with three tests using mocked db pools:
1. slot denial: resolve returns competitor_slots=2, two distinct rivals exist -> add third raises HTTPException 403 with upgrade detail.
2. persistence: after a completed /audit/run response containing audit id + findings, a competitor_audits row insert is executed with captured values (assert SQL/params).
3. comparison gap logic: pure function `compute_gaps(you_signals, rival_signals)` returning edge/threat key lists correctly (unit-test the pure helper directly; implement it as a module-level function).

Run -> FAIL (module missing).

- [ ] **Step 2: Implement**

Modify `_run_competitor_audit`: parse full response (keep score behavior), then insert rival link row with returned audit id. Add slot check inside create endpoint using a new lightweight platform-side entitlement read: reuse `resolve_sync(owner_email, db)` - thread owner email lookup from users table by user_id. Add services/competitor_analytics.py with `compute_gaps(you, rival)` pure function + async comparison assembly querying nebula_audit pool for latest linked rival audits and owner's latest domain audit. Wire GET comparison route to the service. Legacy rows without links simply return empty history until refresh.

- [ ] **Step 3: Tests green + commit**

```bash
uv run --project /home/mike/nebula python -m pytest tests/test_competitor_analytics.py tests/test_entitlements.py -v
git add platform_api/competitor/routes.py platform_api/services/competitor_analytics.py tests/test_competitor_analytics.py \
  && git commit --no-verify -m "feat: competitor diagnostics persisted with history and comparison"
```

---

### Task 4: Benchmark rollups and personal positioning

**Blocked by:** Tasks 1, 2
**Demoable:** Rollup cron computes percentiles from the live corpus; `/audit/analytics/benchmarks/me?domain=` returns personal percentile ranks gated by analytics_depth.

**Files:**
- Create: `platform_api/services/benchmark_rollups.py`
- Modify: `platform_api/routes/audit_api.py` (new endpoints near benchmarks route ~483)
- Modify: `scripts/run_due_monitors.sh` -> rename responsibilities OR create `scripts/analytics_cron.sh` calling rollups refresh then funnel sweep placeholder (Task 6 fills sweep); update crontab line to call analytics script hourly and keep monitors runner intact
- Test: `tests/test_benchmark_rollups.py`

**Interfaces:**
- Produces:
  - `refresh_rollups(days=90) -> dict` writing one benchmark_rollups row (idempotent inserts; never deletes history).
  - `GET /audit/analytics/benchmarks/me?domain=` session-gated: resolves owner's latest completed audit for domain, returns `{overall_percentile, signals:{key:{percentile, ok_rate_corpus}}}`; depth none -> 403 upgrade shape.
- Percentile definition (pure function `percentile_rank(values, v)`): share of values strictly below v divided by count, times 100 rounded to int.

- [ ] **Step 1: Failing tests**

`tests/test_benchmark_rollups.py`: unit-test percentile_rank edges (empty corpus -> 50 default; v below all -> 0; above all -> 100); rollup row build from synthetic completed-audit rows including INTERNAL_EMAILS exclusion; me-endpoint gating (analytics_depth none -> 403; percentile -> payload shape). Adapt to real signatures discovered while implementing.

- [ ] **Step 2: Implement**

Service queries completed audits last N days excluding INTERNAL_EMAILS + SELF_DOMAINS sets (import from services.audit_db), extracts composite (score column 0-100) and per-signal ok from engine_output->signal results following the SAME extraction helper Task 3 builds for signal maps (extract shared helper into services/signal_extract.py used by both tasks 3+4 - coordinate: Task 3 creates it, Task 4 consumes). Cron script gains a second curl: POST internal `/audit/analytics/rollups/refresh` (internal-guarded endpoint wrapping refresh_rollups) appended AFTER monitor run-due in scripts/analytics_cron.sh replacing the crontab entry target.

- [ ] **Step 3: Green + wire cron + commit**

```bash
uv run --project /home/mike/nebula python -m pytest tests/test_benchmark_rollups.py -v
# force one refresh live:
SECRET=$(sudo cat /proc/$(systemctl show -p MainPID --value nebula-platform-api.service)/environ | tr '\0' '\n' | grep '^INTERNAL_API_SECRET=' | cut -d= -f2-)
curl -s -X POST http://127.0.0.1:8001/audit/analytics/rollups/refresh -H "Authorization: Bearer $SECRET"
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" -c \
  "SELECT computed_at, sample_size FROM benchmark_rollups ORDER BY computed_at DESC LIMIT 1;"
git add platform_api/services/benchmark_rollups.py platform_api/services/signal_extract.py \
  platform_api/routes/audit_api.py scripts/analytics_cron.sh tests/test_benchmark_rollups.py \
  && git commit --no-verify -m "feat: benchmark percentiles with daily rollups"
```

Expected: one fresh rollup row, sample_size > 500.

---

### Task 5: Remediation programs

**Blocked by:** Tasks 1, 2
**Demoable:** GET program for a domain with open recommendations returns a two-stage sequenced roadmap; completing a recommendation flips its step to done on next read.

**Files:**
- Create: `platform_api/services/programs.py`
- Modify: `platform_api/routes/audit_api.py` (program endpoints)
- Test: `tests/test_programs.py`

**Interfaces:**
- Consumes: `sync_recommendations` output tables (recommendations rows for email+domain), fix_implementations, verify states.
- Produces:
  - `derive_steps(open_recs) -> [step dicts]`: stage 1 = quadrant quick_win sorted impact DESC; stage 2 = rest sorted impact DESC then effort ASC. Pure function.
  - `GET /audit/analytics/program?domain=` (session-gated, plan>free): returns-or-creates active program + steps; derives live completion per step (done when matching recommendation done/verified OR fix_implementations row exists); regenerates remaining steps if open set changed while preserving done/verified/dismissed history.
  - `POST /audit/analytics/program/steps/{step_id}/dismiss`.

- [ ] **Step 1: Failing tests**

tests/test_programs.py: derive_steps ordering (quick wins first by impact desc; major projects impact desc effort asc); regeneration preserves done steps and drops satisfied ones; dismissal persists; completion derivation from mocked recommendation/fix rows. Pure-function focus + one route test with patched pool.

- [ ] **Step 2: Implement + verify + commit**

Implement services/programs.py + endpoints; wire plan gate (>free else 403 upgrade shape). Run pytest green; restart API; journals clean.

```bash
git add platform_api/services/programs.py platform_api/routes/audit_api.py tests/test_programs.py \
  && git commit --no-verify -m "feat: sequenced remediation programs"
```

---

### Task 6: Funnel orchestrator

**Blocked by:** Tasks 1, 2
**Demoable:** POST /audit/funnel/runs {domain:'nebulacomponents.com'} creates a run, discovers sitemap URLs, enqueues capped pages through the real queue; heartbeat sweep aggregates a scorecard when pages complete; teaser rule enforced atomically.

**Files:**
- Create: `platform_api/services/funnel.py`
- Modify: `platform_api/routes/audit_api.py` (run/status endpoints)
- Modify: `scripts/analytics_cron.sh` (funnel sweep curl after rollups refresh)
- Test: `tests/test_funnel_orchestrator.py`

**Interfaces:**
- Consumes: `resolve_for_email`, `TEASER_FUNNEL_URLS` (Task 2), audit_runner.kick(), audits table via AuditDB create path - IMPORTANT: page audits are created as normal audits owned by the requesting email with source='funnel' so quota/quota-exempt decision is explicit: funnel pages DO NOT consume audits_per_month (they are covered by the run entitlement); mark source and skip them in count_completed_this_month via existing source filter IF present - verify `count_completed_this_month` SQL (audit_db.py) and add `AND (source IS NULL OR source <> 'funnel')` if absent.
- Produces:
  - `discover_urls(domain) -> list[str]` fetching https://<domain>/sitemap.xml (httpx follow_redirects, 15s), parsing <loc> entries (stdlib xml.etree), normalizing (strip trailing slash, drop non-http, dedupe), filtering obvious assets (.png/.jpg/.pdf/.zip/.xml).
  - `create_run(email, domain, ent)` gating: free -> teaser lifetime check (count plan_snapshot='teaser') then cap 3 URLs; paid -> calendar-month count vs funnel_runs_per_month (null=unlimited); atomic via INSERT ... WHERE NOT EXISTS active-run pattern plus post-insert count re-check; raises HTTPException upgrade-shape on denial.
  - `fan_out(run_id)`: cap discovered to urls_per_run, insert funnel_pages, update requested_count, kick queue.
  - `sweep_completed() -> int`: for each running run where all pages terminal -> aggregate scorecard jsonb {domain_avg, signal_pass_rates, worst_pages:[{url,score}], recurring_quick_wins:[{finding_key,count}]} (recurring = finding_key present on >1 done page), coverage_pct = done/(done+failed), status complete|complete_partial; returns processed count.

- [ ] **Step 1: Failing tests**

Mock-pool tests: teaser lifetime enforcement (1 prior teaser -> 403 upgrade shape); monthly cap for pro; URL normalization/capping pure functions; sweep aggregation math from synthetic funnel_pages+audits rows incl partial failure -> complete_partial + coverage; one-active-per-domain race -> second insert rejected.

- [ ] **Step 2: Implement + wire cron**

Endpoints: POST /audit/funnel/runs, GET /audit/funnel/runs?domain= (status+scorecard). analytics_cron.sh gains funnel sweep call after rollups refresh. Restart API; force cron script once.

```bash
uv run --project /home/mike/nebula python -m pytest tests/test_funnel_orchestrator.py -v
sudo systemctl restart nebula-platform-api.service && sleep 3
/home/mike/nebula/scripts/analytics_cron.sh; tail -4 logs/monitors_runner.log
git add platform_api/services/funnel.py platform_api/routes/audit_api.py \
  scripts/analytics_cron.sh tests/test_funnel_orchestrator.py platform_api/services/audit_db.py \
  && git commit --no-verify -m "feat: funnel orchestrator with teaser rule and scorecards"
```

---

### Task 7: Frontend surfaces

**Blocked by:** Tasks 3, 4, 5, 6
**Demoable:** Workspace shows Program + Funnel tabs gated per plan; Competitor tab renders diagnostics/history; benchmarks page shows personal percentile for Pro+; all charts via recharts.

**Files:**
- Modify: `customer-portal/package.json` (add recharts)
- Create: `customer-portal/app/workspace/programView.tsx`
- Create: `customer-portal/app/workspace/funnelView.tsx`
- Modify: `customer-portal/app/workspace/competitorView.tsx`
- Modify: `customer-portal/app/workspace/WorkspaceClient.tsx` (TabId + navGroups + dynamic imports + render cases)
- Modify: `customer-portal/app/workspace/planGate.tsx` (TAB_ACCESS_REQUIREMENTS: program/funnel require pro rank; competitor full-diagnostics section requires pro while legacy compare stays visible to free)
- Create BFF proxies: `app/api/analytics/program/route.ts`, `app/api/analytics/program/dismiss/route.ts`, `app/api/funnel/runs/route.ts`, `app/api/funnel/runs/status/route.ts`, extend competitor comparison proxy if needed
- Modify: `customer-portal/app/benchmarks/page.tsx` or workspace benchmarks view for personal positioning (analytics_depth aware)

**Interfaces:**
- Consumes Task 3-6 endpoints through internal-bearer proxies with session email injection (phase 1/2 patterns).
- Produces nothing downstream.

- [ ] **Step 1: Dependency + proxies**

`npm i recharts --no-audit --no-fund` in customer-portal. Proxies mirror app/api/monitors-engine/* auth pattern exactly ({...authHeaders(request), ...internalHeaders()} lowercase-collision rule).

- [ ] **Step 2: Views**

programView: two-stage roadmap, progress bar, dismiss buttons, verified badges. funnelView: run launcher (domain input), status/scorecard renderer incl coverage note, teaser banner for free with one-run copy, LockedTab beyond teaser for free after use. competitorView: keep existing add/list; new diagnostics panel (signal side-by-side table, edge/threat lists, history line chart). Benchmarks personal block: percentile bars when depth>=percentile.

All copy passes content rules. Every fetch path hits the new proxies only.

- [ ] **Step 3: Wire tabs + gating**

Add TabIds program/funnel; navGroups entries under Analytics group; TAB_ACCESS_REQUIREMENTS entries keyed to plan rank (pro) with LockedTab fallbacks; free funnel visibility = tab visible, depth locked after teaser used (pass teaserUsed flag from status endpoint).

- [ ] **Step 4: Verify + commit**

```bash
cd customer-portal && npx tsc --noEmit && npx jest __tests__ --silent | tail -1
npx next build && sudo systemctl restart nebula-nextjs.service && sleep 4
curl -s -o /dev/null -w "home %{http_code} " https://nebulacomponents.com/
curl -s -o /dev/null -w "| workspace %{http_code}\n" https://nebulacomponents.com/workspace
journalctl -u nebula-nextjs.service --since "3 minutes ago" -p err --no-pager | tail -2
git add package.json package-lock.json app/workspace app/api/analytics app/api/funnel app/benchmarks \
  && git commit --no-verify -m "feat: analytics surfaces in workspace with plan gating"
```

---

### Task 8: End-to-end validation

**Blocked by:** Task 7
**Demoable:** Real funnel run completes against nebulacomponents.com with scorecard; rival pair compare returns gaps; program generated from live findings with verifiable steps.

**Files:**
- Evidence: `.superpowers/sdd/phase3-e2e-evidence.md`

- [ ] **Step 1: Funnel E2E**

Mint founder session (jwt pattern from phase 2 Task 11 report). POST /api/funnel/runs {domain:'nebulacomponents.com'} -> poll GET status until complete (expect <= 20 URLs, minutes not seconds; heartbeat sweep cadence is hourly so trigger scripts/analytics_cron.sh manually every ~60s to sweep). Assert scorecard fields present + funnel_pages rows link real audit ids.

- [ ] **Step 2: Competitor E2E**

Ensure a rival exists for founder pointing at gofaultline.dev (Nebula-owned); trigger refresh via existing add/re-run flow; call comparison endpoint -> assert your_edge/threats arrays present and history length >= 1.

- [ ] **Step 3: Program E2E**

GET program?domain=nebulacomponents.com -> assert >=1 stage and steps derived from live recommendations; flip one underlying recommendation to done via SQL, re-read program -> that step reports done; revert SQL.

Capture everything redacted into the evidence file. No product commits expected; fix forward if bugs surface (separate commits).

---

### Task 9: Production DoD

**Blocked by:** Task 8
**Demoable:** Artifacts appended to aidlc-docs/audit.md.

- [ ] **Step 1: Final deploy both units; five-surface status check (/ /pricing /workspace /teardowns /audit); journals clean.**
- [ ] **Step 2: Gating matrix live checks**: anon funnel POST -> 401; founder program/funnel accessible (agency); free-tier denial shapes cited from unit suite as substitute evidence; legacy free competitor compare still reachable (grandfather intact); benchmarks me-endpoint depth gate.
- [ ] **Step 3: Append audit trail (redacted) via >>; hand Mike push decision (no push without go).**

## Self-review notes (resolved while writing)

- Spec coverage: entitlement growth T2; competitor persistence+slots+comparison T3; rollups+me-endpoint+cron T4; programs derivation+completion+dismissal T5; funnel gates/discovery/cap/fan-out/sweep/partial T6; frontend tabs+gating+recharts+teaser banner T7; E2E three flows T8; DoD matrix T9. Unknown-price-style refusal analog: discovery failure fails run fast (T6). Grandfathering: legacy score-compare retained (T7 gating note).
- Type consistency: Entitlements four new fields named identically in fixture keys (camelCase) and dataclass (snake_case) mapping in _limits_for; TEASER_FUNNEL_URLS constant produced T2 consumed T6.
- Implementer judgment flags: signal extraction shared helper location (T3/T4 coordinate); count_completed_this_month source filter verification (T6); MembershipGrid-era tests unaffected; jest suites may need mock updates when endpoints change shape (T7 scope allowance).



