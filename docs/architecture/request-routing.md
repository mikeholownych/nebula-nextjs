# Request routing and process topology

## Scope and evidence status

This document is the OPS-01 baseline captured on **2026-07-13**. It deliberately separates the observed live state from the proposed migration design. No production service, tunnel, Caddy configuration, scheduled job, or external system was changed while producing this baseline.

The process IDs below are point-in-time observations, not stable identifiers. The generated-content jobs `audit-to-case-study` and `learning-centre-refresh` were paused for baseline capture.

## Observed live state

### Current request path

For the primary Nebula hostnames, the request path is:

```text
Internet
  |
  v
Cloudflare Tunnel 8cfcc2e1-cf49-4d57-b412-c1ec0474ffd2
cloudflared-tunnel.service (root, cloudflared 2026.7.1)
config: /home/mike/.cloudflared/config.yml
  |
  | nebulacomponents.shop, www.nebulacomponents.shop -> localhost:8765
  v
nebula-site.service (mike, PID 4075913 at capture)
/usr/bin/python3 /home/mike/nebula/agentic_server.py 8765
  /home/mike/nebula nebulacomponents.shop
bind: 0.0.0.0:8765
  |
  | /api/stats is application-proxied
  v
nebula-webhook.service (mike, PID 4105913 at capture)
/usr/bin/python3 /home/mike/nebula/webhook_server.py
bind: 0.0.0.0:9000
```

Cloudflare currently sends the whole `nebulacomponents.shop` and `www.nebulacomponents.shop` path space to `localhost:8765`. Therefore public pages, Stripe, tracking, CRM, discovery documents, and current APIs first reach `agentic_server`. The `/api/stats` handler in `agentic_server` proxies to `webhook_server` on port 9000.

Other observed tunnel rules route the blog to port 8766 and LaunchCrate traffic to ports 8767/8768. Those applications are outside this package. The ingress list ends with a terminal 404 rule, which must remain terminal.

### Active listeners and processes

| Component | Supervisor / user | Command or version | Observed bind | Main-host disposition |
| --- | --- | --- | --- | --- |
| `agentic_server` | `nebula-site.service` / `mike` | `/usr/bin/python3 /home/mike/nebula/agentic_server.py 8765 /home/mike/nebula nebulacomponents.shop` | `0.0.0.0:8765` | Direct Cloudflare origin for both Nebula hostnames |
| `webhook_server` | `nebula-webhook.service` / `mike` | `/usr/bin/python3 /home/mike/nebula/webhook_server.py` | `0.0.0.0:9000` | Reached through the current `/api/stats` application proxy; also referenced by Caddy routes |
| `cloudflared` | `cloudflared-tunnel.service` / `root` | `cloudflared` 2026.7.1, tunnel `8cfcc2e1-cf49-4d57-b412-c1ec0474ffd2` | outbound tunnel | Selects `localhost:8765` for the Nebula hostnames |
| Caddy | active / `caddy:caddy` | Caddy 2.11.4 | ports 80 and 8080 | **Not in the current main-hostname request path** |
| PostgreSQL | existing database service | PostgreSQL | `127.0.0.1:5432` | Internal only; not an HTTP route owner |

### Caddy disposition

Caddy is active. Its `:8080` configuration proxies `/api/stats`, `/api/health`, and `/webhook/*` to port 9000, `/blog*` to port 8766, and `/` to port 8765. The current Cloudflare rules for the Nebula hostnames do **not** target Caddy, so Caddy is not currently in their request path. This baseline does not infer why Caddy exists. A future change must either preserve its separate purpose or explicitly retire it; it must not accidentally add an undocumented proxy hop or loop.

### Current ownership by route family

The machine-readable source of truth is [`config/service-route-manifest.yaml`](../../config/service-route-manifest.yaml). Its rules are ordered from specific protected/dynamic routes toward the public default.

### Machine-checked route contract

Run `venv/bin/python3 scripts/validate_service_routes.py --source agentic_server.py` before accepting a route-map change. The validator parses the Python source with `ast` only; it never imports or executes the server and never reads runtime tokens or environment values. It extracts constant exact, membership, `startswith`, and statically knowable regular-expression path tests with source line and function context. Every extracted contract must be owned by an exact, prefix, or regex manifest rule. The public default is not accepted as coverage for a Python route contract. A selector that cannot be resolved statically fails unless its stable diagnostic identifier has a non-empty reason in `route_contract_exclusions`.

Manifest selectors are ordered. An exact route must precede a broader prefix when routing ownership, upstream, or transition gate differs, and a narrower prefix must likewise precede a broader one. Duplicate prefixes, equivalent regexes, and unsafe regex overlap fail validation. `path_regex` expressions must compile, begin with `^/`, and either end in `$`/`\\Z` or declare `regex_mode: prefix`; root catch-alls and nested quantified expressions are forbidden.

