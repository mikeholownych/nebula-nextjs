import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'How to Test Landing Page Speed (and What to Do With the Results) | Nebula',
  description:
    'The most common speed testing mistake is testing the wrong page. How to test your actual ad landing page with three tools, what to look at first, and how to act on the results.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/landing-page-speed-test',
  },
}

const articleSchema = createArticleSchema({
  headline:
    'How to Test Landing Page Speed (and What to Do With the Results)',
  description:
    'The most common speed testing mistake is testing the wrong page. How to test your actual ad landing page with three tools, what to look at first, and how to act on the results.',
  url: 'https://nebulacomponents.com/learning-centre/landing-page-speed-test',
  publishedDate: '2026-08-28',
  modifiedDate: '2026-08-28',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I test my landing page speed?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use Google PageSpeed Insights (pagespeed.web.dev) with the actual URL of the landing page receiving paid traffic, not the homepage. Look at the LCP score first on mobile. A score under 2.5 seconds is passing. The tool also identifies the specific resources causing the slowdown.',
      },
    },
    {
      '@type': 'Question',
      name: 'Should I test my landing page on mobile or desktop?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Mobile first. Over 60% of paid ad traffic lands on mobile devices, and mobile scores are consistently lower than desktop. A page that passes on desktop can fail on mobile by a significant margin. Google's ranking signals also use the mobile version of the page as the primary index.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between PageSpeed Insights and the Nebula audit for speed?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'PageSpeed Insights measures real load performance by actually loading the page. The Nebula audit checks structural signals in the page HTML, such as render-blocking scripts, image compression, and font loading strategy. Both are useful: PageSpeed gives the measured outcome, Nebula identifies the structural causes.',
      },
    },
  ],
}

