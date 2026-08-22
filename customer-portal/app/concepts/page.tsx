import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Nebula Concepts: 9-Signal Audit Framework Guide | Nebula',
  description:
    'The diagnostic vocabulary Nebula uses to evaluate landing page conversion fitness - signals, evidence atoms, conversion leaks, message match, above-fold state, structural friction, grades, and the One-Leak Repair Sprint.',
  alternates: { canonical: 'https://nebulacomponents.com/concepts' },
  openGraph: {
    title: 'Nebula Concepts: 9-Signal Audit Framework Guide | Nebula',
    description:
      'The diagnostic vocabulary Nebula uses to evaluate landing page conversion fitness - signals, evidence atoms, conversion leaks, message match, above-fold state, structural friction, grades, and the One-Leak Repair Sprint.',
    url: 'https://nebulacomponents.com/concepts',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Nebula Concepts: Frameworks Behind the 9-Signal Landing Page Audit',
  description:
    'The diagnostic vocabulary Nebula uses to evaluate landing page conversion fitness - signals, evidence atoms, conversion leaks, message match, above-fold state, structural friction, grades, and the One-Leak Repair Sprint.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/concepts',
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.com' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Concepts',
      item: 'https://nebulacomponents.com/concepts',
    },
  ],
}

const CONCEPTS = [
  {
    id: 'signal',
    name: 'Signal',
    definition:
      'A single observable, measurable dimension of a landing page\'s conversion fitness. Nebula checks 9 signals per audit. Each has a defined pass standard and returns raw evidence.',
    whyItMatters:
      'Breaking the audit into discrete signals makes findings falsifiable and actionable. A composite score without signal-level detail cannot tell you which element to fix - and fixing the wrong element wastes the budget.',
    howNebulaMeasures:
      'The engine evaluates each signal independently against the page\'s actual HTML response. Signals include: headline (H1 count, ICP clarity), CTA (label, above-fold visibility), social proof (source-order position, specificity), load speed (payload bytes, LCP proxy), and four others. Each returns pass or fail with the raw value that determined the result.',
  },
  {
    id: 'evidence-atom',
    name: 'Evidence Atom',
    definition:
      'The raw value from the page that justifies a pass or fail finding - H1 text, meta description character count, payload bytes, CTA label.',
    whyItMatters:
      'Most audit tools return recommendations without showing their work. An evidence atom makes every finding independently verifiable: you can open the page source and confirm whether the H1 Nebula found is actually the H1 on your page. There is no proprietary scoring black box.',
    howNebulaMeasures:
      'Every signal finding stores the evidence atom alongside the pass/fail verdict. Examples: headline signal stores the exact H1 text. Load speed signal stores the payload size in bytes. Meta description signal stores the character count and the full description text. The audit report surfaces these directly.',
  },
  {
    id: 'conversion-leak',
    name: 'Conversion Leak',
    definition:
      'An observable page condition that fails a documented audit standard and may create friction in the conversion path. A page can have multiple failed conditions; the audit ranks them by priority.',
    whyItMatters:
      'The word "leak" is deliberate: it frames the problem as a fixable structural defect rather than a weak offer or wrong audience. A page leaking 60% of its mobile visitors through a buried CTA is not a traffic problem. It is a structural problem with a bounded fix.',
    howNebulaMeasures:
      'Nebula identifies failed conditions at the signal level. The audit ranks failed signals by priority - a heuristic incorporating journey position, severity, and reproducibility. Message match and CTA failures are ranked higher for paid traffic; load speed and SEO signals are ranked lower. The One-Leak Repair Sprint targets the highest-priority finding.',
  },
  {
    id: 'message-match',
    name: 'Message Match',
    definition:
      'The degree of continuity between the ad that brought the visitor and the headline they see when they arrive. A score of 0 means the ad and page are unrelated.',
    whyItMatters:
      'A visitor who clicked an ad for "project management for engineering teams" and lands on a headline that reads "The all-in-one workspace" faces an immediate disorientation: did they click the right link? The cognitive cost of resolving that question is a conversion-rate penalty. The ad already paid for the click - message mismatch discards that spend in the first two seconds.',
    howNebulaMeasures:
      'Nebula checks the H1 text against the page\'s own title tag and meta description for internal consistency. When an ad URL is provided, it compares ad copy against the H1 directly. The signal returns the H1 text as the evidence atom so the mismatch is visible, not inferred.',
  },
  {
    id: 'above-fold-state',
    name: 'Above-Fold State',
    definition:
      'What a visitor sees before scrolling. For paid traffic, this is the only content that matters for the decision to stay or leave.',
    whyItMatters:
      'Cold paid traffic makes the stay-or-leave decision within the first viewport. If the primary CTA, an ICP-confirming headline, and at least one proof element are not visible before the first scroll, the page is asking visitors to commit effort before it has earned their attention. Most do not.',
    howNebulaMeasures:
      'Nebula checks for CTA presence in the source-order HTML above the fold proxy. It checks whether the H1 is in the static HTML (not rendered by JavaScript). It checks for at least one trust signal in the above-fold region. Each of these is a binary pass/fail backed by the raw HTML evidence.',
  },
  {
    id: 'structural-friction',
    name: 'Structural Friction',
    definition:
      'Page-level obstacles that cost conversions regardless of ad quality or offer strength. Structural friction is fixable; it does not require a new product or a different audience.',
    whyItMatters:
      'Founders and operators running paid traffic often assume the problem is the ad creative, the audience targeting, or the offer price. Structural friction - a five-field form, a CTA below fold, a page that loads in six seconds on mobile - is an observable, fixable variable that can be checked without making any of those assumptions. Addressing structural friction does not guarantee conversion lift, but it removes conditions that are measurably outside documented standards.',
    howNebulaMeasures:
      'Structural friction signals in Nebula\'s audit include: form field count (more than two fields above fold is a friction flag), CTA placement, mobile tap target size, page weight, and font size. These are observable in the HTML and CSS - no session recording or A/B test data required.',
  },
  {
    id: 'one-leak-repair-sprint',
    name: 'One-Leak Repair Sprint',
    definition:
      'Nebula\'s $97 paid product. Takes the highest-priority finding from the audit and delivers targeted implementation instructions. One leak, one fix, one re-audit window.',
    whyItMatters:
      'A full-page redesign is the wrong response to a single conversion leak. If the audit identifies that the H1 has zero ICP clarity, the correct intervention is a headline rewrite - not a new design system. The Repair Sprint scopes the change to the single highest-priority finding, delivers implementation-ready instructions, and includes a re-audit to confirm the finding is resolved.',
    howNebulaMeasures:
      'The Sprint is triggered by the audit output. The highest-ranked failed signal determines the sprint scope. Deliverables are specific to the signal: for a headline failure, the sprint returns three alternative H1 candidates with rationale. For a load speed failure, it returns the specific asset causing the LCP regression and the implementation path to fix it.',
  },
  {
    id: 'grade',
    name: 'Grade',
    definition:
      'Letter grade (A–F) derived from the composite signal score. A = 90+, B = 75–89, C = 60–74, D = 45–59, F = below 45.',
    whyItMatters:
      'A numeric score without a reference frame is harder to act on. The grade maps the score to a decision: a Grade A page has no material leaks and is unlikely to benefit from structural changes. A Grade B page passes most signals but has at least one material leak worth fixing. A Grade D or F page has multiple structural failures that are collectively suppressing conversions.',
    howNebulaMeasures:
      'Each of the 9 signals contributes to the composite score with equal weighting unless override logic applies (a zero H1 count forces the score below 50 regardless of other signals). The grade is computed from the final composite. The audit report shows both the numeric score and the grade letter, with the failed signals that drove the result listed below.',
  },
]

