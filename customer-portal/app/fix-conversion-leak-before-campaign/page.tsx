import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fix Your Landing Page Conversion Leak Before the Next Campaign | Nebula',
  description:
    'How to find and fix conversion leaks on a landing page before scaling paid traffic. Free audit in 2 minutes, $97 repair sprint in 48 hours.',
  alternates: { canonical: 'https://nebulacomponents.com/fix-conversion-leak-before-campaign' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Fix Your Landing Page Conversion Leak Before the Next Campaign',
  description:
    'How to find and fix conversion leaks on a landing page before scaling paid traffic. Free audit in 2 minutes, $97 repair sprint in 48 hours.',
  url: 'https://nebulacomponents.com/fix-conversion-leak-before-campaign',
  mainEntity: {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I find and fix a conversion leak before my next campaign?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'To fix a conversion leak before a paid traffic campaign: run a structural audit on the landing page to identify the highest-priority failure, fix that one thing first, then launch. Nebula audits 9 signals in under 2 minutes for free. The $97 Repair Sprint implements the highest-priority fix in 48 hours.',
        },
      },
      {
        '@type': 'Question',
        name: 'What are the most common conversion leaks on a landing page?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The three leaks most likely to kill a campaign before it starts: a headline that does not match the ad (62% of pages in Nebula audit data), a CTA below the fold on mobile (40% of pages), and no social proof near the CTA (39% of pages). Most pages have more than one, but fixing the dominant leak first produces the highest lift.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does it take to fix a landing page before a campaign?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The audit takes under 2 minutes and identifies the highest-priority failure. The $97 Repair Sprint implements that fix in 48 hours. Total time from identifying the problem to launching a fixed campaign: 48 to 72 hours.',
        },
      },
    ],
  },
}

