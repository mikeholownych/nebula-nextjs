import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Mobile Landing Page Leaks That Kill Paid Traffic | Nebula Components',
  description:
    'The majority of paid social traffic arrives on mobile. These five structural leaks silently drain ad budget — and a 5-minute phone audit will expose all of them.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/mobile-landing-page-leaks',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Mobile Landing Page Leaks That Kill Paid Traffic',
  description:
    'The majority of paid social traffic arrives on mobile. These five structural leaks silently drain ad budget — and a 5-minute phone audit will expose all of them.',
  url: 'https://nebulacomponents.shop/learning-centre/mobile-landing-page-leaks',
  publishedDate: '2026-07-16',
  modifiedDate: '2026-07-21',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why does my landing page convert on desktop but not on mobile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The most common causes: (1) mobile layout breakage — elements designed at desktop widths collapse, clip, or overflow at 390px, making the page look unprofessional or unusable; (2) mobile LCP (Largest Contentful Paint) is poor — the hero image that loads in 0.8s on desktop loads in 4+ seconds on a mid-tier Android device over 4G because it has not been sized and compressed for mobile; (3) the CTA is not visible above the fold on mobile — desktop layouts typically show headline + proof + CTA in the first viewport, but mobile layouts often push the CTA below a full-height hero image. Check all three before attributing the gap to audience quality.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the minimum tap target size for a mobile landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "WCAG 2.5.5 (Level AA) specifies a minimum touch target size of 44×44 CSS pixels for all interactive elements. Apple's Human Interface Guidelines recommend 44 points as the minimum tap target, and Google's Material Design guidelines specify 48×48dp. In practice, most CTA buttons designed in rem-based padding relative to a 16px base font will render at 36–40px on mobile if the designer did not specifically test on a phone. Check every interactive element — buttons, nav links, radio buttons, and form labels — with your thumb, not your index finger, on a real device.",
      },
    },
    {
      '@type': 'Question',
      name: 'How do I check my landing page LCP on mobile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Go to pagespeed.web.dev, paste your landing page URL, and select the Mobile tab (not Desktop — mobile LCP is typically 40–60% worse than desktop for the same URL due to device and network differences). The report identifies the LCP element by name — almost always the hero image. It shows the current LCP score in milliseconds. Google's Core Web Vitals thresholds: under 2.5 seconds is 'Good,' 2.5–4 seconds is 'Needs Improvement,' above 4 seconds is 'Poor.' If your LCP element is a JPEG or PNG over 400KB, converting it to WebP with the correct `sizes` attribute is usually sufficient to move from 'Poor' to 'Good.'",
      },
    },
    {
      '@type': 'Question',
      name: 'Does mobile page speed affect Google Ads Quality Score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Landing Page Experience is one of the three components of Quality Score, and Google evaluates the page on mobile specifically for mobile-originated traffic. A page that is slow, hard to navigate, or difficult to read on mobile receives a "Below Average" Landing Page Experience rating for mobile ad traffic — raising your effective CPC and lowering your ad rank. Fixing mobile LCP and layout issues improves Landing Page Experience, which improves Quality Score, which lowers CPC. The fix is simultaneously a conversion improvement and a cost reduction.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the fastest way to audit a landing page on mobile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Five steps, under 5 minutes: (1) Open the page on a real phone in Chrome (iOS or Android — not desktop browser DevTools 'mobile view'). (2) Read the headline aloud without zooming. If you hesitate, text is too small. (3) Screenshot the first viewport — is the CTA visible without scrolling? (4) Tap every button with your thumb. Any mis-tap is a target under 44px. (5) Run Google PageSpeed Insights on mobile and check your LCP score and the element causing it. These five steps expose the majority of mobile conversion leaks in under five minutes.",
      },
    },
  ],
}

