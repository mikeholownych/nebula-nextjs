# Remediation Progress

Program start: 2026-08-21 ~14:30 UTC · Baseline: e2e-review @ 3715a8b0 (+ pre-existing WIP snapshotted to `backups/wip-pre-remediation-snapshot-20260821.patch` and committed separately as `wip:` commit).

## Sequencing change log
| # | Change | Why | Findings affected |
| --- | --- | --- | --- |
| S-1 | Parallel in-flight feature WIP (batch-scan rate-limit loosening, audit_db rework, GSC routes) found uncommitted in tree at program start | Preserved as its own `wip:` commit before any remediation commits; combined tree validated (typecheck/tests) before any deploy | all waves — deploy gates run against combined tree |

## Wave log
| Wave | Scope | Status |
| --- | --- | --- |
| 0a | SEC-P0-2 containment (stray server killed, secret perms locked) | DONE 2026-08-21 |
| 0b | SEC-P0-1 public-API trust model | IN_PROGRESS |
| 0c | Credential rotation (rotatable set) + guardrails | PENDING |
| 1–7 | per remediation-sequencing.md | PENDING |
