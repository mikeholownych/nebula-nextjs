import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ecommerce Landing Page Audit for Paid Traffic | Nebula',
  description:
    'Find page-side conversion leaks on ecommerce landing pages running paid traffic. Nebula checks observable message, trust, CTA, mobile, speed, SEO, and AI signals.',
  alternates: { canonical: 'https://nebulacomponents.com/ecommerce-landing-page-audit' },
}

const checks = [
  ['Message match', 'Does the page confirm the promise that brought the shopper from the ad?'],
  ['Trust near action', 'Can a first-time visitor find proof, policy clarity, and risk reduction near the primary action?'],
  ['Mobile action', 'Can a mobile visitor understand the offer and complete the next step without hunting?'],
  ['Load conditions', 'Does the page stay usable while the visitor is waiting for the page to render?'],
  ['Search and AI signals', 'Are the title, visible hierarchy, structured data, and entity signals consistent?'],
]

export default function EcommerceLandingPageAudit() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 text-fg">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Ecommerce paid traffic diagnosis</p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">Ecommerce landing page audit for paid traffic that is not converting</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">Before changing targeting or bidding, inspect the page the shopper actually sees. Nebula reads public HTML and identifies observable conditions that can interrupt the path from ad click to action.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/audit?utm_source=ecommerce-audit&utm_medium=organic" className="rounded bg-accent px-6 py-3 text-sm font-semibold text-bg">Run a free audit</a>
          <a href="/repair-sprint" className="rounded border border-border px-6 py-3 text-sm font-semibold text-fg-muted">See the $97 repair sprint</a>
        </div>
      </section>

      <section className="border-y border-border bg-bg-panel px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">What the audit checks</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Page conditions before platform changes</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {checks.map(([title, body]) => <article key={title} className="rounded-xl border border-border bg-bg-surface p-5"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-fg-muted">{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="text-3xl font-semibold tracking-tight">What this audit can and cannot prove</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-elevated p-6"><h3 className="font-semibold text-accent">It can show</h3><p className="mt-3 text-sm leading-6 text-fg-muted">Observable page evidence, failed signals, the affected URL, and a prioritized condition to inspect or change.</p></div>
          <div className="rounded-xl border border-border bg-bg-elevated p-6"><h3 className="font-semibold text-signal-fail">It cannot show</h3><p className="mt-3 text-sm leading-6 text-fg-muted">Whether the audience, offer economics, creative, or campaign settings will produce profitable revenue. Those require downstream data.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="rounded-xl border border-border bg-bg-panel p-7"><h2 className="text-2xl font-semibold">A page diagnosis, not a retainer</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">Start with the free audit. If one high-confidence page condition deserves implementation, the One-Leak Repair Sprint delivers one bounded artifact and a same-scope re-audit. No conversion lift is promised.</p><a href="/why-cro-agencies-dont-work" className="mt-5 inline-block text-sm font-semibold text-accent">Why diagnosis comes before a CRO retainer →</a></div>
      </section>
    </main>
  )
}
