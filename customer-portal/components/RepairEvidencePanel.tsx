import Link from 'next/link'

export default function RepairEvidencePanel() {
  return (
    <aside className="rounded-xl border border-border bg-bg-panel/60 p-5 shadow-sm md:p-6" aria-labelledby="repair-evidence-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">What arrives after payment</p>
        <span className="rounded-full border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-dim">Demonstration artifact</span>
      </div>
      <h2 id="repair-evidence-title" className="text-lg font-extrabold text-fg">A concrete repair package, not a generic checklist.</h2>
      <div className="mt-5 space-y-4 text-sm leading-6">
        <div className="border-l-2 border-border pl-3">
          <p className="font-semibold text-fg">Observed condition</p>
          <p className="text-fg-muted">Primary CTA is below the initial 375px mobile viewport.</p>
        </div>
        <div className="border-l-2 border-accent pl-3">
          <p className="font-semibold text-fg">Exact repair artifact</p>
          <p className="text-fg-muted">Replacement CTA copy, the implementation location, and the pass condition for this page.</p>
        </div>
        <div className="border-l-2 border-border pl-3">
          <p className="font-semibold text-fg">Same-condition re-audit</p>
          <p className="text-fg-muted">Nebula re-runs the same check within 30 days to verify whether the condition changed.</p>
        </div>
      </div>
      <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-fg-dim">
        This is a format demonstration, not a customer outcome or performance claim.
      </p>
      <Link href="/repair-sprint/example" className="mt-4 inline-flex text-sm font-semibold text-accent hover:underline">
        See the full example artifact →
      </Link>
    </aside>
  )
}
