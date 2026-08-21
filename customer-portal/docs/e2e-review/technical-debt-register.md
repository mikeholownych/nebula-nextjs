# Technical Debt Register

Sweep performed: TODO/FIXME/HACK/WORKAROUND (0 hits in customer-portal app/lib — unusually clean), eslint-disable/@ts-ignore family (1 hit), `except Exception` in platform_api (138, triaged below), skip markers (0 pytest skips, 0 jest skips), `|| true` (CI security job only), `.bak` files, dead code.

| ID | Item | Location | Consequence | Class |
| --- | --- | --- | --- | --- |
| TD-1 | Dead admission control | `platform_api/services/audit_db.py:126-139` | Backpressure theater — exists but never invoked | HARDEN or REMOVE |
| TD-2 | Legacy limiter unused | `platform_api/infra/rate_limiter.py` | Two limiter implementations; drift risk | REMOVE |
| TD-3 | FastAPI checkout 410 stub | `platform_api/routes/checkout.py` | Shadow route; openapi advertises a dead endpoint | REMOVE |
| TD-4 | Duplicate page families | checkout-v2 / checkout-impulse / create-97-checkout / launch-page-97; index-old; part-before/part-after | SEO/crawl duplication; maintenance drag | REMOVE after redirect map |
| TD-5 | .bak artifacts in app tree | page.tsx.bak, sitemap.ts.bak, faq-schemas.ts.bak, self-implementation-kit-offer.ts.bak | Confuses search/tooling | REMOVE |
| TD-6 | `.legacy/app` full copy in repo | customer-portal/.legacy | Repo weight; grep noise | ARCHIVE branch |
| TD-7 | 449 unreachable public HTML | public/*.html incl. case-studies×418 | 58 MB artifact; re-exposure risk on matcher change | DOCUMENT + archive |
| TD-8 | Hardcoded offer copy in Python | email_service.py:267,334; followup_emails.py:133 | 2027 price rollover will contradict site | REFACTOR |
| TD-9 | Hardcoded keys/IDs in source | heycatch pk (webhook:21), GA4 id default (analytics:17, webhook:319), IndexNow key (gsc/routes.py:549) | Rotation misses them | REPLACE |
| TD-10 | OPENROUTER key scraped from ~/.hermes/.env | audit_api.py:1026-1033; rewrite_routes.py:162-171 | Secret source outside contract | REPLACE |
| TD-11 | Swallowed side-effect failures | audit_db.py:575-615 badge/cohort writes | Silent integrity gaps | HARDEN (log+record) |
| TD-12 | Naive datetimes | followup_emails.py:41; audits.created_at/completed_at columns | DST/ordering bugs | MIGRATE timestamptz |
| TD-13 | Dual test runners/configs | jest.config.ts + vitest.config.ts | Tests may land in unrun runner | REMOVE one |
| TD-14 | Dead GitHub workflows | customer-portal/.github/workflows/* | Drift illusion of gates | REMOVE |
| TD-15 | Stray dev processes on prod host | http.server ×2, orphan next-server :4173, long jest | Hygiene; SEC-P0-2 family | REMOVE + guardrail |
| TD-16 | Single ts-ignore | (1 occurrence, sampled) | Trivial | REVIEW |

Intentional patterns NOT flagged: `void sendSaleAlert(...)` fire-and-forget sale alerts (documented non-fatal), advisory `|| true` on npm audit (explicitly commented advisory), claims allowlist gating (deliberate governance).
