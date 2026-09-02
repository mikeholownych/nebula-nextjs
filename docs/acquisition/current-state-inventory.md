# Acquisition Learning System: Current-State Inventory

**Phase:** Phase 1 (Discovery and Current-State Assessment)  
**Date:** September 2, 2026  
**Status:** Completed  
**Scope:** Complete inventory of all existing acquisition, SEO, analytics, database, and telemetry assets across the Nebula codebase.

---

## 1. Documentation & Protocol Assets

| File Path | Status / Role | Authority Tier | Description |
| :--- | :--- | :--- | :--- |
| `ACQUISITION_BASELINE.md` | Generated Artifact | Historical Snapshot | Output of `update_acquisition_baseline.py` (v2). Records 41 pages, 429 impressions, 0 clicks, 64.3 avg pos, 16 GA4 organic sessions. |
| `ACQUISITION_BASELINE_PREV.md` | Generated Artifact | Historical Snapshot | Previous baseline output (v1). Records 41 pages, 429 impressions, 0 clicks, 65.6 avg pos, 16 GA4 organic sessions. |
| `CHANGE_LOG.md` | Appended Ledger | Operational Log | Tracks deployed changes with affected cohort, expected impact, and commit hash. |
| `MEASUREMENT_PROTOCOL.md` | Authoritative Protocol | Operational Governance | Defines canonical impressions-weighted average position, drift detection rules, and export commands. |
| `AGENTS.md` | Highest Priority Doctrine | Binding Governance | Live production rules, Definition of Done, verification mandates, and content constraints (zero em-dashes). |
| `CLAUDE.md` | Operational Reference | Binding Workflow | Operational facts, services ports, deployment checklists, and pre-commit content checks. |
| `customer-portal/PRODUCT.md` | Strategic Brief | Product Positioning | Value proposition, target buyer psychology, and messaging architecture. |
| `customer-portal/DESIGN.md` | Design System | Visual Standards | WCAG 2.2 AAA visual standards, single accent `#c7ff2f`, zero teal / glow orbs. |

---

## 2. Acquisition & Analytics Scripts

| Script Path | Execution Runtime | Purpose | Health / Status |
| :--- | :--- | :--- | :--- |
| `scripts/update_acquisition_baseline.py` | Python 3 (uv / venv) | Fetches GSC & GA4 data, compares with previous baseline, and generates `ACQUISITION_BASELINE.md`. | Functional with bugs in position bucketing (lines 230-231) and cohort logic (line 118). |
| `scripts/log_change.py` | Python 3 (uv / venv) | Formats and prepends site change entries to `CHANGE_LOG.md`. | Functional; uses static cohort dictionary. |
| `~/.claude/skills/seo/scripts/gsc_query.py` | Python 3 (google-api-python-client) | Queries GSC Search Analytics API with dimensionless aggregate totals and auto-pagination. | Production-ready, handles query anonymization. |
| `~/.claude/skills/seo/scripts/ga4_report.py` | Python 3 (google-analytics-data) | Queries GA4 Data API v1beta for organic search traffic, daily sessions, and top landing pages. | Production-ready, checks quota consumption. |
| `~/.claude/skills/seo/scripts/gsc_inspect.py` | Python 3 | Queries URL Inspection API for real-time Google indexing state. | Production-ready. |
| `~/.claude/skills/seo/scripts/google_auth.py` | Python 3 | Service account OAuth 2.0 credential loader for Google APIs. | Production-ready. |
| `scripts/gsc_programmatic_review.py` | Python 3 (cron) | Weekly automated review of GSC query performance and ranking trends. | Active in crontab (Monday 08:00 UTC). |
| `scripts/cwv_monitor.py` | Python 3 (cron) | Weekly Core Web Vitals performance audit against production URLs. | Active in crontab (Sunday 22:00 UTC). |
| `scripts/gsc_content_refresh.py` | Python 3 (cron) | Scans for decaying content and opportunities based on GSC impression trends. | Active in crontab (Monday 10:00 UTC). |
| `customer-portal/scripts/check-sitemap-routes.mjs` | Node.js (fast-xml-parser) | Validates that all URLs in `sitemap.xml` return HTTP 200 with non-empty bodies. | Functional; legacy default base URL is `.shop`. |

---

## 3. Database Infrastructure & Schemas

### 3.1 PostgreSQL Databases (Cluster `postgresql@16-main`, Port 5433)

#### Database: `nebula_platform` (Canonical Application Store)
- **`analytics_event_ledger`**: Single authoritative append-only funnel event ledger.
  - Columns: `id` (UUID PK), `event_name`, `event_version`, `stage`, `source_system`, `occurred_at`, `received_at`, `anonymous_user_id`, `session_id`, `user_id`, `audit_attempt_id`, `audit_id`, `checkout_session_id`, `transaction_id`, `landing_path`, `referrer_class`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `device_class`, `status`, `failure_reason`, `dedup_key`, `build_revision`, `environment`, `payment_mode`, `is_synthetic`, `journey_id`, `properties` (JSONB).
  - Triggers: `trg_prevent_mutation_ledger` (enforces strict append-only immutability).
  - Indexes: B-tree indexes on `journey_id`, `occurred_at`, `event_name`, `dedup_key`, and partial index for production live events.
