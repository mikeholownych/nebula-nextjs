import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Landing Page Diagnostic Specification v1 | Nebula Components',
  description:
    'The canonical specification of the Nebula landing page diagnostic: 9 conversion signals, decision rules, severity model, and the evidence record every finding carries.',
  alternates: { canonical: 'https://nebulacomponents.com/spec/landing-page-diagnostic-v1' },
}

const SPEC_URL = 'https://nebulacomponents.com/spec/landing-page-diagnostic-v1'
const VERSION = '1.0.0'
const EFFECTIVE = '2026-08-22'

interface SignalSpec {
  id: string
  label: string
  definition: string
  rule: string
  inspected: string[]
  passExample: string
  failExample: string
}

const SIGNALS: SignalSpec[] = [
  {
    id: 'message_match',
    label: 'Message Match',
    definition:
      'Does the page promise match the expectation created by the ad or referring source?',
    rule:
      'The primary headline and first supporting line must restate the same offer, audience, and outcome as the ad or referral context that produced the visit. A run flags this signal when the rendered headline contradicts, generalizes away from, or omits the promised offer.',
    inspected: ['H1 text', 'first subheadline', 'title tag', 'referring campaign parameters when present'],
    passExample:
      'Ad promises a free landing page audit. H1 reads "Get a free audit of your landing page" for the same audience. Match.',
    failExample:
      'Ad promises a free audit. Page opens with generic agency branding and no mention of an audit anywhere above the fold. Flagged.',
  },
  {
    id: 'trust',
    label: 'Trust Signals',
    definition: 'Does the page support its claims before asking for commitment?',
    rule:
      'At least one verifiable proof element must appear near the conversion ask: named results, sourced review counts, case studies, or identifiable company and author information. A run flags pages that make strong claims with no adjacent, checkable support.',
    inspected: ['testimonial and logo blocks', 'review widgets', 'case study links', 'author and company identity markup'],
    passExample:
      'A pricing claim sits next to a linked case study naming the customer and the measured result. Support is checkable. Clear.',
    failExample:
      '"Trusted by hundreds" appears with no names, no sources, and no links. Flagged.',
  },
  {
    id: 'mobile_cta',
    label: 'Mobile CTA',
    definition: 'Is the primary action visible and usable on a small viewport?',
    rule:
      'The primary call-to-action must be fully visible inside the initial 390px-wide viewport without scrolling, and must meet minimum tap-target size. A run flags CTAs pushed below the fold, overlapped by other elements, or smaller than usable touch targets at mobile width.',
    inspected: ['CTA bounding box position and size at 390px', 'overlap checks against header, banners, and sticky elements', 'tap target dimensions'],
    passExample:
      'Primary button renders entirely inside the first mobile viewport with a 48px tap height and nothing covering it. Clear.',
    failExample:
      'At 390px the CTA sits underneath a fixed bottom banner, so the first tap hits the banner instead. Flagged.',
  },
  {
    id: 'load_time',
    label: 'Load Speed',
    definition:
      'Does the page become useful quickly enough to keep paid visitors from bouncing?',
    rule:
      'Main content must reach usable state fast enough on a constrained connection. A run inspects render-blocking behavior, oversized hero media, and late-loading primary content, then reports measured values against the required threshold for the specific finding.',
    inspected: ['render-blocking resource count', 'hero image weight and format', 'when primary content becomes visible'],
    passExample:
      'Primary content paints early; hero image is sized and compressed for mobile. Within threshold. Clear.',
    failExample:
      'A multi-megabyte autoplay video delays first meaningful content well past the threshold recorded in the finding. Flagged.',
  },
  {
    id: 'cta_clarity',
    label: 'CTA Clarity',
    definition: 'Is the next step obvious and proportionate to visitor intent?',
    rule:
      'One primary action must dominate. A run flags pages offering several competing equal-weight actions, vague action labels, or asks disproportionate to intent (for example demanding account creation before delivering any value).',
    inspected: ['button label text', 'count and relative weight of distinct actions', 'ask placement relative to value shown'],
    passExample:
      'Single high-contrast "Run my free audit" button; secondary links are visually subordinate. Clear.',
    failExample:
      'Four equal-weight buttons ("Book a call", "Sign up", "Learn more", "Follow us") compete in the first viewport. Flagged.',
  },
  {
    id: 'above_fold',
    label: 'Above-Fold Clarity',
    definition:
      'Can a visitor understand the offer and next action in the first viewport?',
    rule:
      'Within the initial viewport a first-time visitor must be able to answer three questions: what is offered, who it is for, and what to do next. A run flags pages where any of these answers requires scrolling or inference.',
    inspected: ['viewport-height slice of rendered DOM', 'headline, subhead, CTA presence in that slice'],
    passExample:
      'Offer, audience, and CTA all legible in the first desktop and mobile viewport. Clear.',
    failExample:
      'First viewport contains only a full-screen illustration and a logo; offer and action require scrolling. Flagged.',
  },
  {
    id: 'ad_signals',
    label: 'Ad Signal Continuity',
    definition: 'Can paid clicks be connected to outcomes without guessing?',
    rule:
      'Paid traffic infrastructure must preserve click identity through to conversion events. A run checks for broken or missing tracking continuity between entry and conversion surfaces and flags gaps that would force attribution guesses.',
    inspected: ['tracking parameter handling across navigation', 'conversion event wiring', 'attribution break points'],
    passExample:
      'Click identifiers survive the redirect into checkout and fire the purchase event with source intact. Clear.',
    failExample:
      'The main CTA links to a separate domain without carrying parameters, severing attribution for every paid click. Flagged.',
  },
  {
    id: 'seo_foundations',
    label: 'SEO Foundations',
    definition: 'Can search systems retrieve and interpret the page foundations?',
    rule:
      'Core retrieval elements must be present, unique, and consistent: crawlable status, canonical URL, title, meta description, heading hierarchy, and indexability directives. A run flags missing, duplicated, or contradictory foundations.',
    inspected: ['HTTP status and robots directives', 'canonical tag', 'title and meta description', 'heading structure'],
    passExample:
      'Self-referencing canonical, unique title and description, single H1, indexable. Clear.',
    failExample:
      'Canonical points to a different URL while an internal link targets this one as the destination. Contradiction flagged.',
  },
  {
    id: 'ai_readiness',
    label: 'AI Readiness',
    definition: 'Can answer engines identify, verify, and cite the page accurately?',
    rule:
      'Machine-facing surfaces must let AI systems resolve who you are, what you offer, and what claims are supportable: structured data matching visible content, explicit factual statements, stable entity references, and crawler policy that permits answer engines you want citing you.',
    inspected: ['JSON-LD presence and accuracy', 'entity consistency', 'claim specificity', 'crawler access rules for AI agents'],
    passExample:
      'Product schema matches visible pricing; company identity is stated once, consistently, with same-as links. Clear.',
    failExample:
      'Schema asserts guarantees the visible page never makes, and robots.txt blocks every AI crawler indiscriminately. Flagged.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'TechArticle',
      '@id': `${SPEC_URL}#article`,
      headline: 'Nebula Landing Page Diagnostic Specification v1',
      description:
        'Canonical specification of the nine conversion signals checked by the Nebula landing page diagnostic, including decision rules, severity bands, and the evidence record attached to every finding.',
      datePublished: EFFECTIVE,
      version: VERSION,
      url: SPEC_URL,
      author: { '@id': 'https://nebulacomponents.com/#organization' },
      publisher: { '@id': 'https://nebulacomponents.com/#organization' },
      about: {
        '@type': 'DefinedTermSet',
        name: 'Nebula Conversion Signals v1',
        hasDefinedTerm: SIGNALS.map((s) => ({
          '@type': 'DefinedTerm',
          termCode: s.id,
          name: s.label,
          description: s.definition,
        })),
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://nebulacomponents.com/#organization',
      name: 'Nebula Components',
      url: 'https://nebulacomponents.com',
    },
  ],
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">
      {children}
    </p>
  )
}

