import RelatedContent from '@/components/RelatedContent'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mobile Landing Page Audit: CTA Visibility, 44px Tap Targets & Viewport Failures for Meta and TikTok Traffic | Nebula',
  description:
    'When 60–80% of your paid ad clicks land on mobile and conversion rates lag desktop, the cause is specific and observable: CTA not visible at 375px, tap targets under 44px, missing viewport meta, desktop-resolution images, and font sizes triggering iOS zoom. This guide covers each failure with evidence and a fix.',
  alternates: {
    canonical: 'https://nebulacomponents.com/mobile-landing-page-audit',
  },
  openGraph: {
    title: 'Mobile Landing Page Audit: CTA Visibility, 44px Tap Targets & Viewport Failures for Meta and TikTok Traffic | Nebula',
    description:
      'When 60–80% of your paid ad clicks land on mobile and conversion rates lag desktop, the cause is specific and observable: CTA not visible at 375px, tap targets under 44px, missing viewport meta, desktop-resolution images.',
    url: 'https://nebulacomponents.com/mobile-landing-page-audit',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Mobile Landing Page Audit: CTA Visibility, 44px Tap Targets & Viewport Failures for Meta and TikTok Traffic',
  description:
    'Diagnostic guide for mobile-specific landing page conversion failures - CTA visibility at 375px, tap target size, viewport meta configuration, form friction, image loading weight, and font size causing iOS zoom.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/mobile-landing-page-audit',
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.com' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Mobile Landing Page Audit',
      item: 'https://nebulacomponents.com/mobile-landing-page-audit',
    },
  ],
}

