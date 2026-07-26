import type { CitableJobRoute } from '@/app/resources/citable/content'
import { CitablePageShell } from './CitablePageShell'
import { CitableProofPanel } from './CitableProofPanel'

interface CitableJobTemplateProps {
  job: CitableJobRoute
}

function EvidenceList({
  title,
  items,
}: {
  title: string
  items: readonly string[]
}) {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight text-fg">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-border bg-bg-panel px-5 py-4 text-base leading-relaxed text-fg-muted"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function CitableJobTemplate({ job }: CitableJobTemplateProps) {
  return (
    <CitablePageShell route={job}>
      <article className="space-y-12">
        <EvidenceList title="What Citable observes" items={job.observes} />
        <EvidenceList title="Evidence artifacts" items={job.artifacts} />
        <EvidenceList title="What the observation cannot establish" items={job.limits} />

        <section className="rounded-2xl border border-accent/30 bg-bg-panel p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Next operational step
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-fg">Act on the bounded result</h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-fg-muted">{job.nextStep}</p>
        </section>
      </article>

      <CitableProofPanel />
    </CitablePageShell>
  )
}
