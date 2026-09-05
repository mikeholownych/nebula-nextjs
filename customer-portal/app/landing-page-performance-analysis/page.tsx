import type { Metadata } from 'next'
import Link from 'next/link'
import { formatUsd, getActiveFixPack } from '@/app/lib/public-facts'

export const metadata: Metadata = {
  title: 'Landing Page Performance Analysis for Paid Traffic: What to Measure and Fix | Nebula',
  description:
    "How to analyze why paid traffic isn't converting. Nebula checks 9 structural signals on any landing page, free, in under 2 minutes.",
  alternates: { canonical: 'https://nebulacomponents.com/landing-page-performance-analysis' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Landing Page Performance Analysis for Paid Traffic: What to Measure and Fix',
  description:
    "How to analyze why paid traffic isn't converting. Nebula checks 9 structural signals on any landing page, free, in under 2 minutes.",
  url: 'https://nebulacomponents.com/landing-page-performance-analysis',
  datePublished: '2026-07-01',
  dateModified: '2026-09-01',
  author: {
    '@type': 'Organization',
    name: 'Nebula Components',
    url: 'https://nebulacomponents.com',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Nebula Components',
    url: 'https://nebulacomponents.com',
  },
  mainEntity: {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What should I measure to analyze landing page performance for paid traffic?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Paid traffic performance analysis means diagnosing why visitors from ads are not converting. The core signals: message match, CTA clarity, social proof, load speed, above-fold clarity, mobile CTA, ad signals, SEO foundations, and AI readiness. Nebula checks all 9 automatically.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the most common reason paid traffic does not convert?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Based on 293 completed Nebula audits (Q3 2026), 62% of pages have headline or message-match failures. This is the single most common conversion failure for paid traffic landing pages.',
        },
      },
    ],
  },
}

const NINE_SIGNALS = [
  {
    name: 'Message match',
    description:
      'Does the headline on the landing page match the promise made in the ad? Misaligned messaging is the top driver of immediate bounce. If the ad says "Get 50% off today" and the headline says "Welcome to our store," the visitor leaves.',
    stat: '62% failure rate in 293-audit benchmark',
  },
  {
    name: 'CTA clarity',
    description:
      'Is there a single, clear call to action above the fold? Competing CTAs (sign up AND learn more AND book a call) reduce click-through by diluting intent.',
    stat: null,
  },
  {
    name: 'Social proof',
    description:
      'Are specific, credible trust signals visible without scrolling? Logos, testimonials, review counts, and case study snippets all serve this function. Generic "people love us" copy does not.',
    stat: '39% of pages missing adequate social proof',
  },
  {
    name: 'Load speed',
    description:
      'Does the page load in under 3 seconds on a mobile connection? Google\'s data shows a 53% abandonment rate when load time exceeds 3 seconds. Every additional second costs conversions.',
    stat: '40% of pages have load speed failures',
  },
  {
    name: 'Above-fold clarity',
    description:
      'Can a visitor understand what you offer, who it is for, and why it matters within the first viewport, without scrolling? Ambiguity at the top of the page kills purchase intent before it forms.',
    stat: null,
  },
  {
    name: 'Mobile CTA',
    description:
      'Is the primary CTA prominently placed and easily tappable on a 375px phone screen? More than 60% of paid traffic arrives on mobile. A CTA that requires scrolling on mobile is a CTA that most visitors never reach.',
    stat: null,
  },
  {
    name: 'Ad signal alignment',
    description:
      'Do the visual style, color palette, and brand voice of the ad carry through to the landing page? Discontinuity, even minor discontinuity, triggers distrust and signals that the visitor may have landed in the wrong place.',
    stat: null,
  },
  {
    name: 'SEO foundations',
    description:
      'Are title tags, meta descriptions, and Open Graph tags correctly implemented? These also affect Google Ads Quality Score, which directly impacts your cost-per-click on paid campaigns.',
    stat: null,
  },
  {
    name: 'AI readiness',
    description:
      'Is the page structured with schema markup and clear answer surfaces? AI tools like ChatGPT and Perplexity increasingly surface landing pages in answer contexts. Pages without structured data are invisible to this channel.',
    stat: null,
  },
]

