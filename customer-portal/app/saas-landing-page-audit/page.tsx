import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SaaS Landing Page Audit: ICP & Friction Guide | Nebula',
  description:
    'Audit SaaS landing pages for ICP clarity, product comprehension, demo vs trial CTA friction, proof placement, and security claims.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/saas-landing-page-audit',
  },
  openGraph: {
    title: 'SaaS Landing Page Audit: ICP & Friction Guide | Nebula',
    description:
      'Audit SaaS landing pages for ICP clarity, product comprehension, demo vs trial CTA friction, proof placement, and security claims.',
    url: 'https://nebulacomponents.shop/saas-landing-page-audit',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'SaaS Landing Page Audit: B2B Conversion Friction & ICP Alignment',
  description:
    'Tailored audit framework for B2B SaaS landing pages evaluating trial friction, product proof, and enterprise credibility.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.shop/saas-landing-page-audit',
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.shop' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'SaaS Landing Page Audit',
      item: 'https://nebulacomponents.shop/saas-landing-page-audit',
    },
  ],
}

export default function SaasAuditPage() {
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
              B2B SaaS Conversion
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              SaaS Landing Page Audit
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed">
              B2B SaaS landing pages often struggle with feature-heavy jargon, premature demo requests, or vague value propositions. This guide covers how to audit SaaS pages for ICP clarity, product comprehension, and friction-free onboarding.
            </p>
          </header>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/20 p-6 md:p-8">
            <h2 className="text-xl font-bold text-fg mb-4">Core SaaS Audit Checklist</h2>
            <div className="space-y-4 text-sm text-fg-muted">
              <ul className="list-disc pl-5 space-y-2 text-fg-muted">
                <li><strong className="text-fg">ICP Clarity:</strong> Does the headline explicitly state who the software is for?</li>
                <li><strong className="text-fg">Product Comprehension:</strong> Can a visitor understand what the software does within 5 seconds?</li>
                <li><strong className="text-fg">Screenshot &amp; UI Visibility:</strong> Is real product interface visible above the fold?</li>
                <li><strong className="text-fg">Demo vs Trial CTA Alignment:</strong> Matching commitment level to product complexity.</li>
                <li><strong className="text-fg">Security &amp; Integration Claims:</strong> Verifiable SOC2, GDPR, or API integration badges.</li>
                <li><strong className="text-fg">Pricing Expectations:</strong> Clear tier transparency vs hidden enterprise quotes.</li>
              </ul>
            </div>
          </section>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">Audit Your SaaS Landing Page</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Run Nebula&apos;s free audit to check message match, CTA friction, and proof placement on your SaaS page URL.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-base"
            >
              Run Free SaaS Audit &rarr;
            </Link>
          </section>

          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related Audits:</span>
            <Link href="/ecommerce-landing-page-audit" className="hover:text-accent">
              Ecommerce Audit
            </Link>
            <Link href="/lead-generation-landing-page-audit" className="hover:text-accent">
              Lead Gen Audit
            </Link>
            <Link href="/pricing" className="hover:text-accent">
              Repair Sprint Pricing
            </Link>
          </footer>
        </article>
      </main>
    </>
  )
}
