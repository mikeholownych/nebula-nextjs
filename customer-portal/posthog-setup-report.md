<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Nebula customer portal - a Next.js 16 App Router application. The integration covers the full conversion funnel: from a visitor submitting a landing page URL for the free audit, through email capture to unlock results, to Stripe checkout initiation and confirmed payment. Both client-side (posthog-js) and server-side (posthog-node) tracking are in place, with user identity correlated across both domains via `identify()` and `X-POSTHOG-DISTINCT-ID` headers.

Key changes made:
- **`instrumentation-client.ts`** - PostHog browser SDK initialized via Next.js 15.3+ instrumentation hook, proxied through `/ingest` with `capture_exceptions: true`
- **`next.config.ts`** - PostHog reverse proxy rewrites added for `/ingest/*` and `/ingest/static/*` and `/ingest/array/*`; `skipTrailingSlashRedirect: true` added
- **`app/lib/posthog-server.ts`** - Shared server-side PostHog client factory (posthog-node, `flushAt: 1`, `flushInterval: 0`)
- **`app/audit/AuditForm.tsx`** - `audit_submitted` captured on URL submit; errors sent to PostHog exception tracking
- **`app/audit/[id]/processing/page.tsx`** - `audit_email_submitted` captured + `identify()` called when user provides email to unlock; `X-POSTHOG-DISTINCT-ID` and `X-POSTHOG-SESSION-ID` headers forwarded to unlock API
- **`app/audit/[id]/results/ResultsClient.tsx`** - `audit_email_submitted` + `identify()` on inline email gate; `magic_link_requested` on login-link click
- **`app/checkout/CheckoutCTAButton.tsx`** *(new)* - Client component wrapping the Stripe CTA; fires `checkout_initiated` on click
- **`app/checkout/page.tsx`** - Replaced inline `<a>` with `CheckoutCTAButton`
- **`app/thank-you/PurchaseTracker.tsx`** *(new)* - Client component that fires `purchase_confirmed_viewed` on mount (conversion confirmation page)
- **`app/thank-you/page.tsx`** - `PurchaseTracker` added to the server component
- **`app/api/audit/start/route.ts`** - `audit_started` captured server-side with `audit_id`, `page_url`, `score`, `grade`
- **`app/api/audit/unlock/route.ts`** - `audit_results_unlocked` + server-side `identify()` using the user's email; client distinct ID forwarded for cross-domain correlation
- **`app/api/checkout/route.ts`** - `checkout_session_created` captured after Stripe session created; `identify()` called with email
- **`app/api/webhooks/stripe/route.ts`** - `purchase_completed` and `invoice_payment_succeeded` captured from verified Stripe webhook events; each awaits `ph.flush()` before returning

| Event | Description | File |
|---|---|---|
| `audit_submitted` | User submits a landing page URL to start the free audit | `app/audit/AuditForm.tsx` |
| `audit_email_submitted` | User provides their email to unlock full audit results | `app/audit/[id]/processing/page.tsx`, `app/audit/[id]/results/ResultsClient.tsx` |
| `checkout_initiated` | User clicks the Continue to Stripe Checkout button | `app/checkout/CheckoutCTAButton.tsx` |
| `purchase_confirmed_viewed` | User lands on the thank-you confirmation page after completing payment | `app/thank-you/PurchaseTracker.tsx` |
| `magic_link_requested` | User requests an email login link to revisit their audit | `app/audit/[id]/results/ResultsClient.tsx` |
| `audit_started` | Server confirms audit processing has been kicked off for a submitted URL | `app/api/audit/start/route.ts` |
| `audit_results_unlocked` | Server captures email and sends the full audit report to the user | `app/api/audit/unlock/route.ts` |
| `checkout_session_created` | Server confirms a Stripe checkout session was created for the Repair Sprint | `app/api/checkout/route.ts` |
| `purchase_completed` | Stripe webhook confirms checkout.session.completed - payment received | `app/api/webhooks/stripe/route.ts` |
| `invoice_payment_succeeded` | Stripe webhook confirms a recurring subscription invoice was paid successfully | `app/api/webhooks/stripe/route.ts` |

## Next steps

We've built a dashboard and five insights for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard - Analytics basics (wizard):** https://us.posthog.com/project/525183/dashboard/1894166
- **Conversion funnel: Audit → Email → Purchase (wizard):** https://us.posthog.com/project/525183/insights/Ih9RqcAm
- **Audits submitted per day (wizard):** https://us.posthog.com/project/525183/insights/rxYqgpwN
- **Purchases completed (wizard):** https://us.posthog.com/project/525183/insights/EP3dvZZM
- **Audit results unlocked (email captures) (wizard):** https://us.posthog.com/project/525183/insights/EIhmL450
- **Checkout initiated vs purchase completed (wizard):** https://us.posthog.com/project/525183/insights/bycfTnaH

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite (`npm test`) - call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any other bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify in PostHog Error Tracking.
- [ ] Confirm the returning-visitor path also calls `identify` - currently `identify` is called on email submit; ensure users who reload the results page while already identified are re-identified (e.g. from a stored distinct ID in the unlock cookie or localStorage).

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
