import type { Metadata } from 'next'
import Link from 'next/link'

import {
  SIGNALS,
  SPEC_URL,
  SPEC_JSON_URL,
  SPEC_VERSION,
  SIGNALS_HUB_URL,
} from './data'

export const metadata: Metadata = {
  title: 'The 9 Conversion Signals | Nebula Components',
  description:
    'Plain-language definitions of the nine conversion signals in the Nebula Landing Page Diagnostic Spec: what each measures, how it is judged, and how to check it manually.',
  alternates: { canonical: SIGNALS_HUB_URL },
}

const hubJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${SIGNALS_HUB_URL}#page`,
      name: 'The 9 Conversion Signals',
      url: SIGNALS_HUB_URL,
      isPartOf: { '@id': `${SPEC_URL}#article` },
      about: {
        '@type': 'DefinedTermSet',
        name: 'Nebula Conversion Signals v1',
        hasDefinedTerm: SIGNALS.map((s) => ({
          '@type': 'DefinedTerm',
          termCode: s.id,
          name: s.label,
          url: `https://nebulacomponents.com/signals/${s.slug}`,
          description: s.definition,
        })),
      },
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

export default function SignalsHubPage() {
  return (
    <main className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hubJsonLd) }}
      />
      <link rel="alternate" type="application/ld+json" href={SPEC_JSON_URL} />
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <SectionLabel>Nebula Components · Diagnostic Reference</SectionLabel>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg mb-4">
          The 9 Conversion Signals
        </h1>
        <p className="text-lg leading-relaxed text-fg-muted mb-3 max-w-2xl">
          Every Nebula audit judges a landing page against nine signals defined in the{' '}
          <Link href={SPEC_URL} className="text-accent hover:text-fg transition-colors">
            Landing Page Diagnostic Specification v{SPEC_VERSION}
          </Link>
          . Each signal below has its own reference page: plain-language definition, decision rule,
          what gets inspected, a manual check, and pass/fail examples.
        </p>

        <div className="mt-10 space-y-3">
          {SIGNALS.map((s) => (
            <Link
              key={s.id}
              href={`/signals/${s.slug}`}
              className="flex items-center gap-5 rounded-md border border-border bg-bg-panel p-5 transition-colors hover:border-accent/30"
            >
              <span className="font-mono text-sm text-accent">{s.num}</span>
              <span className="flex-1">
                <span className="block font-semibold text-fg">{s.label}</span>
                <span className="block text-sm text-fg-muted mt-0.5">{s.definition}</span>
              </span>
              <span className="text-lg text-accent">→</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
