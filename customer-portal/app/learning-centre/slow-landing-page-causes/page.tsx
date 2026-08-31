import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Why Is My Landing Page Slow? The 5 Most Common Causes and Fixes | Nebula',
  description:
    'Five structural causes behind slow landing pages: uncompressed images, sync scripts, font render-block, missing CDN, and high-TTFB hosting. How to confirm each one and what to do about it.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/slow-landing-page-causes',
  },
}

const articleSchema = createArticleSchema({
  headline:
    'Why Is My Landing Page Slow? The 5 Most Common Causes and Fixes',
  description:
    'Five structural causes behind slow landing pages: uncompressed images, sync scripts, font render-block, missing CDN, and high-TTFB hosting. How to confirm each one and what to do about it.',
  url: 'https://nebulacomponents.com/learning-centre/slow-landing-page-causes',
  publishedDate: '2026-08-28',
  modifiedDate: '2026-08-28',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why is my landing page slow?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The five most common causes are: an uncompressed hero image over 500KB, third-party scripts (chat widgets, heatmaps, analytics) loading synchronously before page content, web fonts blocking render, no CDN for static assets, and slow server response time from shared hosting. PageSpeed Insights identifies which applies to a specific page.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it take to fix a slow landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Fixing an uncompressed hero image takes under 30 minutes. Deferring third-party scripts takes 1-2 hours depending on how they were installed. Moving to a CDN or upgrading hosting takes longer but has the highest priority on visitors who are geographically far from the server.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does a slow landing page affect ad performance?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes directly. Google's landing page experience score factors into Ad Rank, which determines both ad position and cost per click. A slow page with poor LCP can raise CPC and reduce ad impressions compared to a competitor sending traffic to a faster page targeting the same keywords.",
      },
    },
  ],
}

