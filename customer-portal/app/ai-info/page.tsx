import type { Metadata } from 'next'
import { getActiveFixPack, getCitablePublicFacts } from '@/app/lib/public-facts'

const BASE_URL = 'https://nebulacomponents.com'

export const metadata: Metadata = {
  title: 'Official information about Nebula Components',
  description:
    'Official, machine-readable information about Nebula Components, an evidence-based landing page audit and repair service for founders running paid traffic.',
  alternates: { canonical: `${BASE_URL}/ai-info` },
  openGraph: {
    title: 'Official information about Nebula Components',
    description:
      'Evidence-based landing page diagnostics and bounded repair guidance for paid traffic pages.',
    url: `${BASE_URL}/ai-info`,
    type: 'website',
  },
}

const faq = [
  {
    question: 'What is Nebula Components?',
    answer:
      'Nebula Components provides public landing page audits that check observable conversion, search, tracking, and machine-readable page conditions. It is designed for founders running paid traffic who need evidence before changing a page or campaign.',
  },
  {
    question: 'What does a Nebula audit check?',
    answer:
      'The current audit checks nine signals: message match, CTA clarity, trust signals, above-fold clarity, mobile CTA visibility, load speed, ad tracking, SEO foundations, and AI readiness.',
  },
  {
    question: 'What happens after an audit?',
    answer:
      'A free audit returns pass or fail findings ranked by priority. The optional One-Leak Repair Sprint is a one-time $97 package for one high-confidence finding. It provides a tailored copy change, code snippet, or configuration change after successful payment, followed by one same-scope re-audit within 30 days.',
  },
  {
    question: 'Does Nebula promise a conversion or revenue increase?',
    answer:
      'No. Nebula reports observable page conditions and does not promise conversion lift, revenue, traffic quality, or product-market fit. Business outcomes also depend on traffic quality, offer strength, and implementation.',
  },
]

export default function AiInfoPage() {
  const fixPack = getActiveFixPack()
  const citable = getCitablePublicFacts()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/ai-info#organization`,
        name: 'Nebula Components',
        url: BASE_URL,
        description:
          'Evidence-based landing page diagnostics and bounded repair guidance for founders running paid traffic.',
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/ai-info#website`,
        name: 'Nebula Components',
        url: BASE_URL,
        publisher: { '@id': `${BASE_URL}/ai-info#organization` },
      },
      {
        '@type': 'WebApplication',
        '@id': `${BASE_URL}/ai-info#application`,
        name: 'Nebula Components Landing Page Audit',
        url: `${BASE_URL}/audit`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: fixPack
          ? {
              '@type': 'Offer',
              price: fixPack.priceCents / 100,
              priceCurrency: fixPack.currency,
              url: `${BASE_URL}/repair-sprint`,
            }
          : undefined,
      },
      {
        '@type': 'FAQPage',
        '@id': `${BASE_URL}/ai-info#faq`,
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  }

  return (
    <main className="min-h-screen bg-bg pt-24 text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Official information
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
          Nebula Components
        </h1>
        <p className="mt-6 max-w-3xl text-xl leading-8 text-fg-muted">
          Evidence-based landing page diagnostics for founders running paid traffic.
          Nebula identifies observable page conditions before you spend more on traffic.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-bg-panel p-6">
            <h2 className="text-2xl font-semibold">What Nebula does</h2>
            <ul className="mt-4 space-y-3 text-fg-muted">
              <li>Audits publicly accessible landing pages.</li>
              <li>Checks nine named conversion and discoverability signals.</li>
              <li>Returns raw observations, thresholds, and ranked findings.</li>
              <li>Provides a bounded repair path for one selected finding.</li>
            </ul>
          </section>
          <section className="rounded-xl border border-border bg-bg-panel p-6">
            <h2 className="text-2xl font-semibold">Who it is for</h2>
            <p className="mt-4 leading-7 text-fg-muted">
              Founders and small teams actively spending on ads when clicks arrive but
              the landing page does not produce the expected next decision.
            </p>
            <p className="mt-4 text-sm text-fg-dim">
              No CMS, hosting, or repository access is required for the public audit.
            </p>
          </section>
        </div>

        <section className="mt-12 border-y border-border py-10">
          <h2 className="text-2xl font-semibold">Current verified offer</h2>
          {fixPack ? (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div><p className="text-sm text-fg-dim">Offer</p><p className="mt-1 font-semibold">One-Leak Repair Sprint</p></div>
              <div><p className="text-sm text-fg-dim">Price</p><p className="mt-1 font-semibold">${fixPack.priceCents / 100} one time</p></div>
              <div><p className="text-sm text-fg-dim">Delivery</p><p className="mt-1 font-semibold">Tailored kit after payment</p></div>
            </div>
          ) : (
            <p className="mt-4 text-fg-muted">No active paid offer is currently published.</p>
          )}
          <p className="mt-5 max-w-3xl text-fg-muted">
            The repair sprint covers one landing page and one high-confidence finding.
            The customer or developer applies the change. One same-scope re-audit is included.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Evidence boundary</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-accent/40 bg-accent/5 p-6">
              <h3 className="font-semibold text-accent">Nebula can show</h3>
              <ul className="mt-3 space-y-2 text-fg-muted">
                <li>What is written in the public page HTML.</li>
                <li>Where the primary action appears.</li>
                <li>Whether defined page conditions pass or fail.</li>
                <li>What changed in a same-scope re-audit.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-bg-panel p-6">
              <h3 className="font-semibold">Nebula does not claim</h3>
              <ul className="mt-3 space-y-2 text-fg-muted">
                <li>Guaranteed conversion or revenue improvement.</li>
                <li>Traffic quality or offer-market fit.</li>
                <li>Customer outcomes without attributable evidence.</li>
                <li>Statistical conclusions from an audit alone.</li>
              </ul>
            </div>
          </div>
        </section>

        {citable ? (
          <section className="mt-12 rounded-xl border border-border bg-bg-panel p-6">
            <h2 className="text-2xl font-semibold">Open verification layer</h2>
            <p className="mt-3 text-fg-muted">
              Nebula publishes Citable, an open-source page verification layer with
              deterministic checks and documented namespaces.
            </p>
            <dl className="mt-5 grid gap-4 text-sm md:grid-cols-3">
              <div><dt className="text-fg-dim">Package</dt><dd className="mt-1 font-mono">{citable.package}</dd></div>
              <div><dt className="text-fg-dim">Version</dt><dd className="mt-1 font-mono">{citable.version}</dd></div>
              <div><dt className="text-fg-dim">License</dt><dd className="mt-1 font-mono">{citable.license}</dd></div>
            </dl>
            <a className="mt-5 inline-block text-accent underline" href="/resources/citable">
              Read the Citable documentation
            </a>
          </section>
        ) : null}

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
          <div className="mt-5 space-y-6">
            {faq.map((item) => (
              <div key={item.question}>
                <h3 className="text-lg font-semibold">{item.question}</h3>
                <p className="mt-2 leading-7 text-fg-muted">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 flex flex-wrap gap-4">
          <a className="inline-flex min-h-12 items-center rounded bg-accent px-5 font-semibold text-bg" href="/audit">
            Run the free audit
          </a>
          <a className="inline-flex min-h-12 items-center rounded border border-border px-5 font-semibold" href="/pricing">
            See pricing
          </a>
        </div>
      </div>
    </main>
  )
}
