import {
  citableProofRecords,
  type CitableProofStatus,
} from '@/app/resources/citable/content'

const statusLabels: Record<CitableProofStatus, string> = {
  documented: 'Documented',
  unknown: 'Unknown',
  not_published: 'Not published',
}

export function CitableProofPanel() {
  return (
    <section aria-labelledby="citable-proof-heading" className="mt-12 border-t border-border pt-10">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
        Proof boundary
      </p>
      <h2 id="citable-proof-heading" className="mt-3 text-2xl font-bold tracking-tight text-fg">
        What this site can document now
      </h2>
      <div className="mt-4 max-w-3xl space-y-2 text-base leading-relaxed text-fg-muted">
        <p>Customer cases and benchmark outcomes are not published.</p>
        <p>
          Workflow and deployment verification remain unavailable without a fresh committed receipt.
        </p>
      </div>

      <dl className="mt-7 grid gap-3 md:grid-cols-2">
        {citableProofRecords.map((record) => (
          <div key={record.key} className="rounded-xl border border-border bg-bg-panel p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <dt className="font-semibold text-fg">{record.label}</dt>
              <dd
                className={
                  record.status === 'documented'
                    ? 'text-xs font-semibold uppercase tracking-[0.08em] text-accent'
                    : 'text-xs font-semibold uppercase tracking-[0.08em] text-fg-muted'
                }
              >
                {statusLabels[record.status]}
              </dd>
            </div>
            <dd className="mt-3 text-sm leading-relaxed text-fg-muted">{record.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