export default function SpecPage() {
  return (
    <main className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        {/* Header */}
        <SectionLabel>Nebula Components · Diagnostic Specification</SectionLabel>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg mb-4">
          Landing Page Diagnostic Specification v1
        </h1>
        <p className="font-mono text-xs text-fg-muted mb-10">
          Version {VERSION} · Effective {EFFECTIVE} · Canonical URL:{' '}
          <span className="break-all">{SPEC_URL}</span>
        </p>

        {/* Scope */}
        <section className="mb-14">
          <SectionLabel>Scope</SectionLabel>
          <div className="space-y-4 text-fg-muted leading-relaxed">
            <p>
              This document defines exactly what the Nebula landing page diagnostic checks. It is
              the machine-readable and human-readable contract behind every audit result Nebula
              produces.
            </p>
            <p>
              The diagnostic inspects one landing page URL against nine conversion signals. For
              each failing condition it returns a finding containing the observed condition, the
              required condition, the measured gap, and a selector identifying where on the page
              the evidence comes from.
            </p>
            <p>
              Boundaries: findings are observations against these rules. They identify repair
              candidates. They do not predict revenue, guarantee ranking or citations, or replace
              controlled experiments. A signal without a returned finding means the run observed no
              failure for that category; it is not a certification.
            </p>
          </div>
        </section>

        {/* Procedure */}
        <section className="mb-14">
          <SectionLabel>Procedure</SectionLabel>
          <ol className="list-decimal list-inside space-y-2 text-fg-muted leading-relaxed">
            <li>Fetch the submitted URL and confirm it resolves to a retrievable page.</li>
            <li>Inspect raw HTML and rendered output across desktop and mobile widths.</li>
            <li>Evaluate the nine signals defined below.</li>
            <li>
              Emit findings for failing conditions, each carrying the evidence record described
              below.
            </li>
            <li>
              Order findings by priority: highest impact first, lowest effort breaks ties, label
              alphabetical as final tiebreaker.
            </li>
          </ol>
        </section>

        {/* Severity */}
        <section className="mb-14">
          <SectionLabel>Severity Model</SectionLabel>
          <p className="text-fg-muted leading-relaxed mb-4">
            Every finding carries an impact score from 0 to 10 and an effort score. Severity bands
            are deterministic:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead>
                <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-fg-muted">
                  <th className="px-4 py-2">Band</th>
                  <th className="px-4 py-2">Impact</th>
                  <th className="px-4 py-2">Meaning</th>
                </tr>
              </thead>
              <tbody className="text-fg-muted">
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-mono text-accent">critical</td>
                  <td className="px-4 py-2 tabular-nums">8 to 10</td>
                  <td className="px-4 py-2">Repair candidate with severe expected cost of inaction</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-mono">warning</td>
                  <td className="px-4 py-2 tabular-nums">5 to 7.9</td>
                  <td className="px-4 py-2">Material friction worth scheduling</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">advisory</td>
                  <td className="px-4 py-2 tabular-nums">below 5</td>
                  <td className="px-4 py-2">Improvement opportunity, lower urgency</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Evidence record */}
        <section className="mb-14">
          <SectionLabel>Evidence Record</SectionLabel>
          <p className="text-fg-muted leading-relaxed mb-4">
            Every finding attaches one evidence record with six fields. Confidence declares how
            directly the engine observed the condition:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead>
                <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-fg-muted">
                  <th className="px-4 py-2">Field</th>
                  <th className="px-4 py-2">Contents</th>
                </tr>
              </thead>
              <tbody className="text-fg-muted">
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-mono">measured</td>
                  <td className="px-4 py-2">What was observed on the page</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-mono">required</td>
                  <td className="px-4 py-2">What the signal rule demands instead</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-mono">delta</td>
                  <td className="px-4 py-2">The gap between measured and required</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-mono">selector</td>
                  <td className="px-4 py-2">Locator tying the observation to page markup</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-mono">confidence</td>
                  <td className="px-4 py-2">
                    One of <code className="font-mono text-xs">definitive</code>,{' '}
                    <code className="font-mono text-xs">high</code>,{' '}
                    <code className="font-mono text-xs">contextual</code>,{' '}
                    <code className="font-mono text-xs">unavailable</code>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">timestamp</td>
                  <td className="px-4 py-2">When the observation was captured</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-fg-muted leading-relaxed mt-4">
            When direct measurement is impossible, confidence drops to{' '}
            <code className="font-mono text-xs">contextual</code> or{' '}
            <code className="font-mono text-xs">unavailable</code> and the finding says so rather
            than asserting a number the engine did not observe.
          </p>
        </section>

        {/* Signals */}
        <section className="mb-14">
          <SectionLabel>The Nine Signals</SectionLabel>
          <div className="space-y-10 mt-6">
            {SIGNALS.map((s, i) => (
              <article key={s.id} id={s.id}>
                <h2 className="text-xl font-semibold text-fg tracking-tight mb-1">
                  <span className="font-mono text-accent text-sm mr-2">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {s.label}
                </h2>
                <p className="font-mono text-xs text-fg-muted mb-3">signal id: {s.id}</p>
                <p className="text-fg leading-relaxed mb-3 font-medium">{s.definition}</p>
                <p className="text-fg-muted leading-relaxed mb-3">{s.rule}</p>
                <p className="text-sm text-fg-muted leading-relaxed mb-1">
                  <span className="font-mono text-xs uppercase tracking-wider text-fg">
                    Inspected:{' '}
                  </span>
                  {s.inspected.join(' · ')}
                </p>
                <div className="mt-3 space-y-2 text-sm leading-relaxed">
                  <p className="pl-4 border-l-2 border-accent text-fg-muted">
                    <span className="font-mono text-xs uppercase tracking-wider text-accent">
                      Pass:{' '}
                    </span>
                    {s.passExample}
                  </p>
                  <p className="pl-4 border-l-2 border-border text-fg-muted">
                    <span className="font-mono text-xs uppercase tracking-wider text-fg-muted">
                      Fail:{' '}
                    </span>
                    {s.failExample}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Versioning */}
        <section className="mb-14">
          <SectionLabel>Versioning</SectionLabel>
          <div className="text-fg-muted leading-relaxed space-y-3">
            <p>
              This specification is versioned. Signal definitions, severity bands, and the evidence
              record are contractual within a major version. Additions ship as minor versions;
              changes to a signal&apos;s meaning ship as a new major version and never silently
              reinterpret prior audits.
            </p>
            <div className="border border-border p-4 font-mono text-sm">
              <div>v1.0.0 · {EFFECTIVE} · Initial publication. Nine signals, severity bands, evidence record.</div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border pt-10">
          <p className="text-fg-muted leading-relaxed mb-6">
            Every Nebula audit runs against this exact specification. Run one against your landing
            page to see your findings with measured evidence.
          </p>
          <a
            href="/audit"
            className="inline-flex items-center rounded-md bg-accent px-6 py-3 font-semibold text-bg hover:opacity-90 transition-opacity"
          >
            Run the free audit
          </a>
        </section>
      </div>
    </main>
  )
}
