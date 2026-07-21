import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Before You Raise Ad Budget: Fix The Leaks First | Nebula Components',
  description:
    'Raising ad budget before fixing landing page leaks scales waste proportionally. Here is the 7-signal checklist to run before touching your daily spend.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/before-you-raise-ad-budget',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Before You Raise Ad Budget: Fix The Leaks First',
  description:
    'Raising ad budget before fixing landing page leaks scales waste proportionally. Here is the 7-signal checklist to run before touching your daily spend.',
  url: 'https://nebulacomponents.shop/learning-centre/before-you-raise-ad-budget',
  publishedDate: '2026-07-16',
  modifiedDate: '2026-07-21',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'When should I raise my ad budget?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When your page is already converting paid traffic at or above the average rate for your vertical and traffic source — and you want more volume of the same result. If your conversion rate is below vertical average on meaningful traffic (500+ paid sessions), raising budget increases waste at the same rate your page is currently leaking it. Fix the page first, then scale.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I know if my problem is the page or the targeting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Segment your analytics by source, device, and time-on-page. If your paid search traffic (high intent) bounces at 80%+ but your email traffic (warm) converts at 10%, the page is structurally broken — not the targeting. If all traffic sources bounce equally, and your click-through rate on the ads is healthy, the page is the problem. If CTR on ads is below 2% for search, the targeting or ad copy is the problem and the page is secondary.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the minimum conversion rate before raising ad budget?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "There is no universal minimum, but a useful working threshold: if your paid search conversion rate is below 3% on 500+ sessions, you have a page problem worth fixing before increasing spend. WordStream's 2026 benchmark for Business Services (B2B lead gen) is 4.85%. If you are below that with meaningful volume, more budget produces more bounces at the same rate — not more customers.",
      },
    },
    {
      '@type': 'Question',
      name: 'Does fixing the landing page improve Google Ads Quality Score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Landing Page Experience is one of the three components of Quality Score (alongside Expected CTR and Ad Relevance). Improving message-match between the ad keyword and the page headline, adding above-fold proof, and reducing LCP below 2.5 seconds all directly improve Landing Page Experience. A higher Quality Score lowers your CPC in the Google Ads auction — meaning the same budget buys more clicks after the page fix.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the fastest way to check for landing page leaks before raising budget?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Run the 7-signal check in order: (1) does the headline match the ad promise? (2) is proof visible before the CTA? (3) does the page load and display correctly on mobile at 390px? (4) is LCP under 2.5 seconds? (5) is there one clear CTA — not three options? (6) does the form ask for the minimum required information? (7) is there specific social proof — a result, a number, a named customer? The first signal that fails is the first fix. Earlier signals gate later ones.',
      },
    },
  ],
}

