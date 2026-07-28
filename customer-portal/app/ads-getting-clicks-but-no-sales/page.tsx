import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ads Getting Clicks But No Sales? Post-Click Audit | Nebula',
  description:
    'Diagnose post-click conversion breakdown when paid ads get clicks but zero sales. Separate pre-click CTR from landing page friction across 7 key signals.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/ads-getting-clicks-but-no-sales',
  },
  openGraph: {
    title: 'Ads Getting Clicks But No Sales? Post-Click Audit | Nebula',
    description:
      'Diagnose post-click conversion breakdown when paid ads get clicks but zero sales. Separate pre-click CTR from landing page friction across 7 key signals.',
    url: 'https://nebulacomponents.shop/ads-getting-clicks-but-no-sales',
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
  mainEntityOfPage: 'https://nebulacomponents.shop/ads-getting-clicks-but-no-sales',
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
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.shop' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Ads Getting Clicks But No Sales',
      item: 'https://nebulacomponents.shop/ads-getting-clicks-but-no-sales',
    },
  ],
}

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
      <main id="main-content" role="main" className="min-h-screen bg-bg pt-24 pb-16">
        <article className="mx-auto max-w-4xl px-6">
          <header className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
              Paid Traffic Analysis
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Ads Getting Clicks But No Sales?
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed">
              When Google, Meta, or LinkedIn campaigns generate steady click volume without purchase completions, the ad network has fulfilled its job. The breakdown sits on the landing page between the initial click and the final transaction.
            </p>
          </header>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/20 p-6 md:p-8">
            <h2 className="text-xl font-bold text-fg mb-4">Pre-Click Success vs Post-Click Failure</h2>
            <p className="text-sm text-fg-muted leading-relaxed mb-4">
              High ad click-through rate proves that your hook, creative, and target audience alignment generated interest. However, post-click conversion requires strict continuity across six operational dimensions:
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

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-fg mb-4">Diagnostic Verification Checklist</h2>
            <div className="space-y-4 text-sm text-fg-muted leading-relaxed">
              <div className="p-4 rounded-xl border border-border bg-bg-muted/10">
                <h3 className="font-semibold text-fg mb-1">Check 1: Ad to Headline Match</h3>
                <p className="text-xs">Does the main headline match the specific claim in your top-performing ad variant?</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-bg-muted/10">
                <h3 className="font-semibold text-fg mb-1">Check 2: Mobile Viewport Action</h3>
                <p className="text-xs">Is the buy or sign-up button visible on mobile screens without requiring scrolling?</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-bg-muted/10">
                <h3 className="font-semibold text-fg mb-1">Check 3: Speed &amp; Asset Weight</h3>
                <p className="text-xs">Does the page load under 2.5 seconds on 4G connections without render-blocking scripts?</p>
              </div>
            </div>
          </section>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">Diagnose Your Paid Traffic Landing Page</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Run a free audit on your ad destination URL to pinpoint observable page friction and receive a prioritized fix list.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-base"
            >
              Run Free Audit Now &rarr;
            </Link>
          </section>

          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related Pages:</span>
            <Link href="/why-is-my-landing-page-not-converting" className="hover:text-accent">
              Why Page Is Not Converting
            </Link>
            <Link href="/landing-page-message-match" className="hover:text-accent">
              Message Match Guide
            </Link>
            <Link href="/ecommerce-landing-page-audit" className="hover:text-accent">
              Ecommerce Audit
            </Link>
          </footer>
        </article>
      </main>
    </>
  )
}
