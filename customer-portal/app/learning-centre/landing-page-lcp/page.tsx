import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'LCP on Landing Pages: What Largest Contentful Paint Means for Your Paid Traffic | Nebula',
  description:
    'LCP measures how long paid visitors wait before they see your main content. Above 2.5 seconds, drop-off accelerates. Three LCP killers, how to spot them, and what to fix.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/landing-page-lcp',
  },
}

const articleSchema = createArticleSchema({
  headline:
    'LCP on Landing Pages: What Largest Contentful Paint Means for Your Paid Traffic',
  description:
    'LCP measures how long paid visitors wait before they see your main content. Above 2.5 seconds, drop-off accelerates. Three LCP killers, how to spot them, and what to fix.',
  url: 'https://nebulacomponents.com/learning-centre/landing-page-lcp',
  publishedDate: '2026-08-28',
  modifiedDate: '2026-08-28',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is LCP and why does it matter for landing pages?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "LCP (Largest Contentful Paint) is the time it takes for the largest visible element on the page to fully render. Google's threshold is 2.5 seconds for a good score. For landing pages receiving paid traffic, a slow LCP means visitors see a blank or partially loaded page immediately after clicking an ad, which causes them to leave before the content appears.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is the most common cause of a slow LCP on a landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An uncompressed hero image is the most common cause. A hero image over 300KB that loads before the page content renders delays LCP significantly. Compressing the image to WebP format and serving it at the correct display size typically reduces LCP by 30-60%.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does LCP affect Google Ads Quality Score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. Google's landing page experience score, which factors into Quality Score and therefore CPC, considers page load speed as a signal. A page with poor LCP may receive a lower quality score, raising the cost per click for campaigns sending traffic to that URL.",
      },
    },
  ],
}

