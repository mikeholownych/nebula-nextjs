import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Speed and Conversion: How Load Time Kills Landing Page Performance | Nebula',
  description:
    'Page speed failures kill landing page conversion before the visitor reaches the CTA. LCP over 2.5s, 400KB+ HTML payloads, render-blocking JavaScript, oversized images, and Cumulative Layout Shift each reduce conversion independently. This guide covers every failure with the signal and the fix.',
  alternates: {
    canonical: 'https://nebulacomponents.com/page-speed-conversion',
  },
  openGraph: {
    title: 'Page Speed and Conversion: How Load Time Kills Landing Page Performance | Nebula',
    description:
      'Page speed failures kill landing page conversion before the visitor reaches the CTA. LCP over 2.5s, 400KB+ HTML payloads, render-blocking JavaScript, oversized images, and Cumulative Layout Shift each reduce conversion independently.',
    url: 'https://nebulacomponents.com/page-speed-conversion',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Page Speed and Conversion: How Load Time Kills Landing Page Performance',
  description:
    'Diagnostic guide for page speed conversion failures — LCP thresholds, HTML payload size, render-blocking JavaScript, mobile image sizing, third-party script overhead, and Cumulative Layout Shift.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/page-speed-conversion',
}

const faqItems = [
  {
    q: 'Does page speed actually affect conversion rates?',
    a: "Yes, directly. Google's data shows a 1-second delay in mobile load time reduces conversion rate by up to 20%. The mechanism is abandonment — mobile visitors on variable connections leave pages that take over 3 seconds to show content. The CTA doesn't matter if the visitor left before it loaded.",
  },
  {
    q: 'What is LCP and why is it the most important speed metric for landing pages?',
    a: "LCP (Largest Contentful Paint) measures when the largest visible element — usually the hero image or headline — finishes loading. It's the proxy for 'when did the visitor see something useful'. Google's threshold is 2.5s. Pages above that threshold are penalized in Quality Score for paid ads and in organic rankings.",
  },
  {
    q: 'What is a normal HTML payload size for a marketing landing page?',
    a: "Under 120KB for a marketing landing page. Pages regularly exceed this with inline JSON (product data, pricing tables), server-rendered component trees, and injected script payloads. Calendly's homepage HTML is 1.2MB — 10x the heuristic. The audit measures and reports the raw HTML payload size from the fetched source.",
  },
  {
    q: 'How do third-party scripts affect landing page speed?',
    a: 'Each third-party script (ad pixel, chat widget, review aggregator, A/B test framework) adds a DNS lookup, a connection, and a script execution. Loading four synchronously in the head can add 800ms-2s before the page begins rendering. The fix is to load non-critical scripts asynchronously or defer them after first contentful paint.',
  },
  {
    q: 'What is Cumulative Layout Shift and why does it hurt conversion?',
    a: "CLS measures how much the page layout shifts while loading. When images load without declared width/height attributes, they collapse to zero height and then expand — pushing content down as they load. A visitor targeting the CTA button clicks on something else because the button moved. Google's CLS threshold is 0.1.",
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

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.com' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Page Speed and Conversion',
      item: 'https://nebulacomponents.com/page-speed-conversion',
    },
  ],
}

