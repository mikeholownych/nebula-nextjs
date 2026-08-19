import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Repair Sprint Example Artifact | Nebula',
  description:
    'A demonstration of the Repair Sprint deliverable - showing the full chain from observation to repair artifact to verification.',
  alternates: { canonical: 'https://nebulacomponents.com/repair-sprint/example' },
}

export default function RepairSprintExamplePage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 pb-24">
      <div className="mx-auto max-w-3xl px-6">

        {/* Demonstration label */}
        <div className="mb-8 rounded-lg border border-signal-fail/30 bg-signal-fail/5 px-4 py-3">
          <p className="text-sm font-semibold text-signal-fail">
            Demonstration artifact - not a customer engagement.
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            This example shows the format and depth of a real Repair Sprint deliverable.
            The target page is a publicly audited third-party site used for demonstration only.
          </p>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-fg mb-2">
          Example Repair Sprint Artifact
        </h1>
        <p className="text-fg-muted mb-12">
          Target: <span className="font-mono text-fg">basecamp.com</span> - SEO Foundations finding
        </p>

        {/* Original observation */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-fg mb-3">1. Original observation</h2>
          <p className="text-sm text-fg-muted leading-7">
            The Nebula audit detected that basecamp.com&apos;s {'<title>'} tag contains only
            8 characters (&ldquo;Basecamp&rdquo;), which is below the recommended 30–60 character
            range for search relevance. The meta description runs 185 characters, exceeding the
            ~155-character SERP truncation point. The H1 text is 95 characters, above the 90-character
            heuristic for clean above-fold messaging on mobile viewports.
          </p>
        </section>

        {/* Evidence atom */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-fg mb-3">2. Evidence atom</h2>
          <div className="rounded-lg border border-border bg-bg-panel/60 p-4 font-mono text-xs text-fg-muted leading-6 overflow-x-auto">
            <p>title: &quot;Basecamp&quot; (8 chars)</p>
            <p>meta desc: 185 chars (truncates at ~155 in Google SERP)</p>
            <p>h1: &quot;The refreshingly straightforward project managemen...&quot; (95 chars)</p>
            <p>h1 count: 1</p>
            <p className="mt-2 text-fg-dim">Captured: July 29, 2026 · Static HTML parse</p>
          </div>
        </section>

        {/* Rule */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-fg mb-3">3. Rule</h2>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-fg-muted">
              <span className="font-semibold text-fg">Rule:</span> seo_foundations v2.0
            </p>
            <p className="mt-1 text-sm text-fg-muted">
              <span className="font-semibold text-fg">Check:</span> Title tag between 30–60 chars,
              meta description &le;155 chars, single descriptive H1 under 90 chars.
            </p>
          </div>
        </section>

        {/* Priority */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-fg mb-3">4. Priority Score</h2>
          <div className="rounded-lg border border-border p-4">
            <p className="text-2xl font-bold text-fg">4.0<span className="text-fg-muted text-sm font-normal">/10</span></p>
            <p className="mt-2 text-sm text-fg-muted leading-6">
              <span className="font-semibold text-fg">Journey position:</span> SEO metadata is encountered before the page renders - it determines how the page appears in search results, which precedes even the first viewport.
            </p>
            <p className="mt-1 text-sm text-fg-muted leading-6">
              <span className="font-semibold text-fg">Severity:</span> Title is 86% shorter than minimum threshold. Meta description exceeds limit by 19%.
            </p>
            <p className="mt-1 text-sm text-fg-muted leading-6">
              <span className="font-semibold text-fg">Reproducibility:</span> Deterministic - present in static HTML on every page load.
            </p>
          </div>
          <p className="mt-2 text-xs text-fg-dim">
            Priority Score is a rule-derived ordering heuristic. It is not a prediction of conversion lift or revenue impact.
          </p>
        </section>

        {/* Why this was selected */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-fg mb-3">5. Why this finding was selected</h2>
          <p className="text-sm text-fg-muted leading-7">
            This finding ties for the highest priority score (4.0/10) in the basecamp.com audit,
            alongside Above-Fold Clarity and Ad Tracking. It was selected for this demonstration because:
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-fg-muted">
            <li className="flex items-start gap-2"><span className="mt-0.5 text-accent">·</span>The evidence is independently verifiable (view-source on any browser)</li>
            <li className="flex items-start gap-2"><span className="mt-0.5 text-accent">·</span>The remediation is concrete and bounded - three metadata changes</li>
            <li className="flex items-start gap-2"><span className="mt-0.5 text-accent">·</span>The re-audit can deterministically confirm whether the condition changed</li>
            <li className="flex items-start gap-2"><span className="mt-0.5 text-accent">·</span>It classifies as a &ldquo;Quick Win&rdquo; - low implementation effort, no design dependency</li>
          </ul>
        </section>

        {/* Repair artifact */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-fg mb-3">6. Repair artifact</h2>
          <p className="text-sm text-fg-muted mb-4">
            The following are the exact replacements a buyer would receive:
          </p>

          <div className="space-y-4">
            {/* Title tag */}
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Title tag replacement</p>
              <div className="mb-2">
                <p className="text-xs text-signal-fail font-mono">- &lt;title&gt;Basecamp&lt;/title&gt;</p>
              </div>
              <div>
                <p className="text-xs text-accent font-mono">+ &lt;title&gt;Basecamp - Project Management &amp; Team Communication&lt;/title&gt;</p>
              </div>
              <p className="mt-2 text-xs text-fg-dim">52 chars. Includes brand name + primary keyword + secondary descriptor.</p>
            </div>

            {/* Meta description */}
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Meta description replacement</p>
              <div className="mb-2">
                <p className="text-xs text-signal-fail font-mono break-all">- &lt;meta name=&quot;description&quot; content=&quot;[185 chars - truncated in SERP]&quot;&gt;</p>
              </div>
              <div>
                <p className="text-xs text-accent font-mono break-all">+ &lt;meta name=&quot;description&quot; content=&quot;Basecamp organizes projects, team communication, and schedules in one place. Used by 75,000+ organizations. Start free - no credit card required.&quot;&gt;</p>
              </div>
              <p className="mt-2 text-xs text-fg-dim">153 chars. Within SERP display limit. Includes social proof marker + low-friction CTA.</p>
            </div>

            {/* H1 */}
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">H1 replacement</p>
              <div className="mb-2">
                <p className="text-xs text-signal-fail font-mono break-all">- &lt;h1&gt;The refreshingly straightforward project management system that&apos;s rock-solid and reliable&lt;/h1&gt;</p>
              </div>
              <div>
                <p className="text-xs text-accent font-mono break-all">+ &lt;h1&gt;Project management that doesn&apos;t require a project to manage it&lt;/h1&gt;</p>
              </div>
              <p className="mt-2 text-xs text-fg-dim">66 chars. Under 90-char heuristic. Leads with buyer outcome, maintains brand voice.</p>
            </div>
          </div>
        </section>

        {/* Implementation scope */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-fg mb-3">7. Implementation scope</h2>
          <div className="rounded-lg border border-border p-4 text-sm text-fg-muted space-y-2">
            <p><span className="font-semibold text-fg">Target:</span> {'<head>'} section of the homepage (basecamp.com/)</p>
            <p><span className="font-semibold text-fg">Files affected:</span> The template or layout file that renders the homepage {'<head>'} metadata</p>
            <p><span className="font-semibold text-fg">Unchanged:</span> Page body, visual design, JavaScript, stylesheets, images, other routes</p>
            <p><span className="font-semibold text-fg">Rollback:</span> Revert the three tag values to their original strings. No dependencies.</p>
            <p><span className="font-semibold text-fg">Side effects:</span> Google may re-index the page with the new title/description within 1–7 days. Existing search snippets will update.</p>
          </div>
        </section>

        {/* Verification */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-fg mb-3">8. Verification</h2>
          <p className="text-sm text-fg-muted leading-7 mb-4">
            The same-scope re-audit checks:
          </p>
          <ul className="space-y-2 text-sm text-fg-muted">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent font-bold">?</span>
              Title tag length between 30–60 characters
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent font-bold">?</span>
              Meta description &le;155 characters
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent font-bold">?</span>
              H1 text under 90 characters
            </li>
          </ul>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-signal-fail/30 bg-signal-fail/5 p-4">
              <p className="text-xs font-semibold text-signal-fail mb-2">Before (FAIL)</p>
              <p className="text-xs text-fg-muted font-mono">title: 8 chars</p>
              <p className="text-xs text-fg-muted font-mono">meta desc: 185 chars</p>
              <p className="text-xs text-fg-muted font-mono">h1: 95 chars</p>
            </div>
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
              <p className="text-xs font-semibold text-accent mb-2">After (PASS)</p>
              <p className="text-xs text-fg-muted font-mono">title: 52 chars &#10003;</p>
              <p className="text-xs text-fg-muted font-mono">meta desc: 153 chars &#10003;</p>
              <p className="text-xs text-fg-muted font-mono">h1: 66 chars &#10003;</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-fg-dim">
            Verification shown against a controlled demonstration fixture reproducing the same rule condition.
            This does not represent a change made to the live basecamp.com site.
          </p>
        </section>

        {/* Demonstration label repeated */}
        <div className="mb-10 rounded-lg border border-signal-fail/30 bg-signal-fail/5 px-4 py-3">
          <p className="text-sm font-semibold text-signal-fail">
            Demonstration artifact - not a customer engagement.
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            Basecamp has not purchased a Repair Sprint. This example demonstrates the deliverable format
            using publicly observable data from a completed audit.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center border-t border-border pt-10">
          <Link
            href="/audit?utm_source=repair-sprint-example&utm_medium=internal"
            className="inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-bg hover:opacity-85 transition-opacity"
          >
            Run your free audit
          </Link>
          <p className="mt-3 text-sm text-fg-muted">
            See your page scored against 9 signals. Then decide.
          </p>
        </div>
      </div>
    </main>
  )
}
