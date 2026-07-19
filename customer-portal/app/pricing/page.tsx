import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, PageShell } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Pricing — Nebula Components Landing Page Audit & Fix Pack',
  description:
    'One-time $147 Conversion Fix Pack: landing page audit diagnosis plus implementation. No retainer, no ongoing commitment. Pay once, get your leaks fixed.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/pricing',
  },
}

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://nebulacomponents.shop/pricing#fix-pack',
  name: 'Conversion Fix Pack',
  description:
    'A structured landing page audit and full implementation of the findings. We identify the specific conversion leaks on your page and fix them. Delivered within 24–48 hours.',
  provider: { '@id': 'https://nebulacomponents.shop/#organization' },
  serviceType: 'Landing Page Conversion Optimization',
  url: 'https://nebulacomponents.shop/pricing',
  offers: {
    '@type': 'Offer',
    price: '147',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: 'https://nebulacomponents.shop/checkout',
    priceValidUntil: '2026-12-31',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Fix Pack deliverables',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Full 7-point page audit' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Written diagnosis with prioritised fix list' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Implementation of all identified fixes' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Before/after comparison' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '30-day re-audit if conversion does not improve' } },
    ],
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is included in the Fix Pack?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A documented audit of your landing page against seven conversion criteria, a written diagnosis identifying which issues are present and in what order to fix them, and implementation of those fixes on your live page.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most Fix Packs are delivered within 24–48 business hours of payment. Complex pages with significant structural issues may take up to 72 hours.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need a retainer or ongoing contract?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. The Fix Pack is a one-time payment. There is no recurring charge and no obligation after delivery.',
      },
    },
    {
      '@type': 'Question',
      name: 'What if my conversion rate does not improve?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We include a 30-day re-audit. If the page is not converting better after fixes are applied and traffic is running, we audit again at no additional charge.',
      },
    },
  ],
}

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <PageShell title="Pricing" description="Only verified, currently available offers are shown.">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-16 text-center">
          <p className="mt-4 max-w-xl mx-auto text-fg-muted">
            No retainers. No monthly commitments. Pay once for the diagnosis and fix, then we are done — until you need us again.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card variant="bordered">
            <p className="mb-3 text-sm font-medium text-fg-muted">Free, instant</p>
            <h2 className="text-2xl font-semibold text-fg">Automated Audit</h2>
            <p className="mt-2 text-3xl font-bold text-fg">Free</p>
            <p className="mt-4 text-fg-muted">
              Drop in a URL and get a scored, evidence-backed diagnosis in seconds — no signup required.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-fg-muted">
              {[
                'Message-match diagnosis',
                'Trust signal check',
                'Mobile layout review',
                'Load time assessment',
                'Compliance flag scan',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-fg-muted" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/audit" className="mt-8 inline-flex rounded-xl border border-border px-5 py-3 font-semibold text-fg hover:border-accent transition-colors">
              Run free audit
            </Link>
          </Card>

          <Card variant="bordered">
            <p className="mb-3 text-sm font-medium text-fg-muted">One-time payment</p>
            <h2 className="text-2xl font-semibold text-fg">Conversion Fix Pack</h2>
            <p className="mt-2 text-4xl font-bold text-fg">$147</p>
            <p className="mt-4 text-fg-muted">
              A structured landing page audit and implementation of the findings. We identify the specific leaks on your page and fix them. Delivered within 24–48 hours.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-fg-muted">
              {[
                'Full 7-point page audit',
                'Written diagnosis with prioritised fix list',
                'Implementation of all identified fixes',
                'Before/after comparison',
                '30-day re-audit if conversion does not improve',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/checkout" className="mt-8 inline-flex rounded-xl bg-accent px-5 py-3 font-semibold text-bg hover:bg-accent-light transition-colors">
              Review checkout →
            </Link>
          </Card>
        </div>

        <section className="mt-16 rounded-2xl border border-border bg-bg-muted/20 p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Frequently asked questions</h2>
          <dl className="space-y-6">
            {[
              {
                q: 'What is included in the Fix Pack?',
                a: 'A documented audit of your landing page against seven conversion criteria, a written diagnosis identifying which issues are present and in what order to fix them, and implementation of those fixes on your live page.',
              },
              {
                q: 'How long does it take?',
                a: 'Most Fix Packs are delivered within 24–48 business hours of payment. Complex pages with significant structural issues may take up to 72 hours.',
              },
              {
                q: 'Do I need a retainer or ongoing contract?',
                a: 'No. The Fix Pack is a one-time payment. There is no recurring charge and no obligation after delivery.',
              },
              {
                q: 'What if my conversion rate does not improve?',
                a: 'We include a 30-day re-audit. If the page is not converting better after fixes are applied and traffic is running, we audit again at no additional charge.',
              },
            ].map(({ q, a }) => (
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
