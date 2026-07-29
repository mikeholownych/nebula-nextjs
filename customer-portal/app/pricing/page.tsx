import type { Metadata } from 'next'
import Link from 'next/link'
import { getActiveFixPack, type FixPackPublicFact } from '@/app/lib/public-facts'
import { REPAIR_SPRINT_OFFER } from '@/app/lib/repair-sprint-offer'
import { Card, PageShell } from '@/components/ui'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Landing Page Audit Pricing & One-Leak Repair Sprint | Nebula',
  description:
    'Free landing page audit, plus the $97 One-Leak Repair Sprint: one landing page, one high-confidence repair, implemented and verified by Nebula.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/pricing',
  },
}

function buildServiceSchema(fixPack: FixPackPublicFact) {
  return {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://nebulacomponents.shop/pricing#fix-pack',
  name: REPAIR_SPRINT_OFFER.name,
  description: REPAIR_SPRINT_OFFER.summary,
  provider: { '@id': 'https://nebulacomponents.shop/#organization' },
  serviceType: 'Landing Page Conversion Optimization',
  url: 'https://nebulacomponents.shop/pricing',
  offers: {
    '@type': 'Offer',
    price: String(REPAIR_SPRINT_OFFER.priceUsd),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: `https://nebulacomponents.shop${fixPack.checkout.pagePath}`,
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
    q: 'What is included in the One-Leak Repair Sprint?',
    a: 'Nebula selects one high-confidence page-level repair from the audit, records the baseline, confirms the scope with you, implements the approved repair, verifies production, and runs a same-scope re-audit.',
  },
  {
    q: 'Why only one repair?',
    a: 'A bounded change can be implemented safely and verified honestly. Changing many things at once makes it harder to determine what changed and turns a $97 repair into an undefined redesign.',
  },
  {
    q: 'How does access work?',
    a: 'After scope approval, you grant temporary collaborator access through your platform or approve a patch handoff. Never send passwords by email. If neither path is safe, we refund you before work begins.',
  },
  {
    q: 'How long does it take?',
    a: 'Stripe confirms the purchase immediately. We email you within one business day to confirm the audited URL, repair scope, approval, and access path before implementation begins.',
  },
  {
    q: 'Does the repair guarantee more conversions?',
    a: 'No. Nebula verifies the page condition and implementation. We do not promise conversion lift because traffic quality, offer strength, campaign changes, and measurement windows also affect outcomes.',
  },
  {
    q: 'What does the 30-day evidence check cover?',
    a: 'One additional check of the same repaired page condition within 30 days. It documents what changed and what remains open; it does not by itself prove business impact.',
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
              No retainer. No undefined redesign. Pay once for one bounded repair, implemented and verified.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Card variant="bordered">
              <p className="mb-3 text-sm font-medium text-fg-muted">Free</p>
              <h2 className="text-2xl font-semibold text-fg">Automated Audit</h2>
              <p className="mt-2 text-3xl font-bold text-fg">Free</p>
              <p className="mt-4 text-fg-muted">
                Drop in a URL and get a scored, evidence-backed diagnosis in minutes — no signup required.
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
              <Link href="/audit" className="mt-8 inline-flex rounded-xl border border-border px-5 py-3 font-semibold text-fg transition-colors hover:border-accent">
                Run free audit
              </Link>
            </Card>

            <Card variant="bordered">
              <p className="mb-3 text-sm font-medium text-fg-muted">One-time payment</p>
              <h2 className="text-2xl font-semibold text-fg">One-Leak Repair Sprint</h2>
              <p className="mt-2 text-4xl font-bold text-fg">${REPAIR_SPRINT_OFFER.priceUsd}</p>
              <p className="mt-4 text-fg-muted">
                One landing page. One high-confidence repair selected from your audit, approved by you,
                implemented by Nebula, and verified on the live page.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-fg-muted">
                {REPAIR_SPRINT_OFFER.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm leading-6 text-fg-muted">
                This service does not promise conversion lift. It proves what page condition was found,
                what changed, and whether that same condition changed on re-audit.
              </p>
              <Link href="/checkout" className="mt-8 inline-flex rounded-xl bg-accent px-5 py-3 font-semibold text-bg transition-colors hover:bg-accent-light">
                Review checkout →
              </Link>
            </Card>
          </div>

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
