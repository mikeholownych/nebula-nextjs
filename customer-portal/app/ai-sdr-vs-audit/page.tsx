import type { Metadata } from 'next'
import { formatUsd, getActiveFixPack } from '@/app/lib/public-facts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "You Don't Need an AI SDR — Fix Your Landing Page First | Nebula Components",
  description: "Before you spend $25k on an AI SDR platform, establish an evidence-backed landing-page baseline across 9 conversion signals.",
  alternates: { canonical: 'https://nebulacomponents.com/ai-sdr-vs-audit' },
}

export default function AiSdrVsAuditPage() {
  const fixPack = getActiveFixPack()
  const fixPackPrice = fixPack ? formatUsd(fixPack.priceCents) : undefined

  return (
    <div className="min-h-screen bg-bg text-fg font-sans">
      {/* Hero */}
      <section className="bg-bg border-b border-border py-20 px-6">
        <div className="max-w-[720px] mx-auto text-center">
          <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-black leading-tight text-fg mb-5">
            You Don't Need an AI SDR.<br />
            You Need a <span className="text-accent-light">Measured Landing-Page Baseline.</span>
          </h1>
          <p className="text-lg text-fg-muted max-w-[600px] mx-auto mb-8">
            More outbound volume cannot establish whether the landing page receiving that traffic
            is ready to convert it. Verify the page before adding another acquisition system.
          </p>

          <blockquote className="border border-border bg-bg-panel py-4 px-5 rounded-r-lg text-left mb-8">
            <strong>Quick Answer:</strong> Before buying an AI SDR ($15k–$25k/year), audit your landing page first ({fixPackPrice ? `$0–${fixPackPrice}` : '$0; no paid offer is currently verified'}). More outbound volume cannot resolve an unverified landing-page baseline.
          </blockquote>

          <div className="flex flex-wrap justify-center gap-3">
            {['No sales call', 'No demo required', 'Evidence required', 'Live audit'].map((pill) => (
              <span key={pill} className="bg-bg-panel text-fg-muted border border-border px-4 py-1.5 rounded-full text-sm">
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main id="main-content" className="max-w-[780px] mx-auto px-6 py-12 pb-20">
        <p className="mb-4">Let's be direct.</p>
        <p className="mb-4">You have traffic. You have ad spend. You're getting zero conversions — or close to it. And now someone told you that you need an "AI SDR" or "AI BDR" to fix it.</p>
        <p className="mb-8">
          Zamp.ai just published their <a href="https://www.zamp.ai/blogs/ai-sdr-bdr-what-they-do-and-how-to-deploy-one" className="text-accent hover:underline">AI SDR guide</a> (July 3, 2026). Good content. But here's what it doesn't tell you:
        </p>

        {/* Zamp Callout */}
        <div className="bg-danger-dim border border-danger/30 rounded-xl p-6 mb-8">
          <div className="text-xs font-bold tracking-widest uppercase text-danger mb-2">
            What Zamp doesn't say
          </div>
          <p className="mb-0">
            Their published guide describes a $25k pilot and a 4–10 week deployment. That system
            will still send prospects to the existing landing page, so the page is a prerequisite
            worth auditing before the additional traffic begins.
          </p>
        </div>

        <p className="mb-6">That's like buying a fleet of trucks before you pave the driveway. The vehicle isn't the bottleneck. The road is.</p>

        {/* Section: Order of Operations */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          The Order of Operations Matters
        </h2>
        <p className="mb-4">Examine these three prerequisites before adding outbound volume:</p>
        <ol className="list-decimal list-inside mb-6 space-y-2">
          <li><strong>A landing page with a verified baseline</strong> — identify evidenced page defects before adding more traffic.</li>
          <li><strong>Trigger-aware outreach</strong> — who you contact and when (not demographic filters, but actual buying signals).</li>
          <li><strong>Volume and sequencing</strong> — the cadence, the follow-ups, the qualification.</li>
        </ol>
        <p className="mb-6">An AI SDR platform only addresses #3. It assumes #1 and #2 are already solved. If your landing page is weak, an AI SDR is just accelerating the rate at which you waste money on leads that won't convert.</p>

        {/* Section: Comparison Table */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4 text-center">
          The $25k vs Free Comparison
        </h2>

        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse border border-border rounded-xl overflow-hidden">
            <thead>
              <tr>
                <th className="bg-bg-panel text-fg-muted text-xs font-bold uppercase tracking-wide text-left p-4 border-b border-border w-2/5">Feature</th>
                <th className="bg-bg-panel text-danger text-xs font-bold uppercase tracking-wide text-left p-4 border-b border-border">AI SDR Platform (Zamp)</th>
                <th className="bg-bg-panel text-accent text-xs font-bold uppercase tracking-wide text-left p-4 border-b border-border">Nebula Audit + Fix</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Entry cost', zamp: '$25k–$75k pilot', nebula: 'Free (or $97 self-implementation kit)' },
                { label: 'Time to value', zamp: '4–10 weeks', nebula: 'Audit completion time varies by page and service load' },
                { label: 'Purchase motion', zamp: 'Book a demo → sales cycle → legal review', nebula: 'Self-serve checkout.' },
                { label: 'What it evaluates', zamp: 'Outbound volume and sequencing', nebula: 'Landing-page conversion signals' },
                { label: 'Self-serve', zamp: 'No. Demo-gated.', nebula: 'Self-serve. No sales call.' },
                { label: 'Risk for you', zamp: '$25k+ commitment + 10 weeks before you know', nebula: 'No automated score is issued without evidence.' },
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-border last:border-b-0">
                  <td className="p-4 text-fg font-semibold">{row.label}</td>
                  <td className="p-4 bg-bg-panel text-danger">{row.zamp}</td>
                  <td className="p-4 bg-bg text-accent">{row.nebula}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-border">
                <td className="p-4 text-fg font-extrabold">Should you buy it?</td>
                <td className="p-4 bg-bg-panel text-danger font-semibold">Only after your page has a verified conversion baseline</td>
                <td className="p-4 bg-bg text-accent font-semibold">Verify this prerequisite first.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section: Trigger Problem */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          The Trigger Problem Zamp Misses
        </h2>
        <p className="mb-4">Zamp's blog says an AI SDR "pulls target accounts from your ICP criteria" and "cross-references intent data." That's demographic-filter targeting with a fresh coat of paint. It's still spray-and-pray — just faster spray.</p>
        <p className="mb-6">Here's what actually works: <strong>trigger-aware targeting</strong>. You don't optimize for who the person is. You optimize for <em>what just happened to them</em>.</p>

        {/* Nebula Callout */}
        <div className="bg-accent-dim border border-accent/30 rounded-xl p-6 mb-6">
          <div className="text-xs font-bold tracking-widest uppercase text-accent mb-2">
            Nebula approach
          </div>
          <p className="mb-0">
            A recent paid-traffic run with no recorded conversions is an observable trigger. It is
            more specific than a job title, but it still requires evidence from the actual campaign
            and page before drawing a conclusion.
          </p>
        </div>

        <p className="mb-8">
          Zamp's model: find the right <em>person</em>, then convince them they have a problem.<br />
          Nebula&apos;s model: start from an observed paid-traffic problem, diagnose the page, and
          implement one bounded, verified repair.
        </p>

        {/* Section: Real Funnel */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          The Real Funnel
        </h2>
        <p className="mb-4">The smartest path to revenue right now — whether you're pre-revenue or scaling — is:</p>
        <ol className="list-decimal list-inside mb-6 space-y-2">
          <li><strong>Run a free audit.</strong> Automated URL submission and evidence-backed scoring are live — no signup required.</li>
          <li>
            <strong>Fix what&apos;s broken.</strong> The free kit shows you what to change.
            {fixPackPrice && ` The ${fixPackPrice} One-Leak Self-Implementation Kit delivers a tailored kit for one high-confidence page-level finding. You or your developer implements it, and the 30-day re-audit verifies the page condition.`}
          </li>
          <li><strong>Measure the result.</strong> Re-audit the page and compare evidence before deciding whether to add more traffic.</li>
          <li><strong>Then consider an AI SDR.</strong> Use the measured baseline to decide whether additional outbound traffic is justified; an audit cannot guarantee conversion.</li>
        </ol>

        {/* Warning Callout */}
        <div className="bg-bg-panel border border-border rounded-xl p-7 mb-8">
          <p className="mb-0 text-fg-muted">
            <strong className="text-fg">Check the preconditions:</strong> Before relying on an AI
            SDR case study, inspect whether it states the landing page&apos;s starting conversion
            baseline. If it does not, the case cannot establish how the same traffic would perform
            on your page.
          </p>
        </div>

        {/* Bounded availability notice */}
        <div className="bg-accent-dim border border-accent/30 rounded-xl p-6 mb-8">
          <div className="text-xs font-bold tracking-widest uppercase text-accent mb-2">
            Free audit live — 9 conversion signals
          </div>
          <p className="mb-0">
            Run a free audit across 9 conversion signals — no signup required. Completion time
            varies by page and service load.{' '}
            <a href="/audit" className="text-accent font-bold hover:underline">Run your free audit →</a>
          </p>
        </div>

        {/* Section: Honest Path */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          The Honest Path
        </h2>
        <p className="mb-4">AI SDRs are designed to automate outbound volume. That can be relevant for a team with a measured landing-page baseline and an established outbound process.</p>
        <p className="mb-4">But when a founder does not yet have a verified landing-page baseline, buying more outbound volume puts the steps in the wrong order. Diagnose the receiving page before deciding whether additional traffic is justified.</p>
        <p className="mb-8"><strong>Start with the landing page.</strong> It is an inspectable prerequisite for the traffic an AI SDR would generate.</p>

        {/* CTA Section */}
        <div className="bg-bg-panel shadow-glow border border-border rounded-2xl py-12 px-10 text-center">
          <h3 className="text-2xl font-bold text-fg mb-3">
            Run your free landing page audit
          </h3>
          <p className="text-fg-muted max-w-[500px] mx-auto mb-6">
            Paste your URL to generate an evidence-backed baseline. Completion time varies by page
            and service load.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <a href="/audit" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-bg font-bold py-4 px-9 rounded-lg transition-colors">
              Run free audit →
            </a>
            <a href="/learning-centre/landing-page-not-converting" className="inline-flex items-center gap-2 bg-transparent border border-border hover:border-accent-light text-fg-muted hover:text-fg font-semibold py-4 px-6 rounded-lg transition-colors">
              Read the full guide
            </a>
          </div>
          <p className="text-fg-muted text-sm">
            Your URL is used only for the audit. No resale. No spam. No required follow-up call.
          </p>
        </div>

        {/* Footer attribution */}
        <p className="text-xs text-fg-muted text-center mt-12 pt-24 border-t border-border">
          Competitive analysis based on{' '}
          <a href="https://www.zamp.ai/blogs/ai-sdr-bdr-what-they-do-and-how-to-deploy-one" className="hover:text-fg">
            Zamp's AI SDR blog post
          </a>{' '}
          (July 3, 2026) and their{' '}
          <a href="https://www.zamp.ai/blogs/hire-an-ai-agent-deployment-and-pricing-guide" className="hover:text-fg">
            pricing guide
          </a>{' '}
          (June 17, 2026).
        </p>
      </main>
    </div>
  )
}
