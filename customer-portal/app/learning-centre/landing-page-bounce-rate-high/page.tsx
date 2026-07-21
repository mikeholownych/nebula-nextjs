import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Landing Page Bounce Rate High: 3 Diagnosable Causes | Nebula Components',
  description:
    'A high bounce rate on paid traffic means the first screen is not delivering on the promise that brought visitors there. Bounce is a symptom — these are the causes.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/landing-page-bounce-rate-high',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Landing Page Bounce Rate High? It Is Usually 3 Diagnosable Causes',
  description:
    'A high bounce rate on paid traffic means the first screen is not delivering on the promise that brought visitors there. Bounce is a symptom — these are the causes.',
  url: 'https://nebulacomponents.shop/learning-centre/landing-page-bounce-rate-high',
  publishedDate: '2026-07-16',
  modifiedDate: '2026-07-21',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a high bounce rate on a paid traffic landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'There is no universal threshold because bounce rate varies by traffic type and offer. Cold paid traffic bounces more than warm traffic by design — a visitor who clicked an ad for the first time is less committed than someone returning from a retargeting campaign. As a working diagnostic: if your paid traffic bounce rate is above 70%, the first screen is likely not confirming the ad promise. If it is above 85%, the message-match, load time, or audience-targeting problem is severe enough to fix before any other optimisation.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between bounce rate and exit rate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Bounce means a visitor landed on your page and left without clicking anything — they arrived, decided the page was not what they expected, and left immediately. Exit means they visited multiple pages and this was their last stop. High exit rate on a landing page is normal if visitors explored and then left. High bounce on a paid traffic landing page is the problem — the first screen failed to hold them.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I reduce bounce rate on a landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Diagnose the cause before changing anything. The three most common paid-traffic bounce causes are: (1) message mismatch — the headline does not echo the ad promise; (2) slow load time — Portent's 2022 analysis of 100M+ page views found B2B pages loading in 1 second convert at roughly 3x the rate of pages loading in 5 seconds; (3) wrong audience — broad keywords or clickbait ads bring visitors who were never going to convert. Segment your analytics by source and device to find which cause is active, then fix that cause specifically.",
      },
    },
    {
      '@type': 'Question',
      name: 'Does load time affect bounce rate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes, directly. A 2017 Google/SOASTA study found that 53% of mobile users abandoned pages taking longer than 3 seconds to load — and that figure is from 2017, before the shift to mobile-first consumption patterns. More recent data from Portent's 2022 research shows that B2B pages loading in 1 second have a conversion rate roughly 3x higher than pages loading in 5 seconds. Slow load time is a bounce cause, not a separate problem — a visitor who abandons during load is recorded as a bounce before they have seen your headline.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is mobile bounce rate versus desktop?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'If your mobile bounce rate is significantly higher than desktop — more than 15 percentage points — the gap is almost always a layout problem, not an audience problem. Mobile visitors need the headline and CTA visible without scrolling, and they need the page to load in under 3 seconds on a mobile connection. Diagnose mobile layout (signal 3) and load time (signal 4) specifically for your mobile segment before concluding that mobile traffic is lower quality.',
      },
    },
  ],
}

