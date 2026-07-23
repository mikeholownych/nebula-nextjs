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

No active Hermes cron job referenced these seven files at archive time. `full_system_audit.py` and `validate_before_campaign.py` now validate the canonical gated REST path instead.
