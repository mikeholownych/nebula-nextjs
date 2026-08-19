import RelatedContent from '@/components/RelatedContent'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Why Is My Landing Page Not Converting? 12 Root Causes (Diagnostic Guide) | Nebula',
  description:
    'The complete diagnostic guide to landing pages getting clicks but no conversions. 12 measurable root causes - message match, above-fold clarity, trust proximity, page speed, mobile UX, form friction - with fixes.',
  alternates: {
    canonical: 'https://nebulacomponents.com/why-is-my-landing-page-not-converting',
  },
  openGraph: {
    title: 'Why Is My Landing Page Not Converting? 12 Root Causes (Diagnostic Guide) | Nebula',
    description:
      'The complete diagnostic guide to landing pages getting clicks but no conversions. 12 measurable root causes with exact checks and fixes.',
    url: 'https://nebulacomponents.com/why-is-my-landing-page-not-converting',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Why Is My Landing Page Not Converting? 12 Root Causes',
  description:
    'Diagnostic guide separating page-level conversion friction from ad targeting, offer economics, and traffic quality. 12 measurable root causes with checks and fixes.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/why-is-my-landing-page-not-converting',
  dateModified: '2026-08-04',
}

const faqItems = [
  {
    q: 'Why am I getting clicks on my ads but zero conversions?',
    a: 'A click proves ad relevance, but conversion depends on post-click continuity. The most common causes are message mismatch between the ad promise and page headline, missing social proof above the fold, mobile rendering bottlenecks, or excessive form fields.',
  },
  {
    q: 'Can an automated audit tell me if my traffic is low quality?',
    a: 'No. An automated page audit evaluates observable DOM and HTML conditions on your public URL. It cannot measure ad account audience selection, search intent, or traffic quality. It surfaces page-level friction candidates so you can rule out page defects first.',
  },
  {
    q: 'What should I fix first if my page is not converting?',
    a: 'First, check message match: ensure your landing page H1 repeats the exact promise made in your ad creative. Second, ensure a clear primary call to action is visible on mobile viewports without scrolling. Third, place verifiable trust signals directly adjacent to the CTA.',
  },
  {
    q: 'What is a good landing page conversion rate?',
    a: 'Across industries, the median landing page conversion rate is roughly 4-5% for top-quartile pages, with the overall average closer to 2-3%. Paid traffic pages should be judged against their own ad spend, not a universal benchmark. If you are at 1% or below with paid traffic, page-level friction is usually the first place to look.',
  },
  {
    q: 'How much does page speed affect conversion rate?',
    a: 'Published research consistently links load time to conversion. For example, Google reports that as page load time goes from 1 to 3 seconds, the probability of bounce increases by roughly 32%. On mobile, 53% of visits are abandoned if a page takes longer than 3 seconds to load. Speed is a conversion factor, not just an SEO factor.',
  },
  {
    q: 'Should I rebuild my landing page or fix what I have?',
    a: 'Rebuild only when the page has a structural problem: the offer itself is unclear, the page is trying to serve multiple audiences, or the underlying technology prevents real fixes. If the page has a solid offer but broken message match, weak trust proximity, or slow load times, targeted fixes will outperform a rebuild and preserve your historical data.',
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
      name: 'Why Is My Landing Page Not Converting',
      item: 'https://nebulacomponents.com/why-is-my-landing-page-not-converting',
    },
  ],
}