const relatedLinks = [
  { href: '/audit', title: 'Run a Free Audit' },
  { href: '/why-is-my-landing-page-not-converting', title: 'Why Is My Landing Page Not Converting?' },
  { href: '/what-is-landing-page-audit', title: 'What Is a Landing Page Audit?' },
  { href: '/pricing', title: 'Repair Sprint Pricing' },
]

export default function ConceptsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
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
              Nebula Frameworks
            </p>
            <h1 className="heading-1 text-fg">Discover Core Landing Page Concepts to Improve Conversions</h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/audit?utm_source=concepts-hero&utm_medium=hero-cta"
            className="inline-flex items-center justify-center rounded bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
          >
            Get free audit →
          </a>
        </div>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed max-w-2xl">
              These are the concepts behind the 9-signal audit. Each term has a precise definition, a measurable standard, and a specific role in Nebula&rsquo;s diagnostic output. Understanding them makes it easier to read an audit report, interpret a grade, and decide which finding to act on first.
            </p>
          </header>

          {/* Concept cards */}
          <section className="mb-14 space-y-4">
            {CONCEPTS.map((c, i) => (
              <div
                key={c.id}
                id={c.id}
                className="rounded-xl border border-border bg-bg-muted/20 p-6"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="shrink-0 font-mono text-xs text-fg-dim mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h2 className="text-base font-semibold text-fg">{c.name}</h2>
                    <p className="text-sm text-fg-muted leading-6 mt-1">{c.definition}</p>
                  </div>
                </div>

                <div className="pl-7 space-y-3 mt-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">Why it matters for conversion</p>
                    <p className="text-sm text-fg-muted leading-6">{c.whyItMatters}</p>
                  </div>
                  <div className="border-l-2 border-accent/30 pl-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">How Nebula measures it</p>
                    <p className="text-sm text-fg-muted leading-6">{c.howNebulaMeasures}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* CTA */}
          <section className="mb-14 rounded-md border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">See these concepts applied to your page</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Paste your URL. Nebula runs all 9 signals and returns each finding with the raw evidence atom - H1 text, CTA label, payload bytes, trust signal count. Free, no signup, under 2 minutes.
            </p>
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="inline-block rounded bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors text-base"
            >
              Run Free Audit &rarr;
            </Link>
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

        </article>
      </main>
    </>
  )
}
