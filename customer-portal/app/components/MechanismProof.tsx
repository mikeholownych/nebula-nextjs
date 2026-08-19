import { SIGNAL_COUNT } from '@/config/signals'

const CAN_OBSERVE = [
  'Whether your H1 matches the ad that sent the click',
  'Whether a CTA is visible before scrolling',
  'Whether trust signals exist near the first action',
  'Whether the page loads fast enough to retain mobile visitors',
  'Whether structured data supports AI citation',
  `Pass/fail state for each of ${SIGNAL_COUNT} signals with raw evidence`,
  'Whether a repaired condition held after 30 days',
]

const CANNOT_PROVE = [
  'That fixing a signal will increase your conversion rate',
  'That your traffic quality is sufficient for any page to convert',
  'That your offer has product-market fit',
  'Revenue outcomes from page changes alone',
  'Statistical significance without controlled traffic and a measurement window',
]

export default function MechanismProof() {
  return (
    <section className="section-default">
      <div className="mx-auto max-w-5xl">
        <h2 className="heading-2 mb-3 text-center">
          What Nebula can prove today.
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-base text-fg-muted">
          Transparency about what the audit measures and where its evidence boundary ends.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">
              Observable &amp; verifiable
            </h3>
            <ul className="space-y-3">
              {CAN_OBSERVE.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-fg-muted leading-6">
                  <span className="mt-0.5 shrink-0 text-accent font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-border bg-bg-surface p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-fg-dim">
              Outside our evidence boundary
            </h3>
            <ul className="space-y-3">
              {CANNOT_PROVE.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-fg-muted leading-6">
                  <span className="mt-0.5 shrink-0 text-signal-fail font-bold">✕</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-fg-dim leading-5">
              Any service that claims to guarantee conversion lift without controlled A/B traffic
              and a measurement window is making a claim they cannot substantiate.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
