import RelatedContent from '@/components/RelatedContent'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Landing Page CTA Optimization: Fix Weak Buttons That Block Conversions | Nebula',
  description:
    'Most landing page CTAs fail for one of six reasons: vague label, wrong placement, visual competition, low contrast, no friction removal, or dead hover state. This guide covers each pattern with a bounded fix.',
  alternates: {
    canonical: 'https://nebulacomponents.com/cta-optimization',
  },
  openGraph: {
    title: 'Landing Page CTA Optimization: Fix Weak Buttons That Block Conversions | Nebula',
    description:
      'Most landing page CTAs fail for one of six reasons: vague label, wrong placement, visual competition, low contrast, no friction removal, or dead hover state.',
    url: 'https://nebulacomponents.com/cta-optimization',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const faqItems = [
  {
    q: 'What is the best CTA text for a landing page?',
    a: "Action verb + specific outcome. 'View the Evidence-Backed Audit Status' outperforms 'Submit' because it tells the visitor exactly what they get and how fast. The verb should match the commitment level - 'Get' for free offers, 'Start' for trials, 'Buy' only when trust is already established.",
  },
  {
    q: 'How many CTAs should a landing page have?',
    a: 'One primary CTA phrase, repeated consistently. Hero CTA, sticky bar CTA, and bottom-of-page CTA should all use the exact same words. Multiple different CTA phrases create decision friction and reduce conversion.',
  },
  {
    q: 'Where should the CTA button go on a landing page?',
    a: "Above the fold (visible without scrolling), in any sticky nav or bar, and again at the bottom of the page. If a visitor has to scroll to find your first CTA, you're losing conversions before they start.",
  },
  {
    q: 'Why does CTA button color matter?',
    a: "Contrast beats brand color. Your CTA button should stand out from the background - high contrast, not matching the page palette. Green or amber on dark backgrounds outperform grey or navy. Test with the squint test: blur your eyes at the page; the CTA should still be obvious.",
  },
]

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Landing Page CTA Optimization: Fix Weak Buttons That Block Conversions',
  description:
    'Diagnostic guide covering the six most common CTA failures on landing pages - vague labels, buried placement, visual competition, low contrast, missing friction removal, and dead hover states - with a bounded fix for each.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/cta-optimization',
}

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
      name: 'CTA Optimization',
      item: 'https://nebulacomponents.com/cta-optimization',
    },
  ],
}

const CTA_FAILURES = [
  {
    signal: 'CTA Text',
    label: "Label: 'Submit' - no outcome stated, describes the action not the result",
    detail:
      "'Submit', 'Learn More', and 'Get Started' all describe what the visitor does, not what they get. A visitor reading 'Submit' has no idea what changes after the click. The CTA label is the last line of your value proposition - it should confirm the specific result the visitor is about to receive. Generic labels create hesitation at exactly the moment you need commitment.",
    fix: "Replace the action verb with an outcome phrase. 'View the Evidence-Backed Audit Status' tells the visitor what they get and how fast. 'Start My Free Trial' confirms the offer type. Format: [action verb] + [specific result]. The fix takes 30 seconds to deploy and is measurable in the first 100 sessions.",
  },
  {
    signal: 'Placement',
    label: 'Buried below fold - visible only after scrolling, cold ad traffic never gets there',
    detail:
      "Cold ad traffic arrives with 3–5 seconds of intent. A visitor from a paid ad who lands on your page has not opted in to read your full narrative - they are evaluating whether to stay. If the first CTA requires scrolling, that visitor has already made their exit decision before they see the action you want them to take. Pages with hero sections that lead with background video, long taglines, or icon rows routinely bury the primary CTA below 800px.",
    fix: "Place the primary CTA inside the first viewport - no scroll required. For most landing pages this means the hero section: headline, one-sentence value statement, and CTA button, all above the fold. Verify with a browser viewport set to 768px height (median laptop screen).",
  },
  {
    signal: 'Visual Hierarchy',
    label: '3–4 equal-weight actions competing - visitor faces paralysis, not a decision',
    detail:
      "Multiple CTAs at equal visual weight - 'Start Free Trial', 'Book a Demo', 'Watch Video', 'See Pricing' - split visitor attention. Each additional option reduces the probability that any single one gets clicked. The heuristic is Hick's Law: decision time scales with the number of choices. For cold traffic, one dominant CTA with everything else visually subordinate converts better than a row of equal options.",
    fix: "Choose one primary CTA for the hero. Secondary options (demo link, pricing anchor) can live in the nav or below the fold at a lower visual weight - smaller text, ghost button, or plain link. The primary CTA should be the only filled button in the hero.",
  },
  {
    signal: 'Visual Design',
    label: 'Low contrast - button color blends into the background, invisible at a glance',
    detail:
      "A CTA button that matches the page's color palette disappears into the layout. This happens most often when designers use the brand primary color for both background elements and the CTA - the button earns no separation. The squint test is the fastest diagnostic: blur your eyes at the page. If the CTA button is not the first element your eye lands on, the contrast is insufficient. Dark pages with dark-green CTAs are the most common offender.",
    fix: "The CTA button should be the highest-contrast element in the hero. On dark backgrounds, a bright accent - white, amber, or high-saturation green - outperforms a brand-tinted dark button. Run the squint test after every design change: the button should still be obvious when the page is visually blurred.",
  },
  {
    signal: 'Trust Signals',
    label: "No friction removal - CTA stands alone with no 'no card required' or time estimate adjacent",
    detail:
      "The moment a visitor considers clicking, objections activate: 'Do I need a credit card?', 'How long will this take?', 'Am I committing to something?' A CTA with no adjacent reassurance forces visitors to resolve these objections on their own - most don't. A single line of micro-copy beneath the button ('No card required · Results in 2 minutes') handles the two most common objections at the point of peak intent.",
    fix: "Add one friction-removal line directly below the primary CTA button. Name the barrier your ICP is most likely to hesitate on - for free tools, it's credit card concern; for audits and reports, it's time commitment. Keep it under 8 words.",
  },
  {
    signal: 'Interaction Design',
    label: 'Generic hover state - no visual confirmation the button responds to interaction',
    detail:
      "A CTA button with no hover or focus state looks static - it does not signal that the element is interactive. This matters most for first-time visitors on desktop, who move their cursor over the button before clicking. A static button creates a half-second of uncertainty ('Is this clickable?') that breaks the micro-commitment arc. It also fails WCAG 2.1 AA focus-visible requirements for keyboard navigation.",
    fix: "Add a visible transition on hover and focus: background color shift, slight scale (scale-[1.02]), or shadow change. The transition should complete in 150–200ms. Ensure the focus ring is visible for keyboard users - this is a compliance requirement, not optional polish.",
  },
]

