import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Landing Page Converting at 2%: What's Actually Wrong and How to Fix It | Nebula",
  description:
    'A 2% conversion rate on a paid traffic landing page usually means one or two structural failures, not a broad optimization problem. Here is how to find them.',
  alternates: { canonical: 'https://nebulacomponents.com/ads-not-converting-two-percent' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: "Landing Page Converting at 2%: What's Actually Wrong and How to Fix It",
  description:
    'A 2% conversion rate on a paid traffic landing page usually means one or two structural failures, not a broad optimization problem. Here is how to find them.',
  url: 'https://nebulacomponents.com/ads-not-converting-two-percent',
  mainEntity: {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Why is my landing page only converting at 2% with paid traffic?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A 2% conversion rate on paid traffic typically indicates 1-2 specific structural failures rather than a broad optimization problem. The most common causes: the headline does not match the ad (62% of pages in Nebula data), social proof is missing near the CTA (39% of pages), or the page loads too slowly on mobile (40% of pages). One fix often doubles the conversion rate. Based on 293 completed Nebula audits, Q3 2026.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is 2% a bad conversion rate for a landing page?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'For paid traffic, 2% is almost always fixable. Industry benchmarks put average paid traffic conversion at 2-5%, but pages with no structural failures typically convert at 4-6% or higher on well-targeted campaigns. A 2% rate is not catastrophic, but it usually means one dominant failure is suppressing performance. Fixing it is faster than testing five small optimizations.',
        },
      },
      {
        '@type': 'Question',
        name: 'What should I fix first on a low-converting landing page?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Start with the headline. If the headline does not directly match the promise of the ad, paid visitors bounce immediately, before any other element has a chance to convert them. After headline match, check CTA visibility on mobile at 375px, then check for social proof adjacent to the CTA. Fix the first failure you find before addressing the others.',
        },
      },
    ],
  },
}

