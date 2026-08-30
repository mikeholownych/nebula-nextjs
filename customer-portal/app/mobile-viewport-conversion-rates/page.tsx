import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Viewport and Conversion Rates: Why Paid Ad Traffic Bounces on Mobile | Nebula',
  description:
    'How mobile viewport size affects landing page conversion rates for paid traffic. When the CTA is not visible at 375px without scrolling, paid visitors leave.',
  alternates: { canonical: 'https://nebulacomponents.com/mobile-viewport-conversion-rates' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Mobile Viewport and Conversion Rates: Why Paid Ad Traffic Bounces on Mobile',
  description:
    'How mobile viewport size affects landing page conversion rates for paid traffic. When the CTA is not visible at 375px without scrolling, paid visitors leave.',
  url: 'https://nebulacomponents.com/mobile-viewport-conversion-rates',
  mainEntity: {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Does mobile viewport affect conversion rates on paid ads?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Mobile viewport directly affects conversion rates for paid traffic. If the primary CTA is not visible on a 375px screen without scrolling, most mobile visitors will leave before they can act. In Nebula data from 293 audits, 40% of pages fail the mobile CTA visibility check.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the reference viewport width for mobile paid ad traffic?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '375px is the standard reference width used to audit mobile landing pages. It corresponds to the iPhone SE and older iPhone models and represents a conservative baseline. More than 60% of paid ad clicks land on a mobile device, making 375px the most important breakpoint to test.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I test my landing page at 375px?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Open Chrome DevTools (F12 or right-click and Inspect), click the device toolbar icon at the top of DevTools, and set a custom width of 375px. No plugins needed. Check whether the primary CTA button is visible without scrolling, the headline is readable at the default font size, and there is no horizontal scroll.',
        },
      },
    ],
  },
}

