import type { Metadata } from 'next'
import Link from 'next/link'
import { getActiveFixPack, type FixPackPublicFact } from '@/app/lib/public-facts'
import { REPAIR_SPRINT_OFFER } from '@/app/lib/self-implementation-kit-offer'
import { Card, PageShell } from '@/components/ui'
import MembershipGrid from './MembershipGrid'
import PricingComparisonTable from './PricingComparisonTable'
import DifferentiationBlock from '@/components/DifferentiationBlock'
import OfferCardVariant from '@/components/OfferCardVariant'


export const metadata: Metadata = {
  title: 'Pricing - One-Leak Repair Sprint | Nebula',
  description:
    'Free evidence-backed landing page audit plus a $97 one-time repair sprint. Nebula identifies the highest-priority failed condition and delivers the exact fix.',
  alternates: {
    canonical: 'https://nebulacomponents.com/pricing',
  },
  openGraph: {
    title: 'Pricing - One-Leak Repair Sprint | Nebula',
    description:
      'Free evidence-backed landing page audit plus a $97 one-time repair sprint. Nebula identifies the highest-priority failed condition and delivers the exact fix.',
    url: 'https://nebulacomponents.com/pricing',
    siteName: 'Nebula Components',
    type: 'website',
  },
}

function buildServiceSchema(fixPack: FixPackPublicFact) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': 'https://nebulacomponents.com/pricing#fix-pack',
    name: REPAIR_SPRINT_OFFER.name,
    description: REPAIR_SPRINT_OFFER.summary,
    provider: { '@id': 'https://nebulacomponents.com/#organization' },
    serviceType: 'Landing Page Conversion Optimization',
    url: 'https://nebulacomponents.com/pricing',
    offers: {
      '@type': 'Offer',
      price: String(REPAIR_SPRINT_OFFER.priceUsd),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `https://nebulacomponents.com${fixPack.checkout.pagePath}`,
      priceValidUntil: fixPack.priceValidUntil,
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Repair Sprint deliverables',
      itemListElement: REPAIR_SPRINT_OFFER.includes.map((name) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name },
      })),
    },
  }
}

const faqItems = [
  {
    q: 'What exactly is included in the Repair Sprint?',
    a: 'The exact replacement - copy, code snippet, or configuration change - written specifically for what was found on your page. Not "improve your H1." The actual replacement H1 text. Not "add social proof." The specific proof element and where to place it. Plus a 30-day re-audit to confirm the condition changed.',
  },
  {
    q: 'How is this different from a generic CRO audit report?',
    a: 'A report tells you what is wrong. The Repair Sprint tells you what to change it to. Nebula reads your actual page HTML - your specific H1, your CTA label, your meta description - and writes the replacement for that page. Generic advice is not included because it is not useful.',
  },
  {
    q: 'Why only one finding?',
    a: 'A bounded change is testable and honest. Changing multiple things at once makes it impossible to know what worked. The Repair Sprint fixes the highest-priority finding first, the 30-day re-audit confirms it held, then you have real evidence to act on next.',
  },
  {
    q: 'Do I need to give Nebula access to my site?',
    a: 'No. The kit is sent to your email after payment - you or your developer applies it. Nebula never needs CMS, hosting, or repository access. The audit reads your public page HTML.',
  },
  {
    q: 'How long does the whole process take?',
    a: 'The audit completes in under 2 minutes. The repair kit arrives within 48 hours of payment. Implementation time depends on what the fix requires - copy changes are minutes, code changes depend on your stack.',
  },
  {
    q: 'Does the repair guarantee more conversions?',
    a: 'No - and any service that guarantees conversion lift without a controlled traffic test is making it up. The 30-day re-audit confirms whether the specific page condition changed. Conversion outcomes also depend on traffic quality and offer strength. You get verifiable evidence of what changed, not a revenue promise.',
  },
]

