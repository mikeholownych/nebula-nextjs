import type { Metadata } from 'next'
import Link from 'next/link'
import { REPAIR_SPRINT_OFFER } from '@/app/lib/self-implementation-kit-offer'
import { REPAIR_GUARANTEE, EARLY_STAGE_DISCLOSURE } from '@/config/repair-guarantee'
import { PRIORITY_SCORE_SHORT } from '@/config/priority-score'
import { SIGNAL_COUNT } from '@/config/signals'
import VisibilityBeacon from '@/components/VisibilityBeacon'

export const metadata: Metadata = {
  title: 'Repair Sprint - One Page, One Condition, One Fix | Nebula',
  description:
    'The $97 Repair Sprint: Nebula identifies your highest-priority failed condition and delivers the exact fix - copy, code, or configuration. 30-day re-audit included.',
  alternates: { canonical: 'https://nebulacomponents.com/repair-sprint' },
}

export default function RepairSprintPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 pb-24">
      <div className="mx-auto max-w-3xl px-6">

        {/* Hero */}
        <VisibilityBeacon
          beaconId="repair_sprint_page_hero"
          eventName="repair_sprint_exposed"
          properties={{ offer_key: 'fix_pack', placement: 'repair_sprint_page' }}
        >
        <section className="mb-16">
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-4xl">
            One page. One verified condition. One concrete repair.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-fg-muted leading-relaxed">
            The free audit identifies observable failed conditions on your page. The Repair Sprint
            produces the exact change required for the highest-priority condition - copy, code, or
            configuration written for your specific URL. You implement the change. Nebula re-runs
            the same check afterward.
          </p>
          <p className="mt-3 text-lg font-semibold text-fg">
            ${REPAIR_SPRINT_OFFER.priceUsd} - one-time, no subscription.
          </p>
          <p className="mt-2 text-sm text-fg-dim">
            No conversion lift is promised. The re-audit confirms whether the targeted condition changed.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/audit?utm_source=repair-sprint&utm_medium=internal"
              className="rounded-lg bg-accent px-6 py-3 font-semibold text-bg hover:opacity-85 transition-opacity"
            >
              Run free audit first
            </Link>
            <Link
              href="/repair-sprint/example"
              className="rounded-lg border border-border px-6 py-3 font-semibold text-fg hover:border-accent transition-colors"
            >
              See example artifact
            </Link>
          </div>
        </section>
        </VisibilityBeacon>

        {/* What you get */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-fg mb-4">What you receive</h2>
          <ul className="space-y-3 text-fg-muted">
            {[
              'Validation of the selected finding against your live page',
              'Exact replacement copy, code snippet, or configuration change - not "consider improving X"',
              'Scoped rationale explaining why this specific change addresses the failed condition',
              'Implementation location - which element, file, or CMS field to change',
              'Before-state evidence (what Nebula observed at audit time)',
              'After-state validation criteria (what PASS looks like for this condition)',
              'Same-scope re-audit within 30 days to verify the condition changed',
              'Rollback guidance where the change carries known side-effect risk',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-6">
                <span className="mt-0.5 shrink-0 text-accent font-bold">+</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* What Nebula does vs. what you do */}
        <section className="mb-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-fg mb-3">What Nebula does</h3>
            <ul className="space-y-2 text-sm text-fg-muted">
              <li>Validates the targeted condition against your live page</li>
              <li>Prepares the repair artifact (copy, code, or config)</li>
              <li>Identifies exact implementation scope</li>
              <li>Delivers within 48 hours of payment</li>
              <li>Re-tests the same condition after you implement</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-fg mb-3">What you do</h3>
            <ul className="space-y-2 text-sm text-fg-muted">
              <li>Implement the supplied change on your page</li>
              <li>Retain full production control - Nebula never accesses your CMS, hosting, or repo</li>
              <li>Request the re-audit when ready (within 30 days)</li>
              <li>Decide whether to address additional findings</li>
            </ul>
          </div>
        </section>

        {/* Not included */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-fg mb-4">Not included</h2>
          <ul className="space-y-2 text-sm text-fg-muted">
            {[
              'Full redesign or multi-page work',
              'Funnel rebuild or offer repositioning',
              'Ad management or traffic optimization',
              'Analytics remediation (unless the finding is specifically an analytics condition)',
              'Backend conversion flows',
              'Guaranteed conversion lift or revenue improvement',
              'Unlimited revisions',
              'Production deployment by Nebula - you implement the change',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-fg-dim">-</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Acceptance criteria */}
        <section className="mb-14 rounded-lg border border-border bg-bg-surface/50 p-6">
          <h2 className="text-xl font-bold text-fg mb-3">Acceptance criteria</h2>
          <p className="text-sm text-fg-muted leading-7">
            The Repair Sprint is complete when the agreed repair artifact has been delivered and you
            have sufficient implementation instructions to apply it. If you apply the supplied change
            as specified, Nebula can re-run the same rule to determine whether the targeted condition
            moved from FAIL to PASS.
          </p>
        </section>

        {/* Repair Guarantee */}
        <section className="mb-14 rounded-lg border border-accent/30 bg-accent/5 p-6">
          <h2 className="text-xl font-bold text-fg mb-3">{REPAIR_GUARANTEE.title}</h2>
          <p className="text-sm text-fg-muted leading-7 mb-4">
            {REPAIR_GUARANTEE.statement}
          </p>
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-fg-muted hover:text-fg transition-colors">
              Exclusions
            </summary>
            <ul className="mt-3 space-y-1.5 text-fg-dim">
              {REPAIR_GUARANTEE.exclusions.map((e) => (
                <li key={e} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">·</span>
                  {e}
                </li>
              ))}
            </ul>
          </details>
          <p className="mt-4 text-xs text-fg-dim">
            {REPAIR_GUARANTEE.evidenceBoundary}
          </p>
        </section>

        {/* Priority Score explanation */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-fg mb-3">How findings are ordered</h2>
          <p className="text-sm text-fg-muted leading-7">
            {PRIORITY_SCORE_SHORT}
          </p>
        </section>

        {/* Product architecture: Audit → Monitor → Repair */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-fg mb-4">Where the Repair Sprint fits</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-fg mb-1">Audit</h3>
              <p className="text-xs text-fg-muted leading-5">Find and inspect observable page conditions. Free, no signup.</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-fg mb-1">Monitor</h3>
              <p className="text-xs text-fg-muted leading-5">Re-run checks continuously and detect regression. Pro membership.</p>
            </div>
            <div className="rounded-lg border border-accent/40 bg-accent/5 p-4">
              <h3 className="font-semibold text-accent mb-1">Repair</h3>
              <p className="text-xs text-fg-muted leading-5">Receive an exact implementation package for one selected condition. $97 one-time.</p>
            </div>
          </div>
        </section>

        {/* Early-stage evidence boundary */}
        <section className="mb-14 rounded-lg border border-border bg-bg-muted/20 p-5">
          <h3 className="text-sm font-semibold text-fg mb-2">Early-stage evidence boundary</h3>
          <p className="text-sm text-fg-muted leading-6">
            {EARLY_STAGE_DISCLOSURE}
          </p>
        </section>

        {/* Platform compatibility */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-fg mb-4">Platform compatibility</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-panel/60">
                  <th className="px-4 py-2 text-left font-semibold text-fg">Platform</th>
                  <th className="px-4 py-2 text-center font-semibold text-fg">Diagnose</th>
                  <th className="px-4 py-2 text-center font-semibold text-fg">Repair artifact</th>
                  <th className="px-4 py-2 text-center font-semibold text-fg">Re-audit</th>
                </tr>
              </thead>
              <tbody className="text-fg-muted">
                {[
                  { platform: 'Static HTML', diagnose: true, repair: true, reaudit: true },
                  { platform: 'WordPress', diagnose: true, repair: true, reaudit: true },
                  { platform: 'Shopify', diagnose: true, repair: true, reaudit: true },
                  { platform: 'Webflow', diagnose: true, repair: true, reaudit: true },
                  { platform: 'Next.js / React', diagnose: true, repair: true, reaudit: true },
                  { platform: 'Framer', diagnose: true, repair: 'scoped', reaudit: true },
                  { platform: 'SPA (client-rendered)', diagnose: 'conditional', repair: 'conditional', reaudit: 'conditional' },
                ].map((row) => (
                  <tr key={row.platform} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2">{row.platform}</td>
                    <td className="px-4 py-2 text-center">
                      {row.diagnose === true ? <span className="text-accent">&#10003;</span> : <span className="text-fg-dim">{row.diagnose}</span>}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {row.repair === true ? <span className="text-accent">&#10003;</span> : <span className="text-fg-dim">{row.repair}</span>}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {row.reaudit === true ? <span className="text-accent">&#10003;</span> : <span className="text-fg-dim">{row.reaudit}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-fg-dim">
            &ldquo;Conditional&rdquo; = requires server-rendered HTML or pre-render for accurate diagnosis. Fully client-rendered SPAs may need manual review.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center border-t border-border pt-12">
          <h2 className="text-2xl font-bold text-fg mb-3">
            Start with the free audit.
          </h2>
          <p className="text-fg-muted mb-6">
            See your {SIGNAL_COUNT} signals scored before deciding whether to purchase a Repair Sprint.
          </p>
          <Link
            href="/audit?utm_source=repair-sprint&utm_medium=internal"
            className="inline-block rounded-lg bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 transition-opacity"
          >
            Run Free Audit
          </Link>
        </section>

      </div>
    </main>
  )
}
