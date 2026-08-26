import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Readiness Checks for Landing Pages | Nebula',
  description:
    'Check whether AI systems can identify, interpret, and cite your landing page accurately. Nebula audits visible content, structured data, entity signals, and evidence boundaries.',
  alternates: { canonical: 'https://nebulacomponents.com/ai-readiness-landing-page-check' },
}

const checks = [
  ['Entity clarity', 'Does the page make the organization, product, audience, and offer understandable from visible content?'],
  ['Structured consistency', 'Do JSON-LD, metadata, Open Graph fields, and visible claims describe the same thing?'],
  ['Evidence boundaries', 'Are claims specific enough to inspect, with limits that prevent unsupported conclusions?'],
  ['Crawl access', 'Can permitted search and answer-engine crawlers reach the page and its supporting resources?'],
  ['Citation surface', 'Are the important answers and definitions present as clear, extractable page content?'],
]

export default function AiReadinessLandingPageCheck() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 text-fg">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">AI readiness for landing pages</p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">Can AI systems understand and cite your landing page?</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">AI visibility starts with a page that is clear, crawlable, and internally consistent. Nebula checks the evidence surface that answer engines can inspect. It does not promise citations or infer visibility from markup alone.</p>
        <div className="mt-8 flex flex-wrap gap-3"><a href="/audit?utm_source=ai-readiness&utm_medium=organic" className="rounded bg-accent px-6 py-3 text-sm font-semibold text-bg">Run a free audit</a><a href="/resources/citable" className="rounded border border-border px-6 py-3 text-sm font-semibold text-fg-muted">Explore Citable</a></div>
      </section>

      <section className="border-y border-border bg-bg-panel px-6 py-14"><div className="mx-auto max-w-5xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Observable checks</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">AI readiness is more than adding JSON-LD</h2><div className="mt-8 grid gap-4 md:grid-cols-2">{checks.map(([title, body]) => <article key={title} className="rounded-xl border border-border bg-bg-surface p-5"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-fg-muted">{body}</p></article>)}</div></div></section>

      <section className="mx-auto max-w-5xl px-6 py-14"><h2 className="text-3xl font-semibold tracking-tight">What this page can prove</h2><div className="mt-7 grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-border bg-bg-elevated p-6"><h3 className="font-semibold text-accent">It can inspect</h3><p className="mt-3 text-sm leading-6 text-fg-muted">Visible answers, entity names, metadata, structured data, crawler policy, and contradictions between claims and evidence.</p></div><div className="rounded-xl border border-border bg-bg-elevated p-6"><h3 className="font-semibold text-signal-fail">It cannot guarantee</h3><p className="mt-3 text-sm leading-6 text-fg-muted">A citation, a ranking, an AI recommendation, or a commercial outcome. Those are external outcomes that require separate measurement.</p></div></div></section>

      <section className="mx-auto max-w-5xl px-6 pb-20"><div className="rounded-xl border border-border bg-bg-panel p-7"><h2 className="text-2xl font-semibold">Make the page easier to understand before optimizing the channel</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">Run the audit, inspect the evidence, then make one bounded change. Re-audit to verify the page condition moved.</p><a href="/audit" className="mt-5 inline-block text-sm font-semibold text-accent">Check a landing page →</a></div></section>
    </main>
  )
}
