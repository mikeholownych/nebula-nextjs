import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../../lib/schema'

export const metadata: Metadata = {
  title: 'Conversion Rate Optimization Tools for Paid Traffic | Nebula',
  description: 'Compare CRO tools by the paid-traffic question they answer, the evidence they expose, and the limits of that evidence.',
  alternates: { canonical: 'https://nebulacomponents.com/learning-centre/topic-guides/conversion-rate-optimization-tools' },
}

const articleSchema = createArticleSchema({
  headline: 'Conversion Rate Optimization Tools for Paid Traffic',
  description: 'A job-to-be-done comparison of page builders, analytics, recordings, experiments, and paid-traffic audits.',
  url: 'https://nebulacomponents.com/learning-centre/topic-guides/conversion-rate-optimization-tools',
  publishedDate: '2026-09-03',
})

const tools = [
  ['Page builders', 'Use when the question is how to construct or edit a page without engineering support. They can expose layout, copy, form, and component settings. They cannot establish that a new layout caused a downstream business result.'],
  ['Analytics tools', 'Use when the question is where visits, devices, sources, and defined actions differ. Segment the paid campaign before reading aggregates. Analytics can show a pattern in recorded events, but missing events and attribution choices limit interpretation.'],
  ['Session recordings', 'Use when the question is how selected visitors navigate, hesitate, scroll, or encounter an interaction problem. Treat recordings as examples, not a representative sample, and redact sensitive form data.'],
  ['Experimentation tools', 'Use when the question is whether two pre-defined page variants differ under a controlled allocation and measurement plan. They require a stable hypothesis, sufficient observations, and guardrails. They do not tell you which page condition to diagnose first.'],
  ['Nebula paid-traffic audit', 'Use when the question is which observable page-side signals deserve attention after an ad click. The audit reads public HTML and page conditions such as message match, proof, CTA, mobile, speed, and form friction. It cannot inspect private campaign settings or prove causality.'],
]

export default function ConversionRateOptimizationToolsPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
    <main id="main-content" className="min-h-screen bg-bg pt-24"><div className="mx-auto max-w-3xl px-6 py-14">
      <Link href="/learning-centre/topic-guides" className="text-sm font-semibold text-accent hover:text-fg">Back to Topic Guides</Link>
      <header className="mt-8 rounded-md border border-border bg-bg-panel p-8 md:p-10"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">Tool Selection · Paid Traffic</p><h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">Conversion Rate Optimization Tools for Paid Traffic</h1><p className="mt-5 text-lg leading-relaxed text-fg-muted">The right CRO tool depends on the question. Build, observe, diagnose, and measure are different jobs, so one tool rarely supplies the whole evidence chain.</p></header>
      <section data-editorial="answer-first" className="mt-6 rounded-md border border-border bg-bg-panel p-8"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">Direct answer</p><h2 className="mb-4 text-2xl font-bold text-fg">Direct answer: select the tool that matches the unknown</h2><p className="leading-relaxed text-fg-muted">Use analytics to locate a paid-traffic pattern, recordings to inspect interaction examples, an audit to prioritize observable page conditions, a builder to make a scoped edit, and an experiment to compare a defined change. Do not use a builder as a diagnosis, or an experiment as a substitute for a clear hypothesis.</p><aside role="note" aria-label="Evidence boundary" className="mt-5 rounded-xl border border-border px-5 py-4 text-sm leading-relaxed text-fg-muted"><strong className="text-fg">Evidence boundary:</strong> each tool supplies a different observation. None alone can prove causality or predict a conversion, ROAS, or revenue outcome. Treat patterns as hypotheses until measurement supports them.</aside><div className="mt-5 flex flex-col gap-2 text-sm"><Link href="/learning-centre/topic-guides/landing-page-conversion-leaks" className="font-semibold text-accent hover:text-fg">Diagnose the seven landing page leak conditions</Link><Link href="/learning-centre/topic-guides/ai-traffic-optimization-vs-landing-page-builders" className="font-semibold text-accent hover:text-fg">Compare AI evidence organization with builders</Link></div></section>
      <section className="mt-6 rounded-md border border-border bg-bg-panel p-8"><h2 className="mb-5 text-2xl font-bold text-fg">Compare tools by job to be done</h2><div className="space-y-5">{tools.map(([title, body]) => <article key={title} className="rounded-xl border border-border p-5"><h3 className="text-lg font-bold text-fg">{title}</h3><p className="mt-3 leading-relaxed text-fg-muted">{body}</p></article>)}</div></section>
      <section className="mt-6 rounded-md border border-border bg-bg-panel p-8"><h2 className="mb-4 text-2xl font-bold text-fg">A practical paid-traffic stack</h2><ol className="space-y-4 text-fg-muted"><li><strong className="text-fg">1. Define the action.</strong> Name the event that matters for this landing page and the campaign segment to inspect.</li><li><strong className="text-fg">2. Locate the pattern.</strong> Use analytics to compare source, device, and page path without blending unlike traffic.</li><li><strong className="text-fg">3. Inspect the page.</strong> Use an audit, browser check, and selected recordings to document observable friction.</li><li><strong className="text-fg">4. Repair narrowly.</strong> Use a builder or developer change for one finding, keeping a before state.</li><li><strong className="text-fg">5. Measure deliberately.</strong> Use an experiment or same-condition comparison with a pre-written interpretation rule.</li></ol></section>
      <section className="mt-6 rounded-md border border-accent/30 bg-accent/5 p-8"><h2 className="text-2xl font-bold text-fg">Start with evidence, not a tool wishlist</h2><p className="mt-3 leading-relaxed text-fg-muted">Run the free Nebula audit to collect page-side findings. If one finding is sufficiently specific, the $97 One-Leak Repair Sprint can frame one repair for you or your developer to implement.</p><Link href="/audit?utm_source=topic-guide-conversion-rate-optimization-tools&utm_medium=organic-content" className="mt-6 inline-flex min-h-[44px] items-center rounded bg-accent px-6 py-3 font-semibold text-bg">Compare your page evidence <span aria-hidden="true">→</span></Link></section>
    </div></main>
  </>
}
