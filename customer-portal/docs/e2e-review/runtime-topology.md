# Runtime Topology (observed 2026-08-21, review window 13:00–14:00 UTC)

Sources: `ps`, `ss -tlnp`, `systemctl status/cat`, live curl probes, Postgres/Redis read-only inspection. Cross-checked against `customer-portal/CONTEXT.md` and CLAUDE.md; discrepancies are flagged in documentation-drift.md.

## Public entrypoints

| Surface | Path | Backing process | Notes |
| --- | --- | --- | --- |
| nebulacomponents.com / .shop | Cloudflare Tunnel `8cfcc2e1…` → `localhost:3000` | `nebula-nextjs.service` (Next 16.3.1, `next start --port 3000`) | Primary site + Next API routes |
| api.nebulacomponents.com | Tunnel → `localhost:8001` | `nebula-platform-api.service` (uvicorn FastAPI) | **Direct public exposure of FastAPI, bypasses Next BFF** — see SEC-P0-1 |
| nebula-api.f489709.workers.dev | Worker → tunnel → `localhost:8001` | same FastAPI | Second public path to the same unauthenticated surface |
| mcp.nebulacomponents.com / .shop | Tunnel → `localhost:8002` | `nebula-mcp.service` (`mcp_server.py --http`) | MCP endpoint answers without an auth challenge (INVESTIGATE) |
| li.nebulacomponents.com | Tunnel → `10.0.8.220:5678` | n8n host | Out of scope but on same tunnel |
| launchcrate.io, sdr.launchcrate.io | Tunnel → localhost:3001/8082 | other apps | Shared tunnel catch-all → localhost:3000 |

## Internal listeners (host)

| Port | Process | Owner | Observation |
| --- | --- | --- | --- |
| 3000 | next-server v16.3.1 (PID 1338708) | mike (systemd) | Live origin |
| **4173** | **next-server v16.3.1 (PID 1298444, started 11:53, PPID 1)** | mike (orphan) | **Stale build still serving, bound `*:4173`** — INF-4 |
| 8001 | uvicorn platform_api.main:app | mike (systemd) | FastAPI |
| 8002 | mcp_server.py | mike (systemd) | MCP |
| **8765** | **`python3 -m http.server` (PID 1047801), cwd `/home/mike/nebula`** | mike (no unit) | **Serves entire repo root incl. `.env`, `secrets/`, `HOT_LEAD.json`; bound `0.0.0.0`** — SEC-P0-2 |
| 8767 | `python3 -m http.server` (PID 917, since boot) | mike | Second static server, `0.0.0.0` |
| 5432 | postgresql 16/main | postgres | loopback |
| **5433** | postgresql 16/main second cluster/port | postgres | `listen_addresses = localhost,10.0.22.65` — **LAN-bound**; hosts `nebula_platform`, `nebula_audit` |
| 6379 | redis-server (host) | redis | loopback only, 26 keys, all TTL'd |
| *:6379 | redis-server inside container netns (user `caddy`) | docker | separate namespace (honcho stack) |
| 8080, 5678 etc. | docker/n8n stack | — | out of scope |

## Databases

- `nebula_platform` (port 5433): auth/orgs/purchases/subscriptions/**active** `analytics_event_ledger` (4,665 events), alembic at `0007_experiments`.
- `nebula_audit`: audits (568 rows: 456 completed / 112 failed), customers (305), monitors, CRM tables, newsletter, `outbox_messages` (13 sent), API keys, **dead duplicates**: empty `analytics_event_ledger`, empty `purchases`, divergent `subscriptions` row.
- Also present: `ugc_os`, `charterforge_test` (non-Nebula DBs sharing the instance).

## Workers / background

- In-process audit runner inside FastAPI: 2 workers, MAX_IN_FLIGHT=2, heartbeat 15 s, sweeper 30 s (`platform_api/services/audit_runner.py`).
- Outbox drain loop every 2–5 s in same process (`platform_api/infra/outbox.py:74-153`).
- Cron (~25 entries): backup_databases 03:12 daily (verified runs through 2026-08-21), tunnel liveliness */5, hot_lead_watcher */5, health-checks */5 & */15, followups 6h, reaudit/competitor/digest/experiment crons, post-purchase drip */2h.
- Host-level stray: `jest --detectOpenHandles` running since 06:43 with ~1 GB RSS on the production host.

## Deployment flow (as-built)

`scripts/deploy_customer_portal.sh`: pre-probe FastAPI accept route → build into `.next-incoming` → stamp `NEBULA_BUILD_REVISION` drop-in (chmod 0400) → restart platform-api → stop nextjs → swap `.next-incoming`→`.next` (previous kept as `.next-previous`) → start → `/api/readyz` poll → `verify_production_services.sh` → Cloudflare purge via token from `~/.hermes/.env`.

Observed identity timeline during review: at 13:04 UTC production served revision `f1046bde` while repo HEAD was `3715a8b0`; a deploy completed ~13:50 bringing all surfaces to `3715a8b0` (build-info builtAt 13:50:26Z; FastAPI `/healthz` revision matches; systemd env stamp matches). Coherent after deploy; the earlier gap means HEAD can lead production between commit and deploy.
