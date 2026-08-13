export default function HonestyGrid() {
  return (
    <section className="border-b border-border bg-bg-muted/10 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Clinical Transparency
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-fg md:text-4xl">
            What the Nebula Audit won&apos;t do for you.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-fg-muted">
            We reject black-box AI hype, fake reviews, and vague agency promises. Here are our strict boundaries so you know precisely what to expect.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Card 1 */}
          <div className="rounded-2xl border border-border bg-bg-surface p-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-fail/10 font-bold text-signal-fail text-sm">✕</span>
              <h3 className="text-lg font-bold text-fg">No Fabricated Proof</h3>
            </div>
            <p className="text-sm text-fg-muted leading-6">
              We will never generate fake testimonials, artificial logo scrollers, or exaggerated 100x ROI claims. Every benchmark score is computed from real DOM observations and documented standards.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-border bg-bg-surface p-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-fail/10 font-bold text-signal-fail text-sm">✕</span>
              <h3 className="text-lg font-bold text-fg">No Fake PMF Fixes</h3>
            </div>
            <p className="text-sm text-fg-muted leading-6">
              If your underlying product or offer lacks market demand, no amount of conversion optimization will create sales. We fix observable page friction, headline mismatch, and CTA leaks—not business viability.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-border bg-bg-surface p-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-fail/10 font-bold text-signal-fail text-sm">✕</span>
              <h3 className="text-lg font-bold text-fg">No 30-Page Fluff PDFs</h3>
            </div>
            <p className="text-sm text-fg-muted leading-6">
              We won&apos;t drown you in generic agency jargon or 50-page PDF reports that sit in your inbox. Every audit finding is concise, prioritized by financial impact, and actionable immediately.
            </p>
          </div>

          {/* Card 4 - The Positive */}
          <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 font-bold text-accent text-sm">✓</span>
              <h3 className="text-lg font-bold text-fg">What We DO Deliver</h3>
            </div>
            <p className="text-sm text-fg-muted leading-6">
              Empirical 7-signal page analysis, dollar ad-spend leak calculations, plain-English copy rewrites, and developer code diffs (Webflow, Framer, Shopify, Next.js) with 30-day re-audit verification included.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