export default function LandingPageBounceRateHigh() {
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
              Landing Page Leaks · Bounce Rate
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Landing Page Bounce Rate High? It Is Usually 3 Diagnosable Causes
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              A bounce rate above 70% on paid traffic means the first screen is
              not delivering on the promise that brought visitors there. Bounce
              is a symptom. The cause is almost always offer mismatch, slow
              load, or wrong audience. Treating the symptom — redesigning the
              page — before diagnosing the cause doubles your spend on the wrong
              problem.
            </p>
          </div>

          {/* Bounce vs Exit */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Bounce vs exit: which one is the problem
            </h2>
            <p className="leading-relaxed text-fg-muted">
              <strong className="text-fg">Bounce</strong> means a visitor landed
              on your page and left without clicking anything. They did not
              explore. They arrived, decided the page was not what they
              expected, and left.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              <strong className="text-fg">Exit</strong> means they visited
              multiple pages and this was their last stop. A high exit rate on a
              landing page is normal — if they explored and then left, the page
              did its job.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              High <em>bounce</em> on a paid traffic landing page is the
              diagnostic signal. It means the first screen failed to match what
              the ad promised — and everything you paid to get that click was
              wasted before the visitor saw anything else.
            </p>
          </section>

          {/* 3 causes */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              The 3 diagnosable causes
            </h2>
            <div className="space-y-5">
              {[
                {
                  n: '1',
                  label: 'Offer mismatch',
                  body: 'The ad promised one thing. The page delivered another. If visitors do not see what they came for within the first viewport, they leave. This is message-match failure — signal 1 of the 7 conversion signals. A generic headline, a buried CTA, or an unclear value proposition all produce the same bounce pattern: high CTR on the ad, high bounce on the page.',
                },
                {
                  n: '2',
                  label: 'Slow load time',
                  body: "A 2017 Google/SOASTA study found that 53% of mobile users abandoned pages taking longer than 3 seconds to load. That figure is nearly a decade old — mobile-first consumption patterns have made patience shorter since. Portent's 2022 analysis of over 100 million page views across 20 B2B and B2C sites found that pages loading in 1 second convert at roughly 3x the rate of pages loading in 5 seconds. A visitor who abandons during load is recorded as a bounce before they have seen your headline.",
                },
                {
                  n: '3',
                  label: 'Wrong audience',
                  body: 'Broad keyword targeting, irrelevant search terms, or clickbait ad creative brings visitors who were never going to convert. When this is the cause, the fix is not the page — it is the targeting. Segment your analytics by traffic source to confirm. If Google Ads bounces at 40% and a broad awareness campaign bounces at 85%, those are two separate problems requiring two separate fixes.',
                },
              ].map(({ n, label, body }) => (
                <div
                  key={n}
                  className="rounded-xl border border-accent/20 bg-accent/5 p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-1">
                    Cause {n}
                  </p>
                  <h3 className="text-lg font-bold text-fg">{label}</h3>
                  <p className="mt-2 leading-relaxed text-fg-muted">{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Diagnosis */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Segment first, fix second
            </h2>
            <p className="leading-relaxed text-fg-muted">
              The fastest way to identify which cause is active is to segment
              your analytics before touching the page. Each segment points to a
              different fix.
            </p>
            <ul className="mt-5 space-y-4">
              {[
                {
                  label: 'By source',
                  detail:
                    'Google Ads vs Meta Ads vs Organic vs Email. If one source bounces at 30% and another at 85%, the problem is source-specific — a targeting or message-match issue on the high-bounce channel, not a page-wide layout problem.',
                },
                {
                  label: 'By device',
                  detail:
                    'If mobile bounce is more than 15 percentage points above desktop, your mobile layout is the primary cause — not the ad, not the audience. Check whether headline and CTA are visible without scrolling at 390px.',
                },
                {
                  label: 'By traffic temperature',
                  detail:
                    'Cold traffic (first-visit paid) bounces more than warm traffic (retargeting, email) by design. Do not compare their bounce rates directly. If cold traffic is at 65% and warm at 30%, that gap is normal. If cold traffic is at 88%, something structural is broken.',
                },
                {
                  label: 'By time on page',
                  detail:
                    'If average time-on-page for bouncers is under 5 seconds, the cause is load time or an immediate message mismatch. If it is 15–30 seconds, the visitor read the page but was not convinced — the cause is proof or CTA failure, not the above-fold section.',
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

          {/* Fix sequence */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Fix sequence: cause determines order
            </h2>
            <ol className="space-y-4">
              {[
                {
                  step: 'Match the headline to the ad',
                  detail:
                    'If the ad says "Fix your landing page," the H1 should say "Fix your landing page" — not "Welcome to Our Platform." Copy the specific noun phrase from your highest-traffic ad into the headline. Test before redesigning anything else.',
                },
                {
                  step: 'Cut load time to under 3 seconds on mobile',
                  detail:
                    'Compress images (WebP, 80% quality), add lazy loading to below-fold content, remove unused third-party scripts. Check LCP with Google PageSpeed Insights — free, takes 60 seconds. If LCP is above 4 seconds, load time is the primary bounce cause regardless of what the headline says.',
                },
                {
                  step: 'Put the CTA above the fold on mobile',
                  detail:
                    'Open the page on a real phone at 390px. If the CTA is not visible without scrolling, reposition it. The headline and CTA should both be visible in the first viewport for cold paid traffic.',
                },
                {
                  step: 'Tighten targeting before scaling',
                  detail:
                    'If segmentation shows that specific ad sets or keyword groups are driving the high-bounce traffic, pause those and reallocate budget to the lower-bounce sources. Do not fix a targeting problem by redesigning the page.',
                },
              ].map(({ step, detail }, i) => (
                <li
                  key={i}
                  className="flex gap-4 rounded-xl border border-border bg-bg-muted/10 p-5"
                >
                  <span className="shrink-0 font-bold text-accent">{i + 1}.</span>
                  <div>
                    <p className="font-semibold text-fg">{step}</p>
                    <p className="mt-1 text-sm leading-relaxed text-fg-muted">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
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
              Find the cause on your page
            </h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              The free Nebula audit checks all 7 signals and identifies which
              one is producing your bounce. The $97 Fix Pack implements the fix
              — rewritten copy, rebuilt sections, deployed within 48 hours.
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
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Related leak checks
            </h2>
            <div className="space-y-1">
              {[
                { href: '/learning-centre/landing-page-not-converting', label: 'Landing Page Not Converting? Diagnose These 5 Leaks First' },
                { href: '/learning-centre/message-match-checklist', label: 'Message Match Checklist For Paid Traffic' },
                { href: '/learning-centre/landing-page-load-time-slow', label: 'Landing Page Load Time Slow: Signal 4 Diagnosis' },
                { href: '/learning-centre/mobile-landing-page-leaks', label: 'Mobile Landing Page Leaks That Kill Paid Traffic' },
                { href: '/learning-centre/above-fold-landing-page', label: 'Above The Fold: What Paid Traffic Decides Before Scrolling' },
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
