import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'High CPC Low Conversion: Which Layer Is Broken | Nebula Components',
  description:
    'High CPC and low conversion rate together usually indicate a Quality Score problem rooted in landing page message-match. Here is how to diagnose which layer to fix first.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/high-cpc-low-conversion',
  },
}

const articleSchema = createArticleSchema({
  headline: 'High CPC, Low Conversion: Which Layer Is Broken',
  description:
    'High CPC and low conversion rate together usually indicate a Quality Score problem rooted in landing page message-match. Here is how to diagnose which layer to fix first.',
  url: 'https://nebulacomponents.shop/learning-centre/high-cpc-low-conversion',
  publishedDate: '2026-07-16',
  modifiedDate: '2026-07-21',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why is my Google Ads CPC high?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'CPC is determined by the Google Ads auction, which accounts for your bid and your Quality Score. A low Quality Score means you pay more for the same position — or get outbid by competitors with better Quality Scores and lower bids. Quality Score has three components: Expected CTR (ad relevance to the search), Ad Relevance (how closely the ad matches the keyword), and Landing Page Experience (how well the landing page matches the search intent, loads quickly, and provides a useful path to conversion). The Landing Page Experience component is entirely within your control and is the most commonly neglected of the three.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Google Ads Quality Score and how does it affect CPC?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Quality Score is Google\'s estimate of the quality and relevance of your ads and landing pages, scored 1–10. It is used in the ad auction to determine ad rank and CPC. A higher Quality Score means you can achieve the same ad position at a lower CPC, or a better position at the same CPC. Google\'s public documentation confirms that Quality Score is made up of three components: Expected CTR, Ad Relevance, and Landing Page Experience. Check your Quality Score components in Google Ads under Keywords → Columns → Quality Score.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can fixing my landing page reduce my CPC?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, directly. Improving Landing Page Experience — by matching the page headline to the keyword, loading faster on mobile, and providing a clear conversion path — improves your Quality Score. A higher Quality Score reduces your CPC in the ad auction for the same ad position. This means a better landing page does two things: improves conversion rate on the traffic you receive, and reduces the cost of each click. The two improvements compound — you pay less per click and convert more of the clicks you do receive.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is high CPC a targeting problem or a landing page problem?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Both can contribute. Check Quality Score components first: if Landing Page Experience is "Below Average," the landing page is a confirmed contributor to high CPC and should be fixed before any bid changes. If Expected CTR or Ad Relevance is "Below Average," the ad-to-keyword match is the priority. If all three components are "Average" or better and CPC is still high, the keyword is genuinely competitive — and the only lever is either a higher bid or finding less competitive keyword variants with comparable intent.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is landing page experience in Google Ads?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Landing Page Experience is Google\'s assessment of how useful and relevant your landing page is to visitors who click your ad. Google evaluates: (1) relevance — does the page content match the keyword and ad promise; (2) transparency — is it clear what the page offers and who runs it; (3) ease of navigation — can the visitor find what they came for; (4) loading speed — does the page load quickly on mobile. A "Below Average" rating means at least one of these is failing. The rating appears in Google Ads under Keywords → Quality Score columns.',
      },
    },
  ],
}

