# Wave 4 Report — Deployment & Operations
| Item | Outcome |
| --- | --- |
| CI-5 | Migration step integrated into deploy (after good build, before any restart; failed apply leaves live release untouched). Proven in real deploys (deploy12-14 logs) |
| CI-6 gaps | FastAPI readiness wait after restart fixed false-positive rollback race; revision coherence re-verified across deploys |
| CI-7/INF-6 | Restore rehearsal executed: today's backup restored into throwaway DBs (row counts sane), then full tracked-migration apply on the fresh host — zero errors |
| INF-4 | Orphan next-server (:4173 stale build) killed — it was also poisoning e2e via webServer reuse. Deploy now reaps init-parented next-servers post-verify |
| INF-5 | Tunnel catch-all → http_status:404 (typo hosts no longer silently hit storefront); config.yml 0400 + stale .bak removed; mcp/api/.com/.shop hosts re-verified live after restart. Remaining (operator window): non-root tunnel user |
| INF-8 | Postgres slow-query log enabled at 500ms (ALTER SYSTEM + reload verified) |
| DOC-1..9 | CLAUDE.md :8765 claim corrected (now documents RESERVED-EMPTY + watchdog alerting); CONTEXT.md ingress model/workspace auth/changelog updated; unit Documentation URL fixed; docs/architecture/public-api-model.md written (exposure classes, machine-client contract, n8n secret requirement) |