export default function MobileViewportConversionRates() {
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
              Mobile Viewport and Conversion Rates
            </h1>
            <p className="text-lg text-fg-muted max-w-[600px] mx-auto mb-8">
              Why paid ad traffic bounces on mobile: what to check at 375px.
            </p>

            {/* Answer Capsule */}
            <div
              data-answer-capsule
              className="border-l-2 border-accent bg-bg-panel py-4 px-5 rounded-r-lg text-left mb-8"
            >
              <strong className="text-fg">Quick Answer:</strong>{' '}
              <span className="text-fg-muted">
                Yes. Mobile viewport directly affects conversion rates for paid traffic. If the
                primary CTA is not visible on a 375px screen without scrolling, most mobile visitors
                will leave before they can act. In Nebula data from 293 audits, 40% of pages fail
                the mobile CTA visibility check.
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {['60%+ of ad clicks land on mobile', '375px reference width', '40% fail rate'].map((pill) => (
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
            What Mobile Viewport Means for a Landing Page
          </h2>
          <p className="mb-4">
            The mobile viewport is the visible area of the browser on a phone screen. Unlike desktop,
            where the entire page is usually visible at a glance, mobile visitors only see a narrow
            slice of the page at a time, typically 375px wide on the most common paid ad devices.
          </p>
          <p className="mb-4">
            375px is not an arbitrary number. It corresponds to older iPhone models and represents the
            smallest common screen used by ad-clicking audiences. Designing for 390px or 414px means
            roughly 20% of your paid traffic sees a broken layout. Designing for 375px means your page
            works everywhere.
          </p>
          <p className="mb-6">
            The fold, the point where the page is cut off without scrolling, lands at roughly 667px
            tall on a 375px viewport. Everything above that line must do the work: headline, subhead,
            and the primary CTA button.
          </p>

          {/* Section 2 */}
          <h2 className="text-2xl font-bold text-fg mt-10 mb-4">
            Why Mobile Matters More for Paid Traffic Than Organic
          </h2>
          <p className="mb-4">
            Organic search traffic skews desktop. Paid ad traffic skews mobile. The difference matters
            because the same page can perform well on desktop and fail completely on a phone.
          </p>
          <p className="mb-4">
            More than 60% of ad clicks from Google and Meta land on a mobile device. If you are
            running a paid campaign and your landing page has a mobile layout problem, you are paying
            full cost-per-click for visitors who bounce before they can convert.
          </p>
          <p className="mb-6">
            Organic visitors found your page through a search query; they have moderate intent and
            enough curiosity to scroll. Paid visitors clicked an ad promise. If the page does not
            immediately match that promise with a visible headline and a reachable CTA, they leave.
            Organic traffic forgives friction. Paid traffic does not.
          </p>

          {/* Section 3 */}
          <h2 className="text-2xl font-bold text-fg mt-10 mb-4">
            The Specific Failures That Kill Mobile Conversions
          </h2>
          <p className="mb-4">Three layout failures account for most mobile conversion losses on paid campaigns:</p>
          <div className="space-y-4 mb-6">
            <div className="bg-bg-panel border border-border rounded-lg p-5">
              <h3 className="text-base font-bold text-fg mb-2">CTA below the fold on mobile</h3>
              <p className="text-[0.95rem] m-0">
                A hero image that looks clean on desktop pushes the button below the fold on a 375px
                screen. The visitor sees the headline and a large image, but the button requires
                scrolling. Most do not scroll.
              </p>
            </div>
            <div className="bg-bg-panel border border-border rounded-lg p-5">
              <h3 className="text-base font-bold text-fg mb-2">Form pushed down by the hero</h3>
              <p className="text-[0.95rem] m-0">
                Lead capture forms placed below a full-height hero section are invisible on mobile
                first load. If the form is the conversion action, it needs to be above the fold or
                reached by a single scroll.
              </p>
            </div>
            <div className="bg-bg-panel border border-border rounded-lg p-5">
              <h3 className="text-base font-bold text-fg mb-2">Text too small to read without zooming</h3>
              <p className="text-[0.95rem] m-0">
                Body text under 15px and headline text under 24px forces visitors to pinch-zoom.
                Zooming breaks the layout and signals that the page was not built for the device.
                Most visitors exit instead of zooming.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <h2 className="text-2xl font-bold text-fg mt-10 mb-4">
            How to Test Your Page at 375px
          </h2>
          <p className="mb-4">No plugins required. This takes about 60 seconds in any Chromium browser:</p>
          <ol className="list-decimal list-outside ml-5 space-y-3 mb-6">
            <li>Open your landing page in Chrome or Edge.</li>
            <li>Press F12 (or right-click anywhere and select Inspect) to open DevTools.</li>
            <li>Click the device toolbar icon in the top-left of the DevTools panel (two overlapping rectangles).</li>
            <li>Set the width to 375 and height to 667 in the dimension fields at the top.</li>
            <li>Reload the page so assets render at the correct size.</li>
            <li>Check: is the primary CTA button visible without scrolling? Is the headline readable without zooming? Does anything overflow horizontally?</li>
          </ol>
          <p className="mb-6">
            If any of those three checks fail, you have a confirmed mobile conversion leak. The CTA
            visibility check alone accounts for 40% of failures in Nebula audit data.
          </p>

          {/* Section 5 */}
          <h2 className="text-2xl font-bold text-fg mt-10 mb-4">
            What a Passing Mobile Layout Looks Like
          </h2>
          <p className="mb-4">A page that passes the 375px check has three things in place:</p>
          <ul className="list-disc list-outside ml-5 space-y-2 mb-6">
            <li>One dominant CTA button visible above the fold, with enough contrast to identify it immediately as a button.</li>
            <li>A headline that reads at 24px or larger with no horizontal overflow or text cut off at the edge.</li>
            <li>No horizontal scroll: the entire page fits within the 375px width without requiring side-scrolling.</li>
          </ul>
          <p className="mb-6">
            The rest of the page can scroll. Long-form copy, testimonials, and feature lists all belong
            below the fold. The fold itself must show one clear action.
          </p>

          {/* CTA */}
          <div className="bg-bg-panel border border-border rounded-xl py-10 px-8 text-center mt-14">
            <h2 className="text-[1.5rem] text-fg font-bold mb-3">
              Nebula checks mobile CTA visibility automatically.
            </h2>
            <p className="text-fg-muted mb-6">
              Free audit. No signup. Results in under 2 minutes.
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
