# Infrastructure Findings

## INF-1 · Postgres instance posture (P2)
- Second cluster on :5433 with `listen_addresses = localhost,10.0.22.65` (LAN-bound), `max_connections=100`, `statement_timeout=0`, `idle_in_transaction_session_timeout=0`, `log_min_duration_statement=-1` (no slow-query log), `shared_buffers=128MB`.
- App-level pools sum to a worst case >100 connections (SQLAlchemy 30 + asyncpg pools 10+5+5+3+3 + per-request churn pools) against `max_connections=100` — no cross-pool budget (see RES-3).
- Non-Nebula DBs (`ugc_os`, `charterforge_test`) share the instance; pg_hba grants `ugc_os` from all of 10.0.0.0/8.
- **Remediation class:** CONFIGURE. Evidence: live `pg_settings`, pg_hba read.

## INF-2 · Redis unbounded memory; permanent keys possible (P2)
- `maxmemory=0` (unbounded), policy `noeviction`; currently tiny (1.34 MB, 26 keys, all TTL'd). Circuit-breaker state/failure keys and `maintenance:active` have **no TTL** (`platform_api/infra/circuit_breaker.py:29-43`, `infra/maintenance.py:34`) — a stuck maintenance flag requires manual Redis surgery; cardinality of `rl:*` keys is bounded only by identity rotation (see SEC-P1-1).
- **Remediation:** CONFIGURE (maxmemory + TTLs).

## INF-3 · systemd unit asymmetries (P2)
- `nebula-nextjs.service`: `ReadWritePaths=/home/mike/nebula` (entire repo writable by the web process), no MemoryMax/CPU cap (NODE_OPTIONS heap 4 GB but cgroup uncapped), `ExecReload=/bin/kill -HUP` (npm does not implement reload semantics), StartLimit 5/60 s + RestartSec 10 (storm-protected).
- `nebula-platform-api.service`: MemoryMax=2G, TasksMax=256, but **no** ProtectSystem/PrivateTmp hardening beyond NoNewPrivileges+PrivateTmp; docs URL says `.shop`.
- Drop-in `headers.conf` edited same-day as D13 fix; NODE_OPTIONS raises max-http-header-size to 128 KB to survive cookie bloat — treats symptom of unlock-cookie accumulation (pruning exists in proxy.ts but pre-cap 431s motivated it).
- **Remediation:** CONFIGURE. Risk: low; test restarts in maintenance window.

## INF-4 · Stale/orphan processes on production host (P2)
- Orphan `next-server` PID 1298444 (started 11:53, PPID 1) still bound `*:4173` serving an older build — confusion hazard and port squatting; two stray `http.server` processes (see SEC-P0-2); long-running `jest --detectOpenHandles` (~1 GB RSS) since 06:43 on the prod host.
- **Remediation:** REMOVE + guardrail (deploy script should reap orphans; dev workloads belong off this host).

## INF-5 · Cloudflare Tunnel is single ingress for many estates (P2)
- One tunnel serves nebulacomponents (.com/.shop), MCP hosts, n8n host, launchcrate.io, workers.dev path, and a catch-all → localhost:3000. Blast radius: one tunnel process failure takes down every property; catch-all means any future hostname typo silently routes to the storefront.
- cloudflared runs as **root** with config under `/home/mike/.cloudflared` (root reading mike's home).
- **Remediation:** CONFIGURE (dedicated user, explicit hosts, drop catch-all). 

## INF-6 · Backups exist; restore drills unevidenced (P2)
- Daily `backup_databases.py` at 03:12 (runs verified through 2026-08-21; retention appears ~7 daily dirs); `tests/test_backup_databases.py` exists. No restore-rehearsal evidence or off-host copy found in review window.
- **Remediation:** TEST (documented restore drill) — plan-only.

## INF-7 · Filesystem growth (P3)
- Three Next build trees coexist (`.next` 485 MB, `.next-incoming` 197 MB, `.next-previous` 336 MB ≈ 1 GB churn per deploy cycle); `public/` carries 58 MB / 449 legacy `.html` files unreachable by design (proxy 404s them); screenshots dir small (200 KB, 669 PNGs repo-wide). Disk at 42% — no near-term risk.
- **Remediation:** REMOVE (retention policy for `.next-previous`, prune dead HTML after SEO verification).

## INF-8 · Observability gaps at infra layer (P2)
- No slow-query logging; journal is the only app log sink for both services (no persistent file logs/rotation strategy visible for stdout-heavy Next logs); cron logs scattered across `~/nebula/logs`, `ledgers/`, `/var/log/nebula`, `yt_channel/logs`, `scripts/logs`.
- **Remediation:** CONFIGURE (log destinations + retention), DOCUMENT.
