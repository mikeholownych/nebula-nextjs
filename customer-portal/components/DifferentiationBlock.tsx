const DIFFERENCES = [
  {
    label: 'Evidence-grade observation',
    detail: 'Each finding names the page condition, measured value, threshold, and evidence available for review.',
  },
  {
    label: 'No lift claims',
    detail: 'Nebula does not promise conversion lift or revenue improvement from a page diagnosis.',
  },
  {
    label: 'Same-condition re-audit',
    detail: 'The included re-audit checks whether the targeted condition changed after implementation.',
  },
  {
    label: 'Bounded $97 Repair Sprint',
    detail: 'One page, one prioritized condition, one exact copy, code, or configuration artifact.',
  },
] as const

export default function DifferentiationBlock() {
  return (
    <section
      aria-labelledby="how-nebula-differs"
      className="mb-12 rounded-md border border-border bg-bg-panel p-6 md:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">The boundary matters</p>
      <h2 id="how-nebula-differs" className="mt-2 text-2xl font-bold text-fg">
        How Nebula differs
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-muted">
        Nebula turns observable page conditions into a bounded repair path. It does not replace a controlled conversion experiment or claim an outcome the evidence cannot establish.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {DIFFERENCES.map(({ label, detail }) => (
          <li key={label} className="rounded border border-border bg-bg-elevated p-4">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-1 text-accent">+</span>
              <div>
                <h3 className="font-semibold text-fg">{label}</h3>
                <p className="mt-1 text-sm leading-6 text-fg-muted">{detail}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
