import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Landing Page CTA Audit: Action & Friction Checklist | Nebula',
  description:
    'Audit landing page call to action clarity, contrast, placement, and downstream friction. Eliminate competing buttons and improve mobile visibility.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/landing-page-cta-audit',
  },
  openGraph: {
    title: 'Landing Page CTA Audit: Action & Friction Checklist | Nebula',
    description:
      'Audit landing page call to action clarity, contrast, placement, and downstream friction. Eliminate competing buttons and improve mobile visibility.',
    url: 'https://nebulacomponents.shop/landing-page-cta-audit',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Landing Page CTA Audit: Action Hierarchy and Friction Control',
  description:
    'Evidence-first guide to auditing landing page calls to action beyond button color theatrics.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.shop/landing-page-cta-audit',
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.shop' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Landing Page CTA Audit',
      item: 'https://nebulacomponents.shop/landing-page-cta-audit',
    },
  ],
}

export default function CtaAuditPage() {
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
              Action Hierarchy
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Landing Page CTA Audit
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed">
              CTA optimization is not about testing button colors. A high-converting call to action requires clear outcome messaging, visual contrast, singular focus, and low friction at the next step.
            </p>
          </header>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/20 p-6 md:p-8">
            <h2 className="text-xl font-bold text-fg mb-4">The Eight CTA Quality Dimensions</h2>
            <div className="space-y-4 text-sm text-fg-muted">
              <ul className="list-disc pl-5 space-y-2 text-fg-muted">
                <li><strong className="text-fg">Specific Action Text:</strong> &quot;Get Free Audit&quot; vs vague &quot;Submit&quot; or &quot;Click Here&quot;.</li>
                <li><strong className="text-fg">WCAG Color Contrast:</strong> Minimum 4.5:1 contrast ratio between CTA text and button background.</li>
                <li><strong className="text-fg">Singular Focus:</strong> Exactly one dominant primary CTA per viewport section.</li>
                <li><strong className="text-fg">Competing Action Removal:</strong> Eliminating navigation links that pull visitors off the conversion path.</li>
                <li><strong className="text-fg">Expectation Setting:</strong> Explicitly stating what happens immediately after clicking.</li>
                <li><strong className="text-fg">Mobile Viewport Persistence:</strong> Ensuring CTA buttons stay accessible on small screens.</li>
                <li><strong className="text-fg">Risk Reduction Proximity:</strong> Placing micro-copy (&quot;No credit card required&quot;) directly next to CTA.</li>
                <li><strong className="text-fg">Downstream Form Friction:</strong> Ensuring the destination form does not ask for excessive details.</li>
              </ul>
            </div>
          </section>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">Audit Your Call to Action</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Run Nebula&apos;s free audit to evaluate CTA clarity, button contrast ratios, and competing link count on your page.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-base"
            >
              Run Free CTA Audit &rarr;
            </Link>
          </section>

          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related Diagnostics:</span>
            <Link href="/mobile-landing-page-audit" className="hover:text-accent">
              Mobile CTA Audit
            </Link>
            <Link href="/landing-page-trust-signals" className="hover:text-accent">
              Trust Signal Audit
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
