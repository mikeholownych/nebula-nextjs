import RelatedContent from '@/components/RelatedContent'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mobile Landing Page Optimization: Fix 6 Leaks | Nebula',
  description:
    'Most mobile landing page failures are structural - CTA below fold, tap targets under 44px, text that triggers iOS auto-zoom. Each is observable and fixable. This guide covers all six with pass/fail evidence.',
  alternates: { canonical: 'https://nebulacomponents.com/mobile-landing-page-optimization' },
  openGraph: {
    title: 'Mobile Landing Page Optimization: Fix 6 Leaks | Nebula',
    description:
      'Most mobile landing page failures are structural - CTA below fold, tap targets under 44px, text that triggers iOS auto-zoom. Each is observable and fixable.',
    url: 'https://nebulacomponents.com/mobile-landing-page-optimization',
    siteName: 'Nebula Components',
    type: 'article',
    images: ['https://nebulacomponents.com/brand/v2/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://nebulacomponents.com/brand/v2/og-default.png'],
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Mobile Landing Page Optimization: 6 Conversion Failures and How to Fix Them',
  description:
    'Six structural mobile landing page failures - CTA below fold, tap targets under 44px, text too small, desktop-sized images, missing autocomplete, and horizontal overflow - with pass/fail evidence and bounded fixes.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/mobile-landing-page-optimization',
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.com' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Mobile Landing Page Optimization',
      item: 'https://nebulacomponents.com/mobile-landing-page-optimization',
    },
  ],
}

