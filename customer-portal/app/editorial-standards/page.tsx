import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Editorial Standards — Nebula Components',
  description: 'Nebula Components editorial standards for content accuracy, provenance, and correction policy.',
}

export default function EditorialStandardsPage() {
  return (
    <div className="min-h-screen bg-bg text-fg font-sans">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <p className="text-accent text-sm font-bold tracking-widest uppercase mb-4">Trust &amp; Accuracy</p>
          <h1 className="text-4xl font-black text-fg mb-4">Editorial Standards</h1>
          <p className="text-lg text-fg-muted">How we ensure every audit, article, and recommendation is accurate, verifiable, and correctable.</p>
        </header>

        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-accent mb-3">Accuracy Commitment</h2>
            <p className="text-fg-muted mb-4">Every factual claim on this site meets one of three standards:</p>
            <ul className="space-y-2 text-fg-muted">
              <li className="flex gap-2"><span className="text-accent">1.</span> First-party operational data (from our own audits)</li>
              <li className="flex gap-2"><span className="text-accent">2.</span> Cited third-party research with live source links</li>
              <li className="flex gap-2"><span className="text-accent">3.</span> Explicitly labeled opinion or estimation</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-accent mb-3">Provenance</h2>
            <p className="text-fg-muted mb-4">Each case study references:</p>
            <ul className="space-y-2 text-fg-muted">
              <li className="flex gap-2"><span className="text-accent">•</span> Audit date and methodology</li>
              <li className="flex gap-2"><span className="text-accent">•</span> Scoring rubric applied</li>
              <li className="flex gap-2"><span className="text-accent">•</span> Anonymization method (where applicable)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-accent mb-3">Correction Policy</h2>
            <p className="text-fg-muted mb-4">When we find errors, we:</p>
            <ol className="space-y-2 text-fg-muted">
              <li className="flex gap-2"><span className="text-accent">1.</span> Correct the error within 48 hours</li>
              <li className="flex gap-2"><span className="text-accent">2.</span> Add a correction notice at the top of the page</li>
              <li className="flex gap-2"><span className="text-accent">3.</span> Preserve the original claim in strikethrough for transparency</li>
              <li className="flex gap-2"><span className="text-accent">4.</span> Update the revision date</li>
            </ol>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-accent mb-3">Review Cadence</h2>
            <p className="text-fg-muted mb-4">Content is reviewed on the following schedule:</p>
            <ul className="space-y-2 text-fg-muted">
              <li className="flex gap-2"><span className="text-accent">•</span> Foundational definitions: Annually</li>
              <li className="flex gap-2"><span className="text-accent">•</span> Methodology pages: Quarterly</li>
              <li className="flex gap-2"><span className="text-accent">•</span> Case studies: At publication only</li>
              <li className="flex gap-2"><span className="text-accent">•</span> Pricing: Immediately on change</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-accent mb-3">Authorship</h2>
            <p className="text-fg-muted mb-4">All editorial content includes:</p>
            <ul className="space-y-2 text-fg-muted">
              <li className="flex gap-2"><span className="text-accent">•</span> Named author or contributor</li>
              <li className="flex gap-2"><span className="text-accent">•</span> Publication date</li>
              <li className="flex gap-2"><span className="text-accent">•</span> Last revision date (if different from publication)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-accent mb-3">Contact</h2>
            <p className="text-fg-muted">To report an error or request clarification: <span className="text-accent">{'correct' + String.fromCharCode(64) + 'nebulacomponents.shop'}</span></p>
          </div>
        </section>

        <footer className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-fg-dim">Last updated: July 15, 2026</p>
        </footer>
      </div>
    </div>
  )
}
