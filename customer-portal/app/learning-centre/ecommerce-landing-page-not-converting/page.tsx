import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Ecommerce Landing Page Not Converting: Fix These 5 Leaks First | Nebula Components',
  description:
    'Low conversion on an ecommerce landing page almost always comes down to 5 fixable structural issues. Diagnose which one is costing you customers before running more ads.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/ecommerce-landing-page-not-converting',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Ecommerce Landing Page Not Converting: Fix These 5 Leaks First',
  description:
    'Low conversion on an ecommerce landing page almost always comes down to 5 fixable structural issues. Diagnose which one is costing you customers before running more ads.',
  url: 'https://nebulacomponents.shop/learning-centre/ecommerce-landing-page-not-converting',
  publishedDate: '2026-07-16',
  modifiedDate: '2026-07-21',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a good conversion rate for an ecommerce landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "There is no single benchmark — conversion rate varies significantly by traffic source, product category, price point, and whether the visitor is cold or warm. WordStream's 2026 analysis places the all-industries average Google Ads conversion rate at 8.18%, but ecommerce product pages receiving paid social traffic typically convert lower because the audience is colder and the product requires more consideration. A more useful benchmark is your own historical rate by traffic source and device. If paid social traffic to a product page converts at under 1% with significant volume, the page has a structural problem worth diagnosing before adding more budget.",
      },
    },
    {
      '@type': 'Question',
      name: 'Why do ecommerce ads get clicks but no purchases?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "The most common causes: (1) the landing page does not match the ad promise — the visitor expected a specific product or offer and landed on a generic category or homepage; (2) no social proof is visible before the add-to-cart CTA — no reviews, no star rating, no indication that others have purchased; (3) shipping cost is hidden until checkout, creating a price surprise that causes abandonment; (4) mobile layout is broken — the add-to-cart button is not visible above the fold on a phone, or images are cut off; (5) page load is slow — Portent's 2022 analysis of 100+ million page views found conversion rate drops significantly as page load time increases beyond 1 second. Start with mobile layout and load time — both affect the majority of paid social traffic.",
      },
    },
    {
      '@type': 'Question',
      name: 'How do I reduce ecommerce cart abandonment?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Baymard Institute research consistently finds average cart abandonment rates around 70%. The most actionable causes they identify: unexpected costs at checkout (shipping, tax), being forced to create an account, overly complicated checkout process, and security concerns. The three highest-leverage fixes before checkout: (1) show shipping cost and estimated delivery date on the product page — before the visitor adds to cart; (2) display trust badges (payment icons, security seals, guarantee text) near the add-to-cart button; (3) surface your return policy clearly near the price. Visitors who know the total cost, delivery timeline, and return terms before they add to cart abandon at a meaningfully lower rate.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do product page reviews really increase conversion rate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. Research from the Spiegel Research Center (Northwestern University, 2017) found that displaying reviews can increase conversion rate by up to 270% for lower-priced products. The effect is strongest when: reviews are displayed prominently near the product price (not buried below), the review count is visible ('247 reviews' not just a star average), and recent reviews are shown (recency signals that the product is still actively purchased). For new products with few reviews, a small number of specific, detailed reviews outperforms a large number of generic ones.",
      },
    },
    {
      '@type': 'Question',
      name: 'Is my ecommerce conversion problem the price or the page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Segment your analytics before testing price. If your add-to-cart rate is low (visitors are not even reaching the cart), the problem is above the fold — product images, headline, or proof. If add-to-cart rate is healthy but purchase rate is low, the problem is at checkout — shipping cost reveal, form friction, or trust signals at payment. If both rates are low on mobile but healthy on desktop, the problem is mobile layout or mobile load time, not price. Only test price after the page structure is clean — a lower price on a broken page still fails.',
      },
    },
  ],
}