const leaks = [
  {
    number: '01',
    title: 'Hero text too small to read without zooming',
    body: "Most page builders render hero headlines at 40–48px on desktop, then scale to 22–26px at a 390px viewport. At that size a visitor is reading word-by-word rather than pattern-matching the message in a single visual pass. The rule: mobile hero text should be at least 28–32px (1.75–2rem) with line-height no greater than 1.2 so the message registers in under two seconds. If a visitor has to pinch-zoom your headline to read it, the ad impression was wasted before they understood what you offer.",
    fix: 'Check your H1 font size at 390px in browser DevTools (Chrome: right-click → Inspect → toggle device toolbar → iPhone 12 Pro). If under 28px, increase the mobile breakpoint font size in your CSS. Do not scale down from desktop — set the mobile size explicitly.',
  },
  {
    number: '02',
    title: 'CTA below the mobile fold',
    body: 'On a standard 844px iPhone viewport with a 72px navigation bar, the visible area is approximately 770px. A full-width hero image at 400px, plus a subheadline at 60px, plus two lines of body copy at 80px already consumes most of the available space — pushing the primary CTA button below the fold. A significant portion of visitors who arrive from paid social will not scroll to find an action they cannot see.',
    fix: 'Measure the pixel depth of every element above your CTA on mobile. If the total exceeds 700px, compress the layout: reduce hero image height, cut body copy from the above-fold section, or implement a sticky CTA bar that remains visible as the visitor scrolls.',
  },
  {
    number: '03',
    title: 'Tap targets under 44px',
    body: 'WCAG 2.5.5 specifies a minimum touch target of 44×44 CSS pixels. Apple\'s Human Interface Guidelines recommend 44 points. In practice, most "desktop-first" button components render at 36px height on mobile because padding was defined in em units relative to a smaller base font size. The result: mis-taps, rage-clicks, and exits. The problem is particularly acute on form radio buttons, checkbox labels, and secondary navigation links — elements that developers rarely test with a physical thumb.',
    fix: 'Test every interactive element on a real phone using your thumb — not your index finger. Your thumb is less precise and represents the actual interaction. Any element that requires two attempts to activate is under 44px. Add explicit `min-height: 44px` and `min-width: 44px` to all interactive elements in mobile CSS.',
  },
  {
    number: '04',
    title: 'Slow mobile LCP',
    body: "Largest Contentful Paint measures how fast the dominant visible element renders. Google's Core Web Vitals define LCP over 4 seconds as 'Poor' — and a poor LCP means a significant portion of visitors abandon before they see your headline. Portent's 2022 analysis of over 100 million page views found that pages loading in 1 second convert at roughly 3× the rate of pages loading in 5 seconds for B2B lead-gen. The Chrome UX Report consistently shows LCP scores 40–60% worse on mobile than desktop for the same URL — because mobile devices have less processing power and are often on slower networks. A 1.8MB JPEG hero image that passes desktop LCP will fail mobile LCP by 3–4 seconds.",
    fix: "Run Google PageSpeed Insights (pagespeed.web.dev) on the Mobile preset. The LCP element is almost always the hero image. Convert it to WebP or AVIF — typically a 40–60% file size reduction with no visible quality loss. Add a `sizes` attribute so mobile devices download a smaller version. Add `fetchpriority='high'` to the hero img element to hint to the browser that it should load first.",
  },
  {
    number: '05',
    title: 'Proof section broken at mobile widths',
    body: 'Social proof — client logos, review quotes, case study snippets — is often structured as a horizontal scroll carousel or a three-to-four column grid that breaks at mobile widths. The result: logos clipped at 50%, star ratings overflowing, and testimonial cards displaying at unreadable sizes. A proof section that looks broken actively erodes credibility rather than building it — the visitor perceives the business as unable to execute a basic web layout.',
    fix: 'Open your proof section on mobile and check: are all logos fully visible without horizontal scrolling? Are testimonial cards fully legible at 390px? Does the section reflow to a single or two-column layout cleanly? Fix any overflow, clipping, or illegibility. A two-column grid with `min-width: 0` on child elements is the most reliable mobile proof layout.',
  },
]

const checklist = [
  {
    step: '1',
    action: 'Open the page on a real phone',
    detail: 'Use Chrome on Android or Safari on iOS — not a desktop browser\'s "device emulation" mode. Read your headline aloud without zooming. If you hesitate or need to re-read, the text is too small.',
  },
  {
    step: '2',
    action: 'Screenshot the first viewport',
    detail: 'Is your primary CTA button visible without scrolling? If not, measure how many pixels of content sit above it — that is the compression target.',
  },
  {
    step: '3',
    action: 'Tap every button with your thumb',
    detail: 'Your thumb is less precise than your index finger. Any button requiring two attempts to activate is under 44px. Flag each one for a `min-height: 44px` fix.',
  },
  {
    step: '4',
    action: 'Run PageSpeed Insights on the Mobile preset',
    detail: 'Go to pagespeed.web.dev. Paste your URL. Select Mobile. Note your LCP score and the element listed as the LCP source — that element is the first fix target.',
  },
  {
    step: '5',
    action: 'Scroll to your proof section',
    detail: 'Are all logos fully visible? Are testimonial text and attribution fully legible? Does the layout reflow cleanly? If any element is clipped or overflowing, it is a trust leak.',
  },
]