export default function LandingPagePerformanceAnalysisPage() {
  const fixPack = getActiveFixPack()
  const fixPackPrice = fixPack ? formatUsd(fixPack.priceCents) : '$97'

  return (
    <div className="min-h-screen bg-bg text-fg font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-bg border-b border-border py-20 px-6">
        <div className="max-w-[720px] mx-auto text-center">
          <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-black leading-tight text-fg mb-5">
            Landing Page Performance Analysis<br />
            <span className="text-accent-light">for Paid Traffic</span>
          </h1>
          <p className="text-lg text-fg-muted max-w-[600px] mx-auto mb-8">
            GA4 bounce rate tells you something is wrong. It doesn't tell you which structural signal
            is failing. Here is how to run a proper performance analysis on a landing page receiving
            paid traffic.
          </p>

          {/* Answer Capsule */}
          <div
            data-answer-capsule
            className="border-l-2 border-accent bg-bg-panel py-4 px-5 rounded-r-lg text-left mb-8"
          >
            <strong className="text-fg">Quick Answer:</strong>{' '}
            <span className="text-fg-muted">
              Paid traffic performance analysis means diagnosing why visitors from ads are not
              converting. The core signals: message match, CTA clarity, social proof, load speed,
              above-fold clarity, mobile CTA, ad signals, SEO foundations, and AI readiness. Nebula
              checks all 9 automatically.
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {['9 structural signals', 'Free audit', 'Under 2 minutes', 'No signup required'].map((pill) => (
              <span
                key={pill}
                className="bg-bg-panel text-fg-muted border border-border px-4 py-1.5 rounded-full text-sm"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[780px] mx-auto px-6 py-12 pb-20">

        {/* Section 1: What performance analysis means for paid traffic */}
        <h2 className="text-2xl font-bold text-fg mt-4 mb-4">
          What Performance Analysis Means for Paid Traffic
        </h2>
        <p className="mb-4">
          Most marketers look at landing page performance through Google Analytics: bounce rate,
          session duration, pages per session. These metrics describe behavior. They don't explain
          the cause.
        </p>
        <p className="mb-4">
          A 78% bounce rate tells you visitors are leaving. It doesn't tell you whether they left
          because the headline didn't match the ad, because the page loaded in 6 seconds, because
          there was no social proof above the fold, or because the CTA was buried below three
          paragraphs of copy.
        </p>
        <p className="mb-4">
          Performance analysis for paid traffic means auditing the structural signals that explain
          why visitors from ads convert, or don't. These are different from the behavioral signals
          you see in GA4 or heatmaps. Structural analysis looks at the page itself before the visitor
          arrives.
        </p>
        <div className="bg-bg-panel border border-border rounded-xl p-7 mb-8">
          <p className="mb-0 text-fg-muted">
            <strong className="text-fg">Structural vs behavioral analysis:</strong> Behavioral tools
            (heatmaps, session recordings, GA4) tell you what visitors did. Structural analysis tells
            you what the page was missing before they arrived. You need both, but structural
            analysis is faster, cheaper, and gives you actionable fixes without requiring 1,000
            sessions of data.
          </p>
        </div>

        <section aria-labelledby="tool-scope" className="mb-8 rounded-xl border border-accent/20 bg-accent/5 p-6">
          <h2 id="tool-scope" className="mb-3 text-xl font-bold text-fg">Which tool answers which question?</h2>
          <p className="mb-4 text-sm leading-relaxed text-fg-muted">Choose the tool by the evidence you need. A behavior tool cannot replace a page inspection, and a technical crawl cannot explain every conversion condition.</p>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <p><strong className="text-fg">Page condition:</strong> <Link href="/audit" className="text-accent hover:underline">Run the free Nebula audit</Link> for message match, CTA, trust, mobile, structure, SEO, and AI readiness.</p>
            <p><strong className="text-fg">Visitor behavior:</strong> use GA4, heatmaps, or recordings when you need to see what visitors did.</p>
            <p><strong className="text-fg">Page speed:</strong> use PageSpeed Insights for Core Web Vitals and loading diagnostics.</p>
            <p><strong className="text-fg">Site-wide SEO:</strong> use a crawler when the question covers many URLs, redirects, or technical metadata.</p>
          </div>
          <p className="mt-4 text-sm text-fg-muted">Start with the page when paid traffic is already arriving and the failure is still unexplained. Then add behavioral data where it can answer a different question.</p>
        </section>

        {/* Section 2: The 9 signals */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          The 9 Signals That Explain Most Conversion Failures
        </h2>
        <p className="mb-6">
          Based on 293 completed Nebula audits (Q3 2026), these 9 structural signals account for
          the majority of conversion failures on paid traffic landing pages.
        </p>
        <div className="space-y-4 mb-8">
          {NINE_SIGNALS.map((signal, idx) => (
            <div key={idx} className="bg-bg-panel border border-border rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-accent font-bold text-sm mt-0.5 shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <strong className="text-fg">{signal.name}</strong>
                    {signal.stat && (
                      <span className="text-xs bg-danger-dim text-danger border border-danger/30 px-2 py-0.5 rounded-full">
                        {signal.stat}
                      </span>
                    )}
                  </div>
                  <p className="text-fg-muted text-sm mb-0">{signal.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section 3: Structural vs behavioral analysis */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          How to Run a Structural Analysis
        </h2>
        <p className="mb-4">
          Heatmaps and session recordings are behavioral tools. They show you where visitors clicked,
          how far they scrolled, and where they dropped off. Useful, but they require traffic to
          generate data, they take weeks to accumulate enough sessions to be meaningful, and they
          still require you to form a hypothesis about what to change.
        </p>
        <p className="mb-4">
          Structural analysis works differently. You inspect the page directly against a framework
          of known conversion signals. You don't need traffic data. You don't need a sample size.
          You can run it on a page before you send a single dollar of ad spend.
        </p>
        <p className="mb-4">
          The process:
        </p>
        <ol className="list-decimal list-inside mb-6 space-y-2 text-fg-muted">
          <li>Check message match: does the headline reflect the ad copy that will send traffic here?</li>
          <li>Check above-fold clarity: can a stranger understand the offer in 5 seconds without scrolling?</li>
          <li>Check CTA prominence: is there one clear action with no competing paths?</li>
          <li>Check social proof: are there credible, specific trust signals visible immediately?</li>
          <li>Check load speed: run the URL through PageSpeed Insights or equivalent.</li>
          <li>Check mobile layout: view the page on a phone before you run mobile ads to it.</li>
          <li>Check ad signal alignment: does the visual style match the ad creative?</li>
          <li>Check technical foundations: title tag, meta description, schema markup.</li>
          <li>Check AI readiness: structured data, FAQ markup, answer surfaces.</li>
        </ol>
        <p className="mb-8">
          Nebula automates this entire checklist. Paste the URL. The audit runs in under 2 minutes.
          You receive a prioritized report showing which signals passed, which failed, and what to
          fix first.
        </p>

        {/* Section 4: Benchmark data */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          What the Data Shows
        </h2>
        <p className="mb-6">
          Based on 293 completed Nebula audits, Q3 2026:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { stat: '62%', label: 'Headline or message-match failure', color: 'text-danger' },
            { stat: '40%', label: 'Load speed failures (mobile)', color: 'text-danger' },
            { stat: '39%', label: 'Missing or inadequate social proof', color: 'text-danger' },
          ].map((item, idx) => (
            <div key={idx} className="bg-bg-panel border border-border rounded-xl p-6 text-center">
              <div className={`text-4xl font-black mb-2 ${item.color}`}>{item.stat}</div>
              <p className="text-fg-muted text-sm mb-0">{item.label}</p>
            </div>
          ))}
        </div>
        <p className="mb-4">
          The average page in this dataset had 2.7 distinct conversion issues. That means fixing
          only the headline is typically not enough. There are usually two to three structural
          problems compounding each other.
        </p>
        <div className="bg-accent-dim border border-accent/30 rounded-xl p-6 mb-8">
          <div className="text-xs font-bold tracking-widest uppercase text-accent mb-2">
            Priority order
          </div>
          <p className="mb-0">
            When a page has multiple failures, fix message match first. It is the most common
            failure and the fastest to resolve. A visitor who doesn't understand your offer in
            5 seconds will not scroll far enough to encounter your social proof or CTA.
          </p>
        </div>
        <p className="text-xs text-fg-muted mb-8">
          Based on 293 completed Nebula audits, Q3 2026. Failure is defined as a signal scoring
          below threshold in Nebula's automated assessment. Individual page results vary.
        </p>

        {/* CTA Section */}
        <div className="bg-bg-panel shadow-glow border border-border rounded-2xl py-12 px-10 text-center">
          <h3 className="text-2xl font-bold text-fg mb-3">
            Analyze your landing page now
          </h3>
          <p className="text-fg-muted max-w-[500px] mx-auto mb-6">
            Nebula checks all 9 structural signals on your landing page. Free, in under 2 minutes.
            No signup. No sales call. Prioritized findings you can act on today.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <a
              href="/audit"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-bg font-bold py-4 px-9 rounded-lg transition-colors"
            >
              Run free audit
            </a>
            <a
              href="/repair-sprint"
              className="inline-flex items-center gap-2 bg-transparent border border-border hover:border-accent-light text-fg-muted hover:text-fg font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              See {fixPackPrice} Repair Sprint
            </a>
          </div>
          <p className="text-fg-muted text-sm">
            Free diagnostic. {fixPackPrice} per repair sprint. No monthly commitment.
          </p>
        </div>
      </main>
    </div>
  )
}
