# Frontend Findings

## FE-1 · Client/server boundary hygiene (P2, positive with caveats)
- Root layout keeps static rendering via isolated Suspense boundaries for OgUrl/GeoConsent/AnalyticsRuntime/FunnelChrome (`app/layout.tsx:76-127`) — deliberate and effective; homepage HTML 162 KB / 12 script tags with src, zero external script hosts in initial HTML (third-parties load post-consent via AnalyticsRuntime).
- Caveat: consent state lives in localStorage (`nebula-cookie-consent`), gate is client-side; server-side consent derivation exists for checkout metadata (`analytics-consent.ts`) — consistent enough for current analytics use.

## FE-2 · Hydration/mismatch risks (P3)
- `suppressHydrationWarning` on `<html>` for the consent attribute — scoped correctly. GeoConsent reads propagated header (x-nebula-country) rather than headers() — avoids full-tree dynamization (documented in proxy.ts:38-42). No mismatch issues observed in code review; runtime console evidence exists in docs/production-validation/console reports.

## FE-3 · Workspace chunking (P3)
- `/workspace` guarded at proxy by cookie presence + per-route verification; heavy client components under workspace are code-split by route segment (App Router default). No dynamic-import anti-patterns found in sampled files.

## FE-4 · Accessibility (P2, evidence-based only)
- Skip-link present (`layout.tsx:115`); repo-root Playwright suites include color-contrast/pricing-contrast specs but they are **not wired into CI** (see TEST-2). WCAG 2.2 AAA target (DESIGN.md) cannot be verified from this review; no compliance claim made. Existing production accessibility report exists under docs/production-validation/.
- **Remediation:** TEST (promote a11y specs into CI gate).

## FE-5 · Legacy static surface (P2)
- 449 `.html` files (58 MB) under `public/` incl. 418 `public/case-studies/*.html`; proxy.ts 404s all non-allowlisted `.html` (proxy.ts:128-140) after legacy redirects (legacy-routes.ts, 54 lines). They are unreachable-by-design but still deployed/shipped, inflating artifact size and risking accidental future re-exposure if matcher changes. docs/architecture/ops-case-studies-html.md suggests retention is intentional for provenance.
- **Remediation:** DOCUMENT retention decision + REMOVE from deploy artifact (move to archive branch) once SEO equivalence confirmed.

## FE-6 · Third-party scripts & consent (P2)
- CSP (live headers) allowlists googletagmanager, cloudflareinsights, searchable tracker, heycatch; connect-src includes PostHog us endpoints. AnalyticsRuntime gates initialization on consent; PostHog /ingest proxied through Next (skipTrailingSlashRedirect supports it). RB2B/HeyCatch identity flows write to public webhook endpoints (SEC-P0-1 family). Double-init risk not observed (single init points).
