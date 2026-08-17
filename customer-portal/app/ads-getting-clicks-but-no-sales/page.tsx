import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ads Getting Clicks But No Sales? Post-Click Audit | Nebula',
  description:
    'Diagnose post-click conversion breakdown when paid ads get clicks but zero sales. Separate pre-click CTR from landing page friction across 7 key signals.',
  alternates: {
    canonical: 'https://nebulacomponents.com/ads-getting-clicks-but-no-sales',
  },
  openGraph: {
    title: 'Ads Getting Clicks But No Sales? Post-Click Audit | Nebula',
    description:
      'Diagnose post-click conversion breakdown when paid ads get clicks but zero sales. Separate pre-click CTR from landing page friction across 7 key signals.',
    url: 'https://nebulacomponents.com/ads-getting-clicks-but-no-sales',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Ads Getting Clicks But No Sales: Diagnosing Post-Click Abandonment',
  description:
    'Analytical guide isolating why high-CTR ad campaigns fail at the landing page level.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/ads-getting-clicks-but-no-sales',
}

const faqItems = [
  {
    q: 'Does a high ad CTR mean my landing page will convert well?',
    a: 'No. Click-through rate (CTR) measures curiosity and ad creative resonance. Conversion rate measures post-click promise fulfillment, trust, and frictionless execution on your landing page.',
  },
  {
    q: 'How do I know if my ad platform is sending bad traffic?',
    a: 'Compare bounce rates and time-on-page across ad sets. However, before assuming traffic quality is the sole issue, audit your page for message match, price clarity, mobile loading, and CTA visibility.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.com' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Ads Getting Clicks But No Sales',
      item: 'https://nebulacomponents.com/ads-getting-clicks-but-no-sales',
    },
  ],
}

const AD_FAILURES = [
  {
    signal: 'Message Match',
    label: 'Ad promised X - landing page delivers Y',
    detail:
      'The ad copy set a specific expectation: a price point, a product type, a use case, a promotional offer. The landing page the visitor arrived at addresses a different angle or uses different language. The visitor cannot reconcile the two in under three seconds, so they leave. This is the single largest source of post-click abandonment in paid search. It is not about aesthetics - it is a literal mismatch between the claim that generated the click and the claim the page leads with.',
    fix: 'Put the ad\'s primary promise - verbatim or near-verbatim - in the H1. If the ad says "Free shipping on orders over $50," the page headline confirms it immediately. One ad group per landing page variant is the structural fix.',
  },
  {
    signal: 'Social Proof',
    label: 'No proof above the fold - visitor is asked to act before they have a reason to trust',
    detail:
      'The primary CTA appears before the visitor has seen evidence that the product works. For cold paid traffic - a visitor who has never heard of the brand - this sequence is backward. They arrived via an ad, which is inherently an unverified claim. Asking them to purchase or sign up before providing any third-party validation (a review count, a named testimonial, a visible star rating) requires a level of trust the page has not yet earned.',
    fix: 'Place at minimum one trust signal above the fold: a star rating with review count, a named customer quote with a specific outcome, or a recognizable logo with context. The CTA adjacent to proof outperforms the CTA alone.',
  },
  {
    signal: 'Price / Commitment Shock',
    label: 'The ask on the page is larger than the ad implied',
    detail:
      'The ad created an expectation about the size of the commitment - a low price, a free trial, a no-signup demo. The landing page presents a higher price, a required account creation, or an upsell before the primary action is available. This discrepancy registers as deception regardless of intent. Visitors do not re-evaluate - they leave. Checkout abandonment rates above 70% with a low-friction ad are the observable signature of this failure.',
    fix: 'Align the commitment level on the page with the commitment level implied by the ad. If the ad says "Try free," the page CTA says "Try free." If pricing is higher than the ad implied, acknowledge the full offer structure immediately rather than surfacing it at checkout.',
  },
  {
    signal: 'Mobile CTA Visibility',
    label: '60–80% of ad clicks are mobile - CTA is below the fold',
    detail:
      'Between 60 and 80 percent of paid social ad clicks originate on mobile devices. On a mobile viewport, a page designed primarily for desktop frequently pushes the primary CTA below a full screen of hero image, headline, and supporting copy. The visitor sees nothing actionable and scrolls - or does not scroll. Page designs with a sticky mobile CTA bar or a CTA within the first 600px of the mobile viewport convert at a measurably higher rate than pages where the first CTA appears at 900px or below.',
    fix: 'Test your page on a 390px-wide mobile viewport. If the CTA button is not visible without scrolling, move it above the fold or implement a sticky bottom CTA bar for mobile breakpoints only.',
  },
  {
    signal: 'Page Speed',
    label: 'LCP over 3 seconds - visitor left before the page rendered',
    detail:
      'Largest Contentful Paint (LCP) above 3 seconds correlates with a 32% increase in bounce rate relative to a 1-second LCP baseline (Google, 2018 - the absolute numbers have shifted but the direction has not changed). Ad traffic is particularly speed-sensitive: the visitor just tapped a small ad unit on a phone, they are mid-scroll, and any delay reactivates the back gesture. A page that loads slowly enough to show a white screen or a layout shift immediately after the click loses a significant fraction of paid clicks before a single word is read.',
    fix: 'Run PageSpeed Insights on the exact landing page URL - not the homepage. LCP above 3s on mobile is the threshold for corrective action. Common causes: unoptimized hero image, render-blocking JavaScript, no CDN, third-party tag manager loading synchronously.',
  },
  {
    signal: 'Ad Tracking',
    label: 'No conversion pixel on the page - ad platform optimizes toward clickers, not buyers',
    detail:
      'Without a conversion event firing on the post-purchase or post-signup page, the ad platform has no signal about which clicks resulted in transactions. It continues spending against clicks, not outcomes. Over time, the algorithm learns to target users who click ads - not users who buy. Campaigns without pixel-verified conversion events consistently show higher CPCs and lower ROAS than equivalent campaigns with verified conversion signals. The page may be converting some visitors while the platform bids against the wrong audience because it cannot see it.',
    fix: 'Verify that the purchase or lead confirmation page fires a conversion event back to every active ad platform (Google Ads, Meta, LinkedIn, TikTok). Use each platform\'s tag diagnostic tool to confirm the event is received. Without this, spend optimization is guesswork.',
  },
]

