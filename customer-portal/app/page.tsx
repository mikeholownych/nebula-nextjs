import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Free Landing Page Audit — Stop Burning Ad Budget | Nebula Components',
  description: 'Evidence-backed landing page conversion diagnosis and implementation for founders spending on paid ads with low or zero conversions.',
  alternates: { canonical: 'https://nebulacomponents.shop' },
  openGraph: {
    title: 'Free Landing Page Audit — Stop Burning Ad Budget | Nebula Components',
    description: 'Evidence-backed landing page conversion diagnosis and implementation for founders spending on paid ads with low or zero conversions.',
    url: 'https://nebulacomponents.shop',
    siteName: 'Nebula Components',
    locale: 'en_US',
    type: 'website',
  },
}

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to get a free landing page audit from Nebula Components',
  description: 'Get an evidence-backed diagnosis of your landing page in three steps.',
  totalTime: 'PT1M',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Enter Your URL',
      text: 'Drop in any landing page URL — no account needed.',
      url: 'https://nebulacomponents.shop/audit',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Get Your Score',
      text: 'We analyze above-fold content, SEO foundations, ad signals, and speed.',
      url: 'https://nebulacomponents.shop/audit',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'See Your Fixes',
      text: 'Get prioritized recommendations with impact and effort scores.',
      url: 'https://nebulacomponents.shop/audit',
    },
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <main id="main-content" role="main" className="min-h-screen bg-bg pt-[72px]">
      {/* Hero Section */}
      <section className="mx-auto flex min-h-[70vh] max-w-4xl flex-col justify-center px-6 py-24 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Free Landing Page Audit
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-6xl">
          Find Out Why Your Ads Aren't Converting
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-xl font-medium text-fg">
          Nebula Components is a landing page audit tool for founders running paid ads.
          Enter your URL and get a prioritized list of conversion fixes in 60 seconds — no signup needed.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-fg-muted">
          We scan your page against 7 conversion signals — message-match, trust, mobile layout,
          load time, CTA clarity, form friction, and proof — then tell you exactly what to fix first.
        </p>
        
        {/* CTA Button */}
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link 
            href="/audit" 
            className="rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-lg"
          >
            Run Free Audit →
          </Link>
        </div>
      </section>

      {/* What You'll Get Section */}
      <section className="border-t border-border bg-bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-fg">
            What You'll Get
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-3 text-4xl">📊</div>
              <h3 className="mb-2 font-semibold text-fg">Evidence-Based Score</h3>
              <p className="text-sm text-fg-muted">
                Not opinions — actual analysis of above-fold content, signals, and speed.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 text-4xl">🎯</div>
              <h3 className="mb-2 font-semibold text-fg">Prioritized Fixes</h3>
              <p className="text-sm text-fg-muted">
                Quick wins vs major projects, ranked by impact and effort.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 text-4xl">💰</div>
              <h3 className="mb-2 font-semibold text-fg">Conversion Focus</h3>
              <p className="text-sm text-fg-muted">
                We diagnose landing pages leaking ad spend — that's our specialty.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 text-4xl">✓</div>
              <h3 className="mb-2 font-semibold text-fg">No Commitment</h3>
              <p className="text-sm text-fg-muted">
                Start free. Share email only if you want the full report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-fg">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-bg">
                1
              </div>
              <h3 className="mb-2 font-semibold text-fg">Enter Your URL</h3>
              <p className="text-sm text-fg-muted">
                Drop in any landing page URL — no account needed.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-bg">
                2
              </div>
              <h3 className="mb-2 font-semibold text-fg">Get Your Score</h3>
              <p className="text-sm text-fg-muted">
                We analyze above-fold content, SEO foundations, ad signals, and speed.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-bg">
                3
              </div>
              <h3 className="mb-2 font-semibold text-fg">See Your Fixes</h3>
              <p className="text-sm text-fg-muted">
                Get prioritized recommendations with impact/effort scores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="border-t border-border bg-bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-8 text-2xl font-bold text-fg">
            Built by Conversion Specialists
          </h2>
          <p className="mx-auto max-w-2xl text-fg-muted">
            Nebula Components specializes in one thing: diagnosing landing pages that leak ad spend.
            We've helped founders stop burning budget on ads that never convert by fixing the page — not the ad.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            Ready to See Why Your Ads Aren't Converting?
          </h2>
          <p className="mb-8 text-fg-muted">
            Get your free landing page audit in 60 seconds.
          </p>
          <Link 
            href="/audit" 
            className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-lg"
          >
            Run Free Audit →
          </Link>
        </div>
      </section>

    </main>
    </>
  )
}
