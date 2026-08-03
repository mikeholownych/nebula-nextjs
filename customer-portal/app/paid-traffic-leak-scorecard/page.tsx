import type { Metadata } from 'next'
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
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg md:text-5xl">
            Before you raise ad spend, find out whether the page is leaking the clicks.
          </h1>
          <p className="mt-5 text-lg leading-8 text-fg-muted">
            Use this seven-question scorecard to identify conversion conditions worth inspecting. Then run the measured audit on your actual landing page.
          </p>
        </div>

        <ScorecardClient />

        <section className="mt-20 border-t border-border pt-12" aria-labelledby="scorecard-faq-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Questions</p>
          <h2 id="scorecard-faq-heading" className="mt-2 text-2xl font-bold tracking-tight text-fg">About this scorecard</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-bg-muted/15">
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