- **`gsc_connections`**: Multi-tenant user GSC OAuth token store (for workspace app).
- **`ga4_connections`**: Multi-tenant user GA4 OAuth token store (for workspace app).
- **`users`, `organizations`, `memberships`, `purchases`, `subscriptions`, `invoices`**: Core billing, tenancy, and customer data.

#### Database: `nebula_audit` (Diagnostic Execution Store)
- Holds 65 tables supporting the automated landing page audit engine:
  - `audits`, `findings`, `finding_events`, `teardowns`, `teardown_claims`, `competitor_audits`, `competitor_intelligence`, `benchmark_rollups`, `ab_tests`, `ab_exposures`.
  - Archived tables from 2026-08-21 consolidation: `analytics_event_ledger__archived_20260821`, `monitored_pages__archived_20260821`.

### 3.2 Auxiliary SQLite Stores (Cold Outbound Engine)
- `lead_store.db`, `lead_state.db`, `mailcheck_beta.db`, `outbound_delivery.db`: Support outbound lead prospecting and email sequences. Completely separated from inbound organic acquisition.

---

## 4. Route Architecture & Canonical URL Representation

### 4.1 Canonical Base URL
`https://nebulacomponents.com` (enforced site-wide; `.shop` domain is legacy tunnel only).

### 4.2 Route Inventory (`customer-portal/app/sitemap.ts`)

| Route Category | Priority | Count | Key URLs / Path Patterns |
| :--- | :--- | :--- | :--- |
| **Homepage** | 1.0 | 1 | `/` |
| **Commercial Core** | 0.9 | 4 | `/pricing`, `/audit`, `/spec/landing-page-diagnostic-v1`, `/how-nebula-audits` |
| **Signal Hubs** | 0.8 | 10 | `/signals`, `/signals/message-match`, `/signals/trust-signals`, `/signals/mobile-cta`, `/signals/load-speed`, `/signals/cta-clarity`, `/signals/above-fold-clarity`, `/signals/ad-signal-continuity`, `/signals/seo-foundations`, `/signals/ai-readiness` |
| **High-Intent Landing Pages** | 0.8 | 18 | `/learning-centre`, `/resources`, `/observatory`, `/case-studies`, `/why-is-my-landing-page-not-converting`, `/ads-getting-clicks-but-no-sales`, `/best-landing-page-audit-tools`, `/lead-generation-landing-page-audit`, `/landing-page-audit-tools-pricing`, `/saas-landing-page-audit`, `/ecommerce-landing-page-audit`, etc. |
| **Comparisons (`/vs/[slug]`)** | 0.6 | 5+ | `/vs/screaming-frog`, `/vs/unbounce`, `/vs/page-speed-insights`, etc. |
| **Teardowns (`/teardowns/[slug]`)**| 0.7 | 5+ | `/teardowns/airtable`, `/teardowns/cal-com`, `/teardowns/linear`, etc. |
| **Learning Centre Articles** | 0.7 | 15+ | `/learning-centre/[slug]` |
| **Playbooks** | 0.6 | 3 | `/playbooks/founder-second-brain`, `/playbooks/linkedin-skill-engine`, `/playbooks/specialist-ai-agent-library` |
| **Citable Entities (`/citable/[slug]`)**| 0.7-0.8 | 10+ | `/resources/citable/[slug]` |
| **Pricing Guides** | 0.6 | 4+ | `/pricing-guides/[slug]` |
| **Utility / Legal** | 0.2-0.5 | 5 | `/about`, `/about/team`, `/privacy-policy`, `/data-rights`, `/terms` |
| **Non-Indexed Utility Surfaces**| `noindex` | 3 | `/checkout` (`noindex, nofollow`), `/login` (`307`), `/workspace` (Disallowed in `robots.txt`) |

Total Published Public Sitemap URLs: **68+ routes**.

---

## 5. Telemetry, Event Registries & Client Analytics