export default function BeforeYouRaiseAdBudget() {
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
      <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <Link
            href="/learning-centre"
            className="text-sm font-semibold text-accent hover:text-accent-light transition-colors"
          >
            Back to Learning Centre
          </Link>

          {/* Hero */}
          <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Budget Leaks · Before You Scale
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Before You Raise Ad Budget, Fix The Leaks First
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              Raising budget on a page with conversion leaks does not fix the
              leaks — it scales them. If your current spend is producing a 1%
              conversion rate, doubling the budget produces twice the traffic at
              the same 1% rate. The math does not improve until the page does.
            </p>
          </div>

          {/* The budget multiplier problem */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              The budget multiplier problem
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Ad budget is a multiplier. It amplifies what is already happening
              on the page — in both directions. If the page converts, more
              budget produces more customers. If the page leaks, more budget
              produces more waste at exactly the same rate.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              The impulse to raise budget when results are disappointing is
              understandable — more traffic should produce more signal. But
              signal from a broken page is noise. You will see more visits, more
              bounces, and more cost-per-non-conversion. What you will not see
              is the actual diagnosis, because the traffic is too diluted across
              a broken experience to isolate which signal is broken.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              The correct order is: find and fix the broken signal, verify the
              page converts on current volume, then scale. Reversing that order
              accelerates the rate at which you learn nothing useful.
            </p>
          </section>

          {/* Is it the page or the targeting */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Is this a page problem or a targeting problem?
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Before running any signal check, confirm that the problem is the
              page rather than the targeting. The diagnostic is:
            </p>
            <ul className="mt-5 space-y-4">
              {[
                {
                  label: 'CTR on the ad itself',
                  detail:
                    'If your Google Ads search CTR is below 3-5% on high-intent keywords, the ad is the problem — not the page. Visitors are not clicking. No amount of page optimisation fixes an ad that does not get clicked.',
                },
                {
                  label: 'Bounce rate by source',
                  detail:
                    'Segment analytics by traffic source. If paid search bounces at 80% but email or direct traffic converts at 8%, the page structure is not the issue — the message-match between the ad and the page is. If all sources bounce equally at 80%+, the page itself is broken.',
                },
                {
                  label: 'Time-on-page for bouncers',
                  detail:
                    'Under 5 seconds: load time or immediate message mismatch. The visitor did not stay long enough to read the headline. 15–30 seconds: the visitor read the page but was not convinced. The problem is proof, CTA, or offer — not the above-fold section.',
                },
                {
                  label: 'Device split',
                  detail:
                    'If mobile bounces 20+ percentage points above desktop, the cause is mobile layout or mobile load time — not the audience. Paid social traffic is predominantly mobile. Fix mobile layout before attributing the problem to traffic quality.',
                },
              ].map(({ label, detail }) => (
                <li
                  key={label}
                  className="border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <p className="font-semibold text-fg">{label}</p>
                  <p className="mt-1 leading-relaxed text-fg-muted">{detail}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* 7-signal pre-spend checklist */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              The 7-signal pre-spend checklist
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Run these in order. The signals are sequenced: a visitor who
              bounces on signal 1 never reaches signal 5. Fix in order — earlier
              signals gate later ones.
            </p>
            <ol className="mt-6 space-y-5">
              {[
                {
                  signal: 'Message-match',
                  check: 'Does the page headline use the same noun phrase as the ad that brought the visitor there? If the ad says "Fix your landing page" and the H1 says "Welcome to Acme Inc.", the chain is broken at arrival.',
                },
                {
                  signal: 'Trust',
                  check: 'Is there specific proof visible before the primary CTA? A named customer result, a recognisable logo, or a specific outcome number. Generic "5-star rated" claims without context do not count as trust signals.',
                },
                {
                  signal: 'Mobile layout',
                  check: 'Open the page on Chrome DevTools at 390px (iPhone 12 Pro). Are the headline, a proof signal, and the CTA all visible without scrolling? If not, fix mobile layout before any other optimisation.',
                },
                {
                  signal: 'Load time',
                  check: 'Run Google PageSpeed Insights (pagespeed.web.dev) on the mobile preset. Is LCP under 2.5 seconds? Above 4 seconds is the primary conversion leak regardless of what the headline says.',
                },
                {
                  signal: 'CTA clarity',
                  check: 'Is there one primary CTA with a label that describes the outcome of clicking — not just the mechanics? "Get my free audit" not "Submit." Multiple competing CTAs at equal weight split the visitor\'s attention.',
                },
                {
                  signal: 'Form friction',
                  check: 'If the conversion action involves a form, does it ask for the minimum information required to deliver the next step — and nothing more? Each additional field reduces completion rate.',
                },
                {
                  signal: 'Proof',
                  check: 'Is there at least one specific, attributed proof element on the page — a customer name, a result with a number, a case outcome? Vague testimonials ("Great service!") do not reduce buyer risk. Specific ones do.',
                },
              ].map(({ signal, check }, i) => (
                <li
                  key={signal}
                  className="rounded-xl border border-border bg-bg-muted/10 p-5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="shrink-0 text-xs font-bold text-accent bg-accent/10 rounded-full w-6 h-6 flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="font-semibold text-fg">Signal {i + 1}: {signal}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-fg-muted pl-9">{check}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* When budget is the right lever */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              When raising budget is the right move
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Budget is the right lever when all of the following are true:
            </p>
            <ul className="mt-5 space-y-3">
              {[
                'Your paid search conversion rate is at or above the average for your vertical (WordStream 2026: Business Services 4.85%, all-industries 8.18%)',
                'You have at least 500 paid sessions through the same page to confirm the rate is stable — not a statistical artefact of a good week',
                'You have verified the 7 signals are structurally in place on the page',
                'You have confirmed the rate holds on mobile (not just desktop)',
                'Increasing volume does not require changing targeting to lower-intent audiences to find more traffic',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-fg-muted">
                  <span className="shrink-0 mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 leading-relaxed text-fg-muted">
              If any of these are not true, the budget increase will produce a
              predictable result: more traffic at the same leaking rate, more
              cost per non-conversion, and no new diagnostic signal about what
              is broken.
            </p>
          </section>

          {/* The QS bonus */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Fixing the page reduces CPC — you get more from current budget
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Landing Page Experience is one of the three components of Google
              Ads Quality Score. A page that loads fast, matches the keyword,
              and provides a clear path to conversion earns a higher Landing
              Page Experience rating — which directly improves Quality Score.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              Quality Score affects your cost-per-click in the ad auction. A
              higher Quality Score means you pay less for the same position. In
              competitive verticals, the difference between a Quality Score of
              4 and 8 can mean paying significantly less per click for the same
              ad placement. This means fixing the page does two things: raises
              the conversion rate on the traffic you receive, and lowers the
              cost of each click.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              Raising budget while Quality Score is low does the opposite: you
              are paying a premium per click to drive traffic to a page that
              converts poorly. The two problems compound each other. Fix the
              page first — the budget you have already becomes more effective.
            </p>
          </section>

          {/* FAQ */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-6 text-2xl font-bold text-fg">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {faqSchema.mainEntity.map((item, i) => (
                <div
                  key={i}
                  className="border-b border-border pb-6 last:border-0 last:pb-0"
                >
                  <h3 className="mb-2 font-semibold text-fg">{item.name}</h3>
                  <p className="leading-relaxed text-fg-muted">
                    {item.acceptedAnswer.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Run the leak check before the next budget increase
            </h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              The free Nebula audit checks all 7 signals and returns a
              prioritised fix list. The $97 Fix Pack implements every finding
              within 48 hours — before you spend another dollar on traffic.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/audit"
                className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors"
              >
                Run the free audit
              </Link>
              <Link
                href="/pricing"
                className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors"
              >
                See the Fix Pack
              </Link>
            </div>
          </section>

          {/* Related */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
            <div className="space-y-1">
              {[
                { href: '/learning-centre/google-ads-clicks-no-sales', label: 'Google Ads Clicks But No Sales: Check The Page' },
                { href: '/learning-centre/high-cpc-low-conversion', label: 'High CPC, Low Conversion: Which Layer Is Broken' },
                { href: '/learning-centre/landing-page-not-converting', label: 'Landing Page Not Converting? Diagnose These 5 Leaks First' },
                { href: '/learning-centre/landing-page-conversion-rate-benchmark', label: 'Landing Page Conversion Rate Benchmark: What The Numbers Mean' },
                { href: '/learning-centre/facebook-ads-no-leads', label: 'Facebook Ads Getting Clicks But No Leads' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
