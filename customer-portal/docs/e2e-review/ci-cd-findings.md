# CI/CD Findings

## CI-1 · Security audit gate is advisory (P2)
- `.github/workflows/ci.yml` job `security`: `npm audit --omit=dev --audit-level=moderate || true`. Documented as intentional, but consequence is 2 high vulns currently shipping unblocked. **Remediation:** TEST/HARDEN — make high+ blocking with suppressions file.

## CI-2 · Duplicate pipeline definitions (P2)
- Root `.github/workflows/ci.yml` AND `customer-portal/.github/workflows/ci.yml` + `health-check.yml` exist; GitHub consumes only root-level workflows, so the customer-portal copies are dead files that will drift (they already differ). **Remediation:** REMOVE dead copies; single source of truth.

## CI-3 · Coverage thresholds are zero (P2)
- Jest job passes `--coverageThreshold='{"global":{...:0}}'` — coverage is decorative. **Remediation:** set ratcheted minimums.

## CI-4 · Test scope mismatch (P1)
- CI pytest runs **only** `tests/platform_api`; the 88-file repo-root suite (lead pipeline, release gates, backup verifier) never runs in CI. Playwright e2e runs the 7 specs in `customer-portal/e2e` but not repo-root browser suites (a11y/contrast/full-page audits). **Remediation:** wire in or explicitly archive.

## CI-5 · Deployment sequencing is manual and mostly sound (positive + P2)
- `scripts/deploy_customer_portal.sh`: pre-probe → build to side dir → stamp revision drop-in (0400) → restart API → atomic swap → readyz poll → verify script → CF purge. Gaps: no migration step inside the script (operator-order message instead — DATA-2); no automatic rollback on failed verification (exits leaving new build live but unhealthy — message says "investigate"); `.next-previous` enables manual rollback but no documented drill.
- Production smoke (`production-smoke.yml`, */15) probes .com routes incl. D13 header-size regression probe — good operational guard.

## CI-6 · Revision stamping coherence (verified positive)
- build-info.json generated at build (`generate-build-info.mjs`), stamped into systemd env for FastAPI, surfaced via `/api/build-info`, `X-Nebula-Revision`, and FastAPI `/healthz`. During review all three matched post-deploy (3715a8b0). Pre-deploy window showed prod one commit behind HEAD — acceptable promote-on-demand model, but document it (DOC-2).

## CI-7 · No deploy integration test (P2)
- Nothing exercises "build → swap → healthz revision match" outside the real host. A staging or containerized rehearsal would catch class-of-errors like the 2026-07-26 CSS incident the script memorializes.
