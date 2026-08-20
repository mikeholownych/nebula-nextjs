import RelatedContent from '@/components/RelatedContent'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ecommerce Landing Page Audit: Fix Product Page Leaks | Nebula',
  description:
    'DTC product pages receiving paid Meta and Google traffic fail for specific, observable reasons: product-name H1s, price buried below fold, CTA competing with wishlist, no social proof adjacent to buy button. This guide covers each failure with evidence and a bounded fix.',
  alternates: {
    canonical: 'https://nebulacomponents.com/ecommerce-landing-page-audit',
  },
  openGraph: {
    title: 'Ecommerce Landing Page Audit: Fix Product Page Leaks | Nebula',
    description:
      'DTC product pages receiving paid Meta and Google traffic fail for specific, observable reasons: product-name H1s, price buried below fold, CTA competing with wishlist, no social proof adjacent to buy button.',
    url: 'https://nebulacomponents.com/ecommerce-landing-page-audit',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Ecommerce Landing Page Audit: H1 Clarity, Price Visibility & CTA Focus for Product Pages',
  description:
    'Diagnostic guide for DTC ecommerce product pages receiving paid traffic - headline framing, price and shipping visibility, social proof placement, CTA hierarchy, mobile image usability, and load speed.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/ecommerce-landing-page-audit',
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.com' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Ecommerce Landing Page Audit',
      item: 'https://nebulacomponents.com/ecommerce-landing-page-audit',
    },
  ],
}

