# Performance Findings

Live edge measurements (2026-08-21, Cloudflare HIT where noted):

| Route | Status | HTML bytes | TTFB (total) | Notes |
| --- | --- | --- | --- | --- |
| / | 200 | 162,439 B | 0.09 s | cf-cache HIT age 92 |
| /audit | 200 | 153,196 B | 0.08 s | |
| /pricing | 200 | 168,465 B | 0.12 s | s-maxage=300 + SWR 60 |
| /checkout | 200 | 94,162 B | 0.15 s | |

## PERF-1 · HTML payload weight (P2)
- Marketing pages ship 150–170 KB HTML — large for content pages; likely drivers: inline JSON-LD blocks, extensive inline critical CSS in globals.css pipeline, long Link discovery headers (~1 KB), and RSC flight payload embedded. Not a blocker at current TTFB; budget exists (`scripts/check-bundle-size.mjs`, Lighthouse CI lab budgets in CI job 5) — budgets are lab-only.
- **Remediation:** INVESTIGATE field-data (CrUX/RUM) before optimizing; no action taken per review scope.

## PERF-2 · Cache semantics are coherent post-incident (positive)
- HTML: `public, max-age=0, s-maxage=300, stale-while-revalidate=60` + CF purge step in deploy script (incident-documented fix for MIME/stale-chunk class). `/api/build-info`: `no-store` + CDN no-store — correct for revision truth. Personalized surfaces (workspace) rely on login + no-store defaults. No public caching of personalized data observed.

## PERF-3 · Ledger query growth curve (P3)
- Funnel/SLO queries use correlated NOT EXISTS over full table (`funnel-ledger.ts:647-750`) — fine at 4.7k rows; add time-bounds before 100k. Indexes present for the access paths used.

## PERF-4 · Event-loop contention on FastAPI (P2)
- `/audit/run` waiters poll DB every 0.25 s up to 120 s each; concurrent waiters multiply round-trips and starve heartbeat tasks (RES-4). Push-based completion (LISTEN/NOTIFY or poll backoff) would decouple.