export default function SlowLandingPageCausesPage() {
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
            Why Is My Landing Page Slow? The 5 Most Common Causes and Fixes
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-muted">
            A slow landing page is not usually one big problem. It is typically a combination of
            three to five small ones, each adding a few hundred milliseconds, that together push
            your Largest Contentful Paint above the 2.5 second threshold where paid traffic begins
            to leave. A 55% improvement in LCP led to a 50% reduction in bounce rate for NDTV
            (Chrome team case study, web.dev). This article covers the five causes behind most
            of those failures, how to confirm each one is present on your page, and what to do
            about it.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/audit?utm_source=learning-centre-slow-landing-page-causes&utm_medium=hero-cta"
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
            Cause 1: Uncompressed Hero Image Over 500KB
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The hero image is the most common source of a failing LCP because it is typically the
            largest file the browser has to download before it can render the main visual. When
            that image is exported from a design tool at full quality and original dimensions, it
            routinely weighs 1 to 3 MB. On a mobile connection, downloading that file alone can
            add 2 to 5 seconds to your page load.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">How to confirm:</span> Open Chrome DevTools,
            go to the Network tab, reload your landing page, and filter by &ldquo;Img.&rdquo; Look at the
            size column for your hero image. If it is above 200KB, it is worth optimising. Above
            500KB is a likely contributor to a failing LCP.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">What to do:</span> Convert the image to WebP
            format and compress it to under 100KB for a 1200px-wide version. If your page uses
            a Next.js Image component, set the{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">priority</code> prop to
            true on the hero so the browser fetches it before other resources. If you are using a
            plain <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">{'<img>'}</code> tag,
            add <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">fetchpriority="high"</code>{' '}
            and <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">loading="eager"</code>.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Cause 2: Synchronous Third-Party Scripts Before Content
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Analytics tags, A/B testing scripts, retargeting pixels, chat widgets, and conversion
            tracking all load as third-party scripts. When these are added to the{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">{'<head>'}</code> of
            your page without a{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">defer</code> or{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">async</code> attribute,
            they execute synchronously: the browser stops parsing and rendering your page until
            each script has been fetched, downloaded, and executed. If the third-party server is
            slow or temporarily unavailable, your entire page waits.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">How to confirm:</span> Run your landing page
            in WebPageTest and examine the waterfall. Any external-domain request that appears as
            a blocking bar before your main content renders is a render-blocking script. PageSpeed
            Insights also flags this under &ldquo;Eliminate render-blocking resources.&rdquo;
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">What to do:</span> Add{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">defer</code> to every
            third-party script that does not need to run before content renders - which is almost
            all of them. For A/B testing scripts that inject content before render, consult the
            vendor's documentation for their recommended async loading pattern. Defer does not
            affect data accuracy for analytics; it only delays execution by a few hundred
            milliseconds, which is imperceptible to measurement tools.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Cause 3: Web Font Render Block
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Web fonts cause a specific type of delay called a Flash of Invisible Text (FOIT) or
            Flash of Unstyled Text (FOUT) depending on how they are configured. The default
            browser behaviour when a custom font is loading is to render no text at all until
            the font file arrives. On a slow connection, this can leave your headline and body
            copy invisible for one to three seconds even after the rest of the page structure
            has loaded.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">How to confirm:</span> In Chrome DevTools,
            throttle your connection to &ldquo;Slow 4G&rdquo; and reload your page. If you see a blank
            white area where your headline should be for more than a second before it appears,
            font blocking is occurring. You can also check your CSS for{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">font-display</code>{' '}
            settings - if it is absent or set to{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">block</code>, fonts
            are blocking.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">What to do:</span> Set{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">font-display: swap</code>{' '}
            in your{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">@font-face</code> declarations.
            This tells the browser to render text immediately in a fallback font and swap to the
            custom font when it arrives. Add a{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">{'<link rel="preload">'}</code>{' '}
            tag for your primary font file in the{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">{'<head>'}</code> to
            start the download earlier. If you are using Google Fonts via the standard embed
            URL, append <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">&amp;display=swap</code>{' '}
            to the URL.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Cause 4: No CDN for Static Assets
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A Content Delivery Network (CDN) stores copies of your static files - images, CSS,
            JavaScript - on servers distributed geographically close to your visitors. Without a
            CDN, every visitor's browser fetches your assets from a single origin server, which
            may be in a different country or data centre from where your traffic originates. The
            physical distance adds latency that cannot be fixed by any other optimisation.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">How to confirm:</span> In Chrome DevTools,
            click on a static asset request in the Network tab and look at the response headers.
            If you see headers like{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">x-cache: Miss from cloudfront</code>{' '}
            or no CDN headers at all, your assets are being served from origin. You can also
            check the TTFB for image requests - values above 200ms for a static file suggest
            no CDN is in use.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">What to do:</span> If you are on a managed
            platform like Vercel, Netlify, or Cloudflare Pages, CDN delivery is built in and
            this cause likely does not apply to you. If you are on a VPS or shared host, add
            Cloudflare's free tier in front of your domain to get CDN delivery for all static
            assets without changing your hosting.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Cause 5: High TTFB From Shared Hosting
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Time to First Byte (TTFB) is the delay between your visitor's browser sending a
            request and your server sending back the first byte of the response. On shared hosting,
            your server's resources are split across hundreds of other websites. During peak load
            periods, your site queues behind those other sites before it can respond. The resulting
            TTFB can exceed 1 to 2 seconds, pushing every subsequent metric - including LCP - later
            regardless of how optimised your page files are.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">How to confirm:</span> PageSpeed Insights
            reports this as &ldquo;Server response times&rdquo; under Diagnostics. A value above 600ms
            is flagged as an issue. You can also test directly from the command line:
            {' '}<code className="rounded bg-bg px-1 py-0.5 text-sm text-fg">curl -o /dev/null -s -w "%&#123;time_starttransfer&#125;n" https://yourdomain.com/your-landing-page</code>{' '}
            run several times across different times of day will show you the real TTFB range.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">What to do:</span> If your page is static
            or can be statically generated, serve it from a platform with edge distribution
            (Vercel, Cloudflare Pages, Netlify) where TTFB is under 100ms by default. If your
            page is dynamic, add full-page caching so that the server does not regenerate the
            HTML on every request. Moving off shared hosting to a dedicated VPS or managed
            platform is the permanent fix when the TTFB problem is structural.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The{' '}
            <Link
              href="/signals/load-speed"
              className="underline underline-offset-4 hover:text-fg transition-colors"
            >
              Load Speed signals
            </Link>{' '}
            in Nebula's audit check for all five of these causes structurally. See also the{' '}
            <Link
              href="/learning-centre/landing-page-lcp"
              className="underline underline-offset-4 hover:text-fg transition-colors"
            >
              LCP article
            </Link>{' '}
            for a deeper look at the three killers that most directly affect Largest Contentful Paint.
          </p>
        </section>

        {/* CTA section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Find Out Which Causes Are on Your Page</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Nebula's free audit runs a structural check for all five causes above and tells you
            which ones are present on your landing page. You get a prioritised fix list with
            specific next steps for each issue found.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/audit?utm_source=learning-centre-slow-landing-page-causes&utm_medium=closing-cta"
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
                href="/learning-centre/landing-page-speed-test"
                className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
              >
                How to Test Landing Page Speed (and What to Do With the Results)
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
              <h3 className="font-semibold text-fg">Why is my landing page slow?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">The five most common causes are: an uncompressed hero image over 500KB, third-party scripts (chat widgets, heatmaps, analytics) loading synchronously before page content, web fonts blocking render, no CDN for static assets, and slow server response time from shared hosting. PageSpeed Insights identifies which applies to a specific page.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">How long does it take to fix a slow landing page?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Fixing an uncompressed hero image takes under 30 minutes. Deferring third-party scripts takes 1-2 hours depending on how they were installed. Moving to a CDN or upgrading hosting takes longer but has the highest priority on visitors who are geographically far from the server.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">Does a slow landing page affect ad performance?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Yes directly. Google&apos;s landing page experience score factors into Ad Rank, which determines both ad position and cost per click. A slow page with poor LCP can raise CPC and reduce ad impressions compared to a competitor sending traffic to a faster page targeting the same keywords.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
