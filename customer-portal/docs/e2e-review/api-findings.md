# API Findings

## API-1 · Response-semantics inconsistency across duplicate audit entrypoints (P2)
- `POST /api/audit/run` vs `/api/audit/start` vs FastAPI `/audit/accept`+`/audit/run` (wait-loop variant) vs `/api/widget/audit` — four intake paths to the same engine with different auth postures (start enforces SSRF guard + quota; widget has its own path; mpp/audit + mpp/audit-compat add two more). Drift risk: a fix applied to one intake (e.g., SSRF/quota) silently misses others. Evidence: route files under `app/api/audit/*`, `app/api/mpp/*`, `app/api/widget/audit/route.ts`.
- **Remediation:** REFACTOR to one intake with policy flags.

## API-2 · Public analytics report surface (P2)
- `/api/analytics/funnel` and `/api/analytics/funnel-report` exist as Next routes wrapping ledger queries; verify auth posture — funnel-ledger functions have no auth parameter by design; if unauthenticated they leak conversion metrics (aggregate business intelligence). Flagged INVESTIGATE with SEC-P0-1 remediation wave.
- Live check during review focused on FastAPI surface (confirmed public); Next-side probe intentionally limited to avoid expanding production reads.

## API-3 · Error-shape inconsistency (P3)
- Mix of `{error}` string shapes and `{code:'CHECKOUT_…'}` machine codes in Next routes; FastAPI uses RFC-ish detail objects. Clients must handle both. Standardize error envelope.

## API-4 · Timeout matrix (P2)
| Call | Timeout | Retry | Notes |
| --- | --- | --- | --- |
| checkout → Stripe REST | **none** | none | RES-1 |
| webhook → GA4 MP | none | none | fire-and-catch |
| workspace-auth → /auth/me | 5 s | none | fail 503 |
| BFF → FastAPI audit lookups | 10 s | none | consistent |
| FastAPI → SendGrid | 10 s | outbox [1,5,30]min | no idempotency key |
| FastAPI → OpenRouter | 12 s / 30 s | circuit breaker | cached fallback |
| FastAPI → Bedrock | 60 s read | falls through | |
| engine fetch_page | 15 s/hop ×≤6 | UA rotation on 403 | size-capped |
| signal_verifier httpx | 10 s | follows redirects | SSRF gap SEC-P2-3 |
| JWKS fetch | default (~5 s) | none | explicit timeout missing |

## API-5 · Versioning/discovery surface (P3)
- `/api/v1/*` fixes API exists alongside unversioned routes; Link-header discovery (llms.txt, api-catalog, acp/ucp) is extensive but advertises endpoints whose auth posture varies (ties to SEC-P0-1). Keep discovery aligned with actual authorization.
