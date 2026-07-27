import type { Metadata } from 'next'
import Link from 'next/link'
import SelfScan from './components/SelfScan'
import AggregateProof from './components/AggregateProof'
import { HOMEPAGE_DESCRIPTION, HOMEPAGE_SEO_TITLE } from './lib/homepageContent'
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

const SIGNALS = [
  { key: 'message_match', label: 'Message match', desc: 'Ad promise matches page headline' },
  { key: 'trust_signals', label: 'Trust signals', desc: 'Social proof visible above fold' },
  { key: 'mobile_cta', label: 'Mobile CTA', desc: 'Primary action visible without scroll' },
  { key: 'load_time', label: 'Load time', desc: 'LCP under 2.5s on mobile' },
  { key: 'cta_clarity', label: 'CTA clarity', desc: 'One clear action, no competing choices' },
  { key: 'form_friction', label: 'Form friction', desc: 'Five fields or fewer, clear labels' },
  { key: 'compliance', label: 'Compliance', desc: 'No consent banner blocking conversion' },
]

const PATTERNS = [
  {
    label: 'Most common',
    heading: 'Pricing behind the email gate',
    body: 'Asking for a commitment before delivering value. The visitor has not decided yet. You have already lost them.',
    dominant: true,
  },
  {
    label: 'Second most common',
    heading: 'CTA you cannot see',
    body: 'Green button on green background. Not a traffic problem - a visibility problem that A/B testing will not find.',
    dominant: false,
  },
  {
    label: 'Third most common',
    heading: 'No proof above the fold',
    body: 'Strangers do not trust strangers. Without social proof in the first scroll, the bounce is silent and final.',
    dominant: false,
  },
]

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFAQSchema) }}
      />
      <main id="main-content" role="main" className="min-h-screen bg-bg pt-24">

        {/* ── 1. Hero: asymmetric split ── */}
        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2 md:items-start">

            {/* Left: copy */}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl lg:text-6xl">
                Your ads worked.{' '}
                <span className="text-fg-muted">Your page did not let them.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-7 text-fg-muted">
                Before you pause those ads - find out if the page is what is killing them.
                Free. No signup. Under 2 minutes.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/audit"
                  className="rounded-xl bg-accent px-7 py-3.5 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-base"
                >
                  Find the Leak
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm text-fg-muted hover:text-fg transition-colors"
                >
                  $97 Fix Pack if it fails &rarr;
                </Link>
              </div>
              <AggregateProof />
            </div>

            {/* Right: live self-scan widget */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border bg-bg-muted/30 p-6">
                <p className="mb-1 text-xs font-semibold text-accent">Live - our own audit</p>
                <p className="mb-4 text-xs text-fg-muted">Same engine every free scan uses.</p>
                <SelfScan />
              </div>
            </div>

          </div>
        </section>

        {/* ── 2. Seven signals grid ── */}
        <section className="border-t border-border px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 grid gap-2 md:grid-cols-2 md:items-end">
              <h2 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">
                Seven signals. Every scan.
              </h2>
              <p className="text-base text-fg-muted md:text-right">
                Not opinions. Specific pass/fail checks against your actual page.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SIGNALS.slice(0, 4).map((s) => (
                <div key={s.key} className="rounded-xl border border-border bg-bg-muted/20 p-4">
                  <p className="mb-1 font-semibold text-fg text-sm">{s.label}</p>
                  <p className="text-xs text-fg-muted leading-5">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {SIGNALS.slice(4).map((s) => (
                <div key={s.key} className="rounded-xl border border-border bg-bg-muted/20 p-4">
                  <p className="mb-1 font-semibold text-fg text-sm">{s.label}</p>
                  <p className="text-xs text-fg-muted leading-5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. Patterns: dominant + 2 ── */}
        <section className="border-t border-border px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-fg md:text-3xl">
              The ads did their job. The page had one job.
            </h2>
            <p className="mb-10 max-w-xl text-base text-fg-muted leading-7">
              Most founders spend real money on ads before asking whether the page was the problem.
              These are the three failures we find most.
            </p>
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">

              {/* Dominant card */}
              <div className="rounded-2xl border border-border bg-bg-muted/30 p-8 lg:row-span-2">
                <p className="mb-1 text-xs font-semibold text-accent">{PATTERNS[0].label}</p>
                <h3 className="mb-4 mt-1 text-xl font-bold text-fg">{PATTERNS[0].heading}</h3>
                <p className="text-base text-fg-muted leading-7">{PATTERNS[0].body}</p>
                <div className="mt-8 rounded-xl border border-border bg-bg p-4 font-mono text-xs text-fg-muted">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-accent">message_match</span>
                    <span className="text-signal-fail">3/10</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-border">
                    <div className="h-1.5 w-[30%] rounded-full bg-signal-fail" />
                  </div>
                  <p className="mt-2 text-fg-muted">Ad: &quot;Get $97 audit&quot; &rarr; Page: &quot;Landing page help&quot;</p>
                </div>
              </div>

              {/* Supporting cards */}
              {PATTERNS.slice(1).map((p) => (
                <div key={p.label} className="rounded-2xl border border-border bg-bg-muted/20 p-6">
                  <p className="mb-1 text-xs font-semibold text-accent">{p.label}</p>
                  <h3 className="mb-2 mt-1 text-base font-bold text-fg">{p.heading}</h3>
                  <p className="text-sm text-fg-muted leading-6">{p.body}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 max-w-xl text-sm text-fg-muted">
              Agencies A/B test these for 90 days. That is not optimization - it is billing you to confirm the page is broken.{' '}
              <strong className="text-fg">Fix the page first. Then test.</strong>
            </p>
          </div>
        </section>

        {/* ── 4. How it works ── */}
        <section className="border-t border-border bg-bg-muted/10 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-10 text-2xl font-bold tracking-tight text-fg md:text-3xl">
              From URL to fix list in under 2 minutes.
            </h2>
            <div className="grid gap-0 md:grid-cols-3">
              {[
                {
                  n: '01',
                  heading: 'Paste your URL',
                  body: 'Any public landing page. No account, no signup, no integration required.',
                },
                {
                  n: '02',
                  heading: 'Get 7 signals checked',
                  body: 'Message match, trust, mobile CTA, load time, CTA clarity, form friction, compliance - scored against your actual page.',
                },
                {
                  n: '03',
                  heading: 'See what to fix first',
                  body: 'Every failing signal ranked by conversion impact and effort. Specific findings from your page, not generic advice.',
                },
              ].map((step, i) => (
                <div key={step.n} className={`border-border p-6 ${i < 2 ? 'md:border-r' : ''}`}>
                  <p className="mb-3 font-mono text-xs text-fg-muted">{step.n}</p>
                  <h3 className="mb-2 font-semibold text-fg">{step.heading}</h3>
                  <p className="text-sm text-fg-muted leading-6">{step.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/audit"
                className="rounded-xl bg-accent px-7 py-3.5 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-sm inline-block"
              >
                Run the audit free &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* ── 5. Comparison: not a sales call ── */}
        <section className="border-t border-border px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 md:grid-cols-2 md:items-start">
              <div>
                <h2 className="mb-4 text-2xl font-bold tracking-tight text-fg md:text-3xl">
                  Not a sales call in disguise.
                </h2>
                <p className="mb-6 text-base text-fg-muted leading-7">
                  You have seen &quot;free audit&quot; - a PDF with 8 generic recommendations and a discovery call at the end.
                  This is different. No email required to see your results.
                </p>
                <Link
                  href="/audit"
                  className="rounded-xl border border-accent px-6 py-3 text-sm font-semibold text-accent hover:bg-accent hover:text-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors inline-block"
                >
                  See what you actually get &rarr;
                </Link>
              </div>
              <div className="grid gap-3">
                <div className="rounded-xl border border-border bg-bg-muted/20 p-5">
                  <p className="mb-3 text-xs font-semibold text-fg-muted">Other audits</p>
                  <ul className="space-y-2 text-sm text-fg-muted">
                    {[
                      'Generic report - same 8 recommendations for every site',
                      'Vague advice you have to figure out how to apply',
                      'Gated behind a sales call',
                      '3-month engagement to see results',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-red-400">✕</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
                  <p className="mb-3 text-xs font-semibold text-accent">Nebula audit</p>
                  <ul className="space-y-2 text-sm text-fg-muted">
                    {[
                      'Real scrape - scored against 7 specific conversion signals',
                      'Prioritized fixes with impact and effort scores',
                      'No signup to see your results',
                      '$97 Fix Pack implements every identified fix',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-accent">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. What the click proved: 3 items ── */}
        <section className="border-t border-border px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">
                Know what the click proved - and what it did not.
              </h2>
              <p className="mt-3 text-base text-fg-muted leading-7">
                A click proves the ad worked. The page determines whether that click becomes a decision.
              </p>
            </div>
            <div className="divide-y divide-border border-t border-b border-border">
              {[
                {
                  heading: 'A click is not the finish line.',
                  body: 'An ad click proves the message created enough interest to investigate. The landing page carries that interest forward - or kills it. If the page changes the promise, hides the next step, or asks for trust before earning it, the visitor leaves and the ad gets blamed.',
                },
                {
                  heading: 'The audit follows the actual path.',
                  body: 'Nebula checks what a paid visitor experiences: message match, above-fold clarity, visible action, proof, mobile usability, performance, measurement. Each failing signal is tied to evidence from your page and ranked by likely impact. The report does not estimate revenue or promise a conversion lift that has not been measured.',
                },
                {
                  heading: 'Use it as a stop-or-fix decision.',
                  body: 'If the page passes, investigate the audience or offer instead. If it fails, you have a bounded repair list before spending another dollar on acquisition. Fix the highest-impact leak first, run the audit again, compare.',
                },
              ].map((item) => (
                <article
                  key={item.heading}
                  className="grid gap-4 py-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-12"
                >
                  <h3 className="text-lg font-bold text-fg">{item.heading}</h3>
                  <p className="text-sm leading-7 text-fg-muted">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. Honest proof ── */}
        <section className="border-t border-border bg-bg-muted/10 px-6 py-16">
          <div className="mx-auto max-w-6xl grid gap-8 md:grid-cols-2 md:items-start">
            <div>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-fg">
                We run this audit on ourselves first.
              </h2>
              <p className="text-base text-fg-muted leading-7">
                7.4/10. Not 10/10. That is what you are getting - actual data, not marketing claims.
                Most landing-page tools lead with case studies they cannot verify. We would rather prove it on our own page first.
              </p>
              <p className="mt-4 text-sm text-fg-muted">
                When we have a real client outcome with dates and a way for you to verify it, it goes here - not before.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-bg-muted/30 p-6 font-mono text-sm">
              <p className="mb-4 text-xs text-fg-muted">
                nebulacomponents.shop - last scan
              </p>
              {SIGNALS.map((s) => (
                <div key={s.key} className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-fg-muted">{s.label}</span>
                  <span className="text-accent">pass</span>
                </div>
              ))}
              <div className="mt-3 border-t border-border pt-3 text-xs text-fg-muted">
                Overall 7.4/10 · Grade B - real engine, real page
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. Final CTA ── */}
        <section className="px-6 py-20 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="mb-3 text-2xl font-bold text-fg">
              Run the audit before you spend another dollar.
            </h2>
            <p className="mb-8 text-base text-fg-muted">
              Free. No signup. See if the page is the leak - then you will know.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-base"
            >
              Find the Leak &rarr;
            </Link>
          </div>
        </section>

      </main>
    </>
  )
}
