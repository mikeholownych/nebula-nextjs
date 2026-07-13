# Deployment, Cutover, and Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy Next.js, the existing Python services, the new platform API, and PostgreSQL with measurable health, secure routing, reversible canaries, and tested rollback.

**Architecture:** Cloudflare Tunnel performs ordered hostname/path routing to local services. systemd supervises each bounded process. CI builds immutable artifacts and blocks deployment on frontend, backend, tenant-isolation, SEO, accessibility, and browser gates.

**Tech Stack:** Cloudflare Tunnel, systemd, Next.js standalone server, Uvicorn, PostgreSQL, GitHub Actions, pytest, Vitest, Playwright, structured JSON logs.

## Global Constraints

- `/stripe-webhook` must reach the existing signature-verifying Python handler without body transformation.
- Agent discovery, tracking, CRM/admin, stats, and existing API routes stay on their current service until explicitly migrated.
- Health indicates process availability; readiness indicates dependency availability; data freshness is a separate metric.
- No production cutover without an exercised staging rollback.
- Route canaries are reversible without a code rollback.

---

### Task 1: Define and test the routing manifest

**Files:**
- Create: `config/service-route-manifest.yaml`
- Create: `scripts/validate_service_routes.py`
- Create: `tests/test_service_route_manifest.py`
- Create: `docs/architecture/request-routing.md`

**Interfaces:**
- Produces ordered route ownership: `next`, `platform_api`, `agentic_server`, or `webhook_server`.

- [ ] **Step 1: Write failing tests for overlap, uncovered protected endpoints, invalid regex, and accidental Stripe routing**

Required existing-route owners include:

```yaml
- path: /stripe-webhook
  owner: agentic_server
- path_prefix: /api/platform/
  owner: platform_api
- path_prefix: /api/crm
  owner: agentic_server
- path: /api/stats
  owner: agentic_server
- path_prefix: /.well-known/
  owner: agentic_server
- default: true
  owner: next
```

- [ ] **Step 2: Parse `agentic_server.py` route contracts and require every dynamic route to appear explicitly or under an explicit prefix**
- [ ] **Step 3: Fail validation when two rules can own the same path before the intended higher-priority rule**
- [ ] **Step 4: Run `venv/bin/python3 scripts/validate_service_routes.py` and pytest**
- [ ] **Step 5: Commit as `test: define service routing ownership`**

### Task 2: Configure Cloudflare Tunnel routing

**Files:**
- Create: `deploy/cloudflared/config.template.yml`
- Create: `scripts/render_cloudflared_config.py`
- Create: `scripts/test_cloudflared_ingress.sh`
- Modify: deployment documentation only until staging verification succeeds.

**Interfaces:**
- Consumes `config/service-route-manifest.yaml`.
- Produces rendered tunnel ingress with no secret values committed.

- [ ] **Step 1: Write renderer tests proving path ordering and exact backend origins**
- [ ] **Step 2: Render platform API paths to `http://127.0.0.1:8770`, existing protected/dynamic paths to `http://127.0.0.1:8765`, and default frontend traffic to `http://127.0.0.1:3000`**
- [ ] **Step 3: Add terminal 404 ingress and validate with `cloudflared tunnel ingress validate`**
- [ ] **Step 4: In staging, POST a signed Stripe fixture and verify the exact existing handler receives unmodified bytes**
- [ ] **Step 5: Verify Next pages and platform API preserve original scheme/host through forwarded headers**
- [ ] **Step 6: Commit as `ops: add deterministic Cloudflare service routing`**

### Task 3: Add supervised services

**Files:**
- Create: `deploy/systemd/nebula-next.service`
- Create: `deploy/systemd/nebula-platform-api.service`
- Create: `deploy/systemd/nebula-agentic.service`
- Create: `deploy/systemd/nebula-webhook.service`
- Create: `scripts/verify_services.py`
- Create: `docs/runbooks/service-lifecycle.md`

**Interfaces:**
- Produces bounded services with health checks and restart limits.

- [ ] **Step 1: Write service-file validation tests for non-root user, absolute working directory, environment file permissions, restart policy, and hardening directives**
- [ ] **Step 2: Configure Next to run `.next/standalone/server.js` on `127.0.0.1:3000` and platform API through Uvicorn on `127.0.0.1:8770`**
- [ ] **Step 3: Preserve current Python ports 8765 and 9000; do not start duplicate processes**
- [ ] **Step 4: Add `NoNewPrivileges`, private temporary directories, read-only system paths, bounded open files, and explicit writable runtime directories**
- [ ] **Step 5: Run `systemd-analyze verify deploy/systemd/*.service` and the service verification script**
- [ ] **Step 6: Commit as `ops: supervise Nebula platform services`**

### Task 4: Build CI quality gates

**Files:**
- Create: `.github/workflows/platform-ci.yml`
- Create: `scripts/ci_route_parity.py`
- Create: `scripts/ci_secret_scan.py`
- Modify: `package.json` to expose existing Playwright commands without removing dependencies.

**Interfaces:**
- Produces required checks: `frontend`, `python`, `platform-integration`, `browser-parity`, and `security`.

