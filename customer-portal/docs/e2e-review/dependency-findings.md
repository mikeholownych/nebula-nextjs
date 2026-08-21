# Dependency Findings

## Node (customer-portal)
- next 16.3.1, 22 deps / 37 devDeps. `npm audit --omit=dev`: **2 high (ajv, fast-uri), 2 moderate (postcss via next)** — all fixAvailable; security job in CI is advisory-only (`|| true`) so these persist.
- Node runtime: systemd PATH uses system node via npm; CI pins Node 22. Local runtime version not pinned by .nvmrc/engine-strict found in review — INVESTIGATE pinning.

## Python
- Managed via uv (`uv.lock` at root); venv at `.venv`. requirements-*.in/txt split (automation vs platform-api). No known-CVE sweep performed (no pip-audit evidence in repo); flagged as gap rather than finding.

## GitHub Actions
- actions/checkout@v4, setup-node@v4, setup-python@v5, upload/download-artifact@v4 — current majors at review date.

## Duplicated major tooling
- Two test runners configured simultaneously: jest.config.ts AND vitest.config.ts + vitest.shims.d.ts (TEST-3); two Playwright estates (customer-portal/e2e + repo-root tests/*.spec.ts).

## Breaking-change risk register
- Stripe API version pinned `2026-07-29.dahlia` in webhook client (`webhooks/stripe/route.ts:25`) while checkout path uses raw REST v1 (unversioned behavior) — mixed integration styles; a future SDK bump must reconcile both.
- Next 16 major with proxy.ts naming (middleware→proxy migration) — plugin ecosystem assumptions should be verified on upgrades.
- Price rollover 2027-01-01 ($97→$147) is a *business* dependency embedded in code copy (CODE-8) and Stripe price objects — calendar-bound breaking change requiring coordinated release.
