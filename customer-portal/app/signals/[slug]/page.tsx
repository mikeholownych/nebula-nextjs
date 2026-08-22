import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  SIGNALS,
  SPEC_URL,
  SPEC_JSON_URL,
  SPEC_VERSION,
  getSignalBySlug,
  SIGNALS_HUB_URL,
} from '../data'

export function generateStaticParams() {
  return SIGNALS.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const signal = getSignalBySlug(slug)
  if (!signal) return {}
  return {
    title: `What Is ${signal.label}? Conversion Signal Definition | Nebula Components`,
    description: signal.definition,
    alternates: {
      canonical: `https://nebulacomponents.com/signals/${signal.slug}`,
    },
  }
}

const SITE = 'https://nebulacomponents.com'

export default async function SignalPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const s = getSignalBySlug(slug)
  if (!s) notFound()

  const idx = SIGNALS.findIndex((x) => x.id === s.id)
  const prev = SIGNALS[(idx + SIGNALS.length - 1) % SIGNALS.length]
  const next = SIGNALS[(idx + 1) % SIGNALS.length]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${SITE}/signals/${s.slug}#article`,
        headline: `${s.label}: Conversion Signal Definition (Nebula Diagnostic Spec v${SPEC_VERSION})`,
        description: s.definition,
        datePublished: '2026-08-22',
        version: SPEC_VERSION,
        url: `${SITE}/signals/${s.slug}`,
        isPartOf: { '@id': `${SPEC_URL}#article` },
        author: { '@id': `${SITE}/#organization` },
        publisher: { '@id': `${SITE}/#organization` },
        about: {
          '@type': 'DefinedTerm',
          termCode: s.id,
          name: s.label,
          description: s.definition,
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE}/signals/${s.slug}#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: `What is ${s.label.toLowerCase()} on a landing page?`,
            acceptedAnswer: { '@type': 'Answer', text: s.definition },
          },
          {
            '@type': 'Question',
            name: `How is ${s.label.toLowerCase()} checked?`,
            acceptedAnswer: { '@type': 'Answer', text: s.rule },
          },
          {
            '@type': 'Question',
            name: `How can I check ${s.label.toLowerCase()} manually?`,
            acceptedAnswer: { '@type': 'Answer', text: s.manualCheck.join(' ') },
          },
        ],
      },
    ],
  }

  return (
    <main className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <link rel="alternate" type="application/ld+json" href={SPEC_JSON_URL} />
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
          <Link href="/resources" className="hover:text-fg transition-colors">Resources</Link>
          <span aria-hidden>/</span>
          <Link href="/signals" className="hover:text-fg transition-colors">9 Conversion Signals</Link>
          <span aria-hidden>/</span>
          <span className="text-fg">{s.label}</span>
        </nav>

        <header className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">
            Signal {s.num} of 09 · Nebula Diagnostic Spec v{SPEC_VERSION}
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg mb-3">
            {s.label}
          </h1>
          <p className="text-lg leading-relaxed text-fg font-medium">{s.definition}</p>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-fg tracking-tight mb-3">Decision rule</h2>
          <p className="leading-relaxed text-fg-muted">{s.rule}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-fg tracking-tight mb-3">What the engine inspects</h2>
          <ul className="space-y-1.5 text-fg-muted leading-relaxed">
            {s.inspected.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-accent font-mono text-sm shrink-0 pt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-fg tracking-tight mb-3">
            How to check it yourself
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-fg-muted leading-relaxed">
            {s.manualCheck.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <p className="mt-4 text-sm leading-relaxed text-fg-muted border-l-2 border-border pl-4">
            The engine automates this inspection and attaches measured evidence to every failing
            condition. A manual pass is not a substitute for the recorded evidence trail, but it
            should agree with it.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-fg tracking-tight mb-3">Pass / fail examples</h2>
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-bg-panel p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-accent mb-2">Pass</p>
              <p className="text-fg-muted leading-relaxed">{s.passExample}</p>
            </div>
            <div className="rounded-md border border-border bg-bg-panel p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-fg-muted mb-2">Fail</p>
              <p className="text-fg-muted leading-relaxed">{s.failExample}</p>
            </div>
          </div>
        </section>

        <aside className="rounded-md border border-border p-6 mb-12">
          <p className="text-sm leading-relaxed text-fg-muted">
            This page defines one of nine signals in the{' '}
            <Link href={SPEC_URL} className="text-accent hover:text-fg transition-colors">
              Nebula Landing Page Diagnostic Specification v{SPEC_VERSION}
            </Link>{' '}
            ({SPEC_URL}). Quoting with attribution is welcome; pin citations to the version.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/audit?utm_source=signal-page&utm_medium=${s.slug}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
            >
              Check this signal on your page
            </Link>
            <Link
              href="/signals"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
            >
              All 9 signals
            </Link>
          </div>
        </aside>

        <nav className="flex justify-between gap-4 border-t border-border pt-6 text-sm">
          <Link href={`/signals/${prev.slug}`} className="text-fg-muted hover:text-fg transition-colors">
            ← {prev.label}
          </Link>
          <Link href={`/signals/${next.slug}`} className="text-right text-fg-muted hover:text-fg transition-colors">
            {next.label} →
          </Link>
        </nav>
      </div>
    </main>
  )
}
