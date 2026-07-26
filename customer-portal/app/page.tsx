import type { Metadata } from 'next'
import Link from 'next/link'
import SelfScan from './components/SelfScan'
import AggregateProof from './components/AggregateProof'
import { HOMEPAGE_DESCRIPTION, HOMEPAGE_SEO_TITLE, PAID_TRAFFIC_DIAGNOSTIC } from './lib/homepageContent'
import { homeFAQSchema } from './lib/faq-schemas'

export const metadata: Metadata = {
  title: HOMEPAGE_SEO_TITLE,
  description: HOMEPAGE_DESCRIPTION,
  alternates: { canonical: 'https://nebulacomponents.shop' },
  openGraph: {
    title: HOMEPAGE_SEO_TITLE,
    description: HOMEPAGE_DESCRIPTION,
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
  totalTime: 'PT2M', // matches the real backend timeout (app/api/audit/start/route.ts) — do not understate this
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFAQSchema) }}
      />
      <main id="main-content" role="main" className="min-h-screen bg-bg pt-24">
      {/* Hero Section — Vindication Frame */}
      <section className="mx-auto flex min-h-[70vh] max-w-4xl flex-col justify-center px-6 py-24 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Landing Page Leak Check
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-6xl">
          Your ads worked.<br className="hidden sm:block" /> Your page didn't let them.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-xl font-medium text-fg">
          Before you pause those ads — see if the page is what's killing them.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-fg-muted">
          You followed the playbook. The page wasn't built for it. We find what's leaking and show you exactly what to fix — no signup needed.
        </p>
        
        {/* CTA Button */}
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/audit"
            className="rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-lg"
          >
            Find the Leak →
          </Link>
        </div>

        <SelfScan />
        <AggregateProof />
      </section>

      {/* Villain Section — The Ad Spend Problem */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            The uncomfortable math
          </p>
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-fg md:text-4xl">
            The ads did their job. The page had one job.
          </h2>
          <p className="mb-8 max-w-2xl text-lg text-fg-muted leading-7">
            Most founders who come to us have already spent real money on paid ads
            <strong className="text-fg"> before</strong> asking whether the page was the problem.
            The ads delivered clicks. The page didn't let them convert.
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
                Green button on green background. Barely-there contrast tanks click-through
                before traffic quality ever enters the picture. Not a traffic problem. A visibility problem.
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

      {/* Objection Section — This isn't a sales call in disguise */}
      <section className="border-t border-border bg-bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            This isn't a sales call in disguise.
          </h2>
          <p className="mb-8 max-w-2xl text-lg text-fg-muted leading-7">
            You've seen "free audit" — a PDF with 8 generic recommendations, three "opportunities," and a sales call at the end.
            This is different.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-muted">Other audits</p>
              <ul className="space-y-2 text-sm text-fg-muted">
                {[
                  'Generic report generated in seconds',
                  'Same 8 recommendations for every site',
                  'Vague advice — you have to figure out how to apply it',
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
                  '$97 Fix Pack: exact AI prompts to fix every issue, in minutes',
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

      {/* Buyer education — substantive diagnostic context, not scanner filler */}
      <section className="border-t border-border px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold text-fg md:text-4xl md:tracking-[-0.03em]">
              Know what the click proved — and what it didn't.
            </h2>
            <p className="mt-4 text-base leading-7 text-fg-muted">
              Paid traffic creates evidence. The page determines whether that evidence becomes a decision.
            </p>
          </div>
          <div className="mt-12 divide-y divide-border border-y border-border">
            {PAID_TRAFFIC_DIAGNOSTIC.map((section) => (
              <article key={section.heading} className="grid gap-4 py-8 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:gap-12">
                <h3 className="text-2xl font-extrabold text-fg">{section.heading}</h3>
                <p className="max-w-[65ch] text-base leading-8 text-fg-muted">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Honest Proof Section — We audit ourselves first */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Honest enough to show you our own audit
          </p>
          <h2 className="mb-6 text-2xl font-bold text-fg">
            We run this audit on ourselves first.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-fg-muted mb-4">
            7.4/10. Not 10/10. Real. That's what you're getting — actual data, not marketing claims.
          </p>
          <p className="max-w-2xl text-base leading-7 text-fg-muted mb-4">
            Most landing-page tools lead with case studies they can't verify. We'd rather prove it on our own page first. 
            Run the same audit on your page and see if it finds anything.
          </p>
          <p className="max-w-2xl text-sm text-fg-muted leading-7">
            When we have a real client outcome with dates, proof, and a way for you to verify it, that goes here — not before.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            One more check before you decide.
          </h2>
          <p className="mb-8 text-fg-muted">
            Run the audit. See if the page is the leak. Then you'll know.
          </p>
          <Link 
            href="/audit" 
            className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-lg"
          >
            Find the Leak →
          </Link>
        </div>
      </section>

    </main>
    </>
  )
}
