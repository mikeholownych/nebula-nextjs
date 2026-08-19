import Link from 'next/link'

const DIMENSIONS = [
  { label: 'Free audit available', nebula: true, typical: false },
  { label: 'No signup required to see results', nebula: true, typical: false },
  { label: 'Page evidence exposed with each finding', nebula: true, typical: false },
  { label: 'Rule-based scoring disclosed', nebula: true, typical: false },
  { label: 'Same-scope re-audit included', nebula: true, typical: false },
  { label: 'Exact implementation artifact (not advice)', nebula: true, typical: false },
  { label: 'Customer retains production control', nebula: true, typical: true },
  { label: 'Recurring monitoring available', nebula: true, typical: true },
  { label: 'Public methodology', nebula: true, typical: false },
]

export default function StackTaxComparison() {
  return (
    <section className="border-b border-border bg-bg-surface px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">
            What Nebula exposes that most audits do not.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-fg-muted">
            This compares observable product mechanics - not estimated competitor costs or delivery timelines.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-panel/60">
                <th className="px-4 py-3 text-left font-semibold text-fg">Dimension</th>
                <th className="px-4 py-3 text-center font-semibold text-accent">Nebula</th>
                <th className="px-4 py-3 text-center font-semibold text-fg-muted">Typical audit service</th>
              </tr>
            </thead>
            <tbody>
              {DIMENSIONS.map((d) => (
                <tr key={d.label} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3 text-fg-muted">{d.label}</td>
                  <td className="px-4 py-3 text-center">
                    {d.nebula ? (
                      <span className="text-accent font-bold">&#10003;</span>
                    ) : (
                      <span className="text-fg-dim">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {d.typical ? (
                      <span className="text-fg-muted">Varies</span>
                    ) : (
                      <span className="text-fg-dim">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center text-xs text-fg-dim">
          &ldquo;Typical audit service&rdquo; reflects common patterns observed across agency and SaaS audit products. Individual services vary.
        </p>

        <div className="mt-8 text-center">
          <Link
            href="/audit?utm_source=comparison_table&utm_medium=homepage"
            className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-bg hover:opacity-85 transition-opacity"
          >
            Run the free audit and compare
          </Link>
        </div>
      </div>
    </section>
  )
}
