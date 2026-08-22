# Wave 6 Report — Test-System Repair
| Item | Outcome |
| --- | --- |
| TEST-1 | tests/integration/test_real_postgres_locking.py: real-Postgres (throwaway DB, zero mocks) proves FOR UPDATE SKIP LOCKED exclusivity for audit claims AND outbox drains under 20-way concurrency. CI gains a postgres:16 service-container job running it |
| CI-4 | Root ops suite (380 tests) wired into CI alongside platform suite |
| CI-1 | npm audit now BLOCKING at high+ (repo measured at 0 prod vulnerabilities after DEP fixes); no `|| true` remains |
| CI-3 | Coverage floors raised from decorative 0% to branches 10 / functions 15 / lines 25 / statements 25 with ratchet note |
| CI-2/TD-14 | Dead duplicate workflows under customer-portal/.github deleted |
| TEST-2/FE-4 | Deploy-gate e2e already exercises contrast/citable/nav/crawlability specs against a rehearsed build; promotion of the legacy repo-root browser suites into scheduled CI recorded as residual (their content overlaps newer e2e and needs de-duplication first) |
| Session-model regressions | JWT/session root tests rewritten to the per-key contract; delivery-safety test rewritten to outbox contract; hermetic admission fixture prevents real-DB leakage from unit tests |
| Dependency security | fast-uri ^4.1.2 override kills the ajv chain HIGH; nested next>postcss ^8.5.26 clears moderates — `npm audit --omit=dev` = **0 vulnerabilities** |
