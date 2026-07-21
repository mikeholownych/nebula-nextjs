import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Google Ads Clicks But No Sales: Check The Page Before Budget | Nebula Components',
  description:
    'If Google Ads produces clicks but no sales, the campaign may be doing its job. The conversion leak usually happens on the landing page, not in the ad.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/google-ads-clicks-no-sales',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Google Ads Clicks But No Sales: Check The Page Before Budget',
  description:
    'If Google Ads produces clicks but no sales, the campaign may be doing its job. The conversion leak usually happens on the landing page, not in the ad.',
  url: 'https://nebulacomponents.shop/learning-centre/google-ads-clicks-no-sales',
  publishedDate: '2026-07-16',
  modifiedDate: '2026-07-21',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why does Google Ads produce clicks but no conversions?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The most common causes are: (1) the landing page headline does not match the search intent or ad promise — the visitor arrived and immediately decided they were in the wrong place; (2) no proof is visible before the CTA — the page asks for action before it earns trust; (3) the page loads slowly on mobile — a visitor who abandons during load is recorded as a bounce before they see anything. A healthy click-through rate on the ad with a high bounce rate on the page is the clearest diagnostic signal: the ad worked, the page did not.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I know if my Google Ads problem is the ad or the landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Check CTR first. If search CTR is below 3-5% on high-intent keywords, the ad is not getting clicked and the page is not yet the issue. If CTR is healthy (above 5%) but conversion rate is below 2%, the ad delivered — the page failed. Confirm with bounce rate by source: if paid search bounces at 80%+ but email or direct traffic converts on the same page, the problem is message-match between the ad and the first screen.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is message match in Google Ads?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Message match means the landing page headline uses the same noun phrase and intent as the ad and keyword that brought the visitor there. If a visitor clicks an ad for "landing page audit tool" and the page headline reads "Welcome to Nebula," the match is broken. The visitor cannot confirm they are in the right place and leaves. The fix is to use the specific search intent from your highest-traffic keywords in your headline — not your brand name or a clever tagline.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does sending Google Ads traffic to a homepage hurt conversion?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Almost always yes, for high-intent searches. A homepage is designed to route multiple audience types — it carries navigation, multiple offers, and no single conversion goal. A high-intent search ad visitor arrived because of one specific promise. A homepage breaks that promise immediately by presenting ten options instead of one. Dedicated landing pages that mirror the ad promise convert more consistently than homepage traffic for paid search.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I fix a high bounce rate from Google Ads?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Fix in this order: (1) confirm the headline mirrors the ad keyword and promise exactly; (2) check mobile load time — run Google PageSpeed Insights on mobile preset and aim for LCP under 2.5 seconds; (3) ensure proof (a result, a number, a named customer) appears before the CTA in the first viewport; (4) reduce the CTA to one action with a label describing the outcome, not the mechanics. Most high-bounce patterns from paid search are caused by the first two — message mismatch and slow mobile load.',
      },
    },
  ],
}

