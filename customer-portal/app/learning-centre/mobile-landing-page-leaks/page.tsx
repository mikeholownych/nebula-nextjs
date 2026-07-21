import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Mobile Landing Page Leaks That Kill Paid Traffic | Nebula Learning Centre',
  description:
    'Over 60% of paid social traffic lands on mobile. These five structural leaks silently drain your ad budget — and a 5-minute phone audit will expose all of them.',
  openGraph: {
    title: 'Mobile Landing Page Leaks That Kill Paid Traffic',
    description:
      'Over 60% of paid social traffic lands on mobile. These five structural leaks silently drain your ad budget.',
    url: 'https://nebulacomponents.shop/learning-centre/mobile-landing-page-leaks',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Mobile Landing Page Leaks That Kill Paid Traffic',
  description:
    'Over 60% of paid social traffic lands on mobile. These five structural leaks silently drain your ad budget — and a 5-minute phone audit will expose all of them.',
  url: 'https://nebulacomponents.shop/learning-centre/mobile-landing-page-leaks',
  publishedDate: '2025-07-15',
  modifiedDate: '2026-07-21',
})

const leaks = [
  {
    number: '01',
    title: 'Hero Text Too Small to Read',
    body:
      'Most page builders render hero headlines at 40–48 px on desktop, then scale to 22–26 px on a 390 px viewport. At that size a visitor is reading, not deciding. The rule: mobile hero text must be ≥ 32 px (2 rem) and line-height ≤ 1.2 so the message lands in one visual pass. If someone has to pinch-zoom your headline, the ad impression was wasted.',
  },
  {
    number: '02',
    title: 'CTA Below the Mobile Fold',
    body:
      'On a 844 px-tall iPhone viewport the visible area after a 72 px nav is roughly 770 px. Hero image + subhead + two lines of body copy can easily consume 900 px — pushing the primary button off-screen. Google\'s own data shows conversion rate drops 20% for every 100 ms a user spends scrolling to find the first action. Your CTA belongs in the first 600 px of the mobile layout, full stop.',
  },
  {
    number: '03',
    title: 'Tap Targets Too Small',
    body:
      'WCAG 2.5.5 specifies a 44 × 44 px minimum touch target. Apple HIG recommends 44 pt. Most "desktop-first" button components render at 36 px height on mobile because padding was defined in em units relative to a smaller base font. The result: mis-taps, rage-clicks, and exits. Check every interactive element — buttons, nav links, and checkbox labels — with your thumb before you spend a dollar on traffic.',
  },
  {
    number: '04',
    title: 'Slow LCP on Mobile Networks',
    body:
      'Largest Contentful Paint (LCP) measures how fast the dominant visible element renders. On a mid-tier Android device over 4G the budget is 2.5 seconds. A desktop-optimised hero image at 1.8 MB will miss that target by 3–4 seconds. Core Web Vitals data from the Chrome UX Report consistently shows LCP scores 40–60% worse on mobile than desktop for the same URL. Every additional second of LCP reduces conversion rate by 4.5% (Portent, 2023). Fix: serve WebP/AVIF, use `sizes` attributes, and preload the hero image.',
  },
  {
    number: '05',
    title: 'Proof Section Hidden by Layout',
    body:
      'Social proof — logos, reviews, case study snippets — is often placed in a horizontal scroll carousel or a multi-column grid that collapses awkwardly at mobile widths. The result: logos are cut off at 50%, star ratings are clipped, and the section reads as visual noise rather than trust signal. Proof must reflow into a single-column stack or a two-column grid with full visible elements. If it looks broken on mobile, it actively erodes credibility.',
  },
]

const checklist = [
  {
    step: '1',
    action: 'Open your page on your phone',
    detail: 'Use Chrome on Android or Safari on iOS — not a desktop browser\'s "mobile view". Read your headline aloud without zooming. If you hesitate, the text is too small.',
  },
  {
    step: '2',
    action: 'Screenshot the first viewport',
    detail: 'Is your primary CTA button visible without scrolling? If not, note exactly how many pixels of content sit above it.',
  },
  {
    step: '3',
    action: 'Tap every button with your thumb — not your index finger',
    detail: 'Your thumb is less precise. Mis-taps on any interactive element mean the target is under 44 px. Flag each one.',
  },
  {
    step: '4',
    action: 'Run PageSpeed Insights on your phone URL',
    detail: 'Go to pagespeed.web.dev, paste your URL, select Mobile. Note your LCP score and the image listed as the LCP element. That image needs to be optimised first.',
  },
  {
    step: '5',
    action: 'Scroll to your proof section',
    detail: 'Are all logos fully visible? Are review stars complete? Can you read the full testimonial text without horizontal scrolling? Anything clipped or cropped is a broken trust signal.',
  },
]

