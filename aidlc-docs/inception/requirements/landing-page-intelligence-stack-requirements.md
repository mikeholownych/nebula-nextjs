# Landing Page Intelligence Stack Requirements

## Intent analysis

- **User request:** Turn the BuildWire content-to-download pattern into a shippable Nebula funnel.
- **Request type:** New customer-facing feature and downloadable resource.
- **Project type:** Brownfield Next.js application.
- **Scope:** One public learning-centre route, one deterministic static download, supporting source assets, metadata, tests, and deployment verification.
- **Complexity:** Moderate. The implementation is static and isolated, but public claims, archive integrity, accessibility, discovery, and conversion routing require explicit gates.

## Objective

Publish a free, evidence-grade Landing Page Intelligence Stack that gives founders six inspectable workflows and routes qualified users into Nebula's live audit. The resource must demonstrate Nebula's evidence discipline rather than imitate a generic prompt-library lead magnet.

## Functional requirements

1. Publish a public learning-centre page at `/learning-centre/landing-page-intelligence-stack`.
2. Explain the six workflows and the concrete artifact each produces:
   - Ad-to-page message-match checker → mismatch map.
   - Trust-gap detector → evidence inventory.
   - Mobile first-scroll analyzer → viewport failure report.
   - CTA and form-friction analyzer → friction sequence.
   - Paid-traffic leak prioritizer → ranked fix map.
   - Fix verification workflow → before/after evidence packet.
3. Provide a direct, no-email download of a versioned ZIP archive.
4. Include a README, six workflow files, an evidence-record schema, and a manifest inside the archive.
5. Make the primary post-download conversion path the live free audit at `/audit`.
6. Add `meta.json` so the existing learning-centre discovery and sitemap mechanisms can find the page.
7. Use only public, verified Nebula methodology claims. Do not claim that the bundle guarantees conversion improvement, replaces paid tools, or has users/results that have not been measured.
8. Keep the archive reproducible: packaging the same source must produce the same file order, timestamps, and bytes.
9. Keep downloadable sources in the repository; the ZIP is a generated projection, not the only copy.
10. Fail CI if the generated ZIP is missing, stale, malformed, or differs from its source manifest.

## Non-functional requirements

- **Accessibility:** Meet the repository's WCAG 2.2 AAA target for contrast, semantic headings, keyboard navigation, focus treatment, and descriptive link text.
- **Privacy:** No email gate, individual profiling, new cookies, form collection, or third-party download host.
- **Security:** Static Markdown/JSON assets only. No executable scripts, macros, binaries, credentials, or external instructions treated as trusted commands.
- **Evidence integrity:** Every factual or performance claim must be sourced from existing verified registry data or omitted.
- **Maintainability:** Follow existing App Router, shared UI, design-token, `meta.json`, and sitemap patterns.
- **Reliability:** The page and archive must be covered by unit/integrity tests, production build, rendered E2E checks, and an independent read-only review.
- **Deployment:** Reuse the existing `nebula-nextjs` service and public domain. No infrastructure, database, API, payment, or outbound-email changes.

## User journey

1. Founder lands on the resource page from search, internal navigation, or a direct link.
2. Founder understands what each workflow checks and what artifact it produces.
3. Founder downloads the ZIP without submitting personal information.
4. Founder can run the workflows manually using public page evidence.
5. Founder uses the secondary CTA to run Nebula's live audit.
6. Existing audit and $97 implementation paths remain unchanged.

## Error and failure behavior

- Missing or stale generated archive fails automated checks.
- Invalid manifest entries, duplicate workflow IDs, unsafe paths, or unexpected archive files fail packaging.
- Unsupported public claims fail existing evidence-integrity checks.
- The public page must not render a broken download CTA when the archive is absent.
- No fallback may silently redirect the download CTA to an email form or external host.

## Success criteria

- Public route returns and renders successfully in a real browser.
- Download returns a ZIP with the expected content type and filename.
- Archive extraction produces exactly the declared files.
- Repeated packaging produces an identical SHA-256 digest.
- The audit CTA routes to `/audit`.
- Unit, integrity, E2E, typecheck, lint, production build, production dependency audit, and independent review pass.

## Explicit exclusions

- Newsletter capture.
- Paid checkout or a new Stripe product.
- AI model calls from the download page.
- User-uploaded files or persisted workflow results.
- Automated outreach or lead-ledger changes.
- Claims that the workflows replace research subscriptions or guarantee revenue.
