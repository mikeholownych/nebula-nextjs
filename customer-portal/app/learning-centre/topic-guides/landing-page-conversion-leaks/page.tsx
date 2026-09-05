import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../../lib/schema'

export const metadata: Metadata = {
  title: 'Landing Page Conversion Leaks in Paid Traffic | Nebula',
  description: 'Diagnose observable landing page conditions that can interrupt a paid visitor journey, then choose one repair and one measurement.',
  alternates: { canonical: 'https://nebulacomponents.com/learning-centre/topic-guides/landing-page-conversion-leaks' },
}

const articleSchema = createArticleSchema({
  headline: 'Landing Page Conversion Leaks in Paid Traffic',
  description: 'A diagnostic guide to observable message, clarity, CTA, proof, mobile, speed, and form conditions on paid-traffic landing pages.',
  url: 'https://nebulacomponents.com/learning-centre/topic-guides/landing-page-conversion-leaks',
  publishedDate: '2026-09-03',
})

const checks = [
  ['Message match', 'Copy the ad promise beside the first viewport. Compare the audience, problem, offer, and next step. If the nouns change, record a message-match hypothesis and test the smallest copy revision.'],
  ['Headline clarity', 'Ask a cold reader to name what is offered, for whom, and what happens next after five seconds. If they cannot, shorten the headline and move the specific offer nearer the top.'],
  ['CTA visibility', 'Load the page at the device and viewport used by the campaign. Record whether the primary action is visible, named clearly, and reachable without hunting through navigation.'],
  ['Proof', 'Check whether proof is specific, attributed, current, and relevant to the paid audience. Missing or generic proof is an observation, not evidence that it caused an exit.'],
  ['Mobile layout', 'Inspect a real phone at the campaign landing URL. Look for clipped text, horizontal overflow, tiny tap targets, buried CTAs, and a hero that displaces the promise.'],
  ['Load speed', 'Run a mobile performance check and record the largest contentful element, blocking scripts, and image weight. Separate a technical finding from the visitor action it might affect.'],
  ['Form friction', 'Count required fields, error states, unclear labels, and unexpected steps. Remove only fields that are not needed for the next action, then measure completion under the same traffic conditions.'],
]

export default function LandingPageConversionLeaksPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre/topic-guides" className="text-sm font-semibold text-accent hover:text-fg">Back to Topic Guides</Link>
        <header className="mt-8 rounded-md border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">Paid Traffic Diagnosis</p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">Landing Page Conversion Leaks in Paid Traffic</h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-muted">A paid click is a handoff, not a conclusion. Inspect the page conditions that can interrupt the handoff before changing targeting, bids, or creative.</p>
        </header>
        <section data-editorial="answer-first" className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">Direct answer</p>
          <h2 className="mb-4 text-2xl font-bold text-fg">Direct answer: find the first broken handoff</h2>
          <p className="leading-relaxed text-fg-muted">Start with the promise in the ad, then inspect headline clarity, CTA visibility, proof, mobile layout, load speed, and form friction. Record the first observable mismatch as a hypothesis, repair one condition, and re-check before interpreting campaign results.</p>
          <aside role="note" aria-label="Evidence boundary" className="mt-5 rounded-xl border border-border px-5 py-4 text-sm leading-relaxed text-fg-muted"><strong className="text-fg">Evidence boundary:</strong> a page inspection can identify conditions and support a causality hypothesis. It does not prove which condition caused a conversion change, and no diagnosis promises a conversion, ROAS, or revenue outcome.</aside>
          <div className="mt-5 flex flex-col gap-2 text-sm">
            <Link href="/learning-centre/topic-guides/conversion-rate-optimization-tools" className="font-semibold text-accent hover:text-fg">Choose conversion rate optimization tools by job</Link>
            <Link href="/learning-centre/topic-guides/ad-spend-roi-improvement" className="font-semibold text-accent hover:text-fg">Use a controlled paid traffic test sequence</Link>
          </div>
        </section>
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Seven observable leak checks</h2>
          <p className="leading-relaxed text-fg-muted">Use the same campaign URL, device context, and offer while checking each condition. Capture a screenshot or exact copy so another person can reproduce the observation.</p>
          <div className="mt-6 space-y-5">{checks.map(([title, body], index) => <article key={title} className="rounded-xl border border-border p-5"><p className="text-xs font-bold uppercase tracking-widest text-accent">Check {String(index + 1).padStart(2, '0')}</p><h3 className="mt-2 text-lg font-bold text-fg">{title}</h3><p className="mt-3 leading-relaxed text-fg-muted">{body}</p></article>)}</div>
        </section>
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Turn findings into one safe next action</h2>
          <ol className="space-y-4 text-fg-muted"><li><strong className="text-fg">1. Freeze the baseline.</strong> Save the ad, landing URL, device split, primary action, and measurement window.</li><li><strong className="text-fg">2. Rank by proximity.</strong> Prefer the earliest mismatch a visitor encounters, not the easiest cosmetic edit.</li><li><strong className="text-fg">3. Scope one repair.</strong> Change one condition and keep campaign settings stable where possible.</li><li><strong className="text-fg">4. Re-audit and measure.</strong> Confirm the page condition changed, then compare the defined action under comparable traffic. A result can support or weaken the hypothesis, but it cannot establish a universal rule.</li></ol>
        </section>
        <section className="mt-6 rounded-md border border-accent/30 bg-accent/5 p-8"><h2 className="text-2xl font-bold text-fg">Need a prioritized page check?</h2><p className="mt-3 leading-relaxed text-fg-muted">Run a free audit for observable findings, then decide whether one high-confidence issue merits the $97 One-Leak Repair Sprint. You or your developer implements the scoped change.</p><Link href="/audit?utm_source=topic-guide-landing-page-conversion-leaks&utm_medium=organic-content" className="mt-6 inline-flex min-h-[44px] items-center rounded bg-accent px-6 py-3 font-semibold text-bg">Run the landing page leak audit <span aria-hidden="true">→</span></Link></section>
      </div>
    </main>
  </>
}
