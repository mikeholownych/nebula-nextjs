import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Intent Aware Audit | Nebula Components',
  description:
    'Audit pages according to what they are for. Nebula classifies paid landing pages, SEO content, FAQs, explainers, comparisons, and checkout pages before suggesting relevant fixes.',
  alternates: { canonical: 'https://nebulacomponents.com/page-intent-aware-audit' },
}

const intents = [
  ['Paid landing page', 'Message match, above-fold clarity, trust, CTA, mobile, and page-side ad conditions.'],
  ['SEO content', 'Heading hierarchy, metadata, content depth, internal linking, schema, and entity clarity.'],
  ['FAQ or support page', 'Question coverage, answer clarity, navigation, and structured content.'],
  ['Product explainer', 'Product understanding, proof, action clarity, structured signals, and objections.'],
  ['Comparison page', 'Comparative framing, decision criteria, evidence, and the next action.'],
  ['Checkout page', 'Offer clarity, friction, trust, and the conditions visible before completion.'],
]

export default function PageIntentAwareAudit() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 text-fg">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Page intent aware diagnostics</p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">The right audit depends on what the page is for</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">A FAQ page is not a paid landing page. An SEO article is not a checkout. Nebula classifies page intent before findings are created, so recommendations reflect the page's job instead of applying one generic checklist everywhere.</p>
        <a href="/audit?utm_source=page-intent&utm_medium=organic" className="mt-8 inline-block rounded bg-accent px-6 py-3 text-sm font-semibold text-bg">Run a free audit</a>
      </section>

      <section className="border-y border-border bg-bg-panel px-6 py-14">
        <div className="mx-auto max-w-5xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Intent categories</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Signals are scoped to the page's purpose</h2><div className="mt-8 grid gap-4 md:grid-cols-2">{intents.map(([title, body]) => <article key={title} className="rounded-xl border border-border bg-bg-surface p-5"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-fg-muted">{body}</p></article>)}</div></div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14"><h2 className="text-3xl font-semibold tracking-tight">What changes when intent is known?</h2><div className="mt-7 rounded-xl border border-border bg-bg-elevated p-6 text-sm leading-7 text-fg-muted"><p>A page with a non-conversion purpose should not receive a conversion finding just because it lacks a landing-page pattern. Intent-aware scoring suppresses irrelevant signals and keeps the evidence tied to the page's role.</p><p className="mt-4">The detected intent is stored with the audit. If the classifier is wrong, a workspace user can override it and re-run the relevant findings sync.</p></div></section>

      <section className="mx-auto max-w-5xl px-6 pb-20"><div className="rounded-xl border border-border bg-bg-panel p-7"><h2 className="text-2xl font-semibold">A diagnosis should explain its assumptions</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">Nebula reports observable evidence and makes the page-purpose assumption visible. It does not infer revenue, audience fit, or offer economics from HTML alone.</p><a href="/resources/citable" className="mt-5 inline-block text-sm font-semibold text-accent">See the evidence layer behind the approach →</a></div></section>
    </main>
  )
}