const relatedArticles = [
  {
    href: '/learning-centre/above-the-fold-audit',
    title: 'Above-the-Fold Audit',
    description: 'What visitors see in the first 600 px determines whether they stay. Here is how to audit it systematically.',
  },
  {
    href: '/learning-centre/landing-page-load-speed',
    title: 'Landing Page Load Speed',
    description: 'Core Web Vitals benchmarks, image formats, and the waterfall fixes that move the needle on paid traffic.',
  },
  {
    href: '/learning-centre/cta-conversion-rate',
    title: 'CTA Conversion Rate',
    description: 'Button copy, placement, and contrast — the three variables that account for most CTA underperformance.',
  },
]

export default function MobileLandingPageLeaksPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-fg-muted">
            <li>
              <Link href="/" className="hover:text-fg transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-border">/</li>
            <li>
              <Link href="/learning-centre" className="hover:text-fg transition-colors">
                Learning Centre
              </Link>
            </li>
            <li aria-hidden="true" className="text-border">/</li>
            <li className="text-fg" aria-current="page">
              Mobile Landing Page Leaks
            </li>
          </ol>
        </nav>

        {/* Article header */}
        <article>
          <header className="mb-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
              Conversion Diagnostics
            </p>
            <h1 className="mb-5 text-3xl font-bold leading-tight text-fg sm:text-4xl">
              Mobile Landing Page Leaks That Kill Paid Traffic
            </h1>
            <p className="text-lg leading-relaxed text-fg-muted">
              More than 60% of paid social traffic — Meta, TikTok, Pinterest, X — arrives on a
              mobile device. Yet most landing pages are designed, QA'd, and optimised on a
              desktop. The gap between those two facts is where ad budget disappears. Below are
              the five structural leaks responsible for the majority of mobile conversion loss,
              and a 5-minute audit you can run from your phone right now.
            </p>
          </header>

          {/* 5 Leaks */}
          <section aria-labelledby="leaks-heading" className="mb-12">
            <h2 id="leaks-heading" className="mb-6 text-2xl font-bold text-fg">
              The 5 Most Common Mobile Leaks
            </h2>
            <div className="grid gap-4 sm:grid-cols-1">
              {leaks.map((leak) => (
                <div
                  key={leak.number}
                  className="rounded-xl border border-border bg-bg-panel p-6"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-xs font-bold tracking-widest text-accent">
                      LEAK {leak.number}
                    </span>
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-fg">{leak.title}</h3>
                  <p className="text-base leading-relaxed text-fg-muted">{leak.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 5-minute audit checklist */}
          <section aria-labelledby="checklist-heading" className="mb-12">
            <h2 id="checklist-heading" className="mb-2 text-2xl font-bold text-fg">
              The 5-Minute Mobile Audit
            </h2>
            <p className="mb-6 text-fg-muted">
              Pick up your phone. Run each step now — before your next ad campaign goes live.
            </p>
            <ol className="space-y-5">
              {checklist.map((item) => (
                <li key={item.step} className="flex gap-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    {item.step}
                  </span>
                  <div>
                    <p className="font-semibold text-fg">{item.action}</p>
                    <p className="mt-1 text-sm leading-relaxed text-fg-muted">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* CTA block */}
          <section
            aria-labelledby="cta-heading"
            className="mb-12 rounded-2xl border border-accent/30 bg-accent/5 p-8"
          >
            <h2 id="cta-heading" className="mb-3 text-xl font-bold text-fg">
              Get a Free Mobile Audit — Then a Full Fix
            </h2>
            <p className="mb-6 text-fg-muted">
              Nebula's free landing page audit flags every mobile leak above with annotated
              screenshots and a severity score. If you want them fixed, the $97 Fix Pack
              delivers production-ready component replacements within 48 hours — no retainer,
              no discovery call.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/audit"
                className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Get Your Free Audit
              </Link>
              <Link
                href="/fix-pack"
                className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-semibold text-fg transition-colors hover:bg-bg-muted"
              >
                See the $97 Fix Pack →
              </Link>
            </div>
          </section>
        </article>

        {/* Related articles */}
        <section aria-labelledby="related-heading" className="mb-12">
          <h2 id="related-heading" className="mb-5 text-xl font-bold text-fg">
            Related Articles
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {relatedArticles.map((article) => (
              <Link
                key={article.href}
                href={article.href}
                className="group rounded-xl border border-border bg-bg-panel p-5 transition-colors hover:border-accent/40 hover:bg-bg-muted"
              >
                <h3 className="mb-2 text-sm font-semibold text-fg group-hover:text-accent transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs leading-relaxed text-fg-muted">{article.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Back link */}
        <div className="border-t border-border pt-8">
          <Link
            href="/learning-centre"
            className="inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back to Learning Centre
          </Link>
        </div>

      </div>
    </main>
  )
}
