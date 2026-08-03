import type { Metadata } from 'next'
import ScorecardClient from './ScorecardClient'

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
      </div>
    </main>
  )
}
