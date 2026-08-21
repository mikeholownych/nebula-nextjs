# Test Quality Findings

## TEST-1 · Mocked-boundary false confidence (P1)
- Platform API tests run with `ENVIRONMENT=development` and no Postgres/Redis services in CI; queue claim semantics (SKIP LOCKED), outbox lease expiry, and advisory-lock fulfillment paths are exercised via mocks/fakes where present. These are precisely the behaviors whose correctness depends on real DB semantics (row locking, partial unique indexes, lease timestamps). No test spins the documented docker/postgres topology.
- **Evidence:** ci.yml pytest job env; absence of any service containers in workflows; `tests/platform_api` file set.
- **Remediation:** TEST — add a dockerized integration job for queue/outbox/fulfillment invariants.

## TEST-2 · Browser-behavior suites exist but never run in CI (P2)
- Repo-root `tests/*.spec.ts` (color-contrast, pricing-contrast, full-page-audit, all-pages-audit, platform-critical-flows) are absent from every workflow. Either they rot or they encode undelivered promises (a11y AAA target).
- **Remediation:** TEST — promote critical flows + contrast specs to CI schedule.

## TEST-3 · Dual runner ambiguity (P3)
- jest.config.ts and vitest.config.ts coexist with shims; risk of writing tests into the unrun framework. Pick one; archive the other config.

## TEST-4 · Source-regex/static tests (P3)
- Several governance checks (`check-banned-strings`, claims allowlist, `test_newsletter_authority_static.py`) validate source text rather than runtime behavior — appropriate for copy/claims gates, but do not substitute behavioral coverage (e.g., price rollover logic is untested at runtime).

## TEST-5 · Production-equivalent validation exists as docs, not gates (P2)
- `docs/production-validation/*` (journey results, defect register D1–D13, release verdict) show manual production QA discipline — commendable — but none are automated post-deploy assertions beyond smoke routes. The D13 header-size probe in production-smoke.yml is the model to generalize (e.g., assert unlock→checkout happy path against prod read-only endpoints).

## TEST-6 · Positive findings
- SSRF guard has dedicated tests (`test_audit_ssrf.py`); JWT sessions tested (`test_jwt_sessions*.py`); multi-tenancy and release-gate tests exist at root scope; funnel ledger SLO queries have data-quality self-checks built into product code (rare and good).