- [ ] **Step 1: Add dependency-cache keys from both lockfiles and the pinned Python requirements file**
- [ ] **Step 2: Run Next lint/typecheck/unit/build and upload the standalone build as an immutable artifact**
- [ ] **Step 3: Start PostgreSQL service, apply Alembic migrations, run all pytest suites, and downgrade/upgrade migration tests**
- [ ] **Step 4: Start Next, platform API, agentic server, and webhook server; wait on readiness endpoints rather than fixed sleeps**
- [ ] **Step 5: Run route/SEO/accessibility/Stripe-link/tenant-isolation Playwright suites**
- [ ] **Step 6: Scan build artifacts for secret patterns and forbidden ledger/private file names**
- [ ] **Step 7: Commit as `ci: gate Next.js platform transformation`**

### Task 5: Add observability and freshness metrics

**Files:**
- Create: `platform_api/observability.py`
- Create: `web/src/lib/observability/request-id.ts`
- Create: `config/platform-slos.yaml`
- Create: `scripts/platform_health_report.py`
- Create: `docs/runbooks/platform-alerts.md`

**Interfaces:**
- Produces correlated request IDs, structured logs, endpoint health, dependency readiness, and data-freshness timestamps.

- [ ] **Step 1: Write tests proving request IDs propagate Cloudflare → Next/platform API → log records without accepting unsafe user values**
- [ ] **Step 2: Log JSON fields `timestamp`, `service`, `request_id`, `route`, `status`, `duration_ms`, and tenant-safe organization hash; never log tokens, emails, card data, or request bodies by default**
- [ ] **Step 3: Define separate metrics for process health, PostgreSQL readiness, Stripe webhook lag, identity webhook lag, subscription projection freshness, and audit projection freshness**
- [ ] **Step 4: Set initial alerts from measured staging baselines rather than invented thresholds; commit the resulting numeric thresholds in `config/platform-slos.yaml` before production**
- [ ] **Step 5: Verify an intentionally stale projection reports `available: true` and `fresh: false`**
- [ ] **Step 6: Commit as `ops: distinguish platform health from data freshness`**

### Task 6: Implement canary routing and rollback

**Files:**
- Create: `config/frontend-route-flags.json`
- Create: `scripts/set_route_canary.py`
- Create: `scripts/rollback_frontend_route.py`
- Create: `tests/test_route_canary.py`
- Create: `docs/runbooks/frontend-cutover.md`

**Interfaces:**
- Produces atomic route-family activation and rollback with audit log entries.

- [ ] **Step 1: Write tests for invalid family, concurrent update, partial write, unauthorized use, and rollback to the previous version**
- [ ] **Step 2: Use atomic temporary-file replacement and a monotonically increasing config version**
- [ ] **Step 3: Support route families `probe`, `case_studies`, `learning_centre`, `articles`, `marketing_static`, `marketing_interactive`, and `homepage`**
- [ ] **Step 4: Require preflight parity command success before activation unless `--emergency-rollback` is used**
- [ ] **Step 5: Exercise staging activation and rollback while active sessions and Stripe webhooks continue**
- [ ] **Step 6: Commit as `ops: add reversible frontend route canaries`**

### Task 7: Production cutover sequence

**Files:**
- Create: `docs/runbooks/production-cutover-checklist.md`
- Create: `scripts/post_cutover_smoke.py`
- Create: `scripts/post_cutover_evidence.py`

**Interfaces:**
- Produces timestamped evidence bundle with git revision, artifact checksums, routes, health/readiness, freshness, browser results, and rollback status.

- [ ] **Step 1: Record pre-cutover database backup, current route map, service versions, route baseline, and rollback commands**
- [ ] **Step 2: Activate page families in order: case studies → learning centre → repeatable content → static marketing → interactive marketing → homepage**
- [ ] **Step 3: After each family, run smoke checks for status, canonical, H1, critical CTA, GA4 event, Stripe link, accessibility, and browser console/network errors**
- [ ] **Step 4: Activate customer dashboard for internal tenant, then one test customer, before general entitlement availability**
- [ ] **Step 5: Activate managed agency subdomains before custom domains**
- [ ] **Step 6: Roll back immediately on cross-tenant access, payment/webhook regression, route loss, canonical corruption, or failed health/readiness; do not wait for aggregate metrics**
- [ ] **Step 7: Save evidence and commit runbook as `ops: define production transformation cutover`**

### Task 8: Legacy retirement

**Files:**
- Modify: `audit_to_case_study.py`
- Modify: `learning_centre_engine.py`
- Modify: `agentic_server.py`
- Create: `scripts/archive_legacy_html.py`
- Create: `tests/test_no_legacy_html_generation.py`

**Interfaces:**
- Produces structured content exports only after the rollback window and parity evidence are complete.

- [ ] **Step 1: Write failing tests that forbid new full-document HTML generation while allowing structured content export**
- [ ] **Step 2: Archive legacy HTML with a manifest and checksums rather than deleting evidence immediately**
- [ ] **Step 3: Remove legacy static branches from Python only after every route family is active in Next and rollback artifacts are retained**
- [ ] **Step 4: Run full pytest, Next, Playwright, route parity, and archive restore tests**
- [ ] **Step 5: Commit as `refactor: retire legacy HTML generation after cutover`**