const faqItems = [
  {
    q: 'Why does my product page get clicks but no add-to-carts?',
    a: 'Three causes account for most cases: price + shipping not visible before the CTA, no social proof adjacent to the buy button, and a CTA that competes with secondary actions like wishlist or compare. Each is observable in the page HTML.',
  },
  {
    q: 'Should the price be above the fold on an ecommerce landing page?',
    a: "Yes. Cold paid traffic from an ad hasn't been warmed up to price anchoring. Hiding the price (or showing it only after variant selection) adds a qualification step the visitor didn't ask for. Visible price + shipping estimate above the fold reduces the surprise at checkout.",
  },
  {
    q: 'How many reviews do I need above the fold to improve conversion?',
    a: "One prominent aggregate (e.g., '4.8 stars · 2,340 reviews') placed directly below the product headline outperforms zero proof. The count matters more than the prose - visitors use the number as a proxy for adoption risk.",
  },
  {
    q: 'Does product image quality affect conversion?',
    a: 'Directly. On mobile, a single compressed hero image with no zoom or alt-angle views forces the visitor to trust the product on one frame. High-res images with at least 3 angles, rendered above fold on mobile, reduce perceived purchase risk.',
  },
  {
    q: 'What is the biggest CTA mistake on product pages?',
    a: "Running 3-4 actions at equal visual weight - Add to Cart, Add to Wishlist, Compare, Share - so the visitor can't identify the primary action. One primary CTA, high contrast, full-width on mobile. Everything else secondary or removed.",
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

const ECOMMERCE_FAILURES = [
  {
    signal: 'Headline (H1)',
    label: 'Product name as H1 instead of outcome or benefit',
    detail:
      "Most product pages set the H1 to the product SKU or name - 'Blue Linen Shirt' - which tells a visitor what the product is called, not why it solves their problem. Cold paid traffic arriving from an ad that promised a specific benefit expects the page headline to confirm that benefit immediately. A product-name H1 is a mismatch between the ad promise and the landing page confirmation.",
    fix: "Reframe the H1 around the buyer's outcome. 'The linen shirt that breathes - even in August' communicates the benefit and extends the ad's promise. The product name can appear as a subtitle or in the breadcrumb. Test the new H1 against the exact ad copy that drove the click.",
  },
  {
    signal: 'Social proof',
    label: 'Star ratings hidden below fold or absent',
    detail:
      'Cold ad traffic has no prior relationship with the brand. The aggregate review score - stars and count - is the fastest available signal that other buyers have evaluated the purchase risk already. Pages that place reviews below the product description, or surface them only after clicking a tab, are withholding the single most-read trust signal at the moment it is most needed.',
    fix: "Place the aggregate rating (e.g., '4.8 stars · 2,340 reviews') directly below the product H1, before the price or variant selector. The count is more important than the text. Link it to the reviews section so the number is verifiable.",
  },
  {
    signal: 'Above the fold',
    label: 'Price not visible before scroll - shipping buried at checkout',
    detail:
      "Two pricing surprises hurt ecommerce conversions: the price appearing only after variant selection, and the shipping cost appearing only at checkout. Both are friction patterns that require the visitor to commit additional steps before receiving information they need to make a purchase decision. Paid traffic is already costly - the visitor's first qualification question is almost always 'how much is this?'",
    fix: 'Display the price - including a shipping estimate or free shipping threshold - above the fold, before the Add to Cart button. If shipping varies, show the range or the free shipping threshold. Do not defer this information to checkout.',
  },
  {
    signal: 'CTA',
    label: "'Add to Cart' competing with 'Save to Wishlist' and 'Compare' at equal visual weight",
    detail:
      "Product pages frequently present 3-4 actions - Add to Cart, Save to Wishlist, Compare, Share - at identical size, color, and position. A visitor who cannot immediately identify the primary action is not deciding to buy - they are deciding which button to interpret. Decision paralysis on a CTA is a design failure, not a visitor failure.",
    fix: 'One primary CTA, high contrast, full-width on mobile. Wishlist, Compare, and Share become icon buttons or links - smaller, muted, never competing visually with the buy action. The hierarchy of visual weight should match the hierarchy of business intent.',
  },
  {
    signal: 'Mobile',
    label: 'Image gallery requiring pinch-zoom - variant selectors under 44px',
    detail:
      'On mobile, a product gallery that requires pinch-to-zoom to see detail signals that the page was not designed for the device the visitor is using. Simultaneously, variant selector buttons - size, color, material - on most Shopify themes are rendered at 32–38px touch targets, below the 44px minimum required for reliable tap interaction. Both failures compound on the same page.',
    fix: 'Implement swipeable gallery with at least 3 angles natively navigable by swipe - no zoom required to see product detail. Render variant selectors at minimum 44×44px with visible selected state. Test on a 375px viewport before shipping.',
  },
  {
    signal: 'Load speed',
    label: 'Product pages with 8-12 JS bundles delay LCP past 4s on mobile',
    detail:
      "Shopify's default themes load 8–12 JavaScript bundles on product pages - reviews widgets, chat plugins, upsell apps, loyalty programs - each blocking or competing for render bandwidth. On a median 4G connection, LCP for these pages exceeds 4 seconds. Google's threshold for good LCP is 2.5s. Pages above 4s lose a measurable share of mobile visitors before the page is usable.",
    fix: 'Audit active Shopify apps and remove any whose JS loads on the product page but provides no above-fold value. Defer non-critical scripts. Target LCP under 2.5s on simulated 4G in Chrome DevTools. Each app removed from the bundle reduces the LCP window.',
  },
]

export default function EcommerceAuditPage() {
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
              DTC Ecommerce Conversion
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg md:text-5xl">
              Ecommerce Landing Page Audit
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed max-w-2xl">
              Product pages receiving paid Meta and Google traffic fail for specific, observable reasons. Product-name H1s where the benefit should be. Price and shipping hidden until checkout. A buy button that competes with three other actions at equal weight. This guide covers each failure pattern with the signal it trips and a bounded fix.
            </p>
          </header>

          {/* Six failure patterns */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Six ecommerce-specific conversion failures
            </h2>
            <div className="space-y-4">
              {ECOMMERCE_FAILURES.map((f, i) => (
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
              What the audit checks on an ecommerce product page
            </h2>
            <p className="text-sm text-fg-muted leading-6 mb-6 max-w-2xl">
              Nebula checks the same 9 signals on every URL. For ecommerce pages, the signals that fail most often are headline framing, social proof placement, and CTA hierarchy. The audit returns pass/fail with the raw value from your page - H1 text, CTA label, review markup presence - so every finding is verifiable.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { signal: 'Headline (H1)', pass: 'H1 states an outcome or benefit', fail: 'H1 is the product name or SKU' },
                { signal: 'Social proof', pass: 'Aggregate rating visible before Add to Cart', fail: 'Reviews below fold or absent' },
                { signal: 'Price visibility', pass: 'Price + shipping estimate above fold', fail: 'Price hidden until variant selected or checkout' },
                { signal: 'CTA', pass: 'Single primary action at full visual weight', fail: 'Buy button at equal weight to wishlist/compare' },
                { signal: 'Mobile', pass: 'Gallery swipeable, variant selectors ≥ 44px', fail: 'Pinch-zoom required, tap targets under 44px' },
                { signal: 'Load speed', pass: 'LCP < 2.5s on simulated 4G', fail: '8+ JS bundles pushing LCP past 4s' },
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
            <h2 className="text-2xl font-bold text-fg mb-3">Audit your product landing page</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Paste your product URL. Nebula checks H1 framing, price visibility, social proof placement, CTA hierarchy, and load speed against the actual page HTML - not a template. Free, no signup, under 2 minutes.
            </p>
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="inline-block rounded bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors text-base"
            >
              Run Free Ecommerce Audit &rarr;
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
              { href: '/saas-landing-page-audit', label: 'SaaS landing page audit', type: 'audit-type' },
            { href: '/mobile-landing-page-audit', label: 'Mobile landing page audit', type: 'audit-type' },
            { href: '/landing-page-trust-signals', label: 'Trust signals that convert', type: 'guide' },
            { href: '/audit', label: 'Get your free audit', type: 'cta' }
            ]}
          />

        </article>
      </main>
    </>
  )
}
