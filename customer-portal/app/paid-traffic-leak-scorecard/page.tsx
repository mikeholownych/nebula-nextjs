import type { Metadata } from 'next'
import Link from 'next/link'
import ScorecardClient from './ScorecardClient'
import { scorecardFaqItems } from './scorecardFaq'

export const metadata: Metadata = {
  title: 'Paid-Traffic Leak Scorecard | Nebula Components',
  description: "Answer seven focused questions before you buy more paid traffic. Find which landing-page conversion conditions need inspection, then run Nebula's free evidence-backed audit.",
  alternates: { canonical: 'https://nebulacomponents.com/paid-traffic-leak-scorecard' },
  openGraph: {
    title: 'Paid-Traffic Leak Scorecard | Nebula Components',
    description: "Answer seven focused questions before you buy more paid traffic. Find which landing-page conversion conditions need inspection, then run Nebula's free evidence-backed audit.",
    url: 'https://nebulacomponents.com/paid-traffic-leak-scorecard',
    siteName: 'Nebula Components',
    locale: 'en_US',
    type: 'website',
  },
}

export default function PaidTrafficLeakScorecardPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg px-6 pb-20 pt-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Nebula Components</p>
          <h1 className="heading-1 text-fg">Discover Where Your Paid Traffic Is Leaking Before Scaling Spend</h1>
          <p className="mt-5 text-lg leading-8 text-fg-muted">
            Use this seven-question scorecard to identify conversion conditions worth inspecting. Then run the measured audit on your actual landing page.
          </p>
          <Link
            href="/downloads/paid-traffic-leak-scorecard.pdf"
            download
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 transition hover:decoration-accent"
          >
            Download the printable worksheet (PDF) <span aria-hidden="true">-&gt;</span>
          </Link>
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/audit?utm_source=scorecard-hero&utm_medium=hero-cta"
              className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
            >
              Get your free audit →
            </Link>
            <Link
              href="/repair-sprint"
              className="inline-flex min-h-[44px] items-center justify-center rounded border border-border px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
            >
              Explore $97 Repair Sprint
            </Link>
          </div>
        </div>

        <ScorecardClient />

        <section className="mt-20 border-t border-border pt-12" aria-labelledby="scorecard-faq-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Questions</p>
          <h2 id="scorecard-faq-heading" className="mt-2 text-2xl font-bold tracking-tight text-fg">About this scorecard</h2>
          <div className="mt-6 divide-y divide-border rounded-md border border-border bg-bg-muted/15">
            {scorecardFaqItems.map((item) => (
              <article key={item.question} className="p-5 md:p-6">
                <h3 className="font-semibold text-fg">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-fg-muted">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: scorecardFaqItems.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
              })),
            }),
          }}
        />
      </div>
    </main>
  )
}
