import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPricingGuide, PRICING_GUIDE_SLUGS } from '../data'

export const dynamicParams = false

export function generateStaticParams() {
  return PRICING_GUIDE_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guide = getPricingGuide(slug)
  if (!guide) return {}
  return {
    title: `${guide.toolName} Pricing (2026): What It Really Costs + Cheaper Alternative`,
    description: guide.bluf,
    alternates: {
      canonical: `https://nebulacomponents.com/pricing-guides/${guide.slug}`,
    },
    openGraph: {
      title: `${guide.toolName} Pricing (2026): What It Really Costs + Cheaper Alternative`,
      description: guide.bluf,
      url: `https://nebulacomponents.com/pricing-guides/${guide.slug}`,
    },
  }
}

export default async function PricingGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const guide = getPricingGuide(slug)
  if (!guide) notFound()

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 pb-24">
      <article className="mx-auto max-w-4xl px-6 py-12">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-fg-muted">
            <li><Link href="/" className="hover:text-fg">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/landing-page-audit-tools-pricing" className="hover:text-fg">Tool Pricing</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-fg" aria-current="page">{guide.toolName} pricing</li>
          </ol>
        </nav>

        {/* Header */}
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          {guide.category} · Pricing verified August 2026
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
          {guide.toolName} Pricing (2026): What It Really Costs
        </h1>

        {/* BLUF - answer up front for AI snippet pull */}
        <section aria-label="Bottom line" className="mt-8 rounded-2xl border border-accent/20 bg-accent/5 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Bottom line up front</h2>
          <p className="mt-3 text-lg leading-8 text-fg">{guide.bluf}</p>
        </section>

        {/* Pricing tiers */}
        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-bold text-fg">{guide.toolName} pricing plans</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {guide.tiers.map((tier) => (
              <div key={tier.name} className="rounded-2xl border border-border bg-bg-panel p-6">
                <p className="text-sm font-semibold uppercase tracking-widest text-fg-muted">{tier.name}</p>
                <p className="mt-2 text-3xl font-bold text-fg">{tier.price}</p>
                {tier.note ? <p className="mt-2 text-sm text-fg-muted">{tier.note}</p> : null}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-fg-muted">
            Pricing from {guide.toolUrl.replace('https://', '')} as of August 2026. Prices change - verify at{' '}
            <a href={guide.toolUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              {guide.toolUrl.replace('https://', '')}
            </a>{' '}
            before deciding.
          </p>
        </section>

        {/* What you get */}
        <section className="mt-12 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-bold text-fg">What you actually get for the price</h2>
          <p className="text-fg-muted leading-relaxed">{guide.whatYouGet}</p>
        </section>

        {/* When worth it */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-bold text-fg">When {guide.toolName} is still worth it</h2>
          <p className="text-fg-muted leading-relaxed">{guide.whenWorthIt}</p>
        </section>

        {/* The cheaper alternative */}
        <section className="mt-12 rounded-2xl border border-accent/20 bg-accent/5 p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The cheaper alternative: Nebula</h2>
          <p className="text-fg leading-relaxed">
            Nebula audits any public landing page in under 2 minutes - free, no signup, no credit card. It checks the
            9 conversion signals that determine whether paid traffic converts: headline message match, CTA clarity,
            trust evidence, above-fold structure, mobile CTA, load speed, ad signals, SEO foundations, and AI citation
            readiness. When the audit finds leaks, the $97 one-time repair sprint writes the exact copy, code, or
            config changes for your page.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/audit?utm_source=pricing-guide&utm_medium=organic-content"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
            >
              Audit Your Page Free →
            </Link>
            <Link
              href={`/vs/${guide.vsSlug}`}
              className="inline-block rounded-xl border border-accent/40 px-8 py-4 font-semibold text-accent hover:bg-accent/10 transition-colors"
            >
              Full {guide.toolName} vs. Nebula Comparison →
            </Link>
          </div>
        </section>

        {/* FAQs */}
        <section className="mt-14" aria-label="Frequently asked questions">
          <h2 className="mb-6 text-2xl font-bold text-fg">Frequently asked questions</h2>
          <div className="divide-y divide-border rounded-2xl border border-border bg-bg-panel">
            {guide.faqs.map((faq) => (
              <details key={faq.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-fg">
                  {faq.q}
                  <span aria-hidden="true" className="shrink-0 text-accent transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-fg-muted leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* FAQPage JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />

      </article>
    </main>
  )
}