export default function MobileLandingPageLeaks() {
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
              Mobile Conversion · Paid Traffic
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Mobile Landing Page Leaks That Kill Paid Traffic
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              The majority of paid social traffic arrives on mobile. A page that converts
              well on desktop can leak most of that traffic through five structural failures
              that are invisible on a laptop screen — and immediately obvious on a phone.
              The audit takes five minutes on your own device.
            </p>
          </div>

          {/* Why mobile is different */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Why desktop conversion rates mislead you about mobile
            </h2>
            <p className="leading-relaxed text-fg-muted">
              If you look at overall conversion data without segmenting by device, a healthy
              desktop rate can mask a broken mobile experience. An overall rate of 3% might
              be a 6% desktop rate and a 1% mobile rate — but the blended number hides the
              structural failure that is affecting the majority of your paid social traffic.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              Check your analytics segmented by device. If mobile conversion is 50% or more
              below desktop on the same page with meaningful volume, you have a mobile
              structural problem — not an audience quality problem. The audience arriving
              from mobile paid social is not inherently lower intent; they are encountering
              a different page.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              The Chrome UX Report consistently shows LCP scores 40–60% worse on mobile
              than desktop for the same URL. That gap alone means a page that passes Core
              Web Vitals on desktop frequently fails on mobile — and Google&apos;s Quality
              Score evaluation uses mobile performance for mobile-originated ad traffic.
            </p>
          </section>

          {/* 5 leaks */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-6 text-2xl font-bold text-fg">The 5 mobile leaks</h2>
            <div className="space-y-6">
              {leaks.map((leak) => (
                <div key={leak.number} className="rounded-xl border border-border p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">
                    Leak {leak.number}
                  </p>
                  <h3 className="text-lg font-bold text-fg">{leak.title}</h3>
                  <p className="mt-3 leading-relaxed text-fg-muted">{leak.body}</p>
                  <div className="mt-4 rounded-lg bg-accent/5 border border-accent/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">Fix</p>
                    <p className="text-sm leading-relaxed text-fg-muted">{leak.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5-minute audit checklist */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              The 5-minute phone audit
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Run this before spending another dollar on mobile-heavy paid social traffic.
              Use a real phone — not DevTools device emulation, which does not replicate
              actual network conditions or touch interaction precision.
            </p>
            <ol className="mt-5 space-y-4">
              {checklist.map(({ step, action, detail }) => (
                <li key={step} className="rounded-xl border border-border p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="shrink-0 text-xs font-bold text-accent bg-accent/10 rounded-full w-6 h-6 flex items-center justify-center">
                      {step}
                    </span>
                    <p className="font-semibold text-fg">{action}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-fg-muted pl-9">{detail}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* QS connection */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Mobile performance affects your Google Ads Quality Score
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Google evaluates Landing Page Experience — one of the three Quality Score
              components — using mobile performance for mobile-originated traffic. A page
              with a poor mobile LCP or broken mobile layout receives a &ldquo;Below
              Average&rdquo; Landing Page Experience rating, which raises your effective
              CPC and lowers your ad rank.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              Fixing mobile leaks is therefore both a conversion improvement and a cost
              reduction: the same page fix that raises conversion rate on mobile traffic
              also improves Quality Score, which lowers your CPC in the next ad auction
              cycle. The two improvements compound — you pay less per click and convert
              more of the clicks you receive.
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
              Find the mobile leaks on your page
            </h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              The free Nebula audit checks all 7 signals — including mobile layout, LCP,
              and CTA visibility — against your actual landing page URL. The $97 Fix Pack
              implements every finding within 48 hours.
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
                { href: '/learning-centre/landing-page-load-time-slow', label: 'Landing Page Load Time Slow: LCP Benchmarks and Fixes' },
                { href: '/learning-centre/landing-page-not-converting', label: 'Landing Page Not Converting? Diagnose These 5 Leaks First' },
                { href: '/learning-centre/ecommerce-landing-page-not-converting', label: 'Ecommerce Landing Page Not Converting: Fix These 5 Leaks First' },
                { href: '/learning-centre/google-ads-clicks-no-sales', label: 'Google Ads Clicks But No Sales: Check The Page' },
                { href: '/learning-centre/paid-traffic-leak-map', label: 'Paid Traffic Leak Map: Where Your Ad Budget Disappears' },
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