export default function GoogleAdsClicksNoSales() {
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
              Google Ads Leaks · Clicks Without Conversions
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Google Ads Clicks But No Sales: Check The Page Before Budget
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              If Google Ads is producing clicks but no sales, the campaign may
              be doing exactly what it should: creating arrival. The chain
              breaks when the landing page does not continue the conversation
              the ad started. Raising budget or adjusting bidding strategy does
              not fix what happens after the click.
            </p>
          </div>

          {/* The chain */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              The click is not the sale — the page closes it
            </h2>
            <p className="leading-relaxed text-fg-muted">
              A Google Ads click represents a visitor who searched for something
              specific and decided your ad was relevant enough to click. That is
              the campaign&apos;s job. The page&apos;s job is to confirm that
              the decision was right, build enough trust to justify action, and
              make that action obvious.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              When the page fails that job — when the headline does not match
              the search, when proof is buried below the fold, when the CTA
              competes with navigation and three other options — the visitor
              leaves. The click was valid. The page broke the chain.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              The diagnostic signal is a healthy CTR on the ad combined with a
              high bounce rate on the page. CTR above 5% on a high-intent
              keyword means the ad is working. Bounce rate above 70% on the
              same traffic means the page is not.
            </p>
          </section>

          {/* 5 page-side causes */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              5 page-side causes of zero conversions from paid search
            </h2>
            <div className="space-y-5">
              {[
                {
                  n: '1',
                  cause: 'Headline does not match the search intent',
                  detail:
                    'The visitor typed a specific phrase, clicked an ad that echoed it, and landed on a page that says something different. The mismatch registers in under a second. A visitor searching "fix landing page conversion rate" and landing on "Transform Your Marketing With AI" has no confirmation they are in the right place. They leave. The fix is to use the exact noun phrase from your highest-traffic ad groups in the page H1.',
                },
                {
                  n: '2',
                  cause: 'No proof above the fold',
                  detail:
                    'Cold paid search traffic has no prior relationship with your brand. The page is asking for trust it has not yet earned. If the first viewport contains only a headline and a CTA with no proof signal — no customer result, no recognisable logo, no specific outcome — a significant portion of visitors will not take action. One specific, attributed proof element above the fold changes the trust calculus for a visitor who has never heard of you.',
                },
                {
                  n: '3',
                  cause: 'Slow mobile load',
                  detail:
                    "A visitor who abandons while the page is loading is recorded as a bounce before they have seen your headline. Portent's 2022 analysis of over 100 million page views found that B2B lead-gen pages loading in 1 second convert at roughly 3x the rate of pages loading in 5 seconds. Check LCP with Google PageSpeed Insights on the mobile preset — not desktop. If LCP is above 4 seconds, this is the primary cause of your zero-conversion pattern.",
                },
                {
                  n: '4',
                  cause: 'Traffic sent to the homepage',
                  detail:
                    'A homepage is built to route multiple audience types across multiple offers. A paid search visitor arrived because of one specific promise. A homepage breaks that promise by presenting navigation, multiple services, and no single conversion path. High-intent search traffic consistently converts better on a dedicated landing page that mirrors the ad promise than on a homepage that dilutes it.',
                },
                {
                  n: '5',
                  cause: 'CTA asks for too much too soon',
                  detail:
                    'If the first action available requires significant commitment — booking a call, entering payment details, or filling out a long form — on a page the visitor has never seen before, the mismatch between trust level and ask size will kill the conversion. For cold search traffic, the CTA should match the temperature of the relationship: a low-commitment first step (free audit, free trial, download) is appropriate before a high-commitment ask.',
                },
              ].map(({ n, cause, detail }) => (
                <div
                  key={n}
                  className="rounded-xl border border-border p-6"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">
                    Cause {n}
                  </p>
                  <h3 className="text-lg font-bold text-fg">{cause}</h3>
                  <p className="mt-2 leading-relaxed text-fg-muted">{detail}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Diagnosis by analytics */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Diagnosing the specific cause from analytics
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Do not guess which cause is active — read the analytics patterns:
            </p>
            <ul className="mt-5 space-y-4">
              {[
                {
                  pattern: 'High CTR, high bounce, under 5s on page',
                  diagnosis:
                    'Load time or immediate message mismatch. The visitor decided in under 5 seconds. Check mobile LCP first, then headline alignment with ad keywords.',
                },
                {
                  pattern: 'High CTR, high bounce, 15–30s on page',
                  diagnosis:
                    'Visitor read the page but was not convinced. Message match likely fine. The issue is proof, CTA clarity, or offer specificity.',
                },
                {
                  pattern: 'Low CTR (under 2-3%) on search',
                  diagnosis:
                    'Ad is the problem, not the page. Fix ad copy or keyword match types before touching the landing page.',
                },
                {
                  pattern: 'Mobile bounce 20+ points above desktop',
                  diagnosis:
                    'Mobile layout or mobile load time. Same page, different rendering. Check 390px viewport and mobile LCP specifically.',
                },
                {
                  pattern: 'Zero form starts (not just zero submits)',
                  diagnosis:
                    'Visitors are not engaging with the form at all. The issue is above-fold — either they are bouncing before reaching the form, or the form is positioned below where attention ends.',
                },
              ].map(({ pattern, diagnosis }) => (
                <li
                  key={pattern}
                  className="border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <p className="font-semibold text-fg text-sm">{pattern}</p>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">{diagnosis}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Fix sequence */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Fix sequence for paid search with zero conversions
            </h2>
            <ol className="space-y-3">
              {[
                'Confirm CTR is healthy (above 3-5% for high-intent search) — if not, fix the ad before the page',
                'Check mobile LCP with Google PageSpeed Insights — if above 4s, fix load time first',
                'Open the page on mobile at 390px — confirm headline, proof signal, and CTA are all above the fold',
                'Verify the headline uses the exact noun phrase from your top-traffic ad groups',
                'Confirm there is one CTA — not three options competing at equal visual weight',
                'Check form field count — remove anything not required to deliver the next step',
                'Add or surface one specific, attributed proof element before the CTA',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-fg-muted">
                  <span className="shrink-0 font-bold text-accent">{i + 1}.</span>
                  {step}
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
              Find the break in the chain
            </h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              The free Nebula audit checks all 7 signals and identifies where
              the page is breaking the conversion chain. The $97 Fix Pack
              implements every finding within 48 hours.
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
                { href: '/learning-centre/landing-page-not-converting', label: 'Landing Page Not Converting? Diagnose These 5 Leaks First' },
                { href: '/learning-centre/high-cpc-low-conversion', label: 'High CPC, Low Conversion: Which Layer Is Broken' },
                { href: '/learning-centre/before-you-raise-ad-budget', label: 'Before You Raise Ad Budget: Fix The Leaks First' },
                { href: '/learning-centre/message-match-checklist', label: 'Message Match Checklist For Paid Traffic' },
                { href: '/learning-centre/traffic-but-no-form-fills', label: 'Traffic But No Form Fills: The Form Is Usually Not The First Leak' },
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
