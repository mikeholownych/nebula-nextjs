import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conversion Rate Optimization Audit | Nebula Components',
  description:
    'A conversion rate optimization audit that identifies observable landing-page leaks before a retainer, redesign, or A/B test. Evidence-backed findings and bounded fixes.',
  alternates: { canonical: 'https://nebulacomponents.com/conversion-rate-optimization-audit' },
}

const principles = [
  ['Diagnose first', 'Inspect the page conditions that visitors encounter before changing traffic, targeting, or bidding.'],
  ['Use evidence', 'Attach each finding to observable page content, structure, or behavior instead of generic advice.'],
  ['Prioritize one change', 'Start with the highest-priority condition rather than producing an unbounded backlog.'],
  ['Re-audit the same scope', 'Verify whether the page condition changed after implementation.'],
]

export default function ConversionRateOptimizationAuditPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 text-fg">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Conversion rate optimization audit</p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">Find the page condition costing conversion before you start a CRO retainer</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">A CRO audit should tell you what is observable, what is failing, and what to change first. Nebula checks landing pages against nine signals and produces evidence-backed findings without claiming a conversion lift it cannot prove from HTML alone.</p>
        <div className="mt-8 flex flex-wrap gap-3"><a href="/audit?utm_source=cro-audit&utm_medium=organic" className="rounded bg-accent px-6 py-3 text-sm font-semibold text-bg">Run a free audit</a><a href="/why-cro-agencies-dont-work" className="rounded border border-border px-6 py-3 text-sm font-semibold text-fg-muted">Why diagnosis comes first</a></div>
      </section>

      <section className="border-y border-border bg-bg-panel px-6 py-14"><div className="mx-auto max-w-5xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">The evidence-first loop</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">A CRO audit should reduce uncertainty</h2><div className="mt-8 grid gap-4 md:grid-cols-2">{principles.map(([title, body]) => <article key={title} className="rounded-xl border border-border bg-bg-surface p-5"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-fg-muted">{body}</p></article>)}</div></div></section>

      <section className="mx-auto max-w-5xl px-6 py-14"><h2 className="text-3xl font-semibold tracking-tight">What the audit checks</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-fg-muted">Nebula checks message match, trust signals, mobile CTA accessibility, load speed, CTA clarity, above-fold clarity, ad signals, SEO foundations, and AI citation readiness. Page intent determines which signals are relevant when the audited page is not a paid landing page.</p><div className="mt-7 rounded-xl border border-border bg-bg-elevated p-6"><h3 className="font-semibold">What it does not claim</h3><p className="mt-3 text-sm leading-7 text-fg-muted">The audit cannot prove audience quality, offer economics, conversion lift, or revenue from page HTML alone. It reports page-side evidence and a bounded next action.</p></div></section>

      <section className="mx-auto max-w-5xl px-6 pb-20"><div className="rounded-xl border border-border bg-bg-panel p-7"><h2 className="text-2xl font-semibold">One diagnosis before ongoing optimization</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">Use the free audit to establish what the page can prove. If one high-confidence condition needs implementation, the $97 One-Leak Repair Sprint provides one bounded artifact and a same-scope re-audit.</p><a href="/audit" className="mt-5 inline-block text-sm font-semibold text-accent">Start with the page audit →</a></div></section>
    </main>
  )
}