export default function AdsNotConvertingTwoPercent() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-bg text-fg-muted leading-relaxed text-[17px]">

        {/* Hero */}
        <section className="bg-bg border-b border-border py-20 px-6">
          <div className="max-w-[720px] mx-auto text-center">
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-black leading-tight text-fg mb-5">
              Converting at 2%: What Is Actually Wrong
            </h1>
            <p className="text-lg text-fg-muted max-w-[600px] mx-auto mb-8">
              A 2% conversion rate on paid traffic usually has one root cause. Here is how to find it.
            </p>

            {/* Answer Capsule */}
            <div
              data-answer-capsule
              className="border-l-2 border-accent bg-bg-panel py-4 px-5 rounded-r-lg text-left mb-8"
            >
              <strong className="text-fg">Quick Answer:</strong>{' '}
              <span className="text-fg-muted">
                A 2% conversion rate on paid traffic typically indicates 1-2 specific structural
                failures rather than a broad optimization problem. The most common causes: the
                headline does not match the ad (62% of pages in Nebula data), social proof is
                missing near the CTA (39% of pages), or the page loads too slowly on mobile (40%
                of pages). One fix often doubles the conversion rate.
              </span>
            </div>

            <p className="text-[13px] text-fg-muted">
              Based on 293 completed Nebula audits, Q3 2026.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <main className="max-w-[780px] mx-auto px-6 py-12 pb-20">

          {/* Section 1 */}
          <h2 className="text-2xl font-bold text-fg mt-4 mb-4">
            What 2% Actually Means
          </h2>
          <p className="mb-4">
            A 2% conversion rate means 98 out of 100 paid visitors left without taking the action you
            wanted. On most campaigns, that is not a targeting problem or an offer problem; those
            98 people clicked the ad, which means the targeting worked. They arrived at the page
            and left. The problem is on the page.
          </p>
          <p className="mb-4">
            2% is not a universal failure signal. For some industries and offer types, including high-ticket
            B2B, complex products, niche services, 2% can represent a healthy conversion rate if
            average order value is high enough. But for most direct-response campaigns running on
            Google or Meta, 2% means the page has a structural failure that is suppressing performance.
          </p>
          <p className="mb-6">
            The key word is structural. A structural failure is a specific, diagnosable problem: the
            headline does not match the ad, the button is not visible on mobile, or there is nothing
            to establish trust before the ask. It is not a vague quality issue or an aesthetic
            preference. It is one specific thing that can be identified and fixed.
          </p>

          {/* Section 2 */}
          <h2 className="text-2xl font-bold text-fg mt-10 mb-4">
            The 3 Structural Failures That Explain Most 2% Rates
          </h2>
          <p className="mb-4">
            In 293 completed Nebula audits, these three failures appear most frequently on pages
            converting at or below 2% on paid traffic:
          </p>
          <div className="space-y-4 mb-6">
            <div className="bg-bg-panel border border-border rounded-lg p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-fg m-0">Headline mismatch</h3>
                <span className="text-sm text-fg-muted shrink-0 ml-4">62% of pages</span>
              </div>
              <p className="text-[0.95rem] m-0">
                The ad promises a specific outcome. The landing page headline describes the product
                or brand instead of matching that promise. The visitor arrives expecting one thing
                and sees another. They leave in under 5 seconds, before any other element has a
                chance to convert them.
              </p>
            </div>
            <div className="bg-bg-panel border border-border rounded-lg p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-fg m-0">Missing above-fold social proof</h3>
                <span className="text-sm text-fg-muted shrink-0 ml-4">39% of pages</span>
              </div>
              <p className="text-[0.95rem] m-0">
                Paid visitors are skeptical. They clicked an ad, not an organic result; they know
                they are being sold to. A number, a testimonial, or a result immediately visible
                above the fold answers the trust question before the visitor has decided to leave.
                Pages without visible social proof near the CTA lose conversions at the final step.
              </p>
            </div>
            <div className="bg-bg-panel border border-border rounded-lg p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-fg m-0">Mobile CTA not visible</h3>
                <span className="text-sm text-fg-muted shrink-0 ml-4">40% of pages</span>
              </div>
              <p className="text-[0.95rem] m-0">
                More than 60% of paid clicks land on mobile. If the primary button is below the fold
                on a 375px screen, visitors have no visible action on first load. The page looks like
                a wall of content with no clear next step. Most do not scroll to find the button.
              </p>
            </div>
          </div>
          <p className="text-sm text-fg-muted italic mb-6">
            Based on 293 completed Nebula audits, Q3 2026.
          </p>

          {/* Section 3 */}
          <h2 className="text-2xl font-bold text-fg mt-10 mb-4">
            What to Rule Out First
          </h2>
          <p className="mb-4">
            Before touching the page, confirm that ad targeting and offer-market fit are not the
            root cause. A structural page fix will not help if the wrong audience is being sent to it.
          </p>
          <p className="mb-4">
            Two quick checks: First, look at the click-through rate on the ad. If CTR is below 0.5%
            on Google or below 1% on Meta, the targeting or ad creative may be the primary problem --
            fix those before the page. Second, check whether the offer has ever converted at a higher
            rate on a different page or channel. If it has, the offer is fine and the page is the
            variable to isolate.
          </p>
          <p className="mb-6">
            If CTR is reasonable and the offer has converted elsewhere, the page is almost certainly
            the bottleneck.
          </p>

          {/* Section 4 */}
          <h2 className="text-2xl font-bold text-fg mt-10 mb-4">
            How to Diagnose Which Failure Applies to Your Page
          </h2>
          <p className="mb-4">
            The fastest path to diagnosis is a structural audit. Nebula checks 9 conversion signals
            on any public URL in under 2 minutes. The output is a prioritized list of failures
            specific to your page, not a generic checklist.
          </p>
          <p className="mb-4">
            If you want to diagnose manually, work through the three most common failures in order:
          </p>
          <ol className="list-decimal list-outside ml-5 space-y-3 mb-6">
            <li>
              Open the page and read the headline as a first-time visitor. Does it directly match
              the specific promise in your ad? If not, this is likely your dominant failure.
            </li>
            <li>
              Resize your browser to 375px width. Is the primary CTA button visible without
              scrolling? If not, this is a confirmed mobile conversion leak.
            </li>
            <li>
              Look at what is visible above the fold on mobile. Is there any number, testimonial, or
              result within the first scroll position adjacent to the CTA? If not, add one.
            </li>
          </ol>

          {/* Section 5 */}
          <h2 className="text-2xl font-bold text-fg mt-10 mb-4">
            The One-Fix Principle
          </h2>
          <p className="mb-4">
            Most pages converting at 2% have one dominant failure. That failure suppresses
            performance more than the combination of all minor issues on the page. Fixing the dominant
            failure often doubles conversion. Fixing five minor issues often moves the needle by 10%.
          </p>
          <p className="mb-4">
            The temptation when conversion is low is to change everything at once: new copy, new
            design, new layout, new offer framing. That approach produces noise, not signal. You
            cannot tell what worked, so you cannot repeat it.
          </p>
          <p className="mb-6">
            Fix the one thing the audit identifies as the dominant failure. Launch. Measure the
            change. If you are still at 2%, there is likely a second failure. Find and fix that one
            next.
          </p>

          {/* CTA */}
          <div className="bg-bg-panel border border-border rounded-xl py-10 px-8 text-center mt-14">
            <h2 className="text-[1.5rem] text-fg font-bold mb-3">
              Find the failure keeping your page at 2%.
            </h2>
            <p className="text-fg-muted mb-6">
              Free audit. No signup. 9 signals checked in under 2 minutes.
            </p>
            <a
              className="inline-block bg-accent text-bg font-bold text-base py-3.5 px-8 rounded-lg no-underline hover:bg-accent-light transition-colors"
              href="/audit"
            >
              Run free audit
            </a>
            <p className="text-[13px] text-fg-muted mt-2.5">
              Works with any public URL, no account required
            </p>
          </div>

        </main>
      </div>
    </>
  )
}
