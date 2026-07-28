import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Lead Gen Landing Page Audit: Form Friction Guide | Nebula',
  description:
    'Audit lead generation landing pages for form length, qualification burden, privacy concerns, scheduling friction, and proof proximity.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/lead-generation-landing-page-audit',
  },
  openGraph: {
    title: 'Lead Gen Landing Page Audit: Form Friction Guide | Nebula',
    description:
      'Audit lead generation landing pages for form length, qualification burden, privacy concerns, scheduling friction, and proof proximity.',
    url: 'https://nebulacomponents.shop/lead-generation-landing-page-audit',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Lead Generation Landing Page Audit: Form Friction & Qualification Balance',
  description:
    'Diagnostic guide evaluating lead generation form length, qualification burdens, and privacy reassurance.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.shop/lead-generation-landing-page-audit',
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.shop' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Lead Generation Landing Page Audit',
      item: 'https://nebulacomponents.shop/lead-generation-landing-page-audit',
    },
  ],
}

export default function LeadGenAuditPage() {
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
              Lead Generation Diagnostics
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Lead Generation Landing Page Audit
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed">
              When paid ad campaigns fail to generate form fills, the obstacle is often form field burden, missing privacy reassurance, or unaligned call to action expectations.
            </p>
          </header>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/20 p-6 md:p-8">
            <h2 className="text-xl font-bold text-fg mb-4">Core Lead Gen Form Audit Signals</h2>
            <div className="space-y-4 text-sm text-fg-muted">
              <ul className="list-disc pl-5 space-y-2 text-fg-muted">
                <li><strong className="text-fg">Form Field Count:</strong> Keeping initial contact inputs to 5 fields or fewer for cold traffic.</li>
                <li><strong className="text-fg">Qualification Burden:</strong> Balancing required fields against drop-off rates.</li>
                <li><strong className="text-fg">Privacy &amp; Spam Reassurance:</strong> Explicit micro-copy confirming email privacy next to submit.</li>
                <li><strong className="text-fg">CTA Expectation Clarity:</strong> Stating what happens post-submission (&quot;Get Audit PDF in 2 Mins&quot;).</li>
                <li><strong className="text-fg">Proof Proximity:</strong> Testimonial or client logotype placement adjacent to the form container.</li>
              </ul>
            </div>
          </section>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">Audit Your Lead Generation Page</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Run Nebula&apos;s free audit to check form friction, label accessibility, and CTA clarity on your lead magnet or landing page URL.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-base"
            >
              Run Free Lead Gen Audit &rarr;
            </Link>
          </section>

          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related Audits:</span>
            <Link href="/saas-landing-page-audit" className="hover:text-accent">
              SaaS Audit
            </Link>
            <Link href="/ecommerce-landing-page-audit" className="hover:text-accent">
              Ecommerce Audit
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