const faqItems = [
  {
    question: 'Why does my landing page convert on desktop but not mobile?',
    answer:
      'The most common reasons: CTA is below the fold on mobile, form fields require precision typing unsuited to mobile keyboards, images are too large and slow the page on cellular connections, or tap targets are too small. Responsive CSS prevents layout breakage but does not fix conversion experience.',
  },
  {
    question: 'What is the minimum tap target size for mobile CTAs?',
    answer:
      '44×44 CSS pixels is Google\'s minimum recommendation. Apple\'s Human Interface Guidelines say the same. Buttons smaller than this get missed clicks and frustrated users. If your CTA button requires pinching to tap accurately, it will cost you conversions.',
  },
  {
    question: 'How do I test my landing page on mobile?',
    answer:
      'Chrome DevTools → Device Toolbar → set width to 390px (iPhone 14 standard). Check: CTA visible above fold, all text readable without zooming, form submittable with one hand, no horizontal scroll, images load. For real-device testing, email yourself the URL and test on an actual phone.',
  },
  {
    question: 'What percentage of landing page traffic is mobile?',
    answer:
      'Industry averages sit between 60–70% for B2B landing pages receiving paid or social traffic. For pages receiving organic Google traffic, mobile share is often 55–65%. If your page converts at 1.2% on desktop and 0.4% on mobile, fixing mobile often has 3× the revenue impact of any desktop improvement.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
}

const MOBILE_FAILURES = [
  {
    signal: 'CTA Placement',
    label: 'CTA below fold on mobile - primary action hidden, visitor does not scroll',
    detail:
      'A CTA that sits in the hero on a 1440px desktop layout frequently falls below the fold on a 390px mobile viewport. The visitor sees the headline, maybe the lede, and then a stock image or a feature row. The button is not visible. Cold paid traffic arriving from an ad does not scroll to find an action they expected to see immediately. The session ends.',
    fix: 'Load the page on a 390px device (or Chrome DevTools device toolbar at 390px) and record a screenshot of the initial viewport. The primary CTA must be visible without scrolling. If it is not, restructure the hero to place the button above any image, subheadline, or proof element.',
  },
  {
    signal: 'Tap Targets',
    label: 'Tap targets under 44px - variant pickers, small buttons, icon-only links',
    detail:
      'Mobile users interact with a fingertip, not a cursor. Elements below 44×44 CSS pixels - variant selectors, icon-only navigation links, close buttons, inline text links - require precision that fingers cannot reliably deliver. Missed taps create frustration and dropout. The failure is common on form pages where "Submit" is styled as a compact inline element rather than a full-width block button.',
    fix: 'Audit every interactive element at 390px width. Any button, link, or form control with a height or width below 44px is a tap-target failure. Full-width block buttons on mobile eliminate the problem entirely for primary CTAs.',
  },
  {
    signal: 'Typography',
    label: 'Text too small - body under 16px triggers iOS auto-zoom, breaks layout',
    detail:
      'iOS Safari automatically zooms the viewport when the user taps an input field if the font size is below 16px. This breaks fixed-position elements, disrupts scroll behavior, and shifts the layout in ways that can hide the CTA. Body copy below 16px also fails basic readability on a 375px screen at arm\'s length - the visitor cannot comfortably read the offer, so they do not act on it.',
    fix: 'Set body font-size to 16px minimum. Set all form input and textarea font-size to 16px or above - this specifically prevents iOS auto-zoom. Check computed font sizes using Chrome DevTools Computed panel at 390px width.',
  },
  {
    signal: 'Images',
    label: 'Desktop-sized images - 1200px asset on 375px viewport wastes bandwidth and LCP',
    detail:
      'A hero image sized for a 1200px desktop layout sent to a 375px mobile viewport is roughly 3× wider than necessary. The browser downloads and decodes 3× the pixel data. On a 4G connection, an unoptimized image that is 800KB can add 2–3 seconds to Largest Contentful Paint. LCP is Google\'s primary user-experience ranking signal. Slow LCP on mobile increases bounce rate before the page is even interactive.',
    fix: 'Use the <picture> element with srcset breakpoints, or serve images through a CDN that delivers appropriately sized variants by device. Target 375–430px images under 150KB for above-fold hero assets. Run a WebPageTest or Lighthouse audit on a throttled mobile connection to verify LCP improvement.',
  },
  {
    signal: 'Forms',
    label: 'No autocomplete on forms - email field without type="email" loses mobile keyboard',
    detail:
      'An <input> element without type="email" renders a standard QWERTY keyboard on iOS, not the email-optimized keyboard with @ and .com keys. An input without autocomplete="email" skips the system\'s stored credential suggestions. Each missing attribute adds friction to form completion on mobile. A three-field form with no autocomplete on any field multiplies the friction across every field.',
    fix: 'Set type="email" on every email input. Set autocomplete attributes explicitly: autocomplete="email", autocomplete="name", autocomplete="tel". Verify that the correct keyboard appears on device for each field. On a standard iOS device, type="email" should surface the keyboard with @ visible as a primary key.',
  },
  {
    signal: 'Layout',
    label: 'Horizontal overflow - content wider than viewport creates sideways scroll',
    detail:
      'A single oversized element - a fixed-width table, an unscaled image, a wide code block, or an element with a hardcoded pixel width - forces the viewport to expand horizontally. The user can now scroll left and right, which breaks the expected vertical reading flow. Trust badges, comparison tables, and icon rows with too many columns are the most common sources of horizontal overflow on landing pages.',
    fix: 'Add overflow-x: hidden to the body element to suppress horizontal scroll. Then trace the source: open Chrome DevTools at 390px and inspect elements wider than the viewport. Fix the root cause - use max-width: 100% on images, replace fixed pixel widths with relative widths, and limit icon rows to three columns on mobile.',
  },
]

const SIGNAL_GRID = [
  {
    signal: 'CTA above fold',
    pass: 'Primary action visible at 390px without scrolling',
    fail: 'CTA hidden below hero image or feature row on mobile',
  },
  {
    signal: 'Tap target size',
    pass: 'All interactive elements ≥ 44×44px',
    fail: 'Variant pickers, close buttons, or links under 44px',
  },
  {
    signal: 'Font size',
    pass: 'Body and input text ≥ 16px - no iOS auto-zoom',
    fail: 'Body or form inputs below 16px - triggers viewport shift',
  },
  {
    signal: 'Image sizing',
    pass: 'Responsive srcset; hero image ≤ 150KB at 430px',
    fail: '1200px desktop image sent to 375px viewport',
  },
  {
    signal: 'Form autocomplete',
    pass: 'type="email" and autocomplete attributes on all inputs',
    fail: 'Generic text inputs - wrong keyboard, no credential fill',
  },
  {
    signal: 'Horizontal scroll',
    pass: 'No element wider than viewport; overflow contained',
    fail: 'Fixed-width table or image forces sideways scroll',
  },
]

const relatedLinks = [
  { href: '/mobile-landing-page-audit', title: 'Mobile Landing Page Audit' },
  { href: '/page-speed-conversion', title: 'Page Speed and Conversion' },
  { href: '/landing-page-cta-audit', title: 'Landing Page CTA Audit' },
  { href: '/ads-getting-clicks-but-no-sales', title: 'Ads Getting Clicks But No Sales' },
  { href: '/pricing', title: 'Repair Sprint Pricing' },
]

export default function MobileLandingPageOptimization() {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main id="main-content" className="min-h-screen bg-bg pt-24 pb-16">
        <article className="mx-auto max-w-4xl px-6">

          {/* Header */}
          <header className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
              Mobile Conversion
            </p>
            <h1 className="heading-1 text-fg md:text-5xl">Optimize Mobile Landing Pages to Boost Paid Traffic Conversions</h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed max-w-2xl">
              60–70% of B2B landing page traffic arrives on a mobile device. &lsquo;Responsive&rsquo; means the layout does not break - it does not mean the page converts. A page that passes a responsive audit can still bury the CTA below fold, render unclickable tap targets, trigger iOS auto-zoom on form inputs, and download a 900KB image to a 375px screen. These six structural failures are the most common reasons mobile conversion rates run 50–70% below desktop.
            </p>
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/audit?utm_source=mobile-opt-hero&utm_medium=hero-cta"
              className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
            >
              Get your free audit →
            </Link>
            <Link
              href="/repair-sprint"
              className="inline-flex min-h-[44px] items-center justify-center rounded border border-border px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
            >
              Explore $97 Repair Sprint
            </Link>
          </div>
          </header>

          {/* Six failure patterns */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Six mobile conversion failures
            </h2>
            <div className="space-y-4">
              {MOBILE_FAILURES.map((f, i) => (
                <div key={i} className="rounded-xl border border-border bg-bg-muted/20 p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="shrink-0 font-mono text-xs text-fg-dim mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-0.5">{f.signal}</p>
                      <h3 className="text-base font-semibold text-fg">{f.label}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-fg-muted leading-6 mb-3 pl-7">{f.detail}</p>
                  <div className="pl-7 border-l-2 border-accent/30 ml-7">
                    <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Fix</p>
                    <p className="text-sm text-fg-muted leading-6">{f.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pass/fail signal grid */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-4">
              What the mobile audit checks
            </h2>
            <p className="text-sm text-fg-muted leading-6 mb-6 max-w-2xl">
              Nebula checks each of these signals against your actual page at a 390px viewport. Every finding returns the raw evidence - not a recommendation based on a template.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {SIGNAL_GRID.map((s) => (
                <div key={s.signal} className="rounded-xl border border-border bg-bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">{s.signal}</p>
                  <p className="text-xs text-fg-muted leading-5 mb-1">
                    <span className="text-accent">Pass: </span>{s.pass}
                  </p>
                  <p className="text-xs text-fg-muted leading-5">
                    <span className="text-signal-fail">Fail: </span>{s.fail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mb-14 rounded-md border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">Audit your mobile experience</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Paste your URL. Nebula checks CTA placement, tap targets, image size, form friction, and load performance against your actual page. Free, no signup, under 2 minutes.
            </p>
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="inline-block rounded bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors text-base"
            >
              Run Free Mobile Audit &rarr;
            </Link>
          </section>

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {faqItems.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-bg-muted/20 p-5"
                >
                  <h3 className="text-sm font-semibold text-fg mb-2">
                    {item.question}
                  </h3>
                  <p className="text-sm text-fg-muted leading-6">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Related */}
          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related:</span>
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-accent transition-colors"
              >
                {link.title}
              </Link>
            ))}
          </footer>

          <RelatedContent
            heading="Related resources"
            items={[
              { href: '/mobile-landing-page-audit', label: 'Mobile landing page audit', type: 'audit-type' },
            { href: '/page-speed-conversion', label: 'Page speed and conversion', type: 'guide' },
            { href: '/audit', label: 'Get your free audit', type: 'cta' }
            ]}
          />

        </article>
      </main>
    </>
  )
}
