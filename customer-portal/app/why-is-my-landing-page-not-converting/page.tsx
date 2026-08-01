import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Why Is My Landing Page Not Converting? Diagnostic Guide | Nebula',
  description:
    'Step-by-step diagnostic guide for landing pages getting clicks but no conversions. Identify observable friction across message match, trust, and CTA hierarchy.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/why-is-my-landing-page-not-converting',
  },
  openGraph: {
    title: 'Why Is My Landing Page Not Converting? Diagnostic Guide | Nebula',
    description:
      'Step-by-step diagnostic guide for landing pages getting clicks but no conversions. Identify observable friction across message match, trust, and CTA hierarchy.',
    url: 'https://nebulacomponents.shop/why-is-my-landing-page-not-converting',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Why Is My Landing Page Not Converting? A Step-by-Step Diagnosis',
  description:
    'Detailed diagnostic guide separating page-level conversion friction from ad targeting, offer economics, and traffic quality.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.shop/why-is-my-landing-page-not-converting',
}

const faqItems = [
  {
    q: 'Why am I getting clicks on my ads but zero conversions?',
    a: 'A click proves ad relevance, but conversion depends on post-click continuity. The most common causes are message mismatch between the ad promise and page headline, missing social proof above the fold, mobile rendering bottlenecks, or excessive form fields.',
  },
  {
    q: 'Can an automated audit tell me if my traffic is low quality?',
    a: 'No. An automated page audit evaluates observable DOM and HTML conditions on your public URL. It cannot measure ad account audience selection, search intent, or traffic quality. It surfaces page-level friction candidates so you can rule out page defects first.',
  },
  {
    q: 'What should I fix first if my page is not converting?',
    a: 'First, check message match: ensure your landing page H1 repeats the exact promise made in your ad creative. Second, ensure a clear primary call to action is visible on mobile viewports without scrolling. Third, place verifiable trust signals directly adjacent to the CTA.',
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

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.shop' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Why Is My Landing Page Not Converting',
      item: 'https://nebulacomponents.shop/why-is-my-landing-page-not-converting',
    },
  ],
}

export default function WhyNotConvertingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main id="main-content" className="min-h-screen bg-bg pt-24 pb-16">
        <article className="mx-auto max-w-4xl px-6">
          <header className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
              Conversion Diagnostics
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Why Is My Landing Page Not Converting?
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed">
              When paid traffic brings visitors but no sales or leads, the instinct is often to rewrite ads or increase campaign budget. Before spending more money on acquisition, diagnose the post-click page mechanics that cause visitors to bounce.
            </p>
          </header>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/20 p-6 md:p-8">
            <h2 className="text-xl font-bold text-fg mb-4">Observable Symptoms &amp; Plausible Causes</h2>
            <div className="space-y-4 text-sm text-fg-muted leading-relaxed">
              <p>
                A failed conversion event is rarely random. Paid visitors leave landing pages due to specific friction points that interrupt their decision sequence:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-fg-muted">
                <li>
                  <strong className="text-fg">High Bounce Rate (70%+ within 5 seconds):</strong> Indicates message mismatch. The headline fails to confirm the promise made in the ad.
                </li>
                <li>
                  <strong className="text-fg">High Scroll Depth with Low Clicks:</strong> Indicates weak CTA contrast, competing secondary buttons, or missing risk-reducers near the primary action.
                </li>
                <li>
                  <strong className="text-fg">Mobile Traffic Abandonment:</strong> Viewport overflow, fixed consent banners obscuring buttons, or tap targets smaller than 44px.
                </li>
                <li>
                  <strong className="text-fg">Form Start but Zero Submissions:</strong> Excessive field burden, unclear privacy expectations, or missing inline validation.
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-fg mb-4">What Public-Page Inspection Can and Cannot Establish</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <h3 className="font-semibold text-fg mb-2">What Can Be Verified from Public HTML</h3>
                <ul className="space-y-2 text-xs text-fg-muted">
                  <li>✓ Headline presence, text length, and character density</li>
                  <li>✓ Primary CTA contrast ratios against surrounding container background</li>
                  <li>✓ Presence of verifiable trust badges and proximity to action buttons</li>
                  <li>✓ Mobile viewport meta tags, tap target sizes, and structural layout</li>
                  <li>✓ DOM node count, image WebP formats, and page weight indicators</li>
                </ul>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                <h3 className="font-semibold text-fg mb-2">What Cannot Be Established Alone</h3>
                <ul className="space-y-2 text-xs text-fg-muted">
                  <li>✕ Paid ad targeting accuracy and keyword intent quality</li>
                  <li>✕ Market demand for your specific product or price elasticity</li>
                  <li>✕ Post-submit form delivery, CRM sync, or email autoresponder health</li>
                  <li>✕ Definitive causal conversion lift without controlled traffic testing</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-fg mb-6">Step-by-Step Diagnostic Sequence</h2>
            <ol className="space-y-6">
              <li className="rounded-xl border border-border bg-bg-muted/10 p-6">
                <h3 className="text-lg font-semibold text-fg mb-2">Step 1: Inspect Above-Fold Message Match</h3>
                <p className="text-sm text-fg-muted leading-relaxed">
                  Open your landing page alongside your active ad copy. Verify that the primary &lt;h1&gt; headline on your landing page uses the same core terminology and promise as your ad. If the ad promises &quot;SaaS Pricing Audit&quot; but the H1 says &quot;Transform Your Enterprise Stack&quot;, intent is broken immediately.
                </p>
              </li>
              <li className="rounded-xl border border-border bg-bg-muted/10 p-6">
                <h3 className="text-lg font-semibold text-fg mb-2">Step 2: Check Mobile Viewport &amp; Tap Action</h3>
                <p className="text-sm text-fg-muted leading-relaxed">
                  Simulate a 375px mobile viewport. Confirm that your primary CTA button is visible without scrolling, or within the first 600px of vertical space. Ensure cookie banners or floating bars do not cover the button.
                </p>
              </li>
              <li className="rounded-xl border border-border bg-bg-muted/10 p-6">
                <h3 className="text-lg font-semibold text-fg mb-2">Step 3: Audit Trust Signal Proximity</h3>
                <p className="text-sm text-fg-muted leading-relaxed">
                  Look at the 100px area surrounding your primary CTA. Is there a verified proof signal (client count, security badge, rating, or testimonial snippet)? If proof is buried 4 scrolls down, cold paid traffic will bounce before seeing it.
                </p>
              </li>
            </ol>
          </section>

          <section className="mb-12 rounded-2xl border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">Audit Your Page Across 7 Conversion Signals</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Run Nebula&apos;s free landing page audit to inspect observable DOM mechanics on your URL. Receive ranked findings with exact measured values and required standards.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-base"
            >
              Run Free Landing Page Audit &rarr;
            </Link>
          </section>

          <section className="mb-12 border-t border-border pt-12">
            <h2 className="text-2xl font-bold text-fg mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqItems.map((faq) => (
                <div key={faq.q} className="rounded-xl border border-border p-5 bg-bg-muted/10">
                  <h3 className="font-semibold text-fg text-base mb-2">{faq.q}</h3>
                  <p className="text-sm text-fg-muted leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related Diagnostics:</span>
            <Link href="/ads-getting-clicks-but-no-sales" className="hover:text-accent">
              Ads Clicks No Sales
            </Link>
            <Link href="/landing-page-message-match" className="hover:text-accent">
              Message Match Audit
            </Link>
            <Link href="/saas-landing-page-audit" className="hover:text-accent">
              SaaS Audit Guide
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
