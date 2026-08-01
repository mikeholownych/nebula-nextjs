import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mobile Landing Page Audit: Find Mobile Leaks | Nebula',
  description:
    'Audit mobile landing page conversion friction. Inspect viewport meta tags, horizontal overflow, 44px tap targets, mobile CTA visibility, and form layout.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/mobile-landing-page-audit',
  },
  openGraph: {
    title: 'Mobile Landing Page Audit: Find Mobile Leaks | Nebula',
    description:
      'Audit mobile landing page conversion friction. Inspect viewport meta tags, horizontal overflow, 44px tap targets, mobile CTA visibility, and form layout.',
    url: 'https://nebulacomponents.shop/mobile-landing-page-audit',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Mobile Landing Page Audit: Diagnosing Viewport Conversion Leaks',
  description:
    'Technical and UX diagnostic guide for identifying mobile-specific conversion bottlenecks.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.shop/mobile-landing-page-audit',
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.shop' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Mobile Landing Page Audit',
      item: 'https://nebulacomponents.shop/mobile-landing-page-audit',
    },
  ],
}

export default function MobileAuditPage() {
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
              Mobile Responsive UX
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Mobile Landing Page Audit
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed">
              Over 60% of paid ad traffic arrives via mobile devices. When mobile conversion rates lag behind desktop, the cause is usually viewport friction, unoptimized layout scaling, or obscured action buttons.
            </p>
          </header>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/20 p-6 md:p-8">
            <h2 className="text-xl font-bold text-fg mb-4">Core Mobile Audit Parameters</h2>
            <div className="space-y-4 text-sm text-fg-muted">
              <ul className="list-disc pl-5 space-y-2 text-fg-muted">
                <li><strong className="text-fg">Viewport Meta Tag:</strong> Verifying `width=device-width, initial-scale=1` configuration.</li>
                <li><strong className="text-fg">Horizontal Overflow:</strong> Detecting wide elements causing unintended X-axis scrolling.</li>
                <li><strong className="text-fg">Tap Target Size:</strong> Ensuring buttons and inputs satisfy WCAG 44x44px minimum touch boundaries.</li>
                <li><strong className="text-fg">Mobile CTA Placement:</strong> Checking primary CTA visibility within 600px of top viewport space.</li>
                <li><strong className="text-fg">Fixed Banner Interferences:</strong> Auditing sticky headers and cookie bars for button occlusion.</li>
                <li><strong className="text-fg">Mobile Image Weight:</strong> Checking image sizing and WebP format usage on mobile networks.</li>
              </ul>
            </div>
          </section>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">Audit Your Mobile Landing Page</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Run Nebula&apos;s free audit to inspect mobile viewport signals, layout checks, and tap target accessibility on your URL.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-base"
            >
              Run Free Mobile Audit &rarr;
            </Link>
          </section>

          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related Pages:</span>
            <Link href="/landing-page-cta-audit" className="hover:text-accent">
              CTA Audit
            </Link>
            <Link href="/why-is-my-landing-page-not-converting" className="hover:text-accent">
              Why Page Not Converting
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
