# PostHog Self-driving setup report

_Generated 2026-07-23 - Nebula customer portal (Next.js 16 App Router)_

## Summary

PostHog Self-driving has been configured for the Nebula customer portal. Error Tracking, Session Replay, Support/Conversations, health-check, and GitHub Issues signal sources are now armed; the scout troop is tuned to three active scouts (general, product-analytics, revenue-analytics). Findings will start appearing in your Self-driving inbox within ~30 minutes: https://us.posthog.com/project/525183/inbox

---

## AI data processing

**Approved.** Organisation-level AI data processing consent was confirmed before this run started.

---

## GitHub

**Already connected.** Integration `Nebula-Components` (id: 189365) was present before setup began - no action needed.

---

## Products enabled

The `products-enable` tool is not exposed in this project's current API token scopes, so the server-side product flips could not be made programmatically. The `posthog.init` in `instrumentation-client.ts` was checked and is clean - no overrides that would suppress Replay or Error Tracking. The signal sources below are armed regardless; they become active as soon as the products are enabled.

| Product | Status | Notes |
|---|---|---|
| Session Replay | **Follow-up required** | Enable at https://us.posthog.com/project/525183/settings/environment-replay. Client init does not disable it (`disable_session_recording` not set). |
| Error Tracking | **Likely already active** | `capture_exceptions: true` is set in `instrumentation-client.ts`. Confirm in project settings. |
| Support (Conversations) | **Follow-up required** | Enable the product in project settings, then connect an inbound channel (email / inbox / Slack) before tickets reach the inbox. |

---

## Signal sources

All sources were newly created (no pre-existing rows).

| Source product | Source type | Action |
|---|---|---|
| `signals_scout` | `cross_source_issue` | **On by default** - no row needed; scout findings reach the inbox automatically. |
| `health_checks` | `health_issue` | **Enabled** (id: 019f8e87-4974-79ae-85d1-12042ac12127) |
| `error_tracking` | `issue_created` | **Enabled** (id: 019f8e87-4c4c-7d00-b5e3-fc4e64eb0d5f) |
| `error_tracking` | `issue_reopened` | **Enabled** (id: 019f8e87-4e1c-79c7-9423-aabad71597b9) |
| `error_tracking` | `issue_spiking` | **Enabled** (id: 019f8e87-5244-7384-bce5-0fc1071bfe85) |
| `conversations` | `ticket` | **Enabled** (id: 019f8e87-5470-7acc-bbd8-51b4a389091f) - dormant until a support channel is connected |
| `session_replay` | `session_analysis_cluster` | **Enabled** (id: 019f8e87-6b61-7b5e-ba46-f41dfe88111c) - sample rate 0.1 |
| `github` | `issue` | **Enabled** (id: 019f8e8a-985a-74de-96c2-a428099cac3d) - live, backed by warehouse source below |
| `llm_analytics` | - | **Skipped** - no LLM/AI usage detected in this project |
| `logs` | - | **Skipped** - PostHog logs product not in use |

---

## Connected tools

| Tool | Status |
|---|---|
| GitHub Issues | **Connected by this setup.** Warehouse source id: `019f8e8a-83f0-0000-bdfb-205d5b3f1a8e`, repo: `Nebula-Components/nebula-components`, syncing `issues` table (incremental on `updated_at`). First sync started automatically. Only the `issues` table is syncing - additional tables (pull requests, etc.) can be enabled in the PostHog data warehouse UI. |
| Linear, Jira, GitLab, Gitea, Shortcut, Sentry, Rollbar, Bugsnag, Honeybadger, Raygun, Zendesk, Freshdesk, Freshservice, Front, Gorgias, Kustomer, Dixa, Plain, pganalyze, Snyk, SonarQube, Semgrep, Rapid7 InsightVM, Featurebase, Frill, Aha, UserVoice, Productboard, Canny, AskNicely, Retently, Appfigures, AppFollow, Judge.me | **Not used** - not selected during setup. |

---

## Scout troop

27 scouts materialized. 3 active; 24 disabled.

### Active (3)

| Scout | Reason |
|---|---|
| `signals-scout-general` | Always on - cross-product correlations and surfaces no specialist covers. Was already enabled at materialisation. |
| `signals-scout-product-analytics` | **Enabled.** Primary product surface: 10 custom events, saved funnel insight (Audit → Email → Purchase), conversion tracking. Watches saved funnels for rate regressions. |
| `signals-scout-revenue-analytics` | **Enabled.** Stripe confirmed in production (`stripe` package, `purchase_completed` and `invoice_payment_succeeded` Stripe webhook events). Watches for Stripe sync stalls, capture regressions, and goal-miss escalations. |

### Disabled (24)

