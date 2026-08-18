import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Landing Page CTA Audit: Label Clarity, Placement, Contrast & Hierarchy | Nebula',
  description:
    'Landing page CTAs fail for specific, observable reasons: generic labels with no outcome, multiple CTAs at equal visual weight, below-fold placement, and contrast ratios that fail WCAG AA. This guide covers each failure with the signal, the finding, and the fix.',
  alternates: {
    canonical: 'https://nebulacomponents.com/landing-page-cta-audit',
  },
  openGraph: {
    title: 'Landing Page CTA Audit: Label Clarity, Placement, Contrast & Hierarchy | Nebula',
    description:
      'Landing page CTAs fail for specific, observable reasons: generic labels with no outcome, multiple CTAs at equal visual weight, below-fold placement, and contrast ratios that fail WCAG AA.',
    url: 'https://nebulacomponents.com/landing-page-cta-audit',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Landing Page CTA Audit: Label Clarity, Placement, Contrast & Hierarchy',
  description:
    'Diagnostic guide for landing page call-to-action failures - generic labels, CTA competition, mobile visibility, contrast ratios, placement, and missing post-click context.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/landing-page-cta-audit',
}

const faqItems = [
  {
    q: 'What makes a CTA label effective?',
    a: "The label should state what the visitor receives, not what they do. 'Submit' describes the action. 'Get my free audit' describes the outcome. Outcome-framed CTAs outperform action-framed ones because they remind the visitor why they're clicking at the moment of decision.",
  },
  {
    q: 'How many CTAs should a landing page have?',
    a: "One primary CTA per viewport section. Multiple CTAs at equal visual weight - typical on pages with 'Buy now', 'Learn more', 'See demo', and 'Contact us' all in the hero - create decision paralysis. One prominent primary action, one subdued secondary option maximum.",
  },
  {
    q: 'What contrast ratio does a CTA button need?',
    a: "WCAG AA requires 4.5:1 for normal text, 3:1 for large text. Most CTA buttons use large text, but the background-to-text contrast must still pass. A green button on a white background can fail if the green is too light. The audit checks the computed contrast ratio from your page's actual CSS.",
  },
  {
    q: 'Where should the CTA be placed on a landing page?',
    a: "Above the fold on both desktop and mobile. Visitors who arrived from an ad have already expressed intent - they don't need to read the entire page before being offered the action. The CTA should be visible immediately, then repeated after the proof section.",
  },
  {
    q: "What is 'CTA competition' and how does it hurt conversion?",
    a: "CTA competition occurs when multiple clickable actions appear at equal visual weight in the same viewport, forcing the visitor to choose between them. The cognitive cost of the choice - Buy now? Learn more? Watch demo? Contact us? - delays or prevents the primary conversion action.",
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
      name: 'Landing Page CTA Audit',
      item: 'https://nebulacomponents.com/landing-page-cta-audit',
    },
  ],
}

