import Link from 'next/link'

export default function StackTaxComparison() {
  return (
    <section className="border-b border-border bg-bg-surface px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Unfair Advantage Matrix
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-fg md:text-4xl">
            Stop paying a $1,500/mo Stack Tax or waiting 3 months for a CRO agency.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-fg-muted">
            Most founders either spend $5k/mo on agencies that deliver 30-page PDFs or stitch 5 tools together and manually execute recommendations. Nebula gives you instant, verified code fixes in under 2 minutes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: CRO Agency */}
          <div className="flex flex-col rounded-2xl border border-border bg-bg-panel p-6 shadow-sm">
            <div className="mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Option 1</span>
              <h3 className="text-xl font-bold text-fg">Traditional CRO Agency</h3>
              <p className="mt-1 text-2xl font-extrabold text-fg-muted">$3,000–$15,000<span className="text-xs font-normal">/mo</span></p>
            </div>
            <ul className="mb-8 space-y-3 text-sm text-fg-muted flex-1">
              <li className="flex items-start gap-2">
                <span className="text-signal-fail">✕</span>
                <span><strong>Time to first fix:</strong> 4 to 12 weeks of discovery calls</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-signal-fail">✕</span>
                <span><strong>Deliverable:</strong> Vague Figma mockups &amp; 30-page PDFs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-signal-fail">✕</span>
                <span><strong>Code execution:</strong> None (handed back to your dev team)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-signal-fail">✕</span>
                <span><strong>AI / GEO Search Audit:</strong> Completely ignored</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-signal-fail">✕</span>
                <span><strong>Contract:</strong> 3 to 6 month retainer commitment</span>
              </li>
            </ul>
            <div className="text-xs text-fg-muted text-center pt-3 border-t border-border">
              High risk, slow iteration cycle
            </div>
          </div>

          {/* Card 2: DIY SaaS Tool Stack */}
          <div className="flex flex-col rounded-2xl border border-border bg-bg-panel p-6 shadow-sm">
            <div className="mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Option 2</span>
              <h3 className="text-xl font-bold text-fg">DIY SaaS Tool Stack</h3>
              <p className="mt-1 text-2xl font-extrabold text-fg-muted">$1,500+<span className="text-xs font-normal">/mo Stack Tax</span></p>
            </div>
            <ul className="mb-8 space-y-3 text-sm text-fg-muted flex-1">
              <li className="flex items-start gap-2">
                <span className="text-signal-fail">✕</span>
                <span><strong>Time to first fix:</strong> 20+ hours/week manual API stitching</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-signal-fail">✕</span>
                <span><strong>Deliverable:</strong> 500-row spreadsheets &amp; complex dashboards</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-signal-fail">✕</span>
                <span><strong>Code execution:</strong> Manual implementation on your time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-signal-fail">✕</span>
                <span><strong>AI / GEO Search Audit:</strong> Requires extra $5k/mo vendor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-signal-fail">✕</span>
                <span><strong>Stack:</strong> Clay + Instantly + Ahrefs + Hotjar + Vercel</span>
              </li>
            </ul>
            <div className="text-xs text-fg-muted text-center pt-3 border-t border-border">
              High effort, fragmented execution
            </div>
          </div>

          {/* Card 3: Nebula Autonomous Engine */}
          <div className="relative flex flex-col rounded-2xl border-2 border-accent bg-bg-elevated p-6 shadow-lifted">
            <div className="absolute -top-3 right-6 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-bg">
              Best Value
            </div>
            <div className="mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Nebula Engine</span>
              <h3 className="text-xl font-bold text-fg">Nebula Components</h3>
              <p className="mt-1 text-2xl font-extrabold text-accent">$0 <span className="text-sm font-normal text-fg-muted">Free Audit</span> / $97 <span className="text-sm font-normal text-fg-muted">Repair Sprint</span></p>
            </div>
            <ul className="mb-8 space-y-3 text-sm text-fg flex-1">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                <span><strong>Time to first fix:</strong> Sub-60s audit; 24h code delivery</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                <span><strong>Deliverable:</strong> Empirical ad spend leak math + exact diffs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                <span><strong>Code execution:</strong> Production-ready Next.js / Tailwind code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                <span><strong>AI / GEO Search Audit:</strong> Included (ChatGPT / Claude citable)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                <span><strong>Guarantee:</strong> 30-day re-audit verification included</span>
              </li>
            </ul>
            <Link
              href="/audit?utm_source=stack_tax_matrix&utm_medium=homepage"
              className="w-full rounded-xl bg-accent py-3 text-center font-semibold text-bg hover:bg-accent-light transition-colors text-sm"
            >
              Get Free Score &amp; Repair Sprint &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
