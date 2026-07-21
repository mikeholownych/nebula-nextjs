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
          The Ad Wasn't the Problem.<br className="hidden sm:block" /> The Page Was.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-xl font-medium text-fg">
          Agencies charge $5,000 to tell you what Nebula shows you in 60 seconds.
          Enter your URL and get a prioritized list of conversion fixes — no signup needed.
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

      {/* Villain Section — The $14,000 Page Problem */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            The uncomfortable math
          </p>
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-fg md:text-4xl">
            The $14,000 page problem.
          </h2>
          <p className="mb-8 max-w-2xl text-lg text-fg-muted leading-7">
            The average founder we audit has spent <strong className="text-fg">$14,000 on paid ads</strong> before asking
            whether the page was the problem. The ads delivered clicks.
            The page stole the sale.
          </p>

          {/* The three friction patterns */}
          <div className="mb-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-bg-muted/40 p-5">
              <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent">Pattern 1</p>
              <p className="font-semibold text-fg">Pricing behind the email gate</p>
              <p className="mt-2 text-sm text-fg-muted">
                Asking for a commitment before delivering the value. Visitors leave before they trust you.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-bg-muted/40 p-5">
              <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent">Pattern 2</p>
              <p className="font-semibold text-fg">CTA you can't see</p>
              <p className="mt-2 text-sm text-fg-muted">
                Green button on green background. 0.02% click-through rate.
                Not a traffic problem. A visibility problem.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-bg-muted/40 p-5">
              <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent">Pattern 3</p>
              <p className="font-semibold text-fg">No proof above the fold</p>
              <p className="mt-2 text-sm text-fg-muted">
                Strangers don't trust strangers. Without social proof in the first scroll,
                the bounce is silent and final.
              </p>
            </div>
          </div>

          <p className="max-w-2xl text-base text-fg-muted leading-7">
            Agencies A/B test these patterns for 90 days. That's not optimization —
            that's billing you to confirm the page is broken.{' '}
            <strong className="text-fg">Fix the page first. Then test.</strong>
          </p>
        </div>
      </section>

      {/* Objection Section — We've seen "free audit" before */}
      <section className="border-t border-border bg-bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            You've seen "free audit" before.
          </h2>
          <p className="mb-8 max-w-2xl text-lg text-fg-muted leading-7">
            It was a PDF with 8 generic recommendations, three "opportunities," and a sales call at the end.
            This isn't that.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-muted">Other audits</p>
              <ul className="space-y-2 text-sm text-fg-muted">
                {[
                  'Generic report generated in seconds',
                  'Same 8 recommendations for every site',
                  'No implementation — just a list',
                  'Gated behind a sales call',
                  '3-month engagement to see results',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 text-red-400">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">Nebula audit</p>
              <ul className="space-y-2 text-sm text-fg-muted">
                {[
                  'Real scrape of your actual page',
                  'Scored against 7 conversion signals',
                  'Prioritized fixes with impact/effort scores',
                  'No signup to see your results',
                  '$97 Fix Pack implements the top fixes in 7 days',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 text-accent">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
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

      {/* Receipts Section — Named proof */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Receipts
          </p>
          <h2 className="mb-10 text-2xl font-bold text-fg">
            Real pages. Real numbers. No stock photos.
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Danny */}
            <div className="rounded-xl border border-border bg-bg-muted/40 p-6">
              <p className="mb-4 text-sm text-fg-muted leading-6 italic">
                "Spent $14,200 on Shopify ads. Page had no social proof visible above the fold.
                Added a 30-second Loom explainer — no voiceover, just the product.
                Day 1 orders tripled."
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-fg">Danny</p>
                  <p className="text-sm text-fg-muted">Ecommerce founder · Shopify</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent">3×</p>
                  <p className="text-xs text-fg-muted">day-1 orders</p>
                </div>
              </div>
            </div>

            {/* The green button */}
            <div className="rounded-xl border border-border bg-bg-muted/40 p-6">
              <p className="mb-4 text-sm text-fg-muted leading-6 italic">
                "Agency A/B tested our CTA button for 90 days. Budget: $22k.
                Result: +0.2% lift. Nebula fixed the contrast and visibility in 2 hours.
                Result: +14.3× conversion."
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-fg">B2B SaaS founder</p>
                  <p className="text-sm text-fg-muted">Lead gen · Name withheld</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent">14.3×</p>
                  <p className="text-xs text-fg-muted">conversion lift</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm text-fg-muted">
            Both pages scored under 5/10 on initial audit.
            Both fixed in under 7 days. $97.
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