Current and target owners must be declared services. Owner changes and targets whose service is `target_not_live` require a named verifiable gate; boolean, `complete`, and `deployed` gates are rejected. Protected Python route classes cannot target Next, Stripe remains an exact route gated by `verified_idempotent_stripe_processor`, and the public default remains gated by `final_public_cutover`.

| Route or family | Observed current owner | Current behavior |
| --- | --- | --- |
| `/stripe-webhook` | `agentic_server` | Remains on the legacy handler; migration is blocked on the verified idempotent processor |
| `/api/platform/*` | `agentic_server` at the current all-path origin | Reserved for target `platform_api`; the target service is not live in this baseline |
| `/api/crm*` | `agentic_server` | Must remain on the existing service until explicitly migrated |
| `/api/stats` | `agentic_server` -> `webhook_server` | Application proxy from 8765 to 9000 |
| `/.well-known/*`, `/auth.md`, `/llms.txt`, `/openapi.json`, `/agent/*` | `agentic_server` | Discovery and agent protocol routes remain protected from frontend-default migration |
| `/track/*`, legacy webhooks, and current `/api/*` | `agentic_server` | Stay on the existing service until explicitly migrated |
| Public page families and public default | `agentic_server` | Current Cloudflare hostname default is port 8765 |
| Unknown host | terminal 404 | Must never fall through to an application default |

## Current risks

1. The current Stripe route is not the target verified idempotent processor. It must not be used as a rollback destination after the secure processor is activated.
2. `agentic_server` and `webhook_server` bind to `0.0.0.0`, broader than the loopback-only target boundary.
3. `cloudflared-tunnel.service` currently runs as root; the target is a bounded unprivileged service account.
4. Caddy exposes an overlapping route map on port 8080 even though it is not in the primary hostname path. Pointing the tunnel at it without a reviewed disposition could introduce an extra hop, ownership divergence, or a proxy loop.
5. `/api/stats` currently has a two-process ownership chain (`agentic_server` proxying to `webhook_server`), so health of port 8765 alone does not prove stats availability.
6. A broad public default can move protected Python routes to Next if ordered rules or the terminal unknown-host rule are lost.
7. Process IDs are ephemeral and the paused content jobs mean this is a controlled baseline, not evidence that generated content remains static indefinitely.

## Target design (not yet live)

The intended topology removes ambiguity by making Cloudflare Tunnel the documented path router and keeping application services on loopback:

```text
Internet
  |
  v
Cloudflare Tunnel (ordered hostname/path rules; terminal unknown-host 404)
  |-- /stripe-webhook ----------------------> platform_api 127.0.0.1:8770
  |      only after verified_idempotent_stripe_processor
  |-- /api/platform/* ----------------------> platform_api 127.0.0.1:8770
  |-- protected/current Python routes ------> agentic_server 127.0.0.1:8765
  |      /api/stats may continue -----------> webhook_server 127.0.0.1:9000
  `-- approved public page families --------> Next 127.0.0.1:3000
         family-by-family canary; public default only at final cutover

PostgreSQL remains internal at 127.0.0.1:5432.
```

This is a target design, not an assertion that Next or `platform_api` is currently running. Caddy is not inserted into this target path unless a later reviewed design explicitly assigns it a role.

### Route-family cutover order

Every family remains on `agentic_server` until its named parity/canary gate succeeds. Activate in this order:

1. compatibility probe (when available),
2. case studies,
3. learning centre, including UK/US aliases,
4. repeatable content (articles, comparisons, and products),
5. static marketing pages,
6. interactive marketing pages,
7. homepage,
8. public default, only after `final_public_cutover`.

After each family, verify status, redirect/canonical behavior, H1 and critical CTA, GA4 events, Stripe links, accessibility, and browser console/network results. `/stripe-webhook`, `/api/platform/*`, CRM, stats, discovery, tracking, and current public APIs are independent security/ownership routes and must not be captured by a frontend family rule.

## Rollback rule

Route canaries must be reversible without a code rollback. Before any future production route edit, copy the active tunnel configuration to a timestamped, permission-preserving backup and validate both the candidate and backup. The operational rollback is to restore that exact last-known-good configuration, restart `cloudflared-tunnel.service`, and probe every representative protected and public route plus the terminal unknown-host 404.

Rollback immediately on route loss, canonical corruption, failed health/readiness, payment or webhook regression, or cross-tenant access. Do not wait for aggregate metrics. Roll back only the affected public family to `agentic_server` where possible. Once `/stripe-webhook` has passed `verified_idempotent_stripe_processor` and moved to `platform_api`, rollback must **not** restore unsigned or non-idempotent Stripe processing; hold or fail the route safely while the verified processor is recovered.

No live rollback command was run for this documentation-only package.
