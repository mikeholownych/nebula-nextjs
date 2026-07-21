import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Landing Page Load Time Slow: Signal 4 Diagnosis and Fix | Nebula Components',
  description:
    'Slow landing page load time bleeds conversions before the page is seen. Here is how to diagnose it, what the data says about the speed-conversion relationship, and where to start fixing.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/landing-page-load-time-slow',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Landing Page Load Time Slow: Signal 4 Diagnosis and Fix',
  description:
    'Slow landing page load time bleeds conversions before the page is seen. Here is how to diagnose it, what the data says about the speed-conversion relationship, and where to start fixing.',
  url: 'https://nebulacomponents.shop/learning-centre/landing-page-load-time-slow',
  publishedDate: '2026-07-16',
  modifiedDate: '2026-07-21',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does page load time affect conversion rate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Multiple studies show a consistent relationship. Portent's 2022 analysis of 100M+ page views found that B2B lead generation pages loading in 1 second have a conversion rate roughly 3x higher than pages loading in 5 seconds, and 5x higher than pages loading in 10 seconds. A 2020 Deloitte/Google study of 37 brands found that a 0.1-second improvement in mobile load time increased retail conversions by 8.4% and travel conversions by 10.1%. The mechanism is simple: a visitor who abandons during load is recorded as a bounce before they have seen your headline, your proof, or your CTA.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is a good page load time for a landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Google defines good Largest Contentful Paint (LCP) as under 2.5 seconds; 2.5–4 seconds needs improvement; above 4 seconds is poor. For paid traffic landing pages specifically, aim for LCP under 2.5 seconds on mobile — this is the device your visitors are most likely using. According to the 2024 Web Almanac (HTTP Archive), only 38% of mobile home pages currently pass all Core Web Vitals. If your page is in the 62% that fail, load time is a conversion blocker before any copy or layout issue is reached.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I check my landing page load time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use Google PageSpeed Insights (free, pagespeed.web.dev) — enter your landing page URL and it returns your LCP, FCP, and Core Web Vitals scores for both mobile and desktop, using real Chrome user data if available. For a more detailed waterfall view, use Chrome DevTools (Network tab, throttle to Fast 3G to simulate mobile). The LCP figure is the most actionable single metric for landing pages.',
      },
    },
    {
      '@type': 'Question',
      name: 'What causes slow LCP on a landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The four most common causes: (1) uncompressed hero image — a 2MB PNG in the first viewport will dominate LCP; (2) render-blocking scripts — third-party tools (chat widgets, analytics, ad pixels) loaded in the head block render until they resolve; (3) no CDN — serving assets from a single origin server adds round-trip latency for distant visitors; (4) server response time (TTFB) above 800ms — hosting tier or unoptimised server-side rendering. Image compression alone fixes LCP in most cases.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does page speed affect Google Ads Quality Score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. Google's Landing Page Experience component of Quality Score includes page load speed as a factor. A slow landing page can reduce Quality Score, which increases your cost-per-click and reduces your ad position. This means slow load time costs you twice: lower conversion rate on the traffic you receive, and higher CPC for that traffic. PageSpeed Insights flags this explicitly in its Quality Score impact section.",
      },
    },
  ],
}