export default function FixConversionLeakBeforeCampaign() {
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
              Fix the Conversion Leak Before the Next Campaign
            </h1>
            <p className="text-lg text-fg-muted max-w-[600px] mx-auto mb-8">
              Most founders launch on a broken page. The audit takes 2 minutes. The fix takes 48 hours.
            </p>

            {/* Answer Capsule */}
            <div
              data-answer-capsule
              className="border-l-2 border-accent bg-bg-panel py-4 px-5 rounded-r-lg text-left mb-8"
            >
              <strong className="text-fg">Quick Answer:</strong>{' '}
              <span className="text-fg-muted">
                To fix a conversion leak before a paid traffic campaign: run a structural audit on
                the landing page to identify the highest-priority failure, fix that one thing first,
                then launch. Nebula audits 9 signals in under 2 minutes for free. The $97 Repair
                Sprint implements the highest-priority fix in 48 hours.
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {['Free audit', '2 minutes', '$97 Repair Sprint', '48h fix'].map((pill) => (
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

          {/* Section 1 */}
          <h2 className="text-2xl font-bold text-fg mt-4 mb-4">
            Why Founders Launch Campaigns on Broken Pages
          </h2>
          <p className="mb-4">
            The page looks fine. That is the problem. Most conversion leaks are structural, not visual.
            A page can have clean design, polished copy, and a clear brand, and still fail to convert
            paid traffic because of one invisible issue: the headline does not match the ad, the button
            is below the fold on mobile, or there is nothing to establish trust before the ask.
          </p>
          <p className="mb-4">
            Founders compare the page to their expectations, not to the visitor's experience. You know
            the product. You trust the offer. You would convert. Your paid visitor just clicked an ad
            three seconds ago and has no context. They need the page to do more work than it looks like
            it needs to do.
          </p>
          <p className="mb-6">
            The result: the campaign launches, the click-through rate looks fine, but conversion is
            low. The instinct is to adjust the ad. Most of the time, inspect the page before changing the ad.
          </p>

          {/* Section 2 */}
          <h2 className="text-2xl font-bold text-fg mt-10 mb-4">
            The 3 Leaks Most Likely to Kill a Campaign Before It Starts
          </h2>
          <div className="space-y-4 mb-6">
            <div className="bg-bg-panel border border-border rounded-lg p-5">
              <h3 className="text-base font-bold text-fg mb-2">1. Headline mismatch</h3>
              <p className="text-[0.95rem] m-0">
                The ad makes a specific promise. The landing page headline talks about something
                adjacent but different. The visitor does not see the connection and bounces. In Nebula
                audit data, 62% of pages have a headline that does not directly match the ad. This is
                the single most common failure.
              </p>
            </div>
            <div className="bg-bg-panel border border-border rounded-lg p-5">
              <h3 className="text-base font-bold text-fg mb-2">2. CTA below the fold on mobile</h3>
              <p className="text-[0.95rem] m-0">
                More than 60% of paid ad clicks land on a mobile device. If the primary button is
                not visible at 375px without scrolling, the visitor has no clear action available on
                first load. 40% of pages in Nebula data fail this check.
              </p>
            </div>
            <div className="bg-bg-panel border border-border rounded-lg p-5">
              <h3 className="text-base font-bold text-fg mb-2">3. No social proof near the CTA</h3>
              <p className="text-[0.95rem] m-0">
                Visitors who are ready to act often hesitate at the last second. A testimonial, a
                result, or a number immediately adjacent to the button addresses that hesitation where
                it happens. 39% of audited pages have no trust signal near the primary CTA.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <h2 className="text-2xl font-bold text-fg mt-10 mb-4">
            The Fix Sequence: Audit First, Fix One Thing, Then Launch
          </h2>
          <p className="mb-4">
            The instinct before a campaign is to optimize everything at once: rewrite the headline,
            add testimonials, redesign the mobile layout, and improve the CTA. That approach takes
            weeks and produces unclear results. If conversion improves, you do not know which fix
            caused it.
          </p>
          <p className="mb-4">
            The right sequence is simpler. First, audit the page to find the dominant failure, the
            one issue that, if fixed, would have the highest priority on conversion. Then fix only that.
            Launch. Measure. If conversion still needs improvement, audit again.
          </p>
          <p className="mb-6">
            One targeted fix is faster to implement, easier to reverse, and produces a cleaner signal
            than five simultaneous changes.
          </p>

          {/* Section 4 */}
          <h2 className="text-2xl font-bold text-fg mt-10 mb-4">
            How Long It Takes
          </h2>
          <div className="space-y-3 mb-6">
            <div className="flex gap-4 items-start">
              <span className="bg-accent text-bg text-sm font-bold px-3 py-1 rounded-full shrink-0 mt-0.5">Step 1</span>
              <p className="m-0">
                <strong className="text-fg">Audit:</strong> 2 minutes. Nebula checks 9 conversion
                signals on any public URL and returns a prioritized list of findings. No signup
                required to see results.
              </p>
            </div>
            <div className="flex gap-4 items-start">
              <span className="bg-accent text-bg text-sm font-bold px-3 py-1 rounded-full shrink-0 mt-0.5">Step 2</span>
              <p className="m-0">
                <strong className="text-fg">Repair Sprint:</strong> 48 hours. The $97 Repair Sprint
                implements the highest-priority fix identified in the audit. One targeted change,
                delivered within two business days.
              </p>
            </div>
            <div className="flex gap-4 items-start">
              <span className="bg-accent text-bg text-sm font-bold px-3 py-1 rounded-full shrink-0 mt-0.5">Step 3</span>
              <p className="m-0">
                <strong className="text-fg">Launch:</strong> After the fix is live, run the campaign.
                The page now passes the most common structural checks.
              </p>
            </div>
          </div>
          <p className="mb-6">
            Total time from starting the audit to running a fixed campaign: 48 to 72 hours.
          </p>

          {/* CTA */}
          <div className="bg-bg-panel border border-border rounded-xl py-10 px-8 text-center mt-14">
            <h2 className="text-[1.5rem] text-fg font-bold mb-3">
              Find the leak before you spend on the campaign.
            </h2>
            <p className="text-fg-muted mb-6">
              Free audit in 2 minutes. $97 Repair Sprint implements the fix in 48 hours.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                className="inline-block bg-accent text-bg font-bold text-base py-3.5 px-8 rounded-lg no-underline hover:bg-accent-light transition-colors"
                href="/audit"
              >
                Run free audit
              </a>
              <a
                className="inline-block border border-border text-fg font-semibold text-base py-3.5 px-8 rounded-lg no-underline hover:border-accent hover:text-accent transition-colors"
                href="/repair-sprint"
              >
                $97 Repair Sprint
              </a>
            </div>
            <p className="text-[13px] text-fg-muted mt-2.5">
              Free audit, no signup required
            </p>
          </div>

        </main>
      </div>
    </>
  )
}
