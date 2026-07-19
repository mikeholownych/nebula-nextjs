import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "You Don't Need an AI SDR — Fix Your Landing Page First | Nebula Components",
  description: "Before you spend $25k on an AI SDR platform, verify that your landing page converts. Automated Nebula audit scoring is currently paused.",
}

export default function AiSdrVsAuditPage() {
  return (
    <div className="min-h-screen bg-bg text-fg font-sans">
      {/* Header */}
      <header className="max-w-[780px] mx-auto px-6 pt-10">
        <a href="/" className="text-accent-light text-sm font-bold tracking-widest uppercase hover:text-accent transition-colors">
          Nebula Components
        </a>
      </header>

      {/* Hero */}
      <section className="bg-bg border-b border-border py-20 px-6">
        <div className="max-w-[720px] mx-auto text-center">
          <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-black leading-tight text-fg mb-5">
            You Don't Need an AI SDR.<br />
            You Need a <span className="text-accent-light">Landing Page That Converts.</span>
          </h1>
          <p className="text-lg text-fg-muted max-w-[600px] mx-auto mb-8">
            Every vendor wants you to believe their $25k AI SDR platform will fix your pipeline. It won't — not if your landing page leaks 98% of the traffic you already paid for.
          </p>

          <blockquote className="border border-border bg-bg-panel py-4 px-5 rounded-r-lg text-left mb-8">
            <strong>Quick Answer:</strong> Before buying an AI SDR ($15k–$25k/year), audit your landing page first ($0–$147). An SDR drives more traffic to a page that already can't convert — multiplying your waste, not your revenue.
          </blockquote>

          <div className="flex flex-wrap justify-center gap-3">
            {['No sales call', 'No demo required', 'Evidence required', 'Scoring paused'].map((pill) => (
              <span key={pill} className="bg-bg-panel text-fg-muted border border-border px-4 py-1.5 rounded-full text-sm">
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[780px] mx-auto px-6 py-12 pb-20">
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
            Their AI SDR starts at $25k for a pilot and takes 4-10 weeks to deploy. And it will be sending traffic to the landing page that isn't converting today. The page that bleeds 98 out of every 100 visitors. The page you haven't audited.
          </p>
        </div>

        <p className="mb-6">That's like buying a fleet of trucks before you pave the driveway. The vehicle isn't the bottleneck. The road is.</p>

        {/* Section: Order of Operations */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          The Order of Operations Matters
        </h2>
        <p className="mb-4">There are exactly three things that drive revenue from outbound:</p>
        <ol className="list-decimal list-inside mb-6 space-y-2">
          <li><strong>A landing page that converts</strong> — if it's below 2%, fix this first. Nothing else matters until this works.</li>
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
                { label: 'Entry cost', zamp: '$25k–$75k pilot', nebula: 'Free (or $147 fix pack)' },
                { label: 'Time to value', zamp: '4–10 weeks', nebula: 'Audit scoring paused pending evidence-backed rebuild' },
                { label: 'Purchase motion', zamp: 'Book a demo → sales cycle → legal review', nebula: 'Audit submission paused pending verified engine' },
                { label: 'What it fixes', zamp: 'Outbound volume (sends more emails)', nebula: 'The page itself (fixes what converts)' },
                { label: 'Self-serve', zamp: 'No. Demo-gated.', nebula: 'Audit submission paused pending verified engine.' },
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
                <td className="p-4 bg-bg-panel text-danger font-semibold">Only after your page converts at 3%+</td>
                <td className="p-4 bg-bg text-accent font-semibold">Do this first. Always.</td>
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
            We identify founders who are actively bleeding money on ads with zero conversions. That's a buying trigger, not a demographic filter. The person who just spent $2,000 on Meta ads and got zero leads is ready to buy a fix right now. The person with the "right ICP" title who isn't in pain? They'll ignore your outreach for months.
          </p>
        </div>

        <p className="mb-8">
          Zamp's model: find the right <em>person</em>, then convince them they have a problem.<br />
          Nebula's model: find people <em>already in pain</em>, then give them a fix that works in hours, not weeks.
        </p>

        {/* Section: Real Funnel */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          The Real Funnel
        </h2>
        <p className="mb-4">The smartest path to revenue right now — whether you're pre-revenue or scaling — is:</p>
        <ol className="list-decimal list-inside mb-6 space-y-2">
          <li><strong>Run a free audit.</strong> Automated URL submission and evidence-backed scoring are live — no signup required.</li>
          <li><strong>Fix what's broken.</strong> Free kit shows you exactly what to change. $147 pack implements it for you.</li>
          <li><strong>Get a page that converts at 3-6%.</strong> Now every dollar of traffic or outreach actually produces leads.</li>
          <li><strong>Then — and only then — consider an AI SDR.</strong> Because now the math works. Each outbound email lands on a page that converts.</li>
        </ol>

        {/* Warning Callout */}
        <div className="bg-bg-panel border border-border rounded-xl p-7 mb-8">
          <p className="mb-0 text-fg-muted">
            <strong className="text-fg">⚠️ Warning:</strong> AI SDR vendors will tell you their platform works regardless of your landing page. Check their case studies. Every single one assumes the landing page is already converting. They're selling you a hose when your pipe is clogged.
          </p>
        </div>

        {/* Bounded availability notice */}
        <div className="bg-accent-dim border border-accent/30 rounded-xl p-6 mb-8">
          <div className="text-xs font-bold tracking-widest uppercase text-accent mb-2">
            Audit and managed outreach are paused
          </div>
          <p className="mb-0">
            Nebula is rebuilding the audit engine and fulfillment controls before reopening automated scoring or managed outreach.{' '}
            <a href="/audit" className="text-accent font-bold hover:underline">View the current audit status →</a>
          </p>
        </div>

        {/* Section: Honest Path */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          The Honest Path
        </h2>
        <p className="mb-4">I'm not saying AI SDRs are useless. They're not. Zamp builds a solid product, and for teams that already have a converting landing page and a mature outbound motion, an AI SDR multiplies output.</p>
        <p className="mb-4">But for the founder who's pre-revenue, pre-product-market-fit, or stuck at 0.8% conversion — the one Zamp is targeting with this content — the AI SDR is the wrong purchase. It's the 10x solution to a 1x problem.</p>
        <p className="mb-8"><strong>Start with the landing page.</strong> It's the highest-leverage thing you can fix, the cheapest to test, and the fastest to deploy. Everything else builds on top of it.</p>

        {/* CTA Section */}
        <div className="bg-bg-panel shadow-glow border border-border rounded-2xl py-12 px-10 text-center">
          <h3 className="text-2xl font-bold text-fg mb-3">
            Audit scoring rebuild in progress
          </h3>
          <p className="text-fg-muted max-w-[500px] mx-auto mb-6">
            Automated scoring and URL submission are paused until each finding can be backed by verifiable evidence.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <a href="/audit" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-bg font-bold py-4 px-9 rounded-lg transition-colors">
              Run free audit →
            </a>
            <a href="/why-landing-pages-dont-convert" className="inline-flex items-center gap-2 bg-transparent border border-border hover:border-accent-light text-fg-muted hover:text-fg font-semibold py-4 px-6 rounded-lg transition-colors">
              Read the full guide
            </a>
          </div>
          <p className="text-fg-muted text-sm">
            Your URL is used only for the audit. No resale. No spam. No required follow-up call.
          </p>
        </div>

        {/* Footer attribution */}
        <p className="text-xs text-fg-muted text-center mt-12 pt-6 border-t border-border">
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
