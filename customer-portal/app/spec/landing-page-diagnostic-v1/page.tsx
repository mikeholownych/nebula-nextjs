import type { Metadata } from 'next'
import Link from 'next/link'

import {
  SIGNALS,
  SPEC_URL,
  SPEC_JSON_URL,
  SPEC_VERSION,
  SPEC_EFFECTIVE,
  SIGNALS_HUB_URL,
} from '@/app/signals/data'

export const metadata: Metadata = {
  title: 'Landing Page Diagnostic Specification v1 | Nebula Components',
  description:
    'The canonical specification of the Nebula landing page diagnostic: 9 conversion signals, decision rules, severity model, and the evidence record every finding carries. Includes suggested citations and a machine-readable version.',
  alternates: { canonical: SPEC_URL },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'TechArticle',
      '@id': `${SPEC_URL}#article`,
      headline: 'Nebula Landing Page Diagnostic Specification v1',
      description:
        'Canonical specification of the nine conversion signals checked by the Nebula landing page diagnostic, including decision rules, severity bands, and the evidence record attached to every finding.',
      datePublished: SPEC_EFFECTIVE,
      version: SPEC_VERSION,
      url: SPEC_URL,
      author: { '@id': 'https://nebulacomponents.com/#founder' },
      publisher: { '@id': 'https://nebulacomponents.com/#organization' },
      about: {
        '@type': 'DefinedTermSet',
        name: 'Nebula Conversion Signals v1',
        hasDefinedTerm: SIGNALS.map((s) => ({
          '@type': 'DefinedTerm',
          termCode: s.id,
          name: s.label,
          url: `${SIGNALS_HUB_URL}/${s.slug}`,
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
      <link rel="alternate" type="application/ld+json" href={SPEC_JSON_URL} />
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        {/* Answer Capsule */}
        <div
          data-answer-capsule
          className="border-l-2 border-accent bg-surface-muted rounded-r-md px-5 py-4 mb-8"
        >
          <p className="text-fg leading-relaxed text-sm">
            The Nebula Landing Page Diagnostic Specification defines the 9 conversion signals checked on every audit, the decision rules for each finding, and the evidence record each finding must carry.
            Version 1.0.0, effective 2026-08-22.
            Machine-readable version available at /spec/landing-page-diagnostic-v1.json.
          </p>
        </div>
        {/* Header */}
        <SectionLabel>Nebula Components · Diagnostic Specification</SectionLabel>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg mb-4">
          Landing Page Diagnostic Specification v1
        </h1>
        <div className="flex items-center gap-3 mt-4 mb-8">
          <img
            src="/mike-holownych-founder.jpg"
            alt="Mike Holownych"
            width={36}
            height={36}
            className="rounded-full border border-border object-cover"
          />
          <div className="text-sm text-fg-muted">
            <span className="font-medium text-fg">Mike Holownych</span>
            {' '}&middot;{' '}
            <span>Founder, Nebula Components</span>
            <span className="mx-2 text-border">·</span>
            <span>Enterprise AI governance lead, TMX Group</span>
          </div>
        </div>
        <p className="font-mono text-xs text-fg-muted mb-10">
          Version {SPEC_VERSION} · Effective {SPEC_EFFECTIVE} · Canonical URL:{' '}
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
              Order findings by priority: highest priority first, lowest effort breaks ties, label
              alphabetical as final tiebreaker.
            </li>
          </ol>
        </section>

        {/* Severity */}
        <section className="mb-14">
          <SectionLabel>Severity Model</SectionLabel>
          <p className="text-fg-muted leading-relaxed mb-4">
            Every finding carries an priority score from 0 to 10 and an effort score. Severity bands
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
          <p className="text-fg-muted text-sm mb-6">
            Each signal also has its own reference page at{' '}
            <Link href={SIGNALS_HUB_URL} className="text-accent hover:text-fg transition-colors">
              nebulacomponents.com/signals
            </Link>{' '}
            with manual checks and pass/fail examples.
          </p>
          <div className="space-y-10 mt-6">
            {SIGNALS.map((s) => (
              <article key={s.id} id={s.id}>
                <h2 className="text-xl font-semibold text-fg tracking-tight mb-1">
                  <span className="font-mono text-accent text-sm mr-2">{s.num}</span>
                  <Link
                    href={`/signals/${s.slug}`}
                    className="hover:text-accent transition-colors"
                  >
                    {s.label}
                  </Link>
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

        {/* How to cite this spec */}
        <section className="mb-14" id="how-to-cite">
          <SectionLabel>How to Cite This Spec</SectionLabel>
          <div className="space-y-5 text-fg-muted leading-relaxed">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-fg mb-1.5">Short form</p>
              <p className="rounded-md border border-border bg-bg-panel p-4 text-sm break-words">
                (Nebula Diagnostic Spec v{SPEC_VERSION.split('.').slice(0, 2).join('.')})
              </p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-fg mb-1.5">Full form</p>
              <p className="rounded-md border border-border bg-bg-panel p-4 text-sm break-words">
                Nebula Landing Page Diagnostic Specification v{SPEC_VERSION} ({SPEC_EFFECTIVE}).
                Nebula Components.{' '}
                <span className="text-accent break-all">{SPEC_URL}</span>
              </p>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-sm">
              <li>
                Quoting with attribution and a link to the canonical URL is welcome for internal
                docs, client reports, playbooks, and publications.
              </li>
              <li>
                Pin citations to a version: later versions never silently reinterpret audits run
                under an earlier one.
              </li>
              <li>
                A machine-readable version of this spec is published at{' '}
                <a href={SPEC_JSON_URL} className="text-accent hover:text-fg transition-colors break-all">
                  {SPEC_JSON_URL}
                </a>{' '}
                and linked from this page via{' '}
                <code className="font-mono text-xs">link rel=&quot;alternate&quot;</code>.
              </li>
              <li>
                Retrieval and summarization by search and answer engines is permitted and
                encouraged with attribution; GPTBot, ClaudeBot, and PerplexityBot are allowed in{' '}
                <a
                  href="https://nebulacomponents.com/robots.txt"
                  className="text-accent hover:text-fg transition-colors"
                >
                  robots.txt
                </a>
                .
              </li>
            </ul>
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
              <div>
                v{SPEC_VERSION} · {SPEC_EFFECTIVE} · Initial publication. Nine signals, severity
                bands, evidence record.
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border pt-10">
          <p className="text-fg-muted leading-relaxed mb-6">
            Every Nebula audit runs against this exact specification. Run one against your landing
            page to see your findings with measured evidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/audit?utm_source=spec-page&utm_medium=cta"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-accent px-6 py-3 font-semibold text-bg hover:opacity-90 transition-opacity"
            >
              Run the free audit
            </a>
            <Link
              href={SIGNALS_HUB_URL}
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border px-6 py-3 font-medium text-fg-muted hover:border-fg-muted hover:text-fg transition-colors"
            >
              Browse the 9 signals
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