| Scout | Reason |
|---|---|
| `signals-scout-error-tracking` | Covered by native source - error tracking events reach the inbox via the `error_tracking` source rows above. No scout needed. |
| `signals-scout-session-replay` | Covered by native source - replay analysis reaches the inbox via the `session_replay` source above. No scout needed. |
| `signals-scout-ai-observability` | No `$ai_*` events or LLM SDK detected. Re-enable if you add LLM analytics. |
| `signals-scout-anomaly-detection` | Disabled to keep troop small; `signals-scout-general` handles cross-product anomalies. Re-enable if you want dedicated anomaly scanning of dashboards/insights. |
| `signals-scout-apm` | No OpenTelemetry / APM spans configured. Re-enable if you add distributed tracing. |
| `signals-scout-conversations` | Disabled to keep troop small. Re-enable once a support channel is connected and tickets start flowing. |
| `signals-scout-csp-violations` | No CSP reporting configured. Re-enable if you add a `Content-Security-Policy` with PostHog reporting. |
| `signals-scout-customer-analytics` | No group/account analytics usage detected. Re-enable if you add B2B account-level tracking. |
| `signals-scout-data-pipelines` | No CDP destinations, batch exports, or hog flows detected. Re-enable if you add pipelines. |
| `signals-scout-data-warehouse` | No active warehouse imports beyond GitHub Issues (just connected). Re-enable once more sources are syncing. |
| `signals-scout-experiments` | No active A/B experiments detected. Re-enable when experiments are running. |
| `signals-scout-feature-flags` | No feature flag usage detected in this repo. Re-enable if you add flags. |
| `signals-scout-health-checks` | Covered by native source - health issues surface via the `health_checks` source above. |
| `signals-scout-inbox-validation` | Not useful on a fresh setup - no resolved reports to validate yet. Re-enable after a few weeks of inbox use. |
| `signals-scout-ingestion-warnings` | Disabled to keep troop small. Re-enable if you see data quality issues. |
| `signals-scout-insight-alerts` | No configured alerts detected. Re-enable if you set up insight alerts. |
| `signals-scout-logs` | PostHog logs product not in use. Re-enable if you connect logs. |
| `signals-scout-mcp-tool-calls` | No `$mcp_tool_call` telemetry in this project. |
| `signals-scout-observability-gaps` | Disabled to keep troop small; `signals-scout-general` covers broad coverage gaps. Re-enable for dedicated gap analysis. |
| `signals-scout-replay-vision` | Replay Vision scanners not configured. Re-enable if you set them up. |
| `signals-scout-skills-store` | Disabled to keep troop small. |
| `signals-scout-surveys` | No surveys in use (0 surveys found). Re-enable if you add surveys. |
| `signals-scout-web-analytics` | No explicit web analytics / UTM tracking confirmed. Re-enable if you add UTM capture or referrer tracking. |
| `signals-scout-web-vitals` | Disabled to keep troop small. Re-enable if you want Core Web Vitals (LCP/INP/CLS) per-page monitoring. |

---

## Custom scouts

**Two candidates proposed; user declined.**

### Surfaces considered

| Candidate | Surface | Filter that killed it |
|---|---|---|
| `signals-scout-audit-pipeline` | Server-side audit processing health - watches whether URL submissions lead to server-side processing confirmations (silent backend failure detection) | Proposed to user; declined |
| `signals-scout-email-unlock` | Email unlock server reliability - watches whether email submissions lead to server-side results delivery (email API / unlock failure detection) | Proposed to user; declined |

Both candidates had concrete discriminators and explore patterns. If the troop turns noisy, you can switch any scout to dry-run by setting `emit: false` on its config in PostHog settings - it will keep running and logging but write nothing to the inbox.

If you want to add these later: the gap analysis is documented above. Both are liveness/absence watchers comparing a client-side submission event against the corresponding server-side confirmation event.

---

## Follow-ups

- [ ] **Enable Session Replay** in project settings: https://us.posthog.com/project/525183/settings/environment-replay
- [ ] **Confirm Error Tracking is on** in project settings (likely already active via `capture_exceptions: true`, but verify the toggle is enabled server-side).
- [ ] **Enable Support (Conversations)** in project settings, then connect an inbound channel (email / inbox / Slack) so support tickets start reaching the inbox.
- [ ] **Connect source maps** for Error Tracking - wire `posthog-cli sourcemap` (or your bundler's upload step) into CI so production stack traces de-minify in the PostHog error tracking UI.
- [ ] **Returning-visitor identify** - ensure users who reload the audit results page while already identified are re-identified (store distinct ID in the unlock cookie or localStorage). Currently `identify` is called only on email submit (noted in the integration wizard report).

---

## What happens next

The scout coordinator picks up the newly-enabled configs within ~30 minutes and fires each scout on its first tick. Findings cluster into reports in your inbox at https://us.posthog.com/project/525183/inbox - immediately-actionable ones can be opened, assigned, and used to start coding tasks. The GitHub integration means Self-driving can look at your repo code when investigating findings and open PRs for fixes.

The GitHub Issues sync will complete its first incremental load automatically; issues will start appearing in the warehouse and feeding the inbox responder once synced.