export default function LandingPageLcpPage() {
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
            LCP on Landing Pages: What Largest Contentful Paint Means for Your Paid Traffic
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-muted">
            Largest Contentful Paint is the single load speed metric that most directly predicts
            whether a paid visitor stays or leaves before your page finishes loading. If your LCP
            is above 2.5 seconds on mobile, you are losing a measurable share of every campaign
            before a single word of your copy has been read. This article explains what LCP
            actually measures, what causes it to fail, and what to do about each cause.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/audit?utm_source=learning-centre-landing-page-lcp&utm_medium=hero-cta"
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
            What LCP Actually Measures
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Largest Contentful Paint measures the time from when a visitor first requests your page
            to when the largest visible content element finishes rendering on their screen. That
            element is usually your hero image or your main H1 heading - whichever is larger in
            rendered area at the moment the page loads.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The reason this metric matters for paid traffic specifically is that paid visitors
            arrive cold. They clicked an ad, they have no prior relationship with your brand, and
            their patience is low. Before they read your headline or see your offer, they are waiting
            for the page to appear. Every additional second of that wait is a window in which they
            decide to press back and return to what they were doing before the ad interrupted them.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Google's threshold is clear: an LCP under{' '}
            <span className="font-semibold text-fg">2.5 seconds</span> is considered &ldquo;Good.&rdquo;
            Between 2.5 and 4 seconds is &ldquo;Needs Improvement.&rdquo; Above 4 seconds is &ldquo;Poor.&rdquo;
            These thresholds are based on field data from real users and are directly tied to
            observed changes in engagement and conversion. A 31% improvement in LCP led to an 8%
            increase in sales for Vodafone (Chrome team case study, web.dev).
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            LCP Killer 1: Uncompressed Hero Image
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The most common LCP killer on landing pages is a hero image that has not been
            compressed or converted to a modern format. A JPEG exported from Figma or Photoshop
            at full quality and original dimensions can easily weigh 1 to 3 MB. On a mobile
            connection, that image alone can add 2 to 4 seconds to your LCP.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">How to spot it:</span> Open PageSpeed Insights
            and look at the &ldquo;Opportunities&rdquo; section. If &ldquo;Properly size images&rdquo; or &ldquo;Serve images in
            next-gen formats&rdquo; appears, your hero is likely the problem. You can confirm by opening
            Chrome DevTools, going to the Network tab, filtering by &ldquo;Img,&rdquo; and checking the file
            size of the first image request.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">What to fix:</span> Convert your hero image to
            WebP format and compress it to under 100KB for a 1200px-wide version. Use the{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">{'<img>'}</code> element with{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">loading="eager"</code> and{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">fetchpriority="high"</code>{' '}
            so the browser knows to prioritise it. If you are using a Next.js{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">Image</code> component,
            set <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">priority</code> to true
            on the hero image.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            LCP Killer 2: Render-Blocking Third-Party Scripts
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Analytics, chat widgets, A/B testing tools, and ad pixels all load as third-party
            scripts. When these scripts are loaded synchronously in the{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">{'<head>'}</code> of your
            page, they block the browser from rendering your content until they finish downloading
            and executing. If the third-party server is slow or unavailable, your LCP suffers even
            though your own server is fast.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">How to spot it:</span> Run your landing page
            in WebPageTest and look at the waterfall chart. Any bar that appears before your main
            content renders and sits on an external domain is a candidate. PageSpeed Insights also
            flags &ldquo;Eliminate render-blocking resources&rdquo; when this pattern is detected.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">What to fix:</span> Load non-critical scripts
            with the <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">defer</code> or{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">async</code> attribute.
            For analytics that fire on page view, defer firing is acceptable - the data arrives
            a few hundred milliseconds later but the visitor experience is intact. For chat widgets
            and live support tools, consider loading them only after the user interacts with the
            page rather than on initial load.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            LCP Killer 3: Slow Time to First Byte
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Time to First Byte (TTFB) is the time between a visitor's browser requesting your page
            and your server sending back the first byte of the response. If TTFB is high - above
            600ms is a common problem threshold - it pushes every subsequent metric later,
            including LCP. You can have a perfectly optimised page that still fails LCP simply
            because the server is slow to respond.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">How to spot it:</span> PageSpeed Insights shows
            TTFB under the &ldquo;Diagnostics&rdquo; section as &ldquo;Server response times.&rdquo; A value above 600ms
            in the field data is a warning sign. You can also measure it directly with{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">curl -o /dev/null -s -w "%&#123;time_starttransfer&#125;"</code>{' '}
            from different geographic locations.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">What to fix:</span> The fix depends on the
            cause. If your page is server-rendered without caching, add a CDN layer or enable
            full-page caching. If your hosting is shared, consider moving to a dedicated or
            edge-hosted environment. If the issue is database query latency on a dynamic page,
            cache the rendered output rather than re-querying on every request.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            What a Passing LCP Looks Like in Practice
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A landing page with a passing LCP score - under 2.5 seconds at the 75th percentile
            of real mobile users - typically has all of the following: a hero image under 100KB
            in WebP format with eager loading, no synchronous third-party scripts before content,
            and a server TTFB under 400ms. Achieving all three simultaneously is not technically
            difficult, but it requires auditing each layer separately.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The{' '}
            <Link
              href="/signals/load-speed"
              className="underline underline-offset-4 hover:text-fg transition-colors"
            >
              Load Speed signals
            </Link>{' '}
            in Nebula's audit check for each of the three killers described above and give you a
            prioritised diagnosis. If your LCP is failing, the audit identifies which layer is
            responsible so you know where to start.
          </p>
        </section>

        {/* CTA section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Find Out What Is Slowing Your LCP</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Nebula's free audit checks your landing page's Core Web Vitals including LCP, identifies
            which of the three killers is responsible if it is failing, and gives you a specific fix
            for each one. Takes under two minutes.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/audit?utm_source=learning-centre-landing-page-lcp&utm_medium=closing-cta"
              className="inline-flex items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
            >
              Get your free audit &rarr;
            </Link>
            <Link
              href="/learning-centre/landing-page-speed-test"
              className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
            >
              Read: How to Test Landing Page Speed
            </Link>
          </div>
        </section>

        {/* Related articles */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-lg font-bold text-fg">Related Articles</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link
                href="/learning-centre/landing-page-speed-test"
                className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
              >
                How to Test Landing Page Speed (and What to Do With the Results)
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
              <h3 className="font-semibold text-fg">What is LCP and why does it matter for landing pages?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">LCP (Largest Contentful Paint) is the time it takes for the largest visible element on the page to fully render. Google&apos;s threshold is 2.5 seconds for a good score. For landing pages receiving paid traffic, a slow LCP means visitors see a blank or partially loaded page immediately after clicking an ad, which causes them to leave before the content appears.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">What is the most common cause of a slow LCP on a landing page?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">An uncompressed hero image is the most common cause. A hero image over 300KB that loads before the page content renders delays LCP significantly. Compressing the image to WebP format and serving it at the correct display size typically reduces LCP by 30-60%.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">Does LCP affect Google Ads Quality Score?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Yes. Google&apos;s landing page experience score, which factors into Quality Score and therefore CPC, considers page load speed as a signal. A page with poor LCP may receive a lower quality score, raising the cost per click for campaigns sending traffic to that URL.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