export default function AdsClicksNoSalesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main id="main-content" className="min-h-screen bg-bg pt-24 pb-16">
        <article className="mx-auto max-w-4xl px-6">

          {/* Header */}
          <header className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
              Paid Traffic Analysis
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg md:text-5xl">
              Ads Getting Clicks But No Sales?
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed max-w-2xl">
              When Google, Meta, or LinkedIn campaigns generate steady click volume without purchase completions, the ad network has fulfilled its job. The breakdown sits on the landing page - between the initial click and the final transaction. Six failure patterns account for the majority of post-click abandonment.
            </p>
          </header>

          {/* Pre-Click vs Post-Click framing */}
          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/20 p-6 md:p-8">
            <h2 className="text-xl font-bold text-fg mb-4">Pre-Click Success vs Post-Click Failure</h2>
            <p className="text-sm text-fg-muted leading-relaxed mb-4">
              High ad click-through rate proves that your hook, creative, and target audience alignment generated interest. Post-click conversion requires strict continuity across six operational dimensions:
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-bg p-4">
                <h3 className="font-semibold text-fg text-sm mb-1">1. Message Continuity</h3>
                <p className="text-xs text-fg-muted">The exact promise in the ad copy must be mirrored in the landing page H1 headline.</p>
              </div>
              <div className="rounded-lg border border-border bg-bg p-4">
                <h3 className="font-semibold text-fg text-sm mb-1">2. Price Transparency</h3>
                <p className="text-xs text-fg-muted">Hiding price or shipping fees until late checkout stages triggers sudden abandonment.</p>
              </div>
              <div className="rounded-lg border border-border bg-bg p-4">
                <h3 className="font-semibold text-fg text-sm mb-1">3. Proof Near Decision Points</h3>
                <p className="text-xs text-fg-muted">Testimonials or ratings placed away from the primary CTA fail to reassure hesitant buyers.</p>
              </div>
              <div className="rounded-lg border border-border bg-bg p-4">
                <h3 className="font-semibold text-fg text-sm mb-1">4. Form &amp; Action Friction</h3>
                <p className="text-xs text-fg-muted">Asking for unnecessary fields or displaying competing links dilutes conversion intent.</p>
              </div>
            </div>
          </section>

          {/* Six failure patterns */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Six reasons ads convert to clicks but not sales
            </h2>
            <div className="space-y-4">
              {AD_FAILURES.map((f, i) => (
                <div key={i} className="rounded-xl border border-border bg-bg-muted/20 p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="shrink-0 font-mono text-xs text-fg-dim mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-0.5">{f.signal}</p>
                      <h3 className="text-base font-semibold text-fg">{f.label}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-fg-muted leading-6 mb-3 pl-7">{f.detail}</p>
                  <div className="pl-7 border-l-2 border-accent/30 ml-7">
                    <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Fix</p>
                    <p className="text-sm text-fg-muted leading-6">{f.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Mid-page CTA — after 3rd diagnostic, before signal grid */}
          <section className="mb-14 rounded-2xl border border-accent/30 bg-accent/5 p-8">
            <h2 className="text-xl font-bold text-fg mb-3">Run the audit on your page now</h2>
            <p className="text-sm text-fg-muted leading-6 mb-6 max-w-xl">
              The checks above are manual. Nebula runs them automatically on your URL — 9 signals,
              ranked by impact, with exact evidence. Free, no signup.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Link
                href="/audit?utm_source=content&utm_medium=organic-content&utm_campaign=ads-clicks-no-sales"
                className="inline-block rounded-xl bg-accent px-6 py-3.5 font-semibold text-bg hover:bg-accent-light transition-colors text-sm"
              >
                Find the Leak — Free &rarr;
              </Link>
              <a
                href="https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h"
                className="text-sm text-fg-muted hover:text-accent transition-colors"
              >
                Already know you need the fix?{' '}
                <span className="font-semibold text-fg">$97 One-Leak Repair Sprint &rarr;</span>
              </a>
            </div>
          </section>

          {/* Pass/Fail signal grid */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-4">
              What the audit checks on a paid traffic landing page
            </h2>
            <p className="text-sm text-fg-muted leading-6 mb-6 max-w-2xl">
              Nebula reads the actual HTML of your ad destination URL - not a screenshot, not a manual walk-through. Each signal returns pass or fail with the raw value from your page so you can verify the finding independently.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  signal: 'Message Match',
                  pass: 'H1 text contains the primary keyword or claim from the ad creative',
                  fail: 'H1 describes the brand or product category - ad claim is absent',
                },
                {
                  signal: 'Social Proof',
                  pass: '1+ named, outcome-specific trust signal visible above the fold',
                  fail: 'No reviews, ratings, or testimonials in the first viewport',
                },
                {
                  signal: 'CTA Visibility Mobile',
                  pass: 'Primary CTA button renders within 600px on a 390px-wide viewport',
                  fail: 'CTA is below 600px on mobile - requires scroll before any action is available',
                },
                {
                  signal: 'Load Speed',
                  pass: 'LCP under 2.5s on mobile, hero image under 200KB',
                  fail: 'LCP above 3s - visitor exits before content renders',
                },
                {
                  signal: 'Ad Signals',
                  pass: 'Conversion pixel fires on the confirmation or thank-you page',
                  fail: 'No verified conversion event - platform optimizes toward clicks not buyers',
                },
                {
                  signal: 'Above the Fold',
                  pass: 'Headline, trust signal, and CTA all visible before scroll on mobile',
                  fail: 'Hero image or navigation consumes the first viewport with no action available',
                },
              ].map((s) => (
                <div key={s.signal} className="rounded-xl border border-border bg-bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">{s.signal}</p>
                  <p className="text-xs text-fg-muted leading-5 mb-1">
                    <span className="text-accent">Pass: </span>{s.pass}
                  </p>
                  <p className="text-xs text-fg-muted leading-5">
                    <span className="text-signal-fail">Fail: </span>{s.fail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mb-14 rounded-2xl border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">Diagnose Your Paid Traffic Landing Page</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Run a free audit on your ad destination URL to pinpoint observable page friction and receive a prioritized fix list.
            </p>
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-base"
            >
              Run Free Audit Now &rarr;
            </Link>
          </section>

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">Common questions</h2>
            <div className="space-y-4">
              {faqItems.map(({ q, a }, i) => (
                <div key={i} className="rounded-xl border border-border bg-bg-muted/20 p-5">
                  <h3 className="text-sm font-semibold text-fg mb-2">{q}</h3>
                  <p className="text-sm text-fg-muted leading-6">{a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related */}
          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related Pages:</span>
            <Link href="/why-is-my-landing-page-not-converting" className="hover:text-accent transition-colors">
              Why Page Is Not Converting
            </Link>
            <Link href="/landing-page-message-match" className="hover:text-accent transition-colors">
              Message Match Guide
            </Link>
            <Link href="/ecommerce-landing-page-audit" className="hover:text-accent transition-colors">
              Ecommerce Landing Page Audit
            </Link>
            <Link href="/roas-cliff" className="hover:text-accent transition-colors">
              The ROAS Cliff
            </Link>
            <Link href="/saas-landing-page-audit" className="hover:text-accent transition-colors">
              SaaS Audit
            </Link>
            <Link href="/pricing" className="hover:text-accent transition-colors">
              Repair Sprint Pricing
            </Link>
          </footer>
        </article>
      </main>
    </>
  )
}
