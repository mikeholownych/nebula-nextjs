# Deployment revision alignment

After a **full rebuild and restart**, these four values must be the same 40-character git SHA:

| Source | How it is set |
|---|---|
| `git rev-parse HEAD` | Commit that was built. |
| `customer-portal/app/lib/build-info.json` `revision` | Written by `node scripts/generate-build-info.mjs` during `npm run build`. Served no-store at `GET /api/build-info`. |
| HTML `X-Nebula-Revision` | Baked at `next build` from `build-info.json` via `next.config.ts` `getBuildRevision()`. |
| FastAPI `GET /healthz` `revision` | `os.getenv("NEBULA_BUILD_REVISION")`, injected by a systemd drop-in on `nebula-platform-api.service`. |

`scripts/deploy_customer_portal.sh` is the coordinated deploy:

1. Probe FastAPI `GET /audit/accept` (must not be 404).
2. Build Next into `.next-incoming` (`NEXT_DIST_DIR`) while the live process keeps serving `.next`. Never run `next build` over the directory the running server is reading — that is the 2026-08-21 ChunkLoadError / sitemap 500 class.
3. Stamp `NEBULA_BUILD_REVISION` on `nebula-platform-api.service` to `git rev-parse HEAD` and restart the API unit.
4. Stop Next, swap `.next-incoming` → `.next`, start Next.
5. Run `verify_production_services.sh` (fails if Next JSON SHA ≠ FastAPI `/healthz` SHA ≠ HEAD).
6. Purge Cloudflare.

Portal `/api/audit/start` calls FastAPI `POST /audit/accept`. The deploy script probes `GET http://127.0.0.1:8001/audit/accept` (405/400 means the POST route exists; production FastAPI does not serve `/openapi.json`) and **refuses to swap Next** on 404 or connect failure.

Operator order for the audit-runner cutover still applies before the first accept-capable API:

1. Apply `platform_api/migrations/20260820_audit_runner_queue.sql` on **nebula_audit**.
2. Restart `nebula-platform-api.service`.
3. Run `scripts/deploy_customer_portal.sh`.

Do not write a SHA into systemd from a docs or CI change. The deploy script is the stamp.

Check after deploy:

```bash
git rev-parse HEAD
jq -r .revision customer-portal/app/lib/build-info.json
curl -sSI http://127.0.0.1:3000/ | awk 'tolower($1)=="x-nebula-revision:"{print $2}'
curl -sS http://127.0.0.1:8001/healthz | jq -r .revision
```

`scripts/verify_production_services.sh` compares FastAPI `GET http://127.0.0.1:8001/healthz` `.revision` with Next `GET /api/build-info` `.revision` and fails if they disagree. It does **not** write systemd drop-ins or restart units.

`/api/build-info` remains `Cache-Control: no-store`. Do not cache that JSON at the edge.
