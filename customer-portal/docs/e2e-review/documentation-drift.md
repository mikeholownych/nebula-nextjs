# Documentation Drift

| # | Doc claim | Runtime/code reality | Verdict |
| --- | --- | --- | --- |
| DOC-1 | CLAUDE.md: "Server: localhost:8765 (venv python3)" | :8765 is a stray static `http.server` over repo root; the real API is FastAPI on 8001 | Stale + dangerous (normalizes the P0 server's existence) |
| DOC-2 | CONTEXT.md Ops: "Tunnel exposes :3000 as nebulacomponents.com" | Tunnel also exposes :8001 publicly (api.*), :8002 (mcp.*), workers.dev path, catch-all→3000 | Incomplete — hides SEC-P0-1 surface |
| DOC-3 | platform-api unit `Documentation=https://nebulacomponents.com` | Canonical domain migrated to .com (site-url.conf, proxy redirects) | Stale metadata |
| DOC-4 | CONTEXT.md: "Workspace gated by email (localStorage MVP)" / EmailGate "not a hard auth boundary" | Workspace now uses magic-link/OAuth JWT sessions via requireWorkspaceUser; localStorage gate superseded | Stale |
| DOC-5 | CONTEXT.md change log stops at 2026-08-17 | D1–D13 QA fixes, D13 header drop-in, queue migration all post-date it | Drift by omission |
| DOC-6 | deploy/systemd/README.md manual sequence | Superseded by scripts/deploy_customer_portal.sh (which references README for rationale) | Partially stale; keep as rationale doc |
| DOC-7 | CLAUDE.md Stripe key location guidance (~/.hermes/.env) | True, but live key ALSO in systemd stripe.conf drop-ins and root .env — doc understates secret spread | Incomplete (SEC-P0-2) |
| DOC-8 | docs/architecture/current-state-architecture.md vs observed topology | Broadly accurate for services/ports; silent on api.* public ingress and second Postgres cluster port binding to LAN | Gap |
| DOC-9 | Rate-limit documentation (if any) vs rate_limit.py classes/fail-modes | No operator-facing doc found describing fail-open vs fail-closed classes | Gap |

**Rule applied:** where docs, code, config, and runtime disagree, runtime was treated as authoritative and the disagreement recorded above.
