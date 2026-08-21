# Deployment revision alignment

After a **full rebuild and restart**, these four values must be the same 40-character git SHA:

| Source | How it is set |
|---|---|
| `git rev-parse HEAD` | Commit that was built. |
| `customer-portal/app/lib/build-info.json` `revision` | Written by `node scripts/generate-build-info.mjs` during `npm run build`. Served no-store at `GET /api/build-info`. |
| HTML `X-Nebula-Revision` | Baked at `next build` from `build-info.json` via `next.config.ts` `getBuildRevision()`. |
| FastAPI `GET /healthz` `revision` | `os.getenv("NEBULA_BUILD_REVISION")`, injected by a systemd drop-in on `nebula-platform-api.service`. |

A portal-only deploy (`scripts/deploy_customer_portal.sh`) rebuilds Next, restarts `nebula-nextjs.service`, and verifies origin `/api/build-info` against HEAD. It does **not** stamp `NEBULA_BUILD_REVISION` and does **not** restart the API. Until the API drop-in is updated and that unit is restarted, `/healthz` can disagree with the portal SHA.

Portal `/api/audit/start` calls FastAPI `POST /audit/accept`. The deploy script probes `GET http://127.0.0.1:8001/audit/accept` (405 means the POST route exists; production FastAPI does not serve `/openapi.json`) and **refuses to restart Next** on 404 or connect failure.

Operator order for the audit-runner cutover:

1. Apply `platform_api/migrations/20260820_audit_runner_queue.sql` on **nebula_audit**.
2. Restart `nebula-platform-api.service`.
3. Run `scripts/deploy_customer_portal.sh` (Next rebuild + restart).
4. Stamp FastAPI `NEBULA_BUILD_REVISION` and restart the API unit only as the explicit SHA-alignment step.

Do not write a SHA into systemd from a docs or CI change. Stamp the API only as an explicit operator step during a coordinated deploy (commented sequence in `scripts/deploy_customer_portal.sh`).

Check after deploy:

```bash
git rev-parse HEAD
jq -r .revision customer-portal/app/lib/build-info.json
curl -sSI http://127.0.0.1:3000/ | awk 'tolower($1)=="x-nebula-revision:"{print $2}'
curl -sS http://127.0.0.1:8001/healthz | jq -r .revision
```

`scripts/verify_production_services.sh` compares FastAPI `GET http://127.0.0.1:8001/healthz` `.revision` with Next `GET /api/build-info` `.revision` and fails if they disagree. It does **not** write systemd drop-ins or restart units.

`/api/build-info` remains `Cache-Control: no-store`. Do not cache that JSON at the edge.
