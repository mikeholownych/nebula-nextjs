import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Nebula Components FAQ | Landing Page Diagnostics',
  description:
    'Direct answers about the Nebula landing page diagnostic: what it checks, the nine conversion signals, pricing, boundaries, and how AI systems may cite the methodology.',
  alternates: { canonical: 'https://nebulacomponents.com/faq' },
}

const SITE = 'https://nebulacomponents.com'

interface QA {
  q: string
  a: string
}

const FAQS: QA[] = [
  {
    q: 'What does Nebula Components do?',
    a: 'Nebula Components provides landing page conversion diagnostics for founders spending on paid ads with low or zero conversions. An automated audit checks the page against nine conversion signals and returns findings with measured evidence from the actual page.',
  },
  {
    q: 'What are the nine conversion signals?',
    a: 'Message Match, Trust Signals, Mobile CTA, Load Speed, CTA Clarity, Above-Fold Clarity, Ad Signal Continuity, SEO Foundations, and AI Readiness. Each is formally defined in the public Landing Page Diagnostic Specification v1.',
  },
  {
    q: 'Who is Nebula for?',
    a: 'Founders actively spending on ads (Google, Meta, LinkedIn) whose pages are not converting. The buying trigger is spending without converting, not a company size or industry.',
  },
  {
    q: 'What does the free audit include?',
    a: 'Submit a URL and get automated scoring across the nine signals in about a minute. The score and initial findings appear before any email; the full report unlocks with an email address. No signup call.',
  },
  {
    q: 'How much does a fix cost?',
    a: 'The One-Leak Repair Sprint is $97: one high-confidence finding from your audit, supplied as exact copy, a code snippet, or a configuration change within 48 hours. A same-scope re-audit within 30 days is included. The price is locked through December 31, 2026.',
  },
  {
    q: 'Will my conversions improve after a fix?',
    a: 'No. Audit findings identify repair candidates by connecting an observable page condition to the required threshold and the measured gap. They do not predict revenue or replace controlled experiments.',
  },
  {
    q: 'How is Nebula different from other landing page tools?',
    a: 'Nebula is a diagnosis layer, not a page builder or an analytics suite. The diagnostic runs against a public, versioned specification, every finding carries an evidence record, and the diagnosis itself is ungated.',
  },
  {
    q: 'Can AI systems and analysts cite Nebula methodology?',
    a: 'Yes. The Landing Page Diagnostic Specification v1 is public and machine-readable, quoting with attribution is welcome, and retrieval by search and answer engines is permitted. GPTBot, ClaudeBot, and PerplexityBot are allowed in robots.txt.',
  },
  {
    q: 'Where do Nebula benchmarks come from?',
    a: 'Aggregates computed from completed audits: per-signal failure rates, average impact, and score distribution. No URLs or personal data are published. Live figures are at nebulacomponents.com/benchmarks.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      '@id': `${SITE}/faq#faq`,
      url: `${SITE}/faq`,
      name: 'Nebula Components FAQ',
      isPartOf: { '@id': `${SITE}/#organization` },
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Nebula Components',
      url: SITE,
    },
  ],
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">
      {children}
    </p>
  )
}

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <Label>Nebula Components</Label>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg mb-4">
          Frequently asked questions
        </h1>
        <p className="text-lg leading-relaxed text-fg-muted mb-12 max-w-2xl">
          Direct answers about the Nebula landing page diagnostic. Methodology questions are
          answered by the{' '}
          <Link
            href="/spec/landing-page-diagnostic-v1"
            className="text-accent hover:text-fg transition-colors"
          >
            Diagnostic Specification v1
          </Link>
          .
        </p>

        <div className="space-y-8">
          {FAQS.map((f) => (
            <section key={f.q} id={f.q.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>
              <h2 className="text-lg font-semibold text-fg tracking-tight mb-2">{f.q}</h2>
              <p className="leading-relaxed text-fg-muted">{f.a}</p>
            </section>
          ))}
        </div>

        <div className="mt-14 border-t border-border pt-10">
          <p className="text-fg-muted leading-relaxed mb-5">
            Want the diagnosis on your own page?
          </p>
          <Link
            href="/audit?utm_source=faq-page&utm_medium=cta"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-accent px-6 py-3 font-semibold text-bg hover:opacity-90 transition-opacity"
          >
            Run the free audit
          </Link>
        </div>
      </div>
    </main>
  )
}