const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  '@id': 'https://nebulacomponents.com/pricing#repair-sprint',
  name: 'Nebula One-Leak Repair Sprint',
  description: 'A bounded single-condition landing page repair. Nebula scopes the highest-priority finding, writes the exact fix, and re-audits after 30 days.',
  image: 'https://nebulacomponents.com/brand/v2/og-default.png',
  brand: { '@type': 'Brand', name: 'Nebula Components' },
  url: 'https://nebulacomponents.com/pricing',
  offers: {
    '@type': 'Offer',
    price: '97',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: 'https://nebulacomponents.com/pricing',
    seller: { '@type': 'Organization', name: 'Nebula Components', url: 'https://nebulacomponents.com' },
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

export default function PricingPage() {
  const fixPack = getActiveFixPack()
  const serviceSchema = fixPack ? buildServiceSchema(fixPack) : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {serviceSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
      )}
      {fixPack && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <PageShell title="Choose a Plan to Boost Landing Page Conversions" description="Only verified, currently available offers are shown.">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-16 text-center">
            <p className="mx-auto mt-4 max-w-xl text-fg-muted">
              Start free. Upgrade for continuous monitoring, team workspaces, or agency white-label. Need a single bounded fix? The $97 kit is one-time.
            </p>
            <p className="mt-3 text-sm text-fg-muted">
              Under 2 minutes · no signup · no sales call
            </p>
          </div>

          <section aria-labelledby="pricing-answers" className="mb-12 rounded-md border border-border bg-bg-muted/10 p-6">
            <h2 id="pricing-answers" className="mb-4 text-lg font-semibold text-fg">Direct answers</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="font-semibold text-fg">What does the free audit check?</h3>
                <p className="mt-1 text-sm leading-6 text-fg-muted">It checks observable conversion conditions against a public landing page and returns results in under 2 minutes.</p>
              </div>
              <div>
                <h3 className="font-semibold text-fg">What does the repair sprint cost?</h3>
                <p className="mt-1 text-sm leading-6 text-fg-muted">The One-Leak Repair Sprint costs $97 as a one-time payment.</p>
              </div>
              <div>
                <h3 className="font-semibold text-fg">Does it guarantee more conversions?</h3>
                <p className="mt-1 text-sm leading-6 text-fg-muted">No. It targets a specific page condition and does not promise conversion lift; the same-scope re-audit is available within 30 days.</p>
              </div>
            </div>
          </section>

          <div
            data-answer-capsule
            className="mb-8 border-l-2 border-accent bg-bg-panel rounded-r-md px-5 py-4"
          >
            <p className="text-sm leading-relaxed text-fg-muted">Nebula audits a landing page for conversion leaks across 9 signals and returns findings ranked by priority. The free audit runs in under 2 minutes. The $97 Repair Sprint fixes one prioritized finding within 48 hours.</p>
          </div>

          <DifferentiationBlock />

          <OfferCardVariant source="pricing" placement="pricing-offer-card" />

          <MembershipGrid />

          <PricingComparisonTable />

          <h2 className="mt-16 mb-6 text-center text-2xl font-bold text-fg">Audit &amp; Repair</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <Card variant="bordered">
              <p className="mb-3 text-sm font-medium text-fg-muted">Free</p>
              <h2 className="text-2xl font-semibold text-fg">Automated Audit</h2>
              <p className="mt-1 text-sm italic text-fg-muted">See observable page conditions before you change the ad</p>
              <p className="mt-2 text-3xl font-bold text-fg">Free</p>
              <p className="mt-4 text-fg-muted">
                Drop in a URL and get a scored, evidence-backed diagnosis in minutes - no signup required.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-fg-muted">
                {
                  [
                    'Message-match diagnosis',
                    'Trust signal check',
                    'Mobile CTA review',
                    'Above-the-fold clarity check',
                    'Ad signal detection',
                    'SEO foundations check',
                    'CTA clarity audit',
                    'Load speed assessment',
                    'AI readiness check',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-fg-muted" />
                      {item}
                    </li>
                  ))
                }
              </ul>
              <Link href="/audit?utm_source=pricing&utm_medium=internal" className="mt-8 inline-flex rounded-xl border border-border px-5 py-3 font-semibold text-fg transition-colors hover:border-accent">
                Run free audit
              </Link>
            </Card>

            <Card variant="bordered">
              <p className="mb-3 text-sm font-medium text-fg-muted">One-time · no subscription</p>
              <h2 className="text-2xl font-semibold text-fg">One-Leak Repair Sprint</h2>
              <p className="mt-1 text-sm text-fg-muted">Find it. Fix it. Verify it held.</p>
              <p className="mt-2 text-4xl font-bold tabular-nums text-fg">${REPAIR_SPRINT_OFFER.priceUsd}</p>
              <p className="mt-2 text-xs font-medium text-accent">
                Less than one day of ad spend. Less than 5% of a CRO consultant&apos;s audit fee.
              </p>
              <p className="mt-4 text-fg-muted leading-relaxed">
                One landing page, one finding. Run the free audit first - Nebula checks 9 signals against your actual page HTML in under 2 minutes.
                Then pay $97 and receive the exact fix for your highest-priority finding within 48 hours.
                Not generic advice - the replacement copy, code snippet, or configuration change written for your specific page.
                You or your developer implements the change. A 30-day re-audit confirms the condition changed.
                This service does not promise conversion lift.
              </p>
              <div className="mt-6 space-y-3">
                {
                  'howItWorks' in REPAIR_SPRINT_OFFER && Array.isArray(REPAIR_SPRINT_OFFER.howItWorks) &&
                    (REPAIR_SPRINT_OFFER.howItWorks as string[]).map((step, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm text-fg-muted">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                          {i + 1}
                        </span>
                        {step}
                      </div>
                    ))
                }
              </div>
              <p className="mt-6 text-sm leading-6 text-fg-muted">
                <Link href="/repair-sprint" className="text-accent hover:text-fg transition-colors">See the full Repair Sprint details →</Link>
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/audit?utm_source=pricing&utm_medium=internal" className="inline-flex rounded bg-accent px-5 py-3 font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent">
                  Run the audit first →
                </Link>
                <Link href="/repair-sprint" className="inline-flex rounded-xl border border-border px-5 py-3 font-semibold text-fg transition-colors hover:border-accent">
                  See full details
                </Link>
              </div>
              <p className="mt-4 text-xs text-fg-muted">
                🛡️ <span className="font-semibold text-fg">30-day money-back guarantee:</span> If we cannot produce a repair that satisfies the agreed check, we refund the $97.{' '}
                <Link href="/repair-sprint#repair-guarantee" className="text-accent hover:underline">
                  View guarantee terms →
                </Link>
              </p>
            </Card>
          </div>

          <p className="mt-6 text-center text-sm text-fg-muted">
            Every audit you run with an email is kept in a free workspace - audit history, fix queue,
            compare, timeline, and 30-day re-audit tracking. No subscription required.
          </p>

          <div className="mt-12 rounded-2xl border border-accent/20 bg-accent/5 p-8 text-center">
            <p className="text-lg font-semibold text-fg">Not sure yet?</p>
            <p className="mt-2 text-fg-muted">
              Run the free audit first - see your page scored against 9 signals before you decide.
            </p>
            <Link
              href="/audit?utm_source=pricing&utm_medium=internal"
              className="mt-5 inline-flex rounded bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent"
            >
              Run free audit →
            </Link>
          </div>

          <section className="mt-16 rounded-md border border-border bg-bg-muted/20 p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">Frequently asked questions</h2>
            <dl className="space-y-6">
              {
                faqItems.map(({ q, a }) => (
                  <div key={q}>
                    <dt className="font-semibold text-fg">{q}</dt>
                    <dd className="mt-2 text-fg-muted">{a}</dd>
                  </div>
                ))
              }
            </dl>
          </section>
        </div>
      </PageShell>
    </>
  )
}