const faqItems = [
  {
    q: 'What is the most common mobile conversion leak on landing pages?',
    a: 'The primary CTA not being visible on mobile without scrolling. The audit checks for this specifically: on a 375px viewport, is the primary call to action visible before the first scroll? If not, a significant portion of mobile visitors never see the action they are supposed to take.',
  },
  {
    q: 'What is the minimum tap target size for mobile buttons?',
    a: "44×44 CSS pixels - Google's Web Vitals standard and Apple's HIG minimum. Buttons, links, and form controls below this size cause accidental taps on adjacent elements or failed interactions. Variant selectors, size pickers, and icon-only buttons on ecommerce pages are the most frequent offenders.",
  },
  {
    q: 'Does page load speed affect mobile conversion differently than desktop?',
    a: "Yes. Mobile connections are slower and more variable than desktop. A page that loads in 1.2s on desktop may take 3.8s on a median 4G connection. Google's LCP threshold is 2.5s. Pages above that threshold see measurable conversion drop-off because mobile visitors are more likely to abandon on slow connections than desktop users.",
  },
  {
    q: 'How do I check if my landing page has mobile conversion problems without testing on a device?',
    a: 'Chrome DevTools device simulation covers most observable issues: CTA visibility at 375px, tap target size, viewport rendering, and image layout. For real device rendering, the audit fetches the page HTML and checks viewport meta configuration, image sizing signals, and font-size declarations in the source.',
  },
  {
    q: 'What is horizontal overflow and why does it hurt mobile conversion?',
    a: "Horizontal overflow occurs when an element's width exceeds the viewport width, creating a horizontal scrollbar. It signals to the visitor that the page was not designed for their device. It also pushes CTAs out of the visible horizontal area on some layouts, making them unreachable without deliberate scrolling in two directions.",
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

const MOBILE_FAILURES = [
  {
    signal: 'CTA visibility',
    label: 'Primary CTA not visible on 375px viewport without scrolling',
    detail:
      "The most common mobile conversion failure is structural: the primary call to action is positioned below a hero section, a headline, and a value proposition paragraph - none of which is the CTA. On a 375px viewport, this typically places the buy button or form submit below the first scroll. Visitors who don't scroll don't see the action they arrived to take. Meta, TikTok, and Instagram traffic arrive on mobile by default - this failure affects the majority of paid click volume.",
    fix: 'Reorder the above-fold layout for mobile: headline, value statement, primary CTA - in that order, all within the first 600px of the viewport on a 375px screen. Verify in Chrome DevTools device simulation. Supporting content - testimonials, feature details, FAQs - belongs below the fold.',
  },
  {
    signal: 'Tap targets',
    label: 'Interactive elements under 44×44px - variant selectors, icon buttons, nav links',
    detail:
      "Google's Web Vitals standard and Apple's Human Interface Guidelines both specify 44×44 CSS pixels as the minimum touch target. Elements below this size cause two distinct failures: accidental taps on adjacent elements, and missed taps that register as no-action. On ecommerce pages, size and color variant selectors - typically rendered at 32–38px in default Shopify themes - are the most frequent violators. Icon-only buttons (wishlist hearts, share icons, close modals) are a close second.",
    fix: 'Audit all interactive elements in Chrome DevTools with the Accessibility panel open. Set a minimum height and width of 44px on all buttons, links, and form controls. For icon-only buttons, increase the padding - not the icon size - to reach the minimum touch area without affecting visual design.',
  },
  {
    signal: 'Viewport meta',
    label: 'Missing or misconfigured viewport meta tag rendering desktop layout on mobile',
    detail:
      "A page without `<meta name='viewport' content='width=device-width, initial-scale=1'>` renders at desktop width on mobile browsers - typically 980px - and then scales down to fit the screen. The result is an unzoomed desktop layout where all text is illegible, all tap targets are tiny, and CTAs require precision tapping. This is a foundational configuration error that makes every other mobile fix irrelevant until it is corrected.",
    fix: "Add `<meta name='viewport' content='width=device-width, initial-scale=1'>` to the `<head>` of every landing page. Verify in Chrome DevTools that the device simulation renders the page at mobile width, not as a scaled-down desktop view. This is the first check in the mobile audit - if it fails, no other signal is evaluable.",
  },
  {
    signal: 'Form friction',
    label: 'Multi-field forms with no autocomplete - email inputs missing type="email"',
    detail:
      "Mobile form friction has two observable components. First: multi-field forms without `autocomplete` attributes force the visitor to type every field manually - name, email, company - on a touchscreen keyboard. Second: email inputs without `type='email'` do not trigger the email-optimized keyboard (with the @ symbol prominent) on iOS and Android. Both add friction that is invisible on desktop but material on mobile.",
    fix: "Add `autocomplete` attributes to every form field: `autocomplete='name'`, `autocomplete='email'`, `autocomplete='organization'`. Set `type='email'` on all email inputs and `type='tel'` on phone inputs. These attributes cost nothing to implement and directly reduce mobile form abandonment.",
  },
  {
    signal: 'Image loading',
    label: 'Hero and product images loading at desktop resolution on mobile',
    detail:
      "A 1400×900 hero image loaded on a 375px mobile viewport delivers 2–4x the bytes the device can render. On a median 4G connection, a single oversized hero image adds 1–3 seconds to LCP. Most pages do not use `srcset` or `sizes` attributes to serve mobile-appropriate image dimensions - the same asset served to desktop users is served to mobile visitors at full resolution.",
    fix: "Implement responsive images using `srcset` and `sizes` attributes, or use a CDN that serves appropriately sized variants. A mobile hero image should be 750px wide at 2x for retina, not 1400px. Use WebP format. Verify in Chrome DevTools Network panel that the image loaded on mobile simulation is under 150KB for above-fold images.",
  },
  {
    signal: 'Font size',
    label: 'Body text under 16px causing iOS to zoom on tap, breaking layout',
    detail:
      "iOS Safari auto-zooms into form inputs and interactive text elements when the font size is below 16px. This zoom behavior is a browser protection against illegible text - but it breaks the page layout for the visitor, requiring them to manually zoom out before continuing. Pages that set body text at 14px or 15px - common in design systems optimized for desktop - trigger this behavior on every form interaction on iOS.",
    fix: 'Set the minimum font size for all text inputs and body text to 16px in your CSS. On iOS, this prevents the auto-zoom. Verify in Chrome DevTools device simulation and test on a real iPhone if available. The fix is a single CSS rule - it does not require a design overhaul.',
  },
]

export default function MobileAuditPage() {
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
              Mobile Conversion Diagnostics
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg md:text-5xl">
              Mobile Landing Page Audit
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed max-w-2xl">
              When 60–80% of paid ad clicks land on mobile and conversion rates lag desktop, the cause is specific and observable. CTA not visible at 375px. Tap targets under 44px. Desktop-resolution images on a 4G connection. Font sizes triggering iOS zoom. This guide covers each mobile-specific failure with the signal it trips and a bounded fix.
            </p>
          </header>

          {/* Six failure patterns */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Six mobile-specific conversion failures
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

          {/* Signal checklist */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-4">
              What the audit checks on a mobile page
            </h2>
            <p className="text-sm text-fg-muted leading-6 mb-6 max-w-2xl">
              Nebula checks the same 9 signals on every URL. For mobile pages, the signals that fail most often are CTA visibility, tap target size, and viewport configuration. The audit returns pass/fail with the raw value from your page - viewport meta content, image dimensions, font-size declarations - so every finding is verifiable.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { signal: 'CTA visibility', pass: 'Primary CTA visible at 375px without scroll', fail: 'CTA below fold on mobile viewport' },
                { signal: 'Tap targets', pass: 'All interactive elements ≥ 44×44px', fail: 'Variant selectors or icon buttons under 44px' },
                { signal: 'Viewport meta', pass: 'width=device-width, initial-scale=1 present', fail: 'Missing or misconfigured viewport tag' },
                { signal: 'Form friction', pass: 'autocomplete attrs set, type="email" on email inputs', fail: 'No autocomplete, generic input types' },
                { signal: 'Image loading', pass: 'srcset/sizes used, mobile image under 150KB', fail: 'Desktop-resolution image on mobile connection' },
                { signal: 'Font size', pass: 'Body and input text ≥ 16px', fail: 'Text under 16px triggering iOS zoom' },
              ].map((s) => (
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
            <h2 className="text-2xl font-bold text-fg mb-3">Audit your mobile landing page</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Paste your URL. Nebula checks CTA visibility at 375px, tap target sizing, viewport meta configuration, image weight signals, and font size against your actual page - not a template. Free, no signup, under 2 minutes.
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
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">Common questions</h2>
            <div className="space-y-4">
              {faqItems.map(({ q, a }, i) => (
                <div key={i} className="rounded-xl border border-border bg-bg-muted/20 p-5">
                  <h3 className="text-sm font-semibold text-fg mb-2">{q}</h3>
                  <p className="text-sm text-fg-muted leading-6">{a}</p>
                </div>
              ))}
            </div>
          </section>


          <RelatedContent
            heading="Related resources"
            items={[
              { href: '/page-speed-conversion', label: 'Page speed and conversion', type: 'guide' },
            { href: '/mobile-landing-page-optimization', label: 'Mobile optimization guide', type: 'guide' },
            { href: '/ecommerce-landing-page-audit', label: 'Ecommerce landing page audit', type: 'audit-type' },
            { href: '/audit', label: 'Get your free audit', type: 'cta' }
            ]}
          />

        </article>
      </main>
    </>
  )
}
