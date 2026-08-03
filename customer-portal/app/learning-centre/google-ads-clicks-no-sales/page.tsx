import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Google Ads Clicks But No Sales: Fix The Page | Nebula',
  description:
    'If Google Ads produces clicks but no sales, separate ad delivery from post-click behaviour before changing bids, creative, or the landing page.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/google-ads-clicks-no-sales',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Google Ads Clicks But No Sales: Check The Page Before Budget',
  description:
    'If Google Ads produces clicks but no sales, separate ad delivery from post-click behaviour before changing bids, creative, or the landing page.',
  url: 'https://nebulacomponents.com/learning-centre/google-ads-clicks-no-sales',
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
        text: 'Common hypotheses include: (1) the landing page headline does not match the search intent or ad promise; (2) no proof is visible before the CTA; and (3) the page loads slowly on mobile. Healthy ad click-through with high post-click bounce is a reason to investigate message match and page experience, but it does not by itself prove which component caused the outcome.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I know if my Google Ads problem is the ad or the landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Check CTR, conversion tracking, bounce rate by source, device, query, and landing-page variant together. Thresholds such as 3-5% CTR or 2% conversion rate are comparison points, not causal diagnoses. Healthy CTR with weak post-click behaviour prioritises a page-side hypothesis; it does not exclude ad targeting, offer fit, attribution, or traffic quality.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is message match in Google Ads?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Message match means the landing page headline uses the same noun phrase and intent as the ad and keyword that brought the visitor there. If a visitor clicks an ad for "landing page audit tool" and the page headline reads "Welcome to Nebula," the match is broken. The visitor cannot confirm they are in the right place and leaves. The fix is to use the specific search intent from your highest-traffic keywords in your headline - not your brand name or a clever tagline.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does sending Google Ads traffic to a homepage hurt conversion?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It can when the homepage presents several audiences, offers, and conversion paths instead of continuing the ad’s specific promise. Compare homepage and dedicated-page performance for the same intent and traffic conditions before attributing the difference to page type.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I fix a high bounce rate from Google Ads?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Test in this order: (1) compare the headline with the ad keyword and promise; (2) check mobile load time with Google PageSpeed Insights and use LCP under 2.5 seconds as a performance target; (3) inspect whether relevant proof appears before the CTA; and (4) test one clearly labelled CTA. Change one variable at a time and compare it with the current baseline before attributing an outcome.',
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
      <main id="main-content" className="min-h-screen bg-bg pt-24">
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

          {/* Direct answer */}
          <section
            data-editorial="answer-first"
            className="mt-6 rounded-2xl border border-border bg-bg-panel p-8"
          >
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Direct answer: isolate the post-click leak before changing budget
            </h2>
            <p className="leading-relaxed text-fg-muted">
              A Google Ads click represents a visitor who searched for something
              specific and decided your ad was relevant enough to click. First
              verify the search term, ad promise, and conversion tracking. Then
              compare page behaviour by campaign, device, and landing page. A
              click with no sale narrows the investigation; it does not identify
              the cause by itself.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              If relevant clicks reach a correctly tracked page but visitors
              disengage before the offer or form, investigate message match,
              mobile load, proof, and CTA friction before buying more traffic.
              Change one suspected cause and measure it against the baseline.
            </p>
            <aside
              role="note"
              aria-label="Evidence boundary"
              className="mt-5 rounded-xl border border-border px-5 py-4 text-sm leading-relaxed text-fg-muted"
            >
              <strong className="text-fg">Evidence boundary:</strong> CTR,
              bounce, and conversion events can support a page-side hypothesis,
              but they do not prove causality or exclude targeting, offer,
              tracking, and auction effects. No diagnosis or page change
              guarantees a sales outcome.
            </aside>
            <div className="mt-5 flex flex-col gap-2 text-sm">
              <Link
                href="/learning-centre/message-match-checklist"
                className="font-semibold text-accent hover:text-accent-light"
              >
                Compare search intent with page messaging
              </Link>
              <Link
                href="/learning-centre/landing-page-not-converting"
                className="font-semibold text-accent hover:text-accent-light"
              >
                Diagnose five common landing-page leaks
              </Link>
            </div>
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
                    'Cold paid search traffic has no prior relationship with your brand. The page is asking for trust it has not yet earned. If the first viewport contains only a headline and a CTA with no proof signal - no customer result, no recognisable logo, no specific outcome - a significant portion of visitors will not take action. One specific, attributed proof element above the fold changes the trust calculus for a visitor who has never heard of you.',
                },
                {
                  n: '3',
                  cause: 'Slow mobile load',
                  detail:
                    "A visitor who abandons while the page is loading is recorded as a bounce before they have seen your headline. Portent's 2022 analysis of over 100 million page views found that B2B lead-gen pages loading in 1 second convert at roughly 3x the rate of pages loading in 5 seconds. Check LCP with Google PageSpeed Insights on the mobile preset - not desktop. If LCP is above 4 seconds, treat load performance as a high-priority hypothesis and test it against other campaign and page signals.",
                },
                {
                  n: '4',
                  cause: 'Traffic sent to the homepage',
                  detail:
                    'A homepage is built to route multiple audience types across multiple offers. A paid search visitor arrived because of one specific promise. A homepage can dilute that promise by presenting navigation, multiple services, and no single conversion path. Compare it with a dedicated page under equivalent traffic conditions rather than assuming page type caused the result.',
                },
                {
                  n: '5',
                  cause: 'CTA asks for too much too soon',
                  detail:
                    'If the first action available requires significant commitment - booking a call, entering payment details, or filling out a long form - on a page the visitor has never seen before, the mismatch between trust level and ask size will kill the conversion. For cold search traffic, the CTA should match the temperature of the relationship: a low-commitment first step (free audit, free trial, download) is appropriate before a high-commitment ask.',
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
              Do not guess which cause is active - read the analytics patterns:
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
                    'Prioritise an ad-copy or keyword-match hypothesis, then compare it against page and traffic-quality evidence before changing the landing page.',
                },
                {
                  pattern: 'Mobile bounce 20+ points above desktop',
                  diagnosis:
                    'Mobile layout or mobile load time. Same page, different rendering. Check 390px viewport and mobile LCP specifically.',
                },
                {
                  pattern: 'Zero form starts (not just zero submits)',
                  diagnosis:
                    'Visitors are not engaging with the form at all. The issue is above-fold - either they are bouncing before reaching the form, or the form is positioned below where attention ends.',
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
                'Confirm CTR is healthy (above 3-5% for high-intent search) - if not, fix the ad before the page',
                'Check mobile LCP with Google PageSpeed Insights - if above 4s, fix load time first',
                'Open the page on mobile at 390px - confirm headline, proof signal, and CTA are all above the fold',
                'Verify the headline uses the exact noun phrase from your top-traffic ad groups',
                'Confirm there is one CTA - not three options competing at equal visual weight',
                'Check form field count - remove anything not required to deliver the next step',
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
              The free Nebula audit identifies likely page-side leaks. The $97 One-Leak Self-Implementation Kit
              delivers a tailored kit for one high-confidence page-level finding. You or your developer implements it, and the 30-day re-audit verifies the page condition. It does not promise conversion lift.
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
                See the One-Leak Self-Implementation Kit
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
