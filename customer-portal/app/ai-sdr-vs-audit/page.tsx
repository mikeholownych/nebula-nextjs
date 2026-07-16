import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "You Don't Need an AI SDR — Fix Your Landing Page First | Nebula Components",
  description: "Before you spend $25k on an AI SDR platform, verify that your landing page converts. Automated Nebula audit scoring is currently paused.",
}

export default function AiSdrVsAuditPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] font-sans">
      {/* Header */}
      <header className="max-w-[780px] mx-auto px-6 pt-10">
        <a href="/" className="text-[#a5b4fc] text-sm font-bold tracking-widest uppercase hover:text-[#818cf8] transition-colors">
          Nebula Components
        </a>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0a0a0f] via-[#12121c] to-[#0a0a0f] border-b border-[#1e1e2e] py-20 px-6">
        <div className="max-w-[720px] mx-auto text-center">
          <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-black leading-tight text-[#f8fafc] mb-5">
            You Don't Need an AI SDR.<br />
            You Need a <span className="text-[#a5b4fc]">Landing Page That Converts.</span>
          </h1>
          <p className="text-lg text-[#94a3b8] max-w-[600px] mx-auto mb-8">
            Every vendor wants you to believe their $25k AI SDR platform will fix your pipeline. It won't — not if your landing page leaks 98% of the traffic you already paid for.
          </p>
          
          <blockquote className="border-l-4 border-[#6366f1] bg-[#0f172a] py-4 px-5 rounded-r-lg text-left mb-8">
            <strong>Quick Answer:</strong> Before buying an AI SDR ($15k–$25k/year), audit your landing page first ($0–$147). An SDR drives more traffic to a page that already can't convert — multiplying your waste, not your revenue.
          </blockquote>

          <div className="flex flex-wrap justify-center gap-3">
            {['No sales call', 'No demo required', 'Evidence required', 'Scoring paused'].map((pill) => (
              <span key={pill} className="bg-[#1e1e2e] text-[#94a3b8] border border-[#2d2d4e] px-4 py-1.5 rounded-full text-sm">
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
          Zamp.ai just published their <a href="https://www.zamp.ai/blogs/ai-sdr-bdr-what-they-do-and-how-to-deploy-one" className="text-[#818cf8] hover:underline">AI SDR guide</a> (July 3, 2026). Good content. But here's what it doesn't tell you:
        </p>

        {/* Zamp Callout */}
        <div className="bg-[#1c1010] border border-[#3a1a1a] border-l-4 border-l-[#ef4444] rounded-xl p-6 mb-8">
          <div className="text-xs font-bold tracking-widest uppercase text-[#ef4444] mb-2">
            What Zamp doesn't say
          </div>
          <p className="mb-0">
            Their AI SDR starts at $25k for a pilot and takes 4-10 weeks to deploy. And it will be sending traffic to the landing page that isn't converting today. The page that bleeds 98 out of every 100 visitors. The page you haven't audited.
          </p>
        </div>

        <p className="mb-6">That's like buying a fleet of trucks before you pave the driveway. The vehicle isn't the bottleneck. The road is.</p>

        {/* Section: Order of Operations */}
        <h2 className="text-2xl font-bold text-[#f1f5f9] mt-12 mb-4 pl-4 border-l-4 border-[#6366f1]">
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
        <h2 className="text-2xl font-bold text-[#f1f5f9] mt-12 mb-4 text-center">
          The $25k vs Free Comparison
        </h2>
        
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse border border-[#1e1e2e] rounded-xl overflow-hidden">
            <thead>
              <tr>
                <th className="bg-[#12121c] text-[#94a3b8] text-xs font-bold uppercase tracking-wide text-left p-4 border-b border-[#1e1e2e] w-2/5">Feature</th>
                <th className="bg-[#12121c] text-[#ef4444] text-xs font-bold uppercase tracking-wide text-left p-4 border-b border-[#1e1e2e]">AI SDR Platform (Zamp)</th>
                <th className="bg-[#12121c] text-[#22c55e] text-xs font-bold uppercase tracking-wide text-left p-4 border-b border-[#1e1e2e]">Nebula Audit + Fix</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Entry cost', zamp: '$25k–$75k pilot', nebula: 'Free (or $147 fix pack)' },
                { label: 'Time to value', zamp: '4–10 weeks', nebula: 'Audit scoring paused pending evidence-backed rebuild' },
                { label: 'Purchase motion', zamp: 'Book a demo → sales cycle → legal review', nebula: 'Audit submission paused pending verified engine' },
                { label: 'What it fixes', zamp: 'Outbound volume (sends more emails)', nebula: 'The page itself (fixes what converts)' },
                { label: 'Self-serve', zamp: 'No. Demo-gated.', nebula: 'Yes. Full self-serve pipeline.' },
                { label: 'Risk for you', zamp: '$25k+ commitment + 10 weeks before you know', nebula: 'No automated score is issued without evidence.' },
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-[#1a1a2a] last:border-b-0">
                  <td className="p-4 text-[#f1f5f9] font-semibold">{row.label}</td>
                  <td className="p-4 bg-[#12121c] text-[#ef4445]">{row.zamp}</td>
                  <td className="p-4 bg-[#0d1117] text-[#22c55e]">{row.nebula}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#2d2d4e]">
                <td className="p-4 text-[#f8fafc] font-extrabold">Should you buy it?</td>
                <td className="p-4 bg-[#12121c] text-[#ef4445] font-semibold">Only after your page converts at 3%+</td>
                <td className="p-4 bg-[#0d1117] text-[#22c55e] font-semibold">Do this first. Always.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section: Trigger Problem */}
        <h2 className="text-2xl font-bold text-[#f1f5f9] mt-12 mb-4 pl-4 border-l-4 border-[#6366f1]">
          The Trigger Problem Zamp Misses
        </h2>
        <p className="mb-4">Zamp's blog says an AI SDR "pulls target accounts from your ICP criteria" and "cross-references intent data." That's demographic-filter targeting with a fresh coat of paint. It's still spray-and-pray — just faster spray.</p>
        <p className="mb-6">Here's what actually works: <strong>trigger-aware targeting</strong>. You don't optimize for who the person is. You optimize for <em>what just happened to them</em>.</p>

        {/* Nebula Callout */}
        <div className="bg-[#0a1a0f] border border-[#1a3a1a] border-l-4 border-l-[#22c55e] rounded-xl p-6 mb-6">
          <div className="text-xs font-bold tracking-widest uppercase text-[#22c55e] mb-2">
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
        <h2 className="text-2xl font-bold text-[#f1f5f9] mt-12 mb-4 pl-4 border-l-4 border-[#6366f1]">
          The Real Funnel
        </h2>
        <p className="mb-4">The smartest path to revenue right now — whether you're pre-revenue or scaling — is:</p>
        <ol className="list-decimal list-inside mb-6 space-y-2">
          <li><strong>Check audit status.</strong> Automated URL submission and scoring are paused during the evidence-backed rebuild.</li>
          <li><strong>Fix what's broken.</strong> Free kit shows you exactly what to change. $147 pack implements it for you.</li>
          <li><strong>Get a page that converts at 3-6%.</strong> Now every dollar of traffic or outreach actually produces leads.</li>
          <li><strong>Then — and only then — consider an AI SDR.</strong> Because now the math works. Each outbound email lands on a page that converts.</li>
        </ol>

        {/* Warning Callout */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#12121c] border border-[#2d2d4e] border-l-4 border-l-[#6366f1] rounded-xl p-7 mb-8">
          <p className="mb-0 text-[#cbd5e1]">
            <strong className="text-[#f8fafc]">⚠️ Warning:</strong> AI SDR vendors will tell you their platform works regardless of your landing page. Check their case studies. Every single one assumes the landing page is already converting. They're selling you a hose when your pipe is clogged.
          </p>
        </div>

        {/* Full Solution Callout */}
        <div className="bg-[#0a1a0f] border border-[#1a3a1a] border-l-4 border-l-[#22c55e] rounded-xl p-6 mb-8">
          <div className="text-xs font-bold tracking-widest uppercase text-[#22c55e] mb-2">
            🔥 The full solution — no AI SDR needed
          </div>
          <p className="mb-0">
            We'll do the whole thing for $997: landing page audit + rewrite, 200 triggered prospects, done-for-you outreach, 14-day reply management. <strong>You get a paying customer in 60 days or we work free until you do.</strong> That's the guarantee.{' '}
            <a href="/growth-launch" className="text-[#22c55e] font-bold hover:underline">See the Growth Launch →</a>
          </p>
        </div>

        {/* Section: Honest Path */}
        <h2 className="text-2xl font-bold text-[#f1f5f9] mt-12 mb-4 pl-4 border-l-4 border-[#6366f1]">
          The Honest Path
        </h2>
        <p className="mb-4">I'm not saying AI SDRs are useless. They're not. Zamp builds a solid product, and for teams that already have a converting landing page and a mature outbound motion, an AI SDR multiplies output.</p>
        <p className="mb-4">But for the founder who's pre-revenue, pre-product-market-fit, or stuck at 0.8% conversion — the one Zamp is targeting with this content — the AI SDR is the wrong purchase. It's the 10x solution to a 1x problem.</p>
        <p className="mb-8"><strong>Start with the landing page.</strong> It's the highest-leverage thing you can fix, the cheapest to test, and the fastest to deploy. Everything else builds on top of it.</p>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16162a] border border-[#2d2d4e] rounded-2xl py-12 px-10 text-center">
          <h3 className="text-2xl font-bold text-[#f8fafc] mb-3">
            Audit scoring rebuild in progress
          </h3>
          <p className="text-[#94a3b8] max-w-[500px] mx-auto mb-6">
            Automated scoring and URL submission are paused until each finding can be backed by verifiable evidence.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <a href="/audit" className="inline-flex items-center gap-2 bg-[#4f46e5] hover:bg-[#5254cc] text-white font-bold py-4 px-9 rounded-lg transition-colors">
              View audit status →
            </a>
            <a href="/why-landing-pages-dont-convert" className="inline-flex items-center gap-2 bg-transparent border border-[#2d2d4e] hover:border-[#a5b4fc] text-[#94a3b8] hover:text-[#e2e8f0] font-semibold py-4 px-6 rounded-lg transition-colors">
              Read the full guide
            </a>
          </div>
          <p className="text-[#94a3b8] text-sm">
            Your URL is used only for the audit. No resale. No spam. No required follow-up call.
          </p>
        </div>

        {/* Footer attribution */}
        <p className="text-xs text-[#94a3b8] text-center mt-12 pt-6 border-t border-[#1e1e2e]">
          Competitive analysis based on{' '}
          <a href="https://www.zamp.ai/blogs/ai-sdr-bdr-what-they-do-and-how-to-deploy-one" className="hover:text-[#e2e8f0]">
            Zamp's AI SDR blog post
          </a>{' '}
          (July 3, 2026) and their{' '}
          <a href="https://www.zamp.ai/blogs/hire-an-ai-agent-deployment-and-pricing-guide" className="hover:text-[#e2e8f0]">
            pricing guide
          </a>{' '}
          (June 17, 2026).
        </p>
      </main>
    </div>
  )
}