export default function EcommerceLandingPageNotConverting() {
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
              Industry Specific · Ecommerce
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Ecommerce Landing Page Not Converting? Fix These 5 Leaks First
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              Low conversion on a product page is almost always one of five structural
              problems — not the product, not the price, and not the ad targeting. Diagnosing
              which leak is active tells you exactly where to spend the next hour. Running
              more ad budget before the diagnosis gives you more traffic at the same broken rate.
            </p>
          </div>

          {/* The conversion sequence */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              How the ecommerce conversion sequence works — and where it breaks
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Every product page visit passes through the same sequence before it either
              converts or exits. The sequence is: arrive → read → trust → decide →
              add-to-cart → checkout. Each stage gates the next. A visitor who does not
              trust the page does not decide. A visitor who decides but cannot find the
              CTA does not add to cart. A visitor who abandons during checkout never
              purchased — but the page already lost them earlier.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              The diagnostic question is: at which stage are you losing them? Analytics
              can answer this:
            </p>
            <ul className="mt-4 space-y-3">
              {[
                {
                  metric: 'High bounce rate (under 15 seconds on page)',
                  stage: 'Arrive → Read failure',
                  cause: 'Page does not match the ad, images are slow to load, or the product is immediately wrong for the visitor',
                },
                {
                  metric: 'Low add-to-cart rate (under 3% of sessions)',
                  stage: 'Trust → Decide failure',
                  cause: 'No social proof visible, unclear value proposition, or pricing perceived as too high without justification',
                },
                {
                  metric: 'High cart abandonment (over 70%)',
                  stage: 'Decide → Checkout failure',
                  cause: 'Surprise shipping cost, forced account creation, or checkout form friction',
                },
                {
                  metric: 'Mobile conversion 50%+ below desktop',
                  stage: 'Cross-cutting mobile failure',
                  cause: 'Broken mobile layout, slow LCP on mobile, or CTA not visible above fold on phone',
                },
              ].map(({ metric, stage, cause }) => (
                <li key={metric} className="rounded-xl border border-border p-4">
                  <p className="font-semibold text-fg text-sm">{metric}</p>
                  <p className="text-xs text-accent font-medium mt-0.5">{stage}</p>
                  <p className="text-sm leading-relaxed text-fg-muted mt-1">{cause}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* 5 leaks */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              The 5 ecommerce landing page leaks
            </h2>
            <div className="space-y-6">
              {[
                {
                  n: '1',
                  title: 'No social proof visible above the add-to-cart CTA',
                  detail:
                    'Research from the Spiegel Research Center (Northwestern University, 2017) found that displaying reviews can increase conversion rate by up to 270% for lower-priced products. For ecommerce, this effect is most pronounced when the review count and star average are visible near the product price — not in a separate reviews section scrolled below.',
                  fix: 'Surface your review count and star average above the fold, next to the price. If you have fewer than 10 reviews, feature the most specific one (with result detail) as a quote near the CTA. Generic "Great product!" reviews provide no signal. Specific "I\'ve had this for 6 months, the stitching held up after 40 washes" reviews reduce risk.',
                },
                {
                  n: '2',
                  title: 'Shipping cost hidden until checkout',
                  detail:
                    "Baymard Institute's large-scale research on cart abandonment consistently identifies unexpected costs at checkout — primarily shipping — as the single leading cause of abandonment. Visitors who discover the true total cost at checkout feel deceived. Even when the shipping cost is reasonable, the surprise creates friction that a pre-disclosed cost would not.",
                  fix: 'Show shipping cost and estimated delivery date on the product page, near the price and add-to-cart button. If shipping is free above a threshold, state it explicitly: "Free shipping on orders over $X." If you offer free shipping, make it the most visible element on the page. Visitors who know the total cost before adding to cart abandon at a meaningfully lower rate.',
                },
                {
                  n: '3',
                  title: 'Mobile add-to-cart not visible above the fold',
                  detail:
                    'The majority of paid social traffic arrives on mobile. On a standard 844px iPhone viewport with a 72px nav, the visible area is approximately 770px. A product image at 400px + product name + star rating + price already consumes most of that. If the add-to-cart button sits below those elements, it is off-screen — requiring a scroll that a significant portion of visitors will not make.',
                  fix: 'Test your product page on a real phone at 390px width. If the add-to-cart CTA is not visible without scrolling, implement a sticky add-to-cart bar that follows the user as they scroll. Alternatively, compress the above-fold layout: reduce hero image height, tighten spacing, and position the price + CTA before the reviews and description.',
                },
                {
                  n: '4',
                  title: 'Slow mobile load time',
                  detail:
                    "Portent's 2022 analysis of over 100 million page views found that B2B lead-gen pages loading in 1 second convert at approximately 3× the rate of pages loading in 5 seconds. The pattern holds for ecommerce: a visitor who abandons during load is recorded as a bounce before they saw any product information. Google's Core Web Vitals defines LCP (Largest Contentful Paint) under 2.5 seconds as good and above 4 seconds as poor. Most ecommerce product pages with full-resolution hero images fail the mobile LCP threshold.",
                  fix: 'Run your product page URL through Google PageSpeed Insights (pagespeed.web.dev) on the mobile preset. Note the LCP element — it is almost always the hero product image. Serve it as WebP or AVIF instead of JPEG/PNG, add a `sizes` attribute so mobile devices download a smaller version, and add `fetchpriority="high"` to the hero image element. This typically reduces LCP by 40–60%.',
                },
                {
                  n: '5',
                  title: 'No clear return policy near the purchase decision',
                  detail:
                    "For first-time buyers, purchase anxiety peaks at the add-to-cart moment. The visitor is weighing: what if this is wrong? What if it breaks? What if I need to return it? If your return policy is buried in the footer or on a separate page, this anxiety goes unanswered at the exact moment of decision. The visitor leaves rather than risk the unknown.",
                  fix: 'Add a one-line return policy statement near the add-to-cart button. Example: "30-day returns, no questions asked." or "Free returns on all orders." This does not require a full policy — just enough to neutralise the risk concern at the moment it is highest. Add a trust badge row (payment icons, security seal, return policy icon) immediately below the CTA.',
                },
              ].map(({ n, title, detail, fix }) => (
                <div key={n} className="rounded-xl border border-border p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">
                    Leak {n}
                  </p>
                  <h3 className="text-lg font-bold text-fg">{title}</h3>
                  <p className="mt-3 leading-relaxed text-fg-muted">{detail}</p>
                  <div className="mt-4 rounded-lg bg-accent/5 border border-accent/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">Fix</p>
                    <p className="text-sm leading-relaxed text-fg-muted">{fix}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Is it price or page */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              How to tell if it is a price problem, not a page problem
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Price testing is expensive — it takes time to gather sufficient data and carries
              risk of training visitors to wait for discounts. Run this diagnosis before
              changing price:
            </p>
            <div className="mt-5 space-y-4">
              {[
                {
                  signal: 'Low add-to-cart rate + no reviews',
                  diagnosis: 'Fix proof before testing price. Visitors are not converting because they do not trust the product — not because the price is wrong. A lower price on an untrusted page still fails.',
                },
                {
                  signal: 'Healthy add-to-cart rate + low purchase rate',
                  diagnosis: 'This is a checkout problem, not a price problem. The visitor valued the product enough to add it. Something at checkout — shipping reveal, form friction, or payment trust — broke the chain.',
                },
                {
                  signal: 'High add-to-cart rate + low purchase rate + competitor prices meaningfully lower',
                  diagnosis: 'This is a genuine price signal. The page is working; the offer is not competitive. Test a price adjustment or add value to the bundle before discounting.',
                },
                {
                  signal: 'Healthy conversion on desktop + poor conversion on mobile',
                  diagnosis: 'This is a mobile layout or mobile load time problem. Price is identical across devices. Fix mobile first.',
                },
              ].map(({ signal, diagnosis }) => (
                <div
                  key={signal}
                  className="border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <p className="font-semibold text-fg text-sm">{signal}</p>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">{diagnosis}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick wins before next ad spend */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              5 quick wins before the next ad spend
            </h2>
            <p className="leading-relaxed text-fg-muted">
              These changes can be live within an hour on most ecommerce platforms. Each
              addresses one of the 5 leaks above:
            </p>
            <ol className="mt-5 space-y-3">
              {[
                'Add review count and star average above the fold, next to the product price — not in a separate reviews tab',
                'Add a shipping cost line or "Free shipping on orders over $X" badge immediately above or below the add-to-cart button',
                'Open the page on a real phone and confirm the add-to-cart button is visible without scrolling — if not, implement a sticky CTA bar',
                'Run Google PageSpeed Insights mobile and check LCP — if above 4s, compress the hero image to WebP and add fetchpriority="high"',
                'Add a one-line return policy statement directly below the add-to-cart button: "30-day free returns" neutralises purchase anxiety at the decision point',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-fg-muted text-sm">
                  <span className="shrink-0 font-bold text-accent">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
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
              Find which leak is on your product page
            </h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              The free Nebula audit checks all 7 signals — including proof placement,
              mobile layout, and load time — against your actual landing page URL. The
              $97 Fix Pack implements every finding within 48 hours.
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
                { href: '/learning-centre/mobile-landing-page-leaks', label: 'Mobile Landing Page Leaks That Kill Paid Traffic' },
                { href: '/learning-centre/landing-page-not-converting', label: 'Landing Page Not Converting? Diagnose These 5 Leaks First' },
                { href: '/learning-centre/google-ads-clicks-no-sales', label: 'Google Ads Clicks But No Sales: Check The Page' },
                { href: '/learning-centre/proof-before-cta', label: 'Proof Before CTA: The Ordering Rule That Lifts Conversions' },
                { href: '/learning-centre/before-you-raise-ad-budget', label: 'Before You Raise Ad Budget: Fix The Leaks First' },
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
