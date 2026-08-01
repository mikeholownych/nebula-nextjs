import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ecommerce Landing Page Audit: Product Page Leaks | Nebula',
  description:
    'Audit ecommerce product landing pages for price clarity, shipping terms, return policy visibility, mobile checkout friction, and social proof.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/ecommerce-landing-page-audit',
  },
  openGraph: {
    title: 'Ecommerce Landing Page Audit: Product Page Leaks | Nebula',
    description:
      'Audit ecommerce product landing pages for price clarity, shipping terms, return policy visibility, mobile checkout friction, and social proof.',
    url: 'https://nebulacomponents.shop/ecommerce-landing-page-audit',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Ecommerce Landing Page Audit: Friction Analysis for Product Destinations',
  description:
    'Diagnostic guide evaluating pre-cart conversion friction on ecommerce product landing pages.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.shop/ecommerce-landing-page-audit',
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.shop' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Ecommerce Landing Page Audit',
      item: 'https://nebulacomponents.shop/ecommerce-landing-page-audit',
    },
  ],
}

export default function EcommerceAuditPage() {
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
      <main id="main-content" className="min-h-screen bg-bg pt-24 pb-16">
        <article className="mx-auto max-w-4xl px-6">
          <header className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
              Ecommerce Optimization
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Ecommerce Landing Page Audit
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed">
              Ecommerce ad traffic often bounces before adding items to cart. This audit evaluates product clarity, price visibility, shipping expectation setting, and pre-cart trust signals on public URLs.
            </p>
          </header>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/20 p-6 md:p-8">
            <h2 className="text-xl font-bold text-fg mb-4">Pre-Cart Audit Checklist</h2>
            <div className="space-y-4 text-sm text-fg-muted">
              <ul className="list-disc pl-5 space-y-2 text-fg-muted">
                <li><strong className="text-fg">Product Title &amp; Image Clarity:</strong> Immediate high-resolution product showcase above fold.</li>
                <li><strong className="text-fg">Price &amp; Shipping Visibility:</strong> Surfacing total cost and delivery timelines before add-to-cart.</li>
                <li><strong className="text-fg">Return Policy Proximity:</strong> Clear return terms displayed near the primary buy button.</li>
                <li><strong className="text-fg">Variant Selection Friction:</strong> Ensuring size/color selectors operate cleanly on mobile touch.</li>
                <li><strong className="text-fg">Customer Review Quality:</strong> Verifiable buyer reviews positioned directly below CTA.</li>
              </ul>
              <p className="text-xs text-fg-muted italic mt-4">
                Note: Nebula inspects observable public HTML on your product page. It does not submit cart forms or inspect private post-checkout states.
              </p>
            </div>
          </section>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">Audit Your Product Landing Page</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Run Nebula&apos;s free audit to check mobile performance, trust signals, and CTA placement on your ecommerce URL.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-base"
            >
              Run Free Ecommerce Audit &rarr;
            </Link>
          </section>

          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related Audits:</span>
            <Link href="/saas-landing-page-audit" className="hover:text-accent">
              SaaS Audit
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
