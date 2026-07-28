import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Landing Page Message Match Audit Guide | Nebula',
  description:
    'Audit ad to landing page message match. Align ad creative promises with page headlines, offer framing, and CTA copy to reduce bounce rates.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/landing-page-message-match',
  },
  openGraph: {
    title: 'Landing Page Message Match Audit Guide | Nebula',
    description:
      'Audit ad to landing page message match. Align ad creative promises with page headlines, offer framing, and CTA copy to reduce bounce rates.',
    url: 'https://nebulacomponents.shop/landing-page-message-match',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Landing Page Message Match: Aligning Ad Intent with Page Copy',
  description:
    'Comprehensive guide on defining, measuring, and repairing message mismatch between paid ad campaigns and destination landing pages.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.shop/landing-page-message-match',
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.shop' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Landing Page Message Match',
      item: 'https://nebulacomponents.shop/landing-page-message-match',
    },
  ],
}

export default function MessageMatchPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main id="main-content" role="main" className="min-h-screen bg-bg pt-24 pb-16">
        <article className="mx-auto max-w-4xl px-6">
          <header className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
              Post-Click Alignment
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Landing Page Message Match
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed">
              Message match measures the degree of consistency between an ad creative promise and the primary headline, visual framing, and next steps offered on your destination landing page.
            </p>
          </header>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/20 p-6 md:p-8">
            <h2 className="text-xl font-bold text-fg mb-4">The Six Dimensions of Message Match</h2>
            <div className="space-y-4 text-sm text-fg-muted">
              <p>
                A complete message match audit evaluates six distinct continuity layers:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-fg-muted">
                <li><strong className="text-fg">Promise Match:</strong> Does the H1 headline explicitly confirm the specific solution promised in the ad?</li>
                <li><strong className="text-fg">Terminology Continuity:</strong> Are key terms in the ad repeated identically on the page?</li>
                <li><strong className="text-fg">Audience Framing:</strong> Does the subheadline address the exact buyer persona targeted in campaign ad sets?</li>
                <li><strong className="text-fg">Offer Alignment:</strong> Is the price, trial term, or deliverable on the page identical to what the ad advertised?</li>
                <li><strong className="text-fg">Visual Hierarchy:</strong> Does the visual styling maintain brand continuity with ad creative assets?</li>
                <li><strong className="text-fg">Next Action Expectation:</strong> Does the CTA button match what the visitor expected when clicking?</li>
              </ul>
            </div>
          </section>

          <section className="mb-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
              <h3 className="font-semibold text-fg text-sm mb-2">Weak Message Match Example</h3>
              <p className="text-xs text-fg-muted mb-2"><strong className="text-fg">Ad Copy:</strong> &quot;Get a 24-hour landing page code audit for $97.&quot;</p>
              <p className="text-xs text-fg-muted"><strong className="text-fg">Page H1:</strong> &quot;We build modern web applications for growth startups.&quot;</p>
              <p className="text-xs text-red-400 mt-2">Result: High bounce. The visitor clicked for an audit, not generic app development.</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <h3 className="font-semibold text-fg text-sm mb-2">Strong Message Match Example</h3>
              <p className="text-xs text-fg-muted mb-2"><strong className="text-fg">Ad Copy:</strong> &quot;Get a 24-hour landing page code audit for $97.&quot;</p>
              <p className="text-xs text-fg-muted"><strong className="text-fg">Page H1:</strong> &quot;Landing Page Audit: Find Conversion Friction in 2 Minutes.&quot;</p>
              <p className="text-xs text-emerald-400 mt-2">Result: Low bounce. Immediate confirmation of intent and promise fulfillment.</p>
            </div>
          </section>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">Audit Your Headline &amp; Message Match</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Run Nebula&apos;s free landing page audit to inspect headline character length, H1 presence, and message match signals on your URL.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-base"
            >
              Run Free Audit Now &rarr;
            </Link>
          </section>

          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related Topics:</span>
            <Link href="/why-is-my-landing-page-not-converting" className="hover:text-accent">
              Why Page Not Converting
            </Link>
            <Link href="/landing-page-cta-audit" className="hover:text-accent">
              CTA Audit
            </Link>
            <Link href="/landing-page-trust-signals" className="hover:text-accent">
              Trust Signals
            </Link>
          </footer>
        </article>
      </main>
    </>
  )
}
