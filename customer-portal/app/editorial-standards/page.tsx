import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Editorial Standards — Nebula Components',
  description: 'Nebula Components editorial standards for content accuracy, provenance, and correction policy.',
}

export default function EditorialStandardsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e8f0] font-sans">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <p className="text-[#10b981] text-sm font-bold tracking-widest uppercase mb-4">Trust &amp; Accuracy</p>
          <h1 className="text-4xl font-black text-[#f8fafc] mb-4">Editorial Standards</h1>
          <p className="text-lg text-[#94a3b8]">How we ensure every audit, article, and recommendation is accurate, verifiable, and correctable.</p>
        </header>

        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-[#10b981] mb-3">Accuracy Commitment</h2>
            <p className="text-[#94a3b8] mb-4">Every factual claim on this site meets one of three standards:</p>
            <ul className="space-y-2 text-[#94a3b8]">
              <li className="flex gap-2"><span className="text-[#10b981]">1.</span> First-party operational data (from our own audits)</li>
              <li className="flex gap-2"><span className="text-[#10b981]">2.</span> Cited third-party research with live source links</li>
              <li className="flex gap-2"><span className="text-[#10b981]">3.</span> Explicitly labeled opinion or estimation</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#10b981] mb-3">Provenance</h2>
            <p className="text-[#94a3b8] mb-4">Each case study references:</p>
            <ul className="space-y-2 text-[#94a3b8]">
              <li className="flex gap-2"><span className="text-[#10b981]">•</span> Audit date and methodology</li>
              <li className="flex gap-2"><span className="text-[#10b981]">•</span> Scoring rubric applied</li>
              <li className="flex gap-2"><span className="text-[#10b981]">•</span> Anonymization method (where applicable)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#10b981] mb-3">Correction Policy</h2>
            <p className="text-[#94a3b8] mb-4">When we find errors, we:</p>
            <ol className="space-y-2 text-[#94a3b8]">
              <li className="flex gap-2"><span className="text-[#10b981]">1.</span> Correct the error within 48 hours</li>
              <li className="flex gap-2"><span className="text-[#10b981]">2.</span> Add a correction notice at the top of the page</li>
              <li className="flex gap-2"><span className="text-[#10b981]">3.</span> Preserve the original claim in strikethrough for transparency</li>
              <li className="flex gap-2"><span className="text-[#10b981]">4.</span> Update the revision date</li>
            </ol>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#10b981] mb-3">Review Cadence</h2>
            <p className="text-[#94a3b8] mb-4">Content is reviewed on the following schedule:</p>
            <ul className="space-y-2 text-[#94a3b8]">
              <li className="flex gap-2"><span className="text-[#10b981]">•</span> Foundational definitions: Annually</li>
              <li className="flex gap-2"><span className="text-[#10b981]">•</span> Methodology pages: Quarterly</li>
              <li className="flex gap-2"><span className="text-[#10b981]">•</span> Case studies: At publication only</li>
              <li className="flex gap-2"><span className="text-[#10b981]">•</span> Pricing: Immediately on change</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#10b981] mb-3">Authorship</h2>
            <p className="text-[#94a3b8] mb-4">All editorial content includes:</p>
            <ul className="space-y-2 text-[#94a3b8]">
              <li className="flex gap-2"><span className="text-[#10b981]">•</span> Named author or contributor</li>
              <li className="flex gap-2"><span className="text-[#10b981]">•</span> Publication date</li>
              <li className="flex gap-2"><span className="text-[#10b981]">•</span> Last revision date (if different from publication)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#10b981] mb-3">Contact</h2>
            <p className="text-[#94a3b8]">To report an error or request clarification: <a href="mailto:correct@nebulacomponents.shop" className="text-[#10b981] hover:underline">correct@nebulacomponents.shop</a></p>
          </div>
        </section>

        <footer className="mt-12 pt-8 border-t border-[#1e1e2e]">
          <p className="text-sm text-[#64748b]">Last updated: July 15, 2026</p>
        </footer>
      </div>
    </div>
  )
}
