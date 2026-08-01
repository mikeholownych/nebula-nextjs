import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Landing Page Trust Signals: Social Proof Audit | Nebula',
  description:
    'Audit landing page trust signals. Separate authentic proof from decorative trust theater. Optimize testimonial proximity, security seals, and identity.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/landing-page-trust-signals',
  },
  openGraph: {
    title: 'Landing Page Trust Signals: Social Proof Audit | Nebula',
    description:
      'Audit landing page trust signals. Separate authentic proof from decorative trust theater. Optimize testimonial proximity, security seals, and identity.',
    url: 'https://nebulacomponents.shop/landing-page-trust-signals',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Landing Page Trust Signals: Authentic Proof vs Trust Theater',
  description:
    'Diagnostic framework for auditing credibility, social proof placement, and verifiable trust signals on landing pages.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.shop/landing-page-trust-signals',
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.shop' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Landing Page Trust Signals',
      item: 'https://nebulacomponents.shop/landing-page-trust-signals',
    },
  ],
}

export default function TrustSignalsPage() {
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
              Credibility Architecture
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Landing Page Trust Signals
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed">
              Cold paid traffic arrives with natural skepticism. Authentic trust signals reduce perceived buyer risk, while decorative or unverifiable proof triggers immediate abandonment.
            </p>
          </header>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/20 p-6 md:p-8">
            <h2 className="text-xl font-bold text-fg mb-4">Authentic Proof vs Trust Theater</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <h3 className="font-semibold text-fg text-sm mb-2 text-red-400">Decorative Trust Theater</h3>
                <ul className="space-y-2 text-xs text-fg-muted">
                  <li>✕ Generic quote testimonials without full name, photo, or company</li>
                  <li>✕ Unverifiable press logos (&quot;As seen on...&quot; without article links)</li>
                  <li>✕ Vague customer count claims (&quot;Trusted by 10,000+ founders&quot;)</li>
                  <li>✕ Synthetic star rating badges disconnected from review providers</li>
                </ul>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <h3 className="font-semibold text-fg text-sm mb-2 text-emerald-400">Authentic Verifiable Proof</h3>
                <ul className="space-y-2 text-xs text-fg-muted">
                  <li>✓ Specific case studies detailing measured baseline and outcome</li>
                  <li>✓ Verifiable customer references with direct website links</li>
                  <li>✓ Clear company contact info, physical address, and team identity</li>
                  <li>✓ Explicit policy terms (return policy, data handling, guarantee scope)</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-fg mb-4">Proof Proximity to Decision Points</h2>
            <p className="text-sm text-fg-muted leading-relaxed mb-4">
              Where proof appears on the page matters as much as what the proof contains. Placing social proof signals within 100px of your primary CTA button reassures buyers at the exact moment of decision.
            </p>
            <div className="p-6 rounded-xl border border-border bg-bg-muted/10 font-mono text-xs text-fg-muted">
              <div className="mb-2 text-accent">[Hero Primary CTA Area]</div>
              <div className="mb-2 text-fg font-bold">[ Button: &quot;Start Free Trial&quot; ]</div>
              <div className="text-fg-muted">↑ Direct Proximity: &quot;No credit card required · 4.9/5 from 120 verified reviews&quot;</div>
            </div>
          </section>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">Audit Your Page Trust Signals</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Run Nebula&apos;s free audit to check above-fold trust signal presence, CTA proximity, and observable credibility markers.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-base"
            >
              Run Free Audit Now &rarr;
            </Link>
          </section>

          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related Pages:</span>
            <Link href="/landing-page-cta-audit" className="hover:text-accent">
              CTA Audit Guide
            </Link>
            <Link href="/saas-landing-page-audit" className="hover:text-accent">
              SaaS Trust Signals
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