const diagnostics = [
  {
    title: 'Message Match Is Broken',
    subtitle: 'The ad promised one thing. The page leads with another.',
    check: 'Open your page beside your active ad creative. Does the H1 repeat the same promise, offer, and core terminology? A headline that says "Transform Your Enterprise Stack" when the ad promised a "Free SaaS Pricing Audit" breaks intent in the first 3 seconds.',
    fix: 'Rewrite the H1 to mirror the ad copy exactly - same offer, same words, same outcome. Do this before touching anything else; it is the highest-leverage fix for paid traffic.',
    signal: 'High bounce in the first 5 seconds (70%+).',
  },
  {
    title: 'The Above-Fold Area Does Not Answer "What Is This?"',
    subtitle: 'Visitors need clarity in the first 600px of vertical space.',
    check: 'On a 1366x768 viewport, can a first-time visitor state what the page offers, who it is for, and what to do next - without scrolling? The fold area should contain: a clear headline, a one-sentence value proposition, a single primary CTA, and one proof signal.',
    fix: 'If any of those four elements is missing above the fold, add it. Remove competing secondary CTAs that split attention.',
    signal: 'Low scroll depth combined with high exit rate.',
  },
  {
    title: 'Trust Signals Are Buried or Missing',
    subtitle: 'Cold paid traffic does not scroll four screens looking for proof.',
    check: 'Within the 100px surrounding your primary CTA, is there a verifiable proof element: client count, rating, testimonial snippet, security badge, or recognizable logo? If your proof is at the bottom of the page, most paid visitors never see it.',
    fix: 'Place one concrete, verifiable proof signal directly adjacent to the CTA - a real number, a named customer, or a rating with a source. Generic "trusted by" logo walls without context do not move cold traffic.',
    signal: 'High scroll depth but no click - visitors read but do not believe.',
  },
  {
    title: 'Page Speed Is Costing You Conversions',
    subtitle: 'Every extra second of load time removes visitors before they see your offer.',
    check: 'Measure the real-world load experience on mobile: Time to First Byte, Largest Contentful Paint, and total page weight. Research consistently shows 3+ second mobile loads lose a majority of visitors.',
    fix: 'Compress images to WebP/AVIF, defer non-critical JavaScript, eliminate render-blocking resources, and reduce DOM node count. A target of under 2.5s LCP on mobile is a reasonable starting point.',
    signal: 'High bounce with very low time-on-page.',
  },
  {
    title: 'Mobile Experience Is an Afterthought',
    subtitle: 'If the page was designed desktop-first, mobile visitors feel it.',
    check: 'Simulate a 375px viewport. Is the CTA visible without scrolling? Are tap targets at least 44px? Does a cookie banner or floating bar cover the button? Is the text legible without zooming?',
    fix: 'Fix viewport overflow, enlarge tap targets, move the CTA into the first screen on mobile, and ensure no fixed element overlays the primary action.',
    signal: 'Mobile traffic bounces at a much higher rate than desktop.',
  },
  {
    title: 'Your CTA Is Ambiguous or Competing',
    subtitle: 'Two CTAs is no CTA.',
    check: 'Count the calls to action on the page. If there are two or more equally weighted buttons - "Get Started", "Learn More", "Contact Us", "View Pricing" - visitors cannot tell which action moves them forward. Also check that the CTA button color contrasts against the page background.',
    fix: 'Choose one primary action per page. Style it with maximum contrast, keep secondary links subtle text links, and make the CTA label specific to the outcome ("Get My Free Audit" beats "Submit").',
    signal: 'Low click rate on the primary button despite high engagement.',
  },
  {
    title: 'Social Proof Is Vague or Generic',
    subtitle: '"Trusted by 100+ companies" is not evidence.',
    check: 'Does your proof include specifics - a named logo, a quantified result, a datapoint with a source? Generic claims without verifiable detail actually reduce trust for skeptical paid traffic.',
    fix: 'Replace vague claims with one specific, verifiable case: "We cut client X\u2019s form abandonment from 61% to 34% in 30 days" with a real page link. One concrete proof outperforms ten generic logos.',
    signal: 'Visitors read the full page but never take action.',
  },
  {
    title: 'Form Friction Is Killing the Finish',
    subtitle: 'Every field is a place to leave.',
    check: 'How many fields does your form require? Are optional fields marked as optional? Is there inline validation or does the visitor find out about errors only after clicking submit? Is privacy communicated near the form?',
    fix: 'Cut fields to the minimum needed to qualify the lead - name and email when possible. Add inline validation, communicate privacy in one line under the button, and use a single-column layout.',
    signal: 'Form started but never submitted (high field-engagement, zero completion).',
  },
  {
    title: 'Objections Are Never Answered',
    subtitle: 'The visitor is ready to leave with a question you did not answer.',
    check: 'List the five biggest objections a skeptical buyer would have about your offer - price, time to result, risk, alternatives, credibility. Is each one answered on the page, or does the page assume the visitor is already convinced?',
    fix: 'Add a compact FAQ block, a risk-reversal statement (refund policy, no-lock-in), or a "how it works" section directly above the final CTA.',
    signal: 'Repeated visits to the same page with no conversion.',
  },
  {
    title: 'You Are Trying to Serve Everyone',
    subtitle: 'A page for every visitor is a page for no one.',
    check: 'Does the headline and value proposition target a specific audience, or does it hedge with "for businesses of all sizes"? Pages that try to appeal to every segment fail to resonate with any segment.',
    fix: 'Pick the highest-value audience segment and make the page speak to them specifically. Use their language, their pain, their outcome. Launch separate pages per segment rather than one diluted page.',
    signal: 'Low conversion across a broad audience with strong individual segment feedback.',
  },
  {
    title: 'No Next Step After the Primary Action',
    subtitle: 'The conversion path ends in a dead end.',
    check: 'What happens after someone clicks the CTA? Does the next page continue the message match? Is there a fallback for visitors who are not ready - a secondary offer, a resource, or a clear exit? A checkout or form page that looks nothing like the landing page can block conversions at the last step.',
    fix: 'Extend message match to the entire post-click path. Keep the same headline promise on the next page. Add a low-friction secondary option (download a guide, watch a demo) for non-ready visitors.',
    signal: 'High CTA click rate but very low final conversion - the leak is downstream.',
  },
  {
    title: 'You Diagnosed the Wrong Layer Entirely',
    subtitle: 'Sometimes the page is fine and the problem is upstream.',
    check: 'Before rebuilding your page, verify the traffic itself: is the keyword or audience in the ad actually matched to the offer? Is the offer competitive on price? Is the creative promise something the page can deliver? An automated page audit cannot measure ad audience quality or market demand.',
    fix: 'Isolate the layer: run a controlled A/B test with a changed headline against your current page. If conversion does not move with the page change, the bottleneck is upstream in targeting, offer, or price - not the DOM.',
    signal: 'Page scores well on every check but conversions stay flat.',
  },
]

