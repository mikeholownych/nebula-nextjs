import Link from 'next/link'

const WITHOUT = [
  { label: 'Open Stripe', detail: 'See $0. Again.' },
  { label: 'Change the ad', detail: 'Same result. Better CTR, still no sales.' },
  { label: 'Rewrite the headline', detail: 'Spend a day on copy. Conversions flat.' },
  { label: 'Blame the audience', detail: '"Maybe my ICP is wrong." It\'s not.' },
  { label: 'Keep paying', detail: '$500–$3,000/month into a page that can\'t close.' },
]

const WITH = [
  { label: 'See the exact leak', detail: 'Score + 3 specific findings. Your page. 2 minutes.' },
  { label: 'Know what to fix first', detail: 'Ranked by conversion impact, not gut feel.' },
  { label: 'Fix it for $97', detail: '48-hour implementation. Same ad spend. Page that closes.' },
  { label: 'Stop guessing', detail: 'The anxiety of not knowing what\'s wrong - gone.' },
  { label: 'Run better campaigns', detail: 'Traffic into a page that\'s built for cold visitors.' },
]

export default function WithWithout() {
  return (
    <section className="border-b border-border px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            The cost of inaction
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">
            Two versions of the next 30 days.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Without */}
          <div className="rounded-xl border border-signal-fail/30 bg-signal-fail/5 p-6">
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-signal-fail">
              Without Nebula
            </p>
            <ul className="flex flex-col gap-4">
              {WITHOUT.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-signal-fail text-sm font-bold">✕</span>
                  <div>
                    <p className="text-sm font-semibold text-fg">{item.label}</p>
                    <p className="text-xs text-fg-muted leading-5">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* With */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-6">
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-accent">
              With Nebula
            </p>
            <ul className="flex flex-col gap-4">
              {WITH.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-accent text-sm font-bold">✓</span>
                  <div>
                    <p className="text-sm font-semibold text-fg">{item.label}</p>
                    <p className="text-xs text-fg-muted leading-5">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/audit?utm_source=with-without&utm_medium=homepage"
            className="inline-block rounded-xl bg-accent px-8 py-3.5 font-semibold text-bg hover:bg-accent-light transition-colors text-sm"
          >
            Get My Free Score - 2 Minutes &rarr;
          </Link>
          <p className="mt-2 text-xs text-fg-muted">No signup. No card. Just your page and its score.</p>
        </div>
      </div>
    </section>
  )
}
