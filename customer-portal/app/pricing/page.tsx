import type { Metadata } from 'next'
import Link from 'next/link'
import { getActiveFixPack, type FixPackPublicFact } from '@/app/lib/public-facts'
import { REPAIR_SPRINT_OFFER } from '@/app/lib/self-implementation-kit-offer'
import { Card, PageShell } from '@/components/ui'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Landing Page Audit Pricing & One-Leak Self-Implementation Kit | Nebula',
  description:
    'Free 9-signal landing page audit plus a $97 self-implementation kit for one selected finding.',
  alternates: {
    canonical: 'https://nebulacomponents.com/pricing',
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
    name: 'Self-Implementation Kit deliverables',
    itemListElement: REPAIR_SPRINT_OFFER.includes.map((name) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name },
    })),
  },
  }
}

const faqItems = [
  {
    q: 'What is included in the One-Leak Self-Implementation Kit?',
    a: 'After the free audit, you pay $97 and receive a tailored implementation kit for one specific failing signal — exact copy, a code snippet, or a configuration change. You implement it yourself, with your developer, or through your CMS. No site access is required by Nebula.',
  },
  {
    q: 'Why only one finding?',
    a: 'A bounded change can be tested and measured honestly. Changing many things at once makes it impossible to know what worked. Fix the highest-impact finding first, run the re-audit, then decide what to do next.',
  },
  {
    q: 'Do I need to give Nebula access to my site?',
    a: 'No. The tailored kit is sent after successful payment — you apply it yourself or hand it to your developer. Nebula never needs CMS, hosting, or repository access.',
  },
  {
    q: 'How long does it take?',
    a: 'Stripe confirms the payment first. The tailored kit is then sent to the email used at checkout. Implementation speed depends on your setup.',
  },
  {
    q: 'Does the repair guarantee more conversions?',
    a: 'No. The kit targets a specific page condition identified by the audit. Conversion outcomes also depend on traffic quality, offer strength, and measurement windows. The 30-day re-audit shows whether the page condition changed — not whether revenue went up.',
  },
  {
    q: 'What does the 30-day evidence check cover?',
    a: 'One additional audit run on the same page within 30 days. It documents whether the repaired condition held. It does not by itself prove business impact.',
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

export default function PricingPage() {
  const fixPack = getActiveFixPack()
  const serviceSchema = fixPack ? buildServiceSchema(fixPack) : null

  return (
    <>
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
      <PageShell title="Pricing" description="Only verified, currently available offers are shown.">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="mb-16 text-center">
            <p className="mx-auto mt-4 max-w-xl text-fg-muted">
              No retainer. No undefined redesign. Pay once for one bounded implementation kit and apply it yourself.
            </p>
            <p className="mt-3 text-sm text-fg-muted">
              Under 2 minutes · no signup · no sales call
            </p>
          </div>

          <section aria-labelledby="pricing-answers" className="mb-12 rounded-2xl border border-border bg-bg-muted/10 p-6">
            <h2 id="pricing-answers" className="mb-4 text-lg font-semibold text-fg">Direct answers</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="font-semibold text-fg">What does the free audit check?</h3>
                <p className="mt-1 text-sm leading-6 text-fg-muted">It checks 9 conversion signals against a public landing page and returns results in under 2 minutes.</p>
              </div>
              <div>
                <h3 className="font-semibold text-fg">What does the self-implementation kit cost?</h3>
                <p className="mt-1 text-sm leading-6 text-fg-muted">The One-Leak Self-Implementation Kit costs $97 as a one-time payment.</p>
              </div>
              <div>
                <h3 className="font-semibold text-fg">Does it guarantee more conversions?</h3>
                <p className="mt-1 text-sm leading-6 text-fg-muted">No. It targets a specific page condition and does not promise conversion lift; the same-scope re-audit is available within 30 days.</p>
              </div>
            </div>
          </section>

          <div className="grid gap-8 md:grid-cols-2">
            <Card variant="bordered">
              <p className="mb-3 text-sm font-medium text-fg-muted">Free</p>
              <h2 className="text-2xl font-semibold text-fg">Automated Audit</h2>
              <p className="mt-1 text-sm italic text-fg-muted">See what's leaking before you spend another dollar</p>
              <p className="mt-2 text-3xl font-bold text-fg">Free</p>
              <p className="mt-4 text-fg-muted">
                Drop in a URL and get a scored, evidence-backed diagnosis in minutes — no signup required.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-fg-muted">
                {[
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
                ))}
              </ul>
              <Link href="/audit" className="mt-8 inline-flex rounded-xl border border-border px-5 py-3 font-semibold text-fg transition-colors hover:border-accent">
                Run free audit
              </Link>
            </Card>

            <Card variant="bordered">
              <p className="mb-3 text-sm font-medium text-fg-muted">One-time payment</p>
              <h2 className="text-2xl font-semibold text-fg">One-Leak Self-Implementation Kit</h2>
              <p className="mt-1 text-sm italic text-fg-muted">Fix the highest-impact leak — kit sent after successful payment</p>
              <p className="mt-2 text-4xl font-bold text-fg">${REPAIR_SPRINT_OFFER.priceUsd}</p>
              <p className="mt-4 text-fg-muted">
                Run the free audit on one landing page first — see your score and initial findings before sharing an email.
                Pay $97 for a tailored implementation kit for one high-impact finding on your specific page.
              </p>
              <div className="mt-6 space-y-3">
                {'howItWorks' in REPAIR_SPRINT_OFFER && Array.isArray(REPAIR_SPRINT_OFFER.howItWorks) &&
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
                This service does not promise conversion lift. It proves what page condition was found,
                what changed, and whether that same condition changed on re-audit.
              </p>
              <Link href="/audit" className="mt-8 inline-flex rounded-xl bg-accent px-5 py-3 font-semibold text-bg transition-colors hover:bg-accent-light">
                Run the audit first →
              </Link>
            </Card>
          </div>

          <p className="mt-6 text-center text-sm text-fg-muted">
            Every audit you run with an email is kept in a free workspace — audit history, fix queue,
            compare, timeline, and 30-day re-audit tracking. No subscription required.
          </p>

          <div className="mt-12 rounded-2xl border border-accent/20 bg-accent/5 p-8 text-center">
            <p className="text-lg font-semibold text-fg">Not sure yet?</p>
            <p className="mt-2 text-fg-muted">
              Run the free audit first — see exactly what's leaking before you decide.
            </p>
            <Link
              href="/audit"
              className="mt-5 inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light"
            >
              Run free audit →
            </Link>
          </div>

          <section className="mt-16 rounded-2xl border border-border bg-bg-muted/20 p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">Frequently asked questions</h2>
            <dl className="space-y-6">
              {faqItems.map(({ q, a }) => (
                <div key={q}>
                  <dt className="font-semibold text-fg">{q}</dt>
                  <dd className="mt-2 text-fg-muted">{a}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </PageShell>
    </>
  )
}