export default function WhyNotConvertingPage() {
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
          <header className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
              Conversion Diagnostics
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Why Is My Landing Page Not Converting?
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed">
              When paid traffic brings visitors but no sales or leads, the instinct is to rewrite
              ads or increase campaign budget. Before spending more money on acquisition, diagnose
              the post-click page mechanics that cause visitors to bounce. This guide walks through
              12 measurable root causes - in the order we check them.
            </p>
          </header>

          <section className="mb-12 rounded-md border border-border bg-bg-muted/20 p-6 md:p-8">
            <h2 className="text-xl font-bold text-fg mb-4">The Diagnosis Order Matters</h2>
            <div className="space-y-4 text-sm text-fg-muted leading-relaxed">
              <p>
                A failed conversion event is rarely random. Paid visitors leave landing pages due to
                specific friction points that interrupt their decision sequence. The most common
                pattern we see is this:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-fg-muted">
                <li>
                  <strong className="text-fg">High Bounce Rate (70%+ within 5 seconds):</strong>{' '}
                  Indicates message mismatch. The headline fails to confirm the promise made in the
                  ad.
                </li>
                <li>
                  <strong className="text-fg">High Scroll Depth with Low Clicks:</strong> Indicates
                  weak CTA contrast, competing secondary buttons, or missing risk-reducers near the
                  primary action.
                </li>
                <li>
                  <strong className="text-fg">Mobile Traffic Abandonment:</strong> Viewport
                  overflow, fixed consent banners obscuring buttons, or tap targets smaller than
                  44px.
                </li>
                <li>
                  <strong className="text-fg">Form Start but Zero Submissions:</strong> Excessive
                  field burden, unclear privacy expectations, or missing inline validation.
                </li>
              </ul>
              <p>
                Work through the checklist in the order below. Each step isolates one layer of
                friction. Skip the diagnosis and you risk "fixing" the wrong layer - changing
                headlines when the problem was page speed, or rebuilding a page when the problem
                was audience targeting.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-fg mb-6">The 12 Checks</h2>
            <div className="space-y-8">
              {diagnostics.map((d, i) => (
                <div
                  key={d.title}
                  className="rounded-xl border border-border bg-bg-muted/10 p-6 md:p-8"
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 font-mono text-sm font-bold text-accent">
                      {i + 1}
                    </span>
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-fg">{d.title}</h3>
                        <p className="text-sm text-accent">{d.subtitle}</p>
                      </div>
                      <div className="space-y-2 text-sm text-fg-muted leading-relaxed">
                        <p>
                          <strong className="text-fg">How to check: </strong>
                          {d.check}
                        </p>
                        <p>
                          <strong className="text-fg">What to fix: </strong>
                          {d.fix}
                        </p>
                        <p className="rounded-lg border border-border bg-bg-muted/10 px-3 py-2">
                          <strong className="text-fg">Signal this is your problem: </strong>
                          {d.signal}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-fg mb-4">
              When to Audit vs. When to Rebuild
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <h3 className="font-semibold text-fg mb-2">Audit and Fix</h3>
                <ul className="space-y-2 text-xs text-fg-muted">
                  <li>✓ The offer is clear and competitive</li>
                  <li>✓ The page targets a defined audience</li>
                  <li>✓ The bottleneck is message match, trust, speed, or form friction</li>
                  <li>✓ You want to preserve historical analytics and testing data</li>
                </ul>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                <h3 className="font-semibold text-fg mb-2">Rebuild</h3>
                <ul className="space-y-2 text-xs text-fg-muted">
                  <li>✕ The offer itself is unclear or the page cannot state it</li>
                  <li>✕ The page tries to serve multiple unrelated audiences</li>
                  <li>✕ The technology stack prevents real performance fixes</li>
                  <li>✕ You have no conversion data to lose</li>
                </ul>
              </div>
            </div>
            <p className="mt-4 text-sm text-fg-muted leading-relaxed">
              In practice, fewer than 20% of landing pages we see need a full rebuild. Most need
              targeted fixes in message match, trust proximity, and speed. Rebuilds look productive
              but they reset your measurement history and take 4-6x longer to validate.
            </p>
          </section>

          <section className="mb-12 rounded-md border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">
              Skip the Guessing - Run the 9-Signal Audit
            </h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Nebula&apos;s free landing page audit inspects observable DOM mechanics on your URL -
              headline clarity, CTA contrast, trust proximity, mobile viewport, page weight, and
              more - and returns ranked findings with exact measured values. See our own
              self-audit in the <Link href="/teardowns" className="text-accent hover:underline">teardowns</Link>.
            </p>
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="inline-block rounded bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors text-base"
            >
              Run Free Landing Page Audit &rarr;
            </Link>
          </section>

          <section className="mb-12 border-t border-border pt-12">
            <h2 className="text-2xl font-bold text-fg mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqItems.map((faq) => (
                <div key={faq.q} className="rounded-xl border border-border p-5 bg-bg-muted/10">
                  <h3 className="font-semibold text-fg text-base mb-2">{faq.q}</h3>
                  <p className="text-sm text-fg-muted leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related Diagnostics:</span>
            <Link href="/ads-getting-clicks-but-no-sales" className="hover:text-accent">
              Ads Clicks No Sales
            </Link>
            <Link href="/landing-page-message-match" className="hover:text-accent">
              Message Match Audit
            </Link>
            <Link href="/saas-landing-page-audit" className="hover:text-accent">
              SaaS Audit Guide
            </Link>
            <Link href="/pricing" className="hover:text-accent">
              Repair Sprint Pricing
            </Link>
          </footer>
          <RelatedContent
            heading="Related resources"
            items={[
              { href: '/ads-getting-clicks-but-no-sales', label: 'Ads getting clicks but no sales', type: 'guide' },
            { href: '/landing-page-mistakes', label: 'Common landing page mistakes', type: 'guide' },
            { href: '/landing-page-cta-audit', label: 'Audit your CTA', type: 'audit-type' },
            { href: '/landing-page-trust-signals', label: 'Trust signals that convert', type: 'guide' },
              { href: '/audit', label: 'Get your free audit', type: 'cta' }
            ]}
          />

        </article>
      </main>
    </>
  )
}