export default function CtaOptimizationPage() {
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
              CTA Conversion
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg md:text-5xl">
              Landing Page CTA Optimization
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed max-w-2xl">
              A weak CTA - &apos;Submit&apos;, &apos;Learn More&apos;, &apos;Get Started&apos; - leaves the visitor guessing what happens next. Vague CTAs are the second-most common conversion killer after weak headlines. The fix is specific: name the action and the outcome in the button text, place it above the fold, and remove the two objections visitors always have before clicking.
            </p>
          </header>

          {/* Six failure patterns */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Six CTA failures that block conversions
            </h2>
            <div className="space-y-4">
              {CTA_FAILURES.map((f, i) => (
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

          {/* Pass/Fail signal grid */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-4">
              What the audit checks on your CTA
            </h2>
            <p className="text-sm text-fg-muted leading-6 mb-6 max-w-2xl">
              Nebula checks six CTA signals on every page audit. Each returns pass or fail with the raw value observed - button label text, DOM position, contrast ratio, adjacent copy - so you can verify the finding without trusting a black box.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { signal: 'CTA Text', pass: "Action verb + specific outcome ('View Audit Results')", fail: "Generic label ('Submit', 'Learn More', 'Get Started')" },
                { signal: 'Placement', pass: 'CTA visible in first viewport - no scroll required', fail: 'First CTA requires scrolling to reach' },
                { signal: 'Visual Hierarchy', pass: 'One dominant CTA; secondary options visually subordinate', fail: 'Multiple equal-weight CTAs competing in hero' },
                { signal: 'Contrast', pass: 'Button color stands out from background at a glance', fail: "Button blends into page palette - fails squint test" },
                { signal: 'Friction Removal', pass: "Objection-handling micro-copy adjacent to CTA", fail: 'CTA stands alone - no card/time/commitment context' },
                { signal: 'Interactivity', pass: 'Visible hover and focus state on button', fail: 'Static button - no state change on interaction' },
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
            <h2 className="text-2xl font-bold text-fg mb-3">See exactly where your CTA breaks down</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Paste your URL. Nebula checks your CTA text, placement, contrast, and friction signals against the actual page HTML - not a template. Free, no signup, under 2 minutes.
            </p>
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="inline-block rounded bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors text-base"
            >
              Run Free CTA Audit &rarr;
            </Link>
            <p className="text-xs text-fg-dim mt-4">Free audit live · results in under 2 minutes</p>
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
            <span className="font-semibold text-fg">Related:</span>
            <Link href="/landing-page-cta-audit" className="hover:text-accent transition-colors">Landing Page CTA Audit</Link>
            <Link href="/headline-optimization" className="hover:text-accent transition-colors">Headline Optimization</Link>
            <Link href="/why-is-my-landing-page-not-converting" className="hover:text-accent transition-colors">Why Your Page Isn&apos;t Converting</Link>
            <Link href="/pricing" className="hover:text-accent transition-colors">Repair Sprint Pricing</Link>
          </footer>

          <RelatedContent
            heading="Related resources"
            items={[
              { href: '/landing-page-cta-audit', label: 'CTA audit', type: 'audit-type' },
            { href: '/headline-optimization', label: 'Headline optimization', type: 'guide' },
            { href: '/landing-page-message-match', label: 'Message match audit', type: 'audit-type' },
            { href: '/audit', label: 'Get your free audit', type: 'cta' }
            ]}
          />

        </article>
      </main>
    </>
  )
}