export default function LandingPageLoadTimeSlow() {
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
              Landing Page Leaks · Load Time (Signal 4)
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Landing Page Load Time Slow: Signal 4 Diagnosis and Fix
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              Slow load time is the only conversion leak that costs you before
              the visitor has seen anything. A visitor who abandons during load
              is recorded as a bounce before your headline, your proof, or your
              CTA ever had a chance to work. Fix this before optimising anything
              else.
            </p>
          </div>

          {/* What the data says */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              What the data says about speed and conversion
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Two studies with real methodology behind them (not the
              widely-circulated figures that have no traceable primary source):
            </p>
            <div className="mt-5 space-y-5">
              <div className="rounded-xl border border-border bg-bg-muted/10 p-5">
                <p className="font-semibold text-fg">
                  Portent, 2022 — 100M+ page views across 20 B2B and B2C sites
                </p>
                <p className="mt-2 leading-relaxed text-fg-muted">
                  B2B lead-generation pages loading in 1 second convert at
                  roughly <strong className="text-fg">3x</strong> the rate of
                  pages loading in 5 seconds, and{' '}
                  <strong className="text-fg">5x</strong> the rate of pages
                  loading in 10 seconds. At anything above a 5-second load,
                  conversion rate drops to roughly half of a fast-loading
                  equivalent. The full analysis is at{' '}
                  <a
                    href="https://www.portent.com/blog/analytics/research-site-speed-hurting-everyones-revenue.htm"
                    className="text-accent hover:text-accent-light underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Portent: Site Speed is (Still) Impacting Your Conversion
                    Rate
                  </a>
                  .
                </p>
              </div>
              <div className="rounded-xl border border-border bg-bg-muted/10 p-5">
                <p className="font-semibold text-fg">
                  Deloitte/Google, 2020 — 37 retail, travel, and lead-gen brands
                </p>
                <p className="mt-2 leading-relaxed text-fg-muted">
                  A 0.1-second improvement in mobile load time increased retail
                  conversions by <strong className="text-fg">8.4%</strong> and
                  travel conversions by{' '}
                  <strong className="text-fg">10.1%</strong>. Retail consumers
                  spent 9.2% more per order at the same improvement. The
                  methodology and full findings are in the{' '}
                  <a
                    href="https://www.thinkwithgoogle.com/_qs/documents/9757/Milliseconds_Make_Millions_report_hQYAbZJ.pdf"
                    className="text-accent hover:text-accent-light underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Milliseconds Make Millions report
                  </a>{' '}
                  (Think with Google / Deloitte Digital).
                </p>
              </div>
              <div className="rounded-xl border border-border bg-bg-muted/10 p-5">
                <p className="font-semibold text-fg">
                  2024 Web Almanac — HTTP Archive, real CrUX data
                </p>
                <p className="mt-2 leading-relaxed text-fg-muted">
                  Only{' '}
                  <strong className="text-fg">
                    38% of mobile home pages
                  </strong>{' '}
                  passed all Core Web Vitals in 2024, according to the{' '}
                  <a
                    href="https://almanac.httparchive.org/en/2024/performance"
                    className="text-accent hover:text-accent-light underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    2024 Web Almanac (Performance chapter)
                  </a>
                  . That means more than six in ten mobile landing pages are
                  failing Google&apos;s real-world performance thresholds —
                  including many that have been &ldquo;optimised.&rdquo;
                </p>
              </div>
            </div>
          </section>

          {/* Google thresholds */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              The thresholds that matter: LCP
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Largest Contentful Paint (LCP) measures when the main content
              element — usually the hero image or headline — becomes visible.
              For a landing page, this is the moment the visitor can actually
              evaluate whether they are in the right place.
            </p>
            <ul className="mt-5 space-y-3">
              {[
                {
                  range: 'LCP under 2.5s',
                  label: 'Good',
                  detail: 'Most visitors see your offer quickly. This is the target for paid traffic landing pages.',
                  colour: 'text-green-400',
                },
                {
                  range: 'LCP 2.5s–4s',
                  label: 'Needs improvement',
                  detail: 'You are losing impatient visitors. Fix before scaling ad spend.',
                  colour: 'text-yellow-400',
                },
                {
                  range: 'LCP above 4s',
                  label: 'Poor',
                  detail: 'You are bleeding conversions and Search ranking. This is the first thing to fix.',
                  colour: 'text-red-400',
                },
              ].map(({ range, label, detail, colour }) => (
                <li
                  key={range}
                  className="flex items-start gap-4 rounded-xl border border-border p-4"
                >
                  <div className="shrink-0 w-32">
                    <p className="text-sm font-semibold text-fg">{range}</p>
                    <p className={`text-xs font-bold uppercase ${colour}`}>{label}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-fg-muted">{detail}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-fg-muted">
              Check your LCP free at{' '}
              <a
                href="https://pagespeed.web.dev"
                className="text-accent hover:text-accent-light underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                pagespeed.web.dev
              </a>
              . Enter your landing page URL. Takes 60 seconds. Run the mobile
              test — not just desktop.
            </p>
          </section>

          {/* 4 causes */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              The 4 most common causes of slow LCP
            </h2>
            <div className="space-y-5">
              {[
                {
                  cause: 'Uncompressed hero image',
                  fix: 'Convert to WebP format. Compress to 80% quality — indistinguishable from lossless at normal screen sizes. Serve responsive images (srcset) so mobile gets a smaller file than desktop. A 2MB PNG hero becomes 150–200KB WebP. This alone fixes LCP in most cases.',
                },
                {
                  cause: 'Render-blocking third-party scripts',
                  fix: 'Chat widgets, ad pixels, analytics tags, and A/B testing tools loaded in the <head> block rendering until they resolve. Audit with Chrome DevTools Network tab. Defer or async-load any script that is not required for initial render. Each third-party tag adds latency you cannot control.',
                },
                {
                  cause: 'No CDN',
                  fix: 'Serving static assets from a single origin server adds round-trip latency for visitors not near that server. Cloudflare is free for most sites and routes assets from edge locations geographically close to the visitor. Enable it before any other infrastructure change.',
                },
                {
                  cause: 'Slow server response (TTFB above 800ms)',
                  fix: 'Time to First Byte above 800ms means the server itself is slow before the browser has received anything to render. Causes: shared hosting under load, unoptimised server-side rendering, no caching. Check TTFB in PageSpeed Insights. If it is above 800ms, hosting tier or server-side caching is the fix, not image compression.',
                },
              ].map(({ cause, fix }, i) => (
                <div key={i} className="border-b border-border pb-5 last:border-0 last:pb-0">
                  <p className="font-semibold text-fg">{cause}</p>
                  <p className="mt-2 leading-relaxed text-fg-muted">{fix}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Fix sequence */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Fix sequence: highest impact first
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Speed optimisation has diminishing returns. Getting from 6s to 3s
              is usually straightforward. Getting from 3s to 1.5s requires code
              splitting, critical CSS, and font subsetting. Start with the
              high-impact, low-effort fixes.
            </p>
            <ol className="mt-5 space-y-3">
              {[
                'Compress hero image to WebP at 80% quality',
                'Add lazy loading to all below-fold images (loading="lazy")',
                'Enable Cloudflare or equivalent CDN',
                'Defer or async-load all non-critical third-party scripts',
                'Check TTFB — if above 800ms, address server response before frontend',
                'Remove redirect chains (each redirect adds a full round-trip)',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-fg-muted">
                  <span className="shrink-0 font-bold text-accent">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-fg-muted">
              Re-run PageSpeed Insights after each change to confirm the LCP
              improvement before moving to the next fix.
            </p>
          </section>

          {/* Quality Score connection */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Load time and Google Ads Quality Score
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Google&apos;s Landing Page Experience score — one of the three
              components of Quality Score — includes page load speed as a
              factor. A slow landing page reduces Quality Score, which raises
              your cost-per-click and lowers your ad position. This means slow
              load time costs you twice: lower conversion rate on the traffic
              you receive, and higher CPC to get that traffic in the first
              place.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              Check your landing page&apos;s Quality Score in Google Ads under
              Keywords &rarr; Columns &rarr; Quality Score components. If
              Landing Page Experience shows &ldquo;Below Average,&rdquo; load
              time is a likely contributor.
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
              Find the leak on your page
            </h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              The free Nebula audit checks all 7 signals including load time.
              The $97 Fix Pack implements every finding — rebuilt sections,
              speed fixes, deployed within 48 hours.
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
                { href: '/learning-centre/mobile-landing-page-leaks', label: 'Mobile Landing Page Leaks That Kill Paid Traffic' },
                { href: '/learning-centre/landing-page-bounce-rate-high', label: 'Landing Page Bounce Rate High: 3 Diagnosable Causes' },
                { href: '/learning-centre/before-you-raise-ad-budget', label: 'Before You Raise Ad Budget: Check These Landing Page Leaks' },
                { href: '/learning-centre/google-ads-quality-score-low', label: 'Google Ads Quality Score Low: How The Landing Page Fixes It' },
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
