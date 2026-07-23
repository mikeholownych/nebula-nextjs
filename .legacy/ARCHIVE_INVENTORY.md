# Repository drift archive inventory

Date: 2026-07-20 UTC
Task: `t_a043bfba`
Policy: preserve first; never delete untracked work without a paper trail.

## Baseline

The reported “1196 changed/untracked paths” was confirmed as 11 tracked modifications plus 1182 untracked files (1193 current paths; Git's top-level summary collapsed the generated directories). Most untracked volume came from reproducible Citable audit runs and snapshots.

## Recovery snapshot

- Archive: `.legacy/repo-drift-t_a043bfba/recovery-before-hygiene.tar.gz`
- SHA-256: `68228d907972772063dbae723bdfff3b67309dcf02b932d2e63d07300be1eaf4`
- Size at creation: 7,042,330 bytes for the containing archive directory.
- Scope: every modified and untracked path reported before the archive move.

## Generated drift moved into `.legacy/`

| Original path | Archived path | Files | Classification |
| --- | --- | ---: | --- |
| `.citable/runs/` | `repo-drift-t_a043bfba/generated/root-citable/runs/` | 183 | generated audit runs |
| `.citable/snapshots/` | `repo-drift-t_a043bfba/generated/root-citable/snapshots/` | 3 | generated audit snapshots |
| `customer-portal/.citable/runs/` | `repo-drift-t_a043bfba/generated/customer-portal-citable/runs/` | 945 | generated audit runs |
| `customer-portal/.citable/snapshots/` | `repo-drift-t_a043bfba/generated/customer-portal-citable/snapshots/` | 18 | generated audit snapshots |
| `nebulacomponents.shop-Coverage-2026-07-19.zip` | `repo-drift-t_a043bfba/generated/coverage/` | 1 | browser coverage export |

Total generated files archived: 1,150.

## Preserved working changes

No source/config/test/ledger changes were deleted or restored. The remaining 47 paths comprise:

- 11 tracked modifications: AI-DLC audit history, Citable projection content/package metadata, and live operational ledgers.
- 26 Citable YAML project/config files retained as potential source-of-truth configuration.
- 4 Citable projection source artifacts retained: workflow, test, release JSON, and sync script.
- 3 deployment unit artifacts and documentation added by this task.
- 3 Python/shell source or tests retained: audit-delivery monitor, its test, and production service verifier.

The retained paths remain visible in `git status --short --untracked-files=all` for review by their owning workstreams.

## Recurrence prevention

`.gitignore` now excludes only reproducible Citable `runs/` and `snapshots/` directories plus dated browser coverage exports. It deliberately does not ignore Citable YAML configuration or application source.

## Outbound bypass archive — 2026-07-23 UTC

Policy: buyer-facing delivery now has one authority: `agentmail_client.py` backed by `outbound_release_gate.py`. Obsolete direct SMTP/raw REST scripts were preserved, not deleted.

| Original path | Archived path | Reason |
| --- | --- | --- |
| `auto_respond_to_audit_interest.py` | `.legacy/outbound-bypasses-2026-07-23/auto_respond_to_audit_interest.py` | Direct AgentMail SMTP bypass; superseded by webhook + gated reply path |
| `auto_responder_dual_funnel.py` | `.legacy/outbound-bypasses-2026-07-23/auto_responder_dual_funnel.py` | Direct AgentMail SMTP bypass; no active scheduler reference |
| `auto_responder_dual_inbox.py` | `.legacy/outbound-bypasses-2026-07-23/auto_responder_dual_inbox.py` | Raw REST bypass; superseded by centralized AgentMail client |
| `manual_pitch_danny.py` | `.legacy/outbound-bypasses-2026-07-23/manual_pitch_danny.py` | One-off raw REST sender; historical send already recorded |
| `warmup.py` | `.legacy/outbound-bypasses-2026-07-23/warmup.py` | Obsolete LaunchCrate warmup using raw REST and artificial traffic |
| `adapters/agentmail.py` | `.legacy/outbound-bypasses-2026-07-23/adapters-agentmail.py` | Unreferenced generic raw-HTTP adapter loading credentials from `/tmp`; canonical client supersedes it |
| `send_pushy_email.py` | `.legacy/outbound-bypasses-2026-07-23/send_pushy_email.py` | One-off sender that marked release-gate blocks as successful delivery |
| `resend_client.py` | `.legacy/outbound-bypasses-2026-07-23/resend_client.py` | Direct Resend fallback bypass; AgentMail REST is the exclusive provider |
| `auto_responder.sh` | `.legacy/outbound-bypasses-2026-07-23/auto_responder.sh` | Malformed Gmail IMAP/SMTP prototype with stale offer copy |
| `cron_jobs` | `.legacy/outbound-bypasses-2026-07-23/cron_jobs` | Obsolete scheduler fragment that invoked the SMTP prototype |
| `send_alert.py` | `.legacy/outbound-bypasses-2026-07-23/send_alert.py` | Placeholder localhost SMTP alert bypass |
| `tunnel_alert.py` | `.legacy/outbound-bypasses-2026-07-23/tunnel_alert.py` | Placeholder Gmail SMTP alert with dummy credentials |
| `check_inbox_and_respond.py` | `.legacy/outbound-bypasses-2026-07-23/check_inbox_and_respond.py` | Empty infinite-loop SMTP prototype superseded by `reply_monitor.py` |

No active Hermes cron job referenced the original seven files at archive time. The later six-file cleanup removed one tracked obsolete cron fragment; live scheduling is governed separately. `full_system_audit.py` and `validate_before_campaign.py` now validate the canonical gated REST path instead.

### Historical outreach-wave directory cutover — 2026-07-23 UTC

The 40 tracked scripts formerly under `archived/` were moved intact to
`.legacy/outreach-wave-archive-2026-07-23/`. They are historical campaign,
SMTP, IMAP, and wave-execution artifacts, have no active code references, and
must not be interpreted as permitted provider paths. Git history plus this
move provide the rollback trail; no file was deleted.

## Reply ledger cutover — 2026-07-23 UTC

| Original path | Canonical replacement | Preservation / rollback |
| --- | --- | --- |
| `replied_emails.jsonl` | `outbound_delivery.db` v2 tables `reply_threads`, `reply_suppressions`, and versioned `gate_state` manifest | Migrated under a cross-process cutover lock with source SHA-256/count parity; retained locally as an ignored migration artifact; WAL-safe pre-v2 backup and frozen source are stored permission-restricted under `.legacy/runtime-reply-cutover/` (ignored runtime archive) |

All active writers, suppression checks, follow-up prefilters, processed-thread deduplication, sequence metrics, and TRIBE queue reads use `OutboundReleaseGate`. V2 separates immutable thread facts from monotonic recipient suppression and leased downstream-action state. A corrupt or conflicting legacy ledger records `reply_ledger_corrupt` and blocks delivery; missing uninitialized state blocks delivery rather than assuming an empty suppression history.

## Test-suite cutover — 2026-07-23 UTC

| Original path | Archived path | Reason |
| --- | --- | --- |
| `tests/test_dashboard_live_data.py` | `.legacy/tests-pre-cutover-2026-07-23/test_dashboard_live_data.py` | Targeted retired root `dashboard.html`; the live dashboard is now Next.js |
| `tests/test_demo_semantics.py` | `.legacy/tests-pre-cutover-2026-07-23/test_demo_semantics.py` | Targeted retired root `demo.html`; the live demo is now Next.js |
| `tests/test_platform_route_contract.py` | `.legacy/tests-pre-cutover-2026-07-23/test_platform_route_contract.py` | Targeted retired `agentic_server.py`; route ownership now uses the checked manifest and FastAPI/Next.js tests |
| `tests/test_stripe_security_vulnerabilities.py` | `.legacy/tests-pre-cutover-2026-07-23/test_stripe_security_vulnerabilities.py` | Asserted that fixed Stripe vulnerabilities must remain present and referenced retired server code |
| `tests/test_stripe_webhook_security.py` | `.legacy/tests-pre-cutover-2026-07-23/test_stripe_webhook_security.py` | Broken vulnerability-presence test for retired server code; superseded by `test_stripe_webhook_fixed.py` |
| `tests/platform_api/test_health2.py` | `.legacy/tests-pre-cutover-2026-07-23/test_health2.py` | Duplicate health tests using the removed `AsyncClient(app=...)` API; canonical ASGI transport coverage remains in `test_health.py` |
| `tests/test_ad_burn_leaderboard.py` | `.legacy/tests-pre-cutover-2026-07-23/test_ad_burn_leaderboard.py` | Targeted retired `agentic_server.py` and root static HTML |
| `tests/test_audit_capture_flow.py` | `.legacy/tests-pre-cutover-2026-07-23/test_audit_capture_flow.py` | Targeted retired `agentic_server.py`; live audit email state is covered through FastAPI service tests |
| `tests/test_static_form_labels.py` | `.legacy/tests-pre-cutover-2026-07-23/test_static_form_labels.py` | Targeted retired root `pricing-generator.html`; live forms are Next.js components |
| `tests/test_stripe_webhook_fixed.py` | `.legacy/tests-pre-cutover-2026-07-23/test_stripe_webhook_fixed.py` | Targeted retired `stripe_webhook.py` and `setup_webhook.py`; live Stripe coverage is in the Next.js route suite |
| `test_ga4_tracking.py` | `.legacy/scripts-pre-cutover-2026-07-23/test_ga4_tracking.py` | Broken ad-hoc root script for the retired static site; not a pytest contract |

These files remain in Git history and in `.legacy/`; no test was deleted without a paper trail.
