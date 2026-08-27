import type { Metadata } from 'next'
import Link from 'next/link'
import { SIGNALS } from '@/app/signals/data'
import { createHowToSchema } from '@/app/lib/schema'

export const metadata: Metadata = {
  title: 'How Nebula Audits Landing Pages: The 9-Signal Diagnostic | Nebula Components',
  description:
    'Nebula audits landing pages across 9 conversion signals: message match, trust, mobile CTA, load speed, CTA clarity, above-fold clarity, ad signal continuity, SEO foundations, and AI readiness. Returns findings in under 2 minutes.',
  alternates: { canonical: 'https://nebulacomponents.com/how-nebula-audits' },
  openGraph: {
    title: 'How Nebula Audits Landing Pages: The 9-Signal Diagnostic | Nebula Components',
    description:
      'Nebula audits landing pages across 9 conversion signals: message match, trust, mobile CTA, load speed, CTA clarity, above-fold clarity, ad signal continuity, SEO foundations, and AI readiness. Returns findings in under 2 minutes.',
    url: 'https://nebulacomponents.com/how-nebula-audits',
    siteName: 'Nebula Components',
    locale: 'en_US',
    type: 'website',
  },
}

const howToSchema = createHowToSchema({
  name: 'How Nebula Audits a Landing Page: The 9-Signal Diagnostic',
  description:
    'Nebula evaluates any publicly accessible landing page across 9 deterministic conversion signals. Each signal produces a pass or fail verdict backed by raw evidence extracted from the page HTML. The full diagnostic completes in under 2 minutes.',
  totalTime: 'PT2M',
  steps: SIGNALS.map((signal, index) => ({
    position: index + 1,
    name: signal.label,
    text: signal.rule,
    url: `https://nebulacomponents.com/signals/${signal.slug}`,
  })),
})

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': 'https://nebulacomponents.com/audit#app',
  name: 'Nebula Landing Page Audit',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Conversion Rate Optimization and Landing Page Audit',
  operatingSystem: 'Any (browser-based)',
  description:
    'Deterministic landing page audit engine for paid traffic. Scans 9 observable conversion signals against public HTML and returns pass/fail verdicts with raw DOM evidence in under 2 minutes.',
  featureList: SIGNALS.map((s) => `${s.label}: ${s.definition}`),
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  url: 'https://nebulacomponents.com/audit',
  provider: {
    '@id': 'https://nebulacomponents.com/#organization',
  },
}

export default function HowNebulaAuditsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />

      <main id="main-content" className="min-h-screen bg-bg pt-24">

        {/* ── Answer Capsule ── */}
        <section className="mx-auto max-w-3xl px-6 py-12 md:py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
            How It Works
          </p>
          <h1 className="heading-1 tracking-tight text-fg md:text-5xl">
            How Nebula Audits a Landing Page
          </h1>
          <div className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-6 py-5">
            <p className="text-base leading-7 text-fg">
              Nebula fetches your publicly accessible landing page and evaluates it across 9
              deterministic conversion signals. Each signal produces a pass or fail verdict backed
              by raw evidence extracted directly from the page HTML. The full diagnostic completes
              in under 2 minutes with no account required.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/audit"
              className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
            >
              Run the free audit
            </Link>
            <Link
              href="/signals"
              className="inline-flex min-h-[44px] items-center justify-center rounded border border-border px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
            >
              Browse all 9 signals
            </Link>
          </div>
        </section>

        {/* ── HowTo: 9-Step Diagnostic ── */}
        <section
          aria-labelledby="howto-heading"
          className="border-t border-border bg-bg-muted/10 px-6 py-14"
        >
          <div className="mx-auto max-w-3xl">
            <h2
              id="howto-heading"
              className="mb-2 text-2xl font-bold tracking-tight text-fg md:text-3xl"
            >
              The 9-Step Diagnostic
            </h2>
            <p className="mb-10 text-sm leading-relaxed text-fg-muted">
              Every audit runs these checks in order. A run produces a pass or fail on each signal
              with the specific page evidence behind the verdict.
            </p>

            <ol className="space-y-0 divide-y divide-border rounded-md border border-border overflow-hidden">
              {SIGNALS.map((signal) => (
                <li key={signal.id} className="grid gap-1 bg-bg px-6 py-5 md:grid-cols-[40px_1fr]">
                  <span className="mr-4 shrink-0 font-mono text-xs font-bold text-accent leading-6">
                    {signal.num}
                  </span>
                  <div>
                    <h3 className="mb-1 font-semibold text-fg">
                      <Link
                        href={`/signals/${signal.slug}`}
                        className="hover:text-accent transition-colors"
                      >
                        {signal.label}
                      </Link>
                    </h3>
                    <p className="text-sm leading-6 text-fg-muted">{signal.definition}</p>
                    <p className="mt-2 text-xs leading-5 text-fg-dim">{signal.rule}</p>
                    {signal.inspected.length > 0 && (
                      <p className="mt-2 text-xs text-fg-dim">
                        <span className="font-semibold text-fg-muted">Inspected:</span>{' '}
                        {signal.inspected.join(', ')}.
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── What the engine returns ── */}
        <section className="border-t border-border px-6 py-14">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-fg md:text-3xl">
              What the audit returns
            </h2>
            <ul className="space-y-3">
              {[
                'A pass or fail verdict on each of the 9 signals',
                'The raw evidence from your page that produced each verdict',
                'Findings ranked by priority so you know where to start',
                'No email required to see your results',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-fg-muted">
                  <span className="mt-0.5 shrink-0 font-bold text-accent">+</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── SoftwareApplication context ── */}
        <section className="border-t border-border bg-bg-muted/10 px-6 py-14">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-fg md:text-3xl">
              About the tool
            </h2>
            <p className="mb-6 text-sm leading-7 text-fg-muted">
              The audit engine is a browser-based application built by Nebula Components. It
              operates on publicly accessible HTML and does not require login credentials, site
              access, or a CMS integration. It does not submit forms, traverse checkout flows, or
              retain raw page screenshots beyond the analysis window.
            </p>
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                { term: 'Application type', def: 'Web-based diagnostic tool' },
                { term: 'Category', def: 'Conversion Rate Optimization' },
                { term: 'Operating system', def: 'Any (browser-based)' },
                { term: 'Price', def: 'Free' },
                { term: 'Signals checked', def: '9 deterministic conversion signals' },
                { term: 'Runtime', def: 'Under 2 minutes per page' },
                { term: 'Account required', def: 'No - results are visible without signup' },
                { term: 'Platforms supported', def: 'Any publicly accessible URL' },
              ].map(({ term, def }) => (
                <div key={term} className="rounded-md border border-border bg-bg p-4">
                  <dt className="text-xs font-semibold text-fg-muted">{term}</dt>
                  <dd className="mt-1 text-sm font-medium text-fg">{def}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-border px-6 py-14">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-fg md:text-3xl">
              Ready to see the diagnostic on your page?
            </h2>
            <p className="mb-6 text-sm leading-7 text-fg-muted">
              Paste your URL. Nebula returns pass/fail verdicts across all 9 signals with the
              evidence behind each one. No account required.
            </p>
            <Link
              href="/audit"
              className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-8 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
            >
              Run the free audit
            </Link>
          </div>
        </section>

      </main>
    </>
  )
}