export default function HighCpcLowConversion() {
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
              Paid Traffic Economics · CPC and Conversion
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              High CPC, Low Conversion: Which Layer Is Broken
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              High CPC combined with low conversion is a two-layer problem, and
              the layers compound each other. You pay a premium per click to
              drive traffic to a page that does not convert it. Before adjusting
              bids, find out which layer is actually broken — because fixing
              the page often reduces the CPC too.
            </p>
          </div>

          {/* Quality Score mechanics */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Why CPC and conversion are linked through Quality Score
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Your cost-per-click in Google Ads is not just your bid — it is
              determined by the ad auction, which accounts for your bid and your
              Quality Score together. A low Quality Score means you pay more for
              the same ad position than a competitor with a higher score bidding
              the same amount.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              Quality Score has three components:
            </p>
            <ul className="mt-4 space-y-3">
              {[
                {
                  label: 'Expected CTR',
                  detail: 'How likely Google estimates your ad is to get clicked relative to the keyword. Based on historical performance of the ad and keyword combination.',
                },
                {
                  label: 'Ad Relevance',
                  detail: 'How closely the ad matches the intent behind the keyword. A generic ad running against a specific keyword will have low Ad Relevance.',
                },
                {
                  label: 'Landing Page Experience',
                  detail: 'How well the landing page matches the keyword and ad promise, loads on mobile, and provides a clear path to conversion. This is the component most commonly rated "Below Average" — and the most directly controllable.',
                },
              ].map(({ label, detail }) => (
                <li key={label} className="flex items-start gap-3 text-fg-muted">
                  <span className="shrink-0 mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                  <div>
                    <span className="font-semibold text-fg">{label}: </span>
                    {detail}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 leading-relaxed text-fg-muted">
              Check your Quality Score components now: in Google Ads, go to
              Keywords &rarr; Columns &rarr; Modify Columns &rarr; Quality
              Score. Add all three component columns. If Landing Page Experience
              shows &ldquo;Below Average,&rdquo; the page is confirmed as a
              contributor to both high CPC and low conversion.
            </p>
          </section>

          {/* Two-layer diagnosis */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Two-layer diagnosis: ad layer vs page layer
            </h2>
            <p className="leading-relaxed text-fg-muted">
              High CPC + low conversion can originate in either layer. Read the
              Quality Score components to identify which one:
            </p>
            <div className="mt-5 space-y-4">
              {[
                {
                  condition: 'Landing Page Experience: Below Average',
                  action: 'Page is confirmed contributor. Fix message-match (headline mirrors keyword), mobile LCP (under 2.5s), and above-fold proof before changing any bid settings.',
                  priority: 'Fix page first',
                },
                {
                  condition: 'Expected CTR or Ad Relevance: Below Average',
                  action: 'Ad-to-keyword match is the priority. Tighten keyword match types, rewrite ad copy to echo the exact search phrase, or restructure ad groups to reduce keyword-to-ad dilution.',
                  priority: 'Fix ad first',
                },
                {
                  condition: 'All three components: Average or Above Average',
                  action: 'The keyword is genuinely competitive. CPC is driven by competitor bids rather than your Quality Score. Options: accept the CPC and optimise the page for higher conversion to improve ROAS; find lower-competition keyword variants with comparable intent; adjust bidding strategy.',
                  priority: 'Competitive keyword',
                },
              ].map(({ condition, action, priority }) => (
                <div
                  key={condition}
                  className="rounded-xl border border-border p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="font-semibold text-fg text-sm">{condition}</p>
                    <span className="shrink-0 text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                      {priority}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-fg-muted">{action}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Landing page fixes for QS */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Landing page fixes that improve Quality Score
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Google assesses Landing Page Experience on four dimensions:
              relevance, transparency, navigability, and speed. Each maps to a
              specific fix:
            </p>
            <div className="mt-5 space-y-5">
              {[
                {
                  dimension: 'Relevance',
                  what: 'The page content matches the keyword and ad promise',
                  fix: 'Use the exact keyword phrase from your top-traffic ad groups in the page H1. If the keyword is "landing page conversion audit" and the H1 is "Digital Marketing Solutions," the relevance signal fails. One-to-one keyword-to-page alignment is the highest-leverage Quality Score fix.',
                },
                {
                  dimension: 'Transparency',
                  what: 'It is clear what the page offers, who provides it, and what the visitor is being asked to do',
                  fix: 'Ensure the above-fold section contains: what you do (specific, not vague), who it is for, and one next step. Buried pricing, hidden terms, or a form with no context around it all reduce transparency signals.',
                },
                {
                  dimension: 'Speed',
                  what: 'The page loads quickly on mobile',
                  fix: "Check LCP with Google PageSpeed Insights on mobile preset. Target under 2.5 seconds. Portent's 2022 analysis found B2B pages loading in 1 second convert at roughly 3x the rate of pages loading in 5 seconds — so speed improvements improve both Quality Score and conversion rate simultaneously.",
                },
                {
                  dimension: 'Navigation',
                  what: 'The visitor can find what they came for without excessive friction',
                  fix: 'For a dedicated landing page, this means a clear single-path layout: headline confirms intent, proof builds trust, CTA makes the next step obvious. A page with a navigation bar linking to ten other sections, multiple CTAs, and no clear hierarchy fails this dimension.',
                },
              ].map(({ dimension, what, fix }) => (
                <div key={dimension} className="border-b border-border pb-5 last:border-0 last:pb-0">
                  <p className="font-semibold text-fg">{dimension}</p>
                  <p className="text-sm text-fg-muted/70 italic mb-2">{what}</p>
                  <p className="text-sm leading-relaxed text-fg-muted">{fix}</p>
                </div>
              ))}
            </div>
          </section>

          {/* The compound effect */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Why fixing the page improves both CPC and conversion simultaneously
            </h2>
            <p className="leading-relaxed text-fg-muted">
              The page fix creates a positive compound: better message-match
              raises Landing Page Experience, which improves Quality Score,
              which lowers CPC in the auction. At the same time, the same
              message-match improvement means more of the visitors who do click
              will recognise they are in the right place and stay — raising
              conversion rate directly.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              The inverse is also true. Raising your bid to compensate for a
              low Quality Score is expensive without improving your position
              proportionally, and it does nothing for conversion rate. The same
              budget after a landing page fix buys more clicks at lower CPC and
              converts more of them. The economics move in one direction.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              This is why high CPC + low conversion is a page problem before it
              is a bid problem. The bid lever is the last one to adjust — after
              the page has been fixed and Quality Score has been given time (a
              few weeks of campaign data) to reflect the improvement.
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
              Find which layer is broken on your page
            </h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              The free Nebula audit checks all 7 signals and identifies the
              specific page-side causes of high CPC and low conversion. The $97
              Fix Pack implements every finding within 48 hours.
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
                { href: '/learning-centre/before-you-raise-ad-budget', label: 'Before You Raise Ad Budget: Fix The Leaks First' },
                { href: '/learning-centre/landing-page-not-converting', label: 'Landing Page Not Converting? Diagnose These 5 Leaks First' },
                { href: '/learning-centre/google-ads-quality-score-low', label: 'Google Ads Quality Score Low: How The Landing Page Fixes It' },
                { href: '/learning-centre/message-match-checklist', label: 'Message Match Checklist For Paid Traffic' },
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