export default function LandingPageSpeedTestPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link
          href="/learning-centre"
          className="text-sm text-fg-muted hover:text-fg transition-colors"
        >
          &larr; Learning Centre
        </Link>

        {/* Opening panel */}
        <div className="mt-8 rounded-md border border-border bg-bg-panel p-8 md:p-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            Load Speed
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-fg md:text-4xl">
            How to Test Landing Page Speed (and What to Do With the Results)
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-muted">
            Most founders who test their page speed test the wrong page. They run their
            homepage through PageSpeed Insights, see a score, and assume the number applies
            to their ad landing pages. It does not. Each URL on your site has its own speed
            profile, and the page your paid traffic lands on may perform completely differently
            from the page you tested. This article shows you how to test the right page with
            three tools, and what to do with what you find.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/audit?utm_source=learning-centre-landing-page-speed-test&utm_medium=hero-cta"
              className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
            >
              Get your free audit &rarr;
            </Link>
            <Link
              href="/repair-sprint"
              className="inline-flex min-h-[44px] items-center justify-center rounded border border-border px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
            >
              Explore $97 Repair Sprint
            </Link>
          </div>
        </div>

        {/* Section 1 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            The Most Common Mistake: Testing the Wrong Page
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Your homepage is often the fastest page on your site. It is the one you care about most
            visually, the one most likely to have been optimised at launch, and the one that may
            have no third-party scripts beyond basic analytics. Your ad landing pages are a different
            story. They may have A/B testing scripts, retargeting pixels, chat widgets, embedded
            video, and form integrations that your homepage does not carry.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            When you test your homepage and see a score of 90, nothing about that score tells you
            what a visitor experiences when they land on{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">yourdomain.com/lp/offer-name</code>.
            That page may score 45 on the same tool. The gap between those two numbers is the gap
            between the page you tested and the page your ad dollars are driving traffic to.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">The rule:</span> always test the exact URL
            your ad campaigns send traffic to. If you have multiple landing page variants, test
            each one separately. Speed profiles are per-URL, not per-domain.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Tool 1: PageSpeed Insights - Start With LCP on Mobile
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            PageSpeed Insights is the right tool to start with because it combines lab data
            (a simulated load) with field data (real Chrome user measurements from your actual
            visitors). Go to{' '}
            <span className="font-semibold text-fg">pagespeed.web.dev</span>, paste your landing
            page URL, and run the analysis.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            When the results load, look at the mobile tab first. Mobile scores matter more for
            paid traffic because the majority of ad clicks happen on mobile devices, and mobile
            connections are slower than desktop connections. The score shown at the top is a
            composite - do not use it as your primary metric.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Instead, scroll to the Core Web Vitals section and look at{' '}
            <span className="font-semibold text-fg">Largest Contentful Paint (LCP)</span> first.
            A passing score is under 2.5 seconds. If the LCP value is shown in orange or red,
            that is your first priority. The other metrics matter but LCP has the most direct
            relationship with whether paid visitors stay or leave before your page is usable.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Tool 2: WebPageTest - Use the Waterfall to Find Blockers
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            PageSpeed Insights tells you what is failing. WebPageTest tells you why. Go to{' '}
            <span className="font-semibold text-fg">webpagetest.org</span>, enter your landing
            page URL, select a mobile device and a mid-tier connection (3G Fast or 4G are
            representative of real paid traffic conditions), and run the test.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The waterfall chart is the most useful output. Each row is one request your page
            makes - your HTML, CSS, JavaScript files, images, fonts, and third-party scripts.
            The horizontal bars show when each request starts and how long it takes. Look for
            three patterns: a very wide bar near the top (large file downloading early), a gap
            where nothing is loading (server waiting), or a cluster of external-domain requests
            that appear before your main content.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Each of those patterns points to a specific fix. A wide image bar points to compression.
            An early gap points to TTFB and hosting. A cluster of external requests before your
            content points to render-blocking scripts. The waterfall does not tell you the fix
            directly, but it shows you exactly where the time is going.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Tool 3: Nebula Audit - Structural CWV Analysis
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            PageSpeed Insights and WebPageTest measure load performance at the technical level.
            Nebula's audit approaches the same question from the structural side: does your landing
            page have the conditions that typically cause Core Web Vitals to fail? This includes
            checking for unoptimised images, synchronous third-party scripts, missing font display
            settings, and hosting configurations that drive high TTFB.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The structural approach is useful because it catches problems before they appear in
            field data. Field data in PageSpeed Insights requires real user visits over a 28-day
            window - if your landing page is new or running on limited traffic, there may not be
            enough data yet to get reliable measurements. A structural audit identifies the same
            patterns without requiring traffic history.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The{' '}
            <Link
              href="/signals/load-speed"
              className="underline underline-offset-4 hover:text-fg transition-colors"
            >
              Load Speed signals
            </Link>{' '}
            in the Nebula audit map directly to the three killers covered in the{' '}
            <Link
              href="/learning-centre/landing-page-lcp"
              className="underline underline-offset-4 hover:text-fg transition-colors"
            >
              LCP article
            </Link>
            : image compression, render-blocking scripts, and TTFB. Each signal has a pass or
            fail result and a specific recommended action.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            What to Do With the Results
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            After running all three tools, you will have a list of issues ranked by impact.
            Work through them in this order: LCP first, then First Input Delay or Interaction to
            Next Paint, then Cumulative Layout Shift. Within LCP, fix image compression before
            script loading before TTFB - image compression is the cheapest fix with the largest
            typical impact.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            After making each fix, re-run PageSpeed Insights on the specific URL you changed.
            Do not assume a fix worked without measuring it. The lab data in PageSpeed Insights
            reflects the current state of the page and updates immediately - you do not need to
            wait for field data to confirm a technical change.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A landing page with a passing LCP on mobile is not the ceiling - it is the floor.
            Once LCP passes, look at the remaining Opportunities in PageSpeed Insights and work
            through them by estimated savings. Each improvement compounds with the others, and
            the difference between a score of 60 and a score of 90 is often a handful of discrete
            changes that each take less than an hour.
          </p>
        </section>

        {/* CTA section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Get a Structural Speed Audit in Two Minutes</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Nebula's free audit runs a structural analysis of your landing page's Core Web Vital
            conditions without requiring 28 days of traffic data. You get a prioritised list of
            load speed failures and specific fixes for each one.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/audit?utm_source=learning-centre-landing-page-speed-test&utm_medium=closing-cta"
              className="inline-flex items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
            >
              Get your free audit &rarr;
            </Link>
            <Link
              href="/learning-centre/landing-page-lcp"
              className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
            >
              Read: What LCP Means for Your Paid Traffic
            </Link>
          </div>
        </section>

        {/* Related articles */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-lg font-bold text-fg">Related Articles</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link
                href="/learning-centre/landing-page-lcp"
                className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
              >
                LCP on Landing Pages: What Largest Contentful Paint Means for Your Paid Traffic
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/slow-landing-page-causes"
                className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
              >
                Why Is My Landing Page Slow? The 5 Most Common Causes and Fixes
              </Link>
            </li>
            <li>
              <Link
                href="/signals/load-speed"
                className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
              >
                Load Speed Signals: How Nebula Audits Core Web Vitals on Your Page
              </Link>
            </li>
          </ul>
        </section>
        {/* FAQ section */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Frequently Asked Questions</h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold text-fg">How do I test my landing page speed?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Use Google PageSpeed Insights (pagespeed.web.dev) with the actual URL of the landing page receiving paid traffic, not the homepage. Look at the LCP score first on mobile. A score under 2.5 seconds is passing. The tool also identifies the specific resources causing the slowdown.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">Should I test my landing page on mobile or desktop?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Mobile first. Over 60% of paid ad traffic lands on mobile devices, and mobile scores are consistently lower than desktop. A page that passes on desktop can fail on mobile by a significant margin. Google&apos;s ranking signals also use the mobile version of the page as the primary index.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">What is the difference between PageSpeed Insights and the Nebula audit for speed?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">PageSpeed Insights measures real load performance by actually loading the page. The Nebula audit checks structural signals in the page HTML, such as render-blocking scripts, image compression, and font loading strategy. Both are useful: PageSpeed gives the measured outcome, Nebula identifies the structural causes.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
