# Firsteyes AI Review

Date: 2026-09-03
Classification: Adjacent competitor, website audit and conversion review product
Scope: Read-only review of the public homepage, sample report, pricing path, robots.txt, sitemap.xml, and browser-rendered navigation/form surface.

## Evidence status

Measured from live public surfaces:

- Homepage title: `firsteyes AI - Website Audit Tool | Find Why Visitors Don't Convert`
- Homepage presents a URL form plus an optional page-goal selector.
- Homepage presents a sample report and a three-lens product model: First Impression, Conversion, and Content Quality.
- Sample report is a long-form, diagnosis-first report with a concrete rewrite artifact and repeated analysis CTA.
- Homepage displays a `$12` Full Report offer. The user supplied a separate screenshot showing a `$27` offer, which was not treated as the current homepage price.
- `/pricing` currently routes to sign-in rather than a public pricing page.
- `robots.txt` allows the public site and disallows API, dashboard, account, payment, and loading paths.
- `sitemap.xml` exposes public SEO and sample-report routes.
- Homepage exposes a personal social/contact identity and an organization email link in the live DOM.

Self-reported or unverified by this review:

- Product-of-the-day badge.
- User testimonials and usage counts.
- Claims about AI agents clicking through every CTA.
- Any conversion or revenue outcome attributed to the product.

## What firsteyes does better than Nebula

1. The sample report creates a buying sequence before the price appears:
   recognition → specific diagnosis → concrete rewrite → offer.
2. It turns the output into a tangible artifact. The buyer can picture receiving a rewrite, annotated screenshot, and prioritized action list.
3. It repeats one clear CTA after comprehension points instead of treating pricing as a detached section.
4. The report is written in the visitor's voice, not only in audit terminology.

## What Nebula should adopt

Adopt one mechanism only:

- Keep Nebula's measured condition and evidence model.
- Present the first condition in recognition language.
- Show exactly what the `$97 One-Leak Repair Sprint` produces.
- Use the sequence: observed condition → scoped artifact → same-condition re-audit.
- Repeat `Get the repair: $97` at the natural decision points.

This is already implemented locally on the results page in commit `dffcd28fc`, but it is not deployed because the mandatory E2E gate currently fails on 9 unrelated baseline tests.

## What Nebula should reject

- Three independent scores that create a second scoring model beside Nebula's condition system.
- Testimonials, usage counts, or product badges without attributable evidence.
- Guaranteed or implied conversion outcomes.
- Unverified claims that the tool behaves like a real visitor or clicks every CTA.
- Broad “everything costing you conversions” framing when the evidence only establishes observable page conditions.
- Public pricing routes that require sign-in before pricing can be inspected.
- A new generic free audit or report product. Nebula already owns the free audit wedge.

## Applied decision

**Adopt:** report narrative, artifact preview, and repeated canonical CTA on the existing results page.

**Reject:** new product architecture, three-score model, unsupported proof language, and unverified outcome claims.

**Monitor:** whether the results-page bridge produces attributable checkout starts and payments. Until payment data changes, this remains a conversion hypothesis, not a proven lift.

**No additional code is justified from this review.** The relevant mechanism is already implemented locally, and production deployment is correctly blocked by the existing E2E gate.
