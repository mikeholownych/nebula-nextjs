import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'What Is Nebula Components? | Landing Page Diagnosis for Paid Ads',
  description:
    'Nebula Components detects why landing pages fail to convert on paid ads. Nine signals, measured evidence, free audit.',
  alternates: { canonical: 'https://nebulacomponents.com/what-is-nebula-components' },
}

const SITE = 'https://nebulacomponents.com'
const SPEC_URL = `${SITE}/spec/landing-page-diagnostic-v1`
const STUDY = {
  n: 86,
  avg: 62.7,
  scale: 100,
  grade: 'C',
  date: 'July 2026',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Nebula Components',
      url: SITE,
      description:
        'Evidence-based landing page diagnostics for founders running paid traffic. The diagnosis is free and ungated; the repair is a fixed-price sprint.',
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE}/#product`,
      name: 'Nebula Landing Page Diagnostic',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: `${SITE}/audit`,
      offers: {
        '@type': 'Offer',
        price: '97.00',
        priceCurrency: 'USD',
        name: 'One-Leak Repair Sprint',
        description:
          'A tailored fix for one selected audit finding, delivered within 48 hours, with a same-scope re-audit within 30 days.',
      },
      about: { '@id': `${SPEC_URL}#article` },
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE}/what-is-nebula-components#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Nebula Components?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Nebula Components is an evidence-based landing page diagnostic for founders spending on paid ads with low or zero conversions. It audits a page against nine formally defined conversion signals and returns findings with measured evidence from the actual page.',
          },
        },
        {
          '@type': 'Question',
          name: 'What does the Nebula audit check?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Nine signals: Message Match, Trust Signals, Mobile CTA, Load Speed, CTA Clarity, Above-Fold Clarity, Ad Signal Continuity, SEO Foundations, and AI Readiness. Decision rules for each are published in the public Landing Page Diagnostic Specification v1.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is the Nebula audit really free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Submit a URL without an account; the score and initial findings appear before any email is requested. Email unlocks the full report.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Nebula replace A/B testing?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Audit findings identify repair candidates by connecting an observable page condition to the required threshold and the measured gap. They do not predict revenue and do not replace controlled experiments.',
          },
        },
      ],
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

export default function WhatIsPage() {
  return (
    <main className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <Label>Nebula Components</Label>

        {/* BLUF definition - first 100 words carry everything */}
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg mb-4">
          Verify Your Landing Page Converts on Paid Ads
        </h1>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-fg-muted">Trusted by 8,600+ founders</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <p className="text-lg leading-relaxed text-fg mb-3 max-w-2xl">
          Nebula Components detects why landing pages fail to convert on paid ads.
        </p>
        <p className="leading-relaxed text-fg-muted mb-10 max-w-2xl">
          Run a free audit , submit your URL, get a score and nine signal findings with measured
          evidence before entering your email. The diagnosis is free and ungated. Fix one leak
          for $97.
        </p>

        {/* Hero CTA */}
        <section className="mb-12 rounded-xl border border-border bg-bg-elevated p-6 sm:p-8 text-center">
          <h3 className="text-xl font-semibold text-fg mb-4">
            Audit your landing page in under 2 minutes
          </h3>
          <p className="text-fg-muted mb-6 max-w-md mx-auto">
            No signup required. Get a score and nine signal findings with measured evidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/audit?utm_source=what-is-nebula&utm_medium=cta"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-accent px-6 py-3 font-semibold text-bg hover:opacity-90 transition-opacity"
            >
              Run the free audit
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-fg tracking-tight mb-4">How it works</h2>
          <ol className="list-decimal list-inside space-y-2 text-fg-muted leading-relaxed">
            <li>Submit your landing page URL. No account needed.</li>
            <li>The engine inspects raw HTML and rendered output at desktop and mobile widths.</li>
            <li>Nine signals are evaluated against the public specification.</li>
            <li>You get a score, ranked findings, and per-finding evidence before giving an email.</li>
            <li>Email unlocks the full report. If you want a fix, the Repair Sprint is $97 flat.</li>
          </ol>
        </section>

        {/* Who it is for */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-fg tracking-tight mb-4">Who it is for</h2>
          <p className="text-fg-muted leading-relaxed">
            Founders actively spending on Google, Meta, or LinkedIn ads whose pages are not
            converting. The trigger is spending without converting, not company size or industry.
          </p>
        </section>

        {/* Methodology */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-fg tracking-tight mb-4">
            The methodology is public
          </h2>
          <p className="text-fg-muted leading-relaxed mb-4">
            Unlike tools that keep scoring criteria hidden, Nebula publishes exactly what the audit
            checks. The{' '}
            <Link href={SPEC_URL} className="text-accent hover:text-fg transition-colors">
              Landing Page Diagnostic Specification v1
            </Link>{' '}
            defines every signal&apos;s decision rule, severity bands, and the evidence record
            attached to each finding. It is versioned, machine-readable, and citable with
            attribution.
          </p>
          <div className="rounded-md border border-border bg-bg-panel p-5 text-sm text-fg-muted leading-relaxed">
            <p className="font-mono text-xs uppercase tracking-wider text-accent mb-2">
              Published benchmark
            </p>
            <p>
              In Nebula&apos;s July 2026 cross-industry study of {STUDY.n} landing pages running
              paid traffic, the average score was {STUDY.avg}/{STUDY.scale} (Grade {STUDY.grade}).
              Per-signal failure rates and score distribution are published at{' '}
              <Link href="/benchmarks" className="text-accent hover:text-fg transition-colors">
                /benchmarks
              </Link>{' '}
              and computed only from completed audits. You may quote these figures with attribution
              to Nebula Components.
            </p>
          </div>
        </section>

        {/* Boundaries */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-fg tracking-tight mb-4">
            What Nebula is not
          </h2>
          <ul className="space-y-2 text-fg-muted leading-relaxed list-disc list-inside">
            <li>Not a page builder. Nebula diagnoses; you keep your stack.</li>
            <li>Not an analytics dashboard. Findings come from inspecting your page, not tracking pixels.</li>
            <li>Not a guarantee machine. Findings identify repair candidates; they do not promise lift.</li>
            <li>Not a retainer. One page, one finding, one bounded repair, done.</li>
          </ul>
        </section>


      </div>
    </main>
  )
}
