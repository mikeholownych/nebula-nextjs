# Worktree Hygiene Review

Date: 2026-08-25

## Safe Feature Commit Scope

The verified agency workspace release is limited to the Phase A to C platform routes, migrations, tests, the complete `workspace-app` source tree, its package manifests and service unit, and the object-storage evidence. These files were live-tested separately and must be staged as one coherent release, not mixed with customer-portal content or competitor analytics work.

## Separate Review Streams

- Customer portal workspace cutover and redirect changes.
- Competitor project-domain changes and migration `0006_competitor_project.py`.
- SEO and marketing content changes.
- Findings sync and signal-intent services.
- Operational ledgers, queues, and state files.

## Sensitive Or Generated State

- `yt_channel/creds/token.pickle` is tracked despite the directory being ignored. Do not commit it. Rotate the credential and remove it from tracking in a separately documented cleanup.
- `error_enricher_state.json`, ledgers, queues, AI visibility captures, SEO reports, benchmark logs, email files, and TypeScript build metadata are runtime or generated artifacts. New instances are now ignored where appropriate; existing tracked files require an explicit tracking-policy change.

## Preserved Report History

The client-audit report was preserved separately from the original billing report. The original billing report remains at `.superpowers/sdd/task-2-report.md`; the client report remains in the local excluded `.superpowers/sdd/` evidence area.

## Explicit Non-actions

No unrelated source, ledger, credential, or customer content was deleted or reverted. No files were staged, committed, or pushed.