### 5.1 Canonical Event Registry (`customer-portal/config/analytics-registry.json`)
Authoritative schema defining 18 events across 9 stages:
1. `landing_page_view` (Stage: `acquisition`, Source: `client`)
2. `audit_cta_exposed` (Stage: `engagement`, Source: `client`)
3. `audit_cta_clicked` (Stage: `engagement`, Source: `client`)
4. `audit_url_submitted` (Stage: `audit_intake`, Source: `client`)
5. `audit_submission_rejected` (Stage: `audit_intake`, Source: `server_api`)
6. `audit_accepted` (Stage: `audit_intake`, Source: `server_api`)
7. `audit_started` (Stage: `audit_execution`, Source: `server_api`)
8. `audit_failed` (Stage: `audit_execution`, Source: `server_worker`)
9. `audit_completed` (Stage: `audit_execution`, Source: `server_worker`)
10. `audit_result_viewed` (Stage: `result_view`, Source: `client`)
11. `audit_result_load_failed` (Stage: `result_view`, Source: `client`)
12. `finding_expanded` (Stage: `result_engagement`, Source: `client`)
13. `repair_sprint_exposed` (Stage: `monetization`, Source: `client`)
14. `repair_sprint_clicked` (Stage: `monetization`, Source: `client`)
15. `checkout_started` (Stage: `checkout`, Source: `server_api`)
16. `checkout_creation_failed` (Stage: `checkout`, Source: `server_api`)
17. `payment_failed` (Stage: `purchase`, Source: `payment_webhook`)
18. `purchase_completed` (Stage: `purchase`, Source: `payment_webhook`)

### 5.2 Client Tracking Runtime
- `customer-portal/app/components/AnalyticsRuntime.tsx`: Fires on route navigation; handles GA4 `page_view`, PostHog `$pageview`, and `landing_page_view` into the ledger.
- `customer-portal/app/components/CookieConsent.tsx`: Implements GDPR/ePrivacy consent gate. EU visitors default to `denied` (banner required); non-EU visitors default to `accepted`. Respects opt-out via `ga-disable-{id}` and PostHog `opt_out_capturing()`.
- `customer-portal/app/lib/analytics-consent.ts`: HMAC-SHA256 pseudonymization of email identifiers and server-side attribution header parsing (`x-nebula-attribution`).

---

## 6. Scheduled Operations & Daemons

### 6.1 Cron Schedule (`crontab -l`)

```cron
# Health and Monitoring
*/5 * * * * /home/mike/nebula/scripts/health-check.sh >> /home/mike/nebula/logs/health-check.log 2>&1
*/15 * * * * /home/mike/nebula/customer-portal/scripts/health-check.sh >> /home/mike/nebula/logs/route-health-check.log 2>&1
*/5 * * * * /home/mike/.local/bin/uv run --project /home/mike/nebula python /home/mike/nebula/scripts/notify_production_health.py >> /home/mike/nebula/logs/notify_production_health.log 2>&1

# SEO & Acquisition Automated Reviews
0 8 * * 1 /usr/bin/python3 /home/mike/nebula/scripts/gsc_programmatic_review.py >> /home/mike/nebula/logs/gsc_review.log 2>&1
0 22 * * 0 /usr/bin/python3 /home/mike/nebula/scripts/cwv_monitor.py >> /home/mike/nebula/logs/cwv_monitor.log 2>&1
0 10 * * 1 /home/mike/.local/bin/uv run --project /home/mike/nebula python /home/mike/nebula/scripts/gsc_content_refresh.py >> /home/mike/nebula/logs/gsc_content_refresh.log 2>&1

# Database Backups & Benchmarks
12 3 * * * /home/mike/.local/bin/uv run --project /home/mike/nebula python /home/mike/nebula/scripts/backup_databases.py >> /home/mike/nebula/backups/backup.log 2>&1
0 16 * * 1 /home/mike/.local/bin/uv run --project /home/mike/nebula python /home/mike/nebula/scripts/funnel_benchmark.py --send --days 14 >> /home/mike/nebula/scripts/logs/funnel_benchmark_cron.log 2>&1
23 * * * * /home/mike/nebula/scripts/analytics_cron.sh >> /home/mike/nebula/logs/monitors_runner.log 2>&1
```

### 6.2 Systemd Services
- `nebula-nextjs.service`: Next.js production web server on `localhost:3000`.
- `nebula-platform-api.service`: FastAPI platform API on `localhost:8001`.
- `nebula-workspace-app.service`: Workspace app server.
- `postgresql@16-main.service`: PostgreSQL 16 cluster on port 5433.
- `redis-server.service`: Redis cache and session store.
- `cloudflared-tunnel.service`: Cloudflare tunnel ingress.
- `nebula-mcp.service`: Nebula Model Context Protocol server.

---

## 7. Credentials & Configuration Inventory

| Integration | Configuration File / Env Var | Status |
| :--- | :--- | :--- |
| **GSC Service Account** | `~/.claude/skills/seo/scripts/google_auth.py` / OAuth Client Secret | Active, verified against `sc-domain:nebulacomponents.com` |
| **GA4 Service Account** | `~/.claude/skills/seo/scripts/google_auth.py` / GA4 Property `544419051` | Active, verified against `G-KJ9S3450LH` |
| **PostHog Client & Server** | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | Active on `https://us.i.posthog.com` |
| **PostgreSQL Connection** | `PGHOST=/var/run/postgresql`, `PGPORT=5433`, `PGUSER=postgres` | Active peer/socket authentication |
| **Stripe Live Secret Key** | `~/.hermes/.env` (`STRIPE_SECRET_KEY`) | Active, write-authorized |