const SPEED_FAILURES = [
  {
    signal: 'Core Web Vitals',
    label: 'LCP over 2.5s — hero content loads after visitors abandon',
    detail:
      "Largest Contentful Paint above 2.5s is the single most common speed failure on marketing landing pages. The LCP element is typically the hero image or the H1 — the first thing a visitor needs to see to confirm they are in the right place. When it loads after 2.5s, a measurable proportion of visitors have already navigated away. Google's own data shows that moving LCP from 2.4s to 3.3s increases the probability of abandonment by 32%. Paid traffic arriving from ads pays for this delay in wasted CPCs.",
    fix: 'Preload the LCP element with a <link rel="preload"> tag in the document head. If the LCP is an image, serve it in WebP or AVIF at the correct display size. If the LCP is a headline, ensure it is in the static HTML response — not rendered by JavaScript. Run the audit and check the reported LCP value against your actual page.',
  },
  {
    signal: 'HTML Payload',
    label: '400KB+ HTML payload — server-rendered data bloating the document',
    detail:
      "A marketing landing page should have an HTML payload under 120KB. Pages that exceed 400KB typically contain inline JSON objects (product catalogs, pricing tables, feature flags), server-rendered component trees that duplicate API data, and injected script payloads that belong in separate files. Calendly's homepage was observed at 1.2MB of HTML — 10x the heuristic ceiling. Every kilobyte of HTML that the browser must download and parse before rendering the first pixel delays LCP.",
    fix: 'Fetch the raw HTML of your page (curl -s https://yourpage.com | wc -c) and compare it to the 120KB heuristic. Move inline JSON to API routes or edge data sources. Remove server-rendered data that is only consumed client-side. Split large component trees into lazy-loaded sections.',
  },
  {
    signal: 'JavaScript',
    label: 'Render-blocking JS in <head> — page appears blank during execution',
    detail:
      "Synchronous JavaScript tags in the document <head> pause HTML parsing until the script downloads, parses, and executes. A page with three render-blocking scripts in the head — a tag manager, an A/B testing framework, and an analytics library — can appear completely blank for 1-3 seconds before the browser renders any visible content. This blank period is the highest-abandonment moment on any page. Visitors who see nothing assume the page is broken.",
    fix: "Add async or defer attributes to all non-critical JavaScript. Scripts that do not need to run before first paint — analytics, chat widgets, retargeting pixels — should be deferred. The only scripts that belong synchronously in <head> are those that must execute before the browser draws anything (e.g. a theme-injection script that prevents flash of wrong color).",
  },
  {
    signal: 'Image Sizing',
    label: '1200px images served to 375px mobile viewports',
    detail:
      "A hero image exported at 1200px width served to a mobile visitor on a 375px viewport transfers 3-4x more data than necessary. This compounds on slow mobile connections: a 400KB desktop image that should be a 90KB mobile image adds 310KB of unnecessary transfer. Multiply by the 60-70% of paid traffic that arrives on mobile and the cumulative wasted bandwidth is substantial. The browser still has to download, decode, and scale the full-resolution image before displaying it.",
    fix: 'Implement responsive images with srcset and sizes attributes. Serve WebP or AVIF variants. Use a CDN that supports on-the-fly resizing, or generate explicitly sized variants at 375px, 768px, and 1200px. The img element should declare width and height attributes to prevent layout shift during load.',
  },
  {
    signal: 'Third-Party Scripts',
    label: 'Synchronous ad pixels and chat widgets adding 200-800ms per script',
    detail:
      "Each synchronous third-party script adds a full DNS lookup, TCP connection, TLS handshake, HTTP request, and script execution to the critical rendering path. A page loading a Facebook pixel, a Google Tag Manager container, a Drift chat widget, and an Optimizely A/B test framework synchronously in the head is performing 4 sets of these operations before rendering anything visible. In-field measurement shows this pattern adding 800ms-2s of blank-page time on median mobile connections.",
    fix: 'Audit your network waterfall for third-party scripts loading in the head. Defer all non-critical scripts (chat, A/B testing, review aggregators) to load after DOMContentLoaded or first user interaction. Load ad pixels via Google Tag Manager with async enabled rather than inline script tags. Every deferred script recaptures the 200-800ms it was costing.',
  },
  {
    signal: 'Core Web Vitals',
    label: 'CLS from images without declared dimensions — CTAs shift on load',
    detail:
      "Images without declared width and height attributes cause the browser to allocate zero height for the image until it loads, then shift the layout as the image expands to its actual dimensions. On a page where the CTA button sits below an undimensioned hero image, the button's position on screen changes as the image loads. A visitor who has positioned their finger over the CTA taps something else because the layout shifted 200px downward during load. Google's CLS threshold is 0.1; pages with multiple undimensioned images routinely score 0.3-0.8.",
    fix: 'Add explicit width and height attributes to all img elements — including hero images, logo images, and testimonial avatars. Set aspect-ratio in CSS as a fallback for responsive images. For above-the-fold images, use a CSS aspect-ratio container to reserve the correct space before the image loads.',
  },
]

export default function PageSpeedConversionPage() {
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
              Page Speed &amp; Conversion
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg md:text-5xl">
              Page Speed and Conversion
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed max-w-2xl">
              Speed failures eliminate conversion before the visitor reaches the CTA. LCP over 2.5s. HTML payloads that should be API calls. Render-blocking scripts that hold the page blank while executing. Desktop-resolution images on mobile viewports. Each failure has a measurable, observable cause — and a bounded fix.
            </p>
          </header>

          {/* Six failure patterns */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Six page speed conversion failures
            </h2>
            <div className="space-y-4">
              {SPEED_FAILURES.map((f, i) => (
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
              What the audit checks for page speed
            </h2>
            <p className="text-sm text-fg-muted leading-6 mb-6 max-w-2xl">
              Nebula measures page speed signals from the raw fetched source and reports each value against the heuristic threshold. The findings reference your actual page — not a simulated environment.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { signal: 'LCP', pass: 'Largest Contentful Paint under 2.5s', fail: 'LCP over 2.5s — hero element loads after abandonment window' },
                { signal: 'HTML Payload', pass: 'Raw HTML under 120KB', fail: '400KB+ payload — inline data bloating the document' },
                { signal: 'JS Blocking', pass: 'No synchronous scripts in <head>', fail: 'Render-blocking scripts hold page blank during execution' },
                { signal: 'Image Sizing', pass: 'Responsive images with srcset — mobile variant served to mobile', fail: '1200px image served to 375px viewport' },
                { signal: 'Third-Party Scripts', pass: 'Non-critical scripts deferred or async', fail: 'Synchronous ad pixels and widgets in critical path' },
                { signal: 'CLS', pass: 'All images have declared dimensions — CLS below 0.1', fail: 'Undimensioned images cause layout shift — CTAs move on load' },
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
          <section className="mb-14 rounded-2xl border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">Audit your page speed</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Paste your URL. Nebula measures LCP, HTML payload size, render-blocking scripts, and CLS against your actual page — not a simulation. Free, no signup, under 2 minutes.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-base"
            >
              Run Free Speed Audit &rarr;
            </Link>
            <p className="mt-3 text-xs text-fg-muted">No credit card required — results in under 2 minutes</p>
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

          {/* Related */}
          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related audits:</span>
            <Link href="/saas-landing-page-audit" className="hover:text-accent transition-colors">SaaS Landing Page Audit</Link>
            <Link href="/ecommerce-landing-page-audit" className="hover:text-accent transition-colors">Ecommerce Audit</Link>
            <Link href="/lead-generation-landing-page-audit" className="hover:text-accent transition-colors">Lead Gen Audit</Link>
            <Link href="/why-is-my-landing-page-not-converting" className="hover:text-accent transition-colors">Landing Page Diagnostics</Link>
            <Link href="/ads-getting-clicks-but-no-sales" className="hover:text-accent transition-colors">Clicks But No Sales</Link>
            <Link href="/pricing" className="hover:text-accent transition-colors">Repair Sprint Pricing</Link>
          </footer>

        </article>
      </main>
    </>
  )
}