const CTA_FAILURES = [
  {
    signal: 'CTA Label',
    label: "Generic label states the action, not the outcome",
    detail:
      "Labels like 'Submit', 'Click here', and 'Learn more' describe what the visitor does, not what they receive. At the moment of clicking, a visitor's decision is whether the outcome is worth the commitment. A label that names the outcome - 'Get my free audit', 'Start saving time today' - answers that question directly. A label that names the action does not. This is the most common CTA failure observed across audits, and it costs conversions on pages that are otherwise well-structured.",
    fix: "Rewrite the CTA label as a first-person outcome statement. Replace 'Submit' with 'Get my free report'. Replace 'Learn more' with 'See how it works'. Replace 'Contact us' with 'Get a response in 24 hours'. The label should answer: what does the visitor receive by clicking?",
  },
  {
    signal: 'CTA Hierarchy',
    label: 'Multiple CTAs at equal visual weight create decision paralysis',
    detail:
      "Pages with 'Buy now', 'Learn more', 'See demo', and 'Contact us' rendered at identical size, color, and weight in the same viewport force the visitor to evaluate which action to take before taking any. This evaluation cost is real - Hick's Law establishes that decision time increases logarithmically with the number of equal-weight options. The primary CTA should be visually dominant. Secondary actions - 'See how it works', 'Read the case study' - should be visually subdued.",
    fix: 'Assign a strict hierarchy: one primary CTA with full fill, one secondary option as a text link or ghost button. Remove all other actions from the hero viewport. Every additional equal-weight CTA reduces the probability that the primary action is taken.',
  },
  {
    signal: 'CTA Mobile Visibility',
    label: 'Primary CTA not visible on 375px viewport without scroll',
    detail:
      "On a 375px viewport - the standard benchmark for mobile - the primary CTA must be visible without scrolling. Pages that push the CTA below a large hero image, a headline, a subheadline, a feature list, and a trust strip have effectively hidden the primary action from mobile visitors. Mobile accounts for 60-70% of paid traffic on most campaigns. A CTA that requires scroll on mobile is functionally absent for the majority of ad-driven visitors.",
    fix: 'Load the page at 375px width and measure the CTA position. The button should be fully visible in the initial viewport. If it is not, reduce the hero height, collapse the feature list to a single line, or move the CTA above the supporting copy.',
  },
  {
    signal: 'CTA Contrast',
    label: 'Button contrast ratio fails WCAG AA at 4.5:1',
    detail:
      "WCAG AA compliance requires a minimum 4.5:1 contrast ratio between the button label text and the button background color. Many landing pages use brand-matched CTAs - light green on white, soft blue on light grey - that fail this threshold. The failure is not purely an accessibility concern: low-contrast CTAs are visually recessive and attract less attention than high-contrast ones. The audit measures the actual computed contrast ratio from the rendered CSS, not the intended design spec.",
    fix: 'Run the button through a contrast checker with the exact background and text hex values. If the ratio is below 4.5:1, darken the background or lighten the text until it passes. A high-contrast CTA - dark text on a bright teal, white text on a dark button - is also higher-attention.',
  },
  {
    signal: 'CTA Placement',
    label: 'CTA placed below the fold on desktop',
    detail:
      "On a 1024px or 1280px desktop viewport, the primary CTA must be visible without scrolling. Visitors arriving from paid ads have already expressed intent - the ad pre-qualified them. They do not need to read the entire page before being offered the conversion action. Pages that lead with a 600px hero image, a navigation strip, a value proposition, and three feature icons before the CTA have placed the most important element after the point where most visitors stop reading.",
    fix: 'Move the primary CTA into the hero section. It should appear alongside or directly below the H1 on both desktop and mobile. The CTA can be repeated further down the page after the proof section, but the first instance must be above the fold.',
  },
  {
    signal: 'Post-Click Clarity',
    label: 'No indication of what happens after the click',
    detail:
      "The CTA button is not the final decision point - the visitor is also deciding whether the post-click commitment is acceptable. A button labeled 'Get started' with no surrounding context leaves the visitor uncertain: Will I be asked for a credit card? Will I enter a sales queue? Will this take 30 minutes? Micro-copy adjacent to the CTA - 'No credit card required', 'Takes 90 seconds', 'No sales call' - reduces the perceived commitment cost at the exact moment of decision.",
    fix: "Add one line of micro-copy directly below or beside the CTA button. It should address the most likely objection. For free tools: 'No signup required'. For trials: 'No credit card - cancel anytime'. For audits: 'Results in under 2 minutes'. Keep it under 10 words.",
  },
]

export default function CtaAuditPage() {
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
              CTA Conversion Audit
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg md:text-5xl">
              Landing Page CTA Audit
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed max-w-2xl">
              CTA failures are the most proximate cause of conversion loss on otherwise healthy pages. Generic labels that name the action instead of the outcome. Multiple CTAs at equal weight. A button that requires scroll on mobile. Low contrast that fails WCAG AA. This guide covers each failure pattern with the observable signal and the bounded fix.
            </p>
          </header>

          {/* Six failure patterns */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Six CTA failure patterns
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

          {/* Pass/fail signal grid */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-4">
              What the audit checks on your CTA
            </h2>
            <p className="text-sm text-fg-muted leading-6 mb-6 max-w-2xl">
              Nebula evaluates CTA quality from your page's actual HTML and computed styles - not a template comparison. Each signal returns the raw value from your page so you can verify the finding directly.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { signal: 'CTA Label', pass: 'Label states what the visitor receives', fail: "Generic label: 'Submit', 'Click here', 'Learn more'" },
                { signal: 'CTA Hierarchy', pass: 'One visually dominant primary action in hero', fail: 'Two or more CTAs at equal visual weight' },
                { signal: 'Mobile Visibility', pass: 'CTA visible on 375px viewport without scroll', fail: 'CTA below fold on mobile - requires scroll to find' },
                { signal: 'Contrast Ratio', pass: 'Button text-to-background ratio ≥ 4.5:1', fail: 'Contrast below WCAG AA threshold' },
                { signal: 'Fold Placement', pass: 'Primary CTA in hero, above the fold on desktop', fail: 'CTA below fold - unreachable for most visitors' },
                { signal: 'Post-Click Clarity', pass: 'Micro-copy adjacent to CTA addresses commitment cost', fail: 'No context on what happens after the click' },
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
            <h2 className="text-2xl font-bold text-fg mb-3">Audit your landing page CTA</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Paste your URL. Nebula checks CTA label, placement, contrast, hierarchy, and post-click clarity against your actual page - not a template. Free, no signup, under 2 minutes.
            </p>
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-base"
            >
              Run Free CTA Audit &rarr;
            </Link>
            <p className="mt-3 text-xs text-fg-muted">No credit card required - results in under 2 minutes</p>
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


        </article>
      </main>
    </>
  )
}
