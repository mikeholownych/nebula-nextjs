import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Ops Retainer — Keep Your Conversion Savings Running | Nebula',
  description: '$1,497/month AI Ops Retainer. We monitor your page, iterate on leaks, and govern AI workflows so the savings we proved in the audit keep growing. No long-term contract.',
  openGraph: {
    title: 'AI Ops Retainer — Keep Conversion Savings Running',
    description: 'We proved the leak. Now keep the savings. $1,497/mo for monitoring, iteration, and governance. 3-month pilot.',
    url: 'https://nebulacomponents.shop/ai-ops-retainer',
    type: 'website',
    siteName: 'Nebula Components',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Ops Retainer — $1,497/mo',
    description: 'The proof is in the audit. We keep it real month over month.',
  },
}

export default function AIOpsRetainerPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#f9f9f9] font-sans">
      <div className="max-w-[720px] mx-auto px-5 py-8">
        {/* Navigation */}
        <nav className="flex gap-3 flex-wrap text-[13px] mb-4">
          <a href="/" className="text-[#2563eb] hover:underline font-medium">← Free audit</a>
          <a href="/checkout" className="text-[#2563eb] hover:underline font-medium">$147 Fix Pack</a>
          <a href="/growth-launch" className="text-[#2563eb] hover:underline font-medium">🔥 $997 Growth Launch</a>
          <a href="/agency-partner" className="text-[#2563eb] hover:underline font-medium">Agency partners</a>
        </nav>

        {/* Hero Section */}
        <section className="bg-[#0a0a0a] border-2 border-[#10b981] rounded-xl p-6 mb-4">
          <span className="inline-block bg-[#d1fae5] text-[#065f46] text-[11px] font-bold px-[10px] py-[3px] rounded-full uppercase tracking-wider">
            New — AI Ops Retainer
          </span>
          <h1 className="text-[28px] font-extrabold tracking-tight leading-tight mt-3">
            Keep the savings.<br />Don&apos;t redo discovery next year.
          </h1>
          <p className="text-[15px] text-[#666] mt-3 mb-5">
            Your audit proved exactly how much is leaking. That number stays real only if someone watches the page — and the AI workflows — month after month. That&apos;s this.
          </p>

          {/* Pricing Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Monthly */}
            <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
              <h3 className="text-base mb-2 font-semibold">Monthly</h3>
              <div className="text-[36px] font-extrabold">
                $1,497<span className="text-sm font-normal text-[#6b7280]">/mo</span>
              </div>
              <p className="text-xs text-[#6b7280] mb-3">Cancel anytime. No commitment.</p>
              <a
                href="https://buy.stripe.com/00w5kD1nK0wkaa573A43S0c"
                className="block w-full text-center bg-white text-black font-bold text-sm py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Start monthly →
              </a>
            </div>

            {/* Annual */}
            <div className="bg-[#0a1a0f] border-2 border-[#10b981] rounded-xl p-5 relative">
              <span className="absolute -top-[10px] left-1/2 -translate-x-1/2 bg-[#10b981] text-white text-[10px] font-bold px-2 py-[3px] rounded-full">
                Save $1,788
              </span>
              <h3 className="text-base mb-2 font-semibold">Annual</h3>
              <div className="text-[36px] font-extrabold text-[#10b981]">
                $997<span className="text-sm font-normal text-[#6b7280]">/mo</span>
              </div>
              <p className="text-xs text-[#6b7280] mb-1">Billed $11,964/year</p>
              <p className="text-[11px] text-[#059669] font-semibold mb-3">≈ 33% discount</p>
              <a
                href="mailto:ops@launchcrate.io?subject=Annual retainer inquiry"
                className="block w-full text-center bg-[#10b981] text-white font-bold text-sm py-3 px-6 rounded-lg hover:bg-[#059669] transition-colors"
              >
                Start annual →
              </a>
            </div>
          </div>

          {/* Value Stack */}
          <div className="bg-[#0f172a] rounded-lg p-4">
            <p className="text-[11px] text-[#94a3b8] uppercase tracking-wider text-center mb-3">
              INCLUDED VALUE STACK
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
              <div className="flex justify-between text-[#e2e8f0]">
                <span>Monthly audit refresh</span>
                <span className="text-[#6ee7b7]">$497 value</span>
              </div>
              <div className="flex justify-between text-[#e2e8f0]">
                <span>Up to 4 copy fixes/mo</span>
                <span className="text-[#6ee7b7]">$588 value</span>
              </div>
              <div className="flex justify-between text-[#e2e8f0]">
                <span>AI workflow governance</span>
                <span className="text-[#6ee7b7]">$297 value</span>
              </div>
              <div className="flex justify-between text-[#e2e8f0]">
                <span>Priority support (&lt;30min)</span>
                <span className="text-[#6ee7b7]">$197 value</span>
              </div>
              <div className="flex justify-between text-[#e2e8f0]">
                <span>Quarterly strategy call</span>
                <span className="text-[#6ee7b7]">$497 value</span>
              </div>
              <div className="flex justify-between text-[#e2e8f0]">
                <span>Claude workflow templates</span>
                <span className="text-[#6ee7b7]">$147 value</span>
              </div>
            </div>
            <div className="border-t border-white/10 mt-3 pt-3 text-center">
              <span className="text-[#94a3b8] text-xs">Total value: </span>
              <span className="text-[#fbbf24] font-bold text-sm line-through">$2,223/mo</span>
              <span className="text-[#6ee7b7] font-bold text-base ml-2">$1,497/mo</span>
            </div>
          </div>
        </section>

        {/* 5X Rule */}
        <section className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 mb-4">
          <h2 className="text-xl font-bold mb-3">The 5X Rule</h2>
          <p className="text-sm text-[#999]">
            Your retainer should cost roughly <strong className="text-white">20% of the measurable monthly value we proved exists</strong>. If the audit showed $7,500+/month in conversion leakage, this retainer is not a cost — it&apos;s a discount. You keep $6,000, we keep $1,497, and the savings keep growing.
          </p>
          <div className="flex gap-2 flex-wrap mt-3">
            <span className="bg-[#1a1a1a] rounded-full px-3 py-1 text-xs font-semibold text-[#666]">Retainer ≈ 20% of proven leak</span>
            <span className="bg-[#1a1a1a] rounded-full px-3 py-1 text-xs font-semibold text-[#666]">You keep the other 80%</span>
            <span className="bg-[#1a1a1a] rounded-full px-3 py-1 text-xs font-semibold text-[#666]">Savings monitored monthly</span>
          </div>
        </section>

        {/* What's Included */}
        <section className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 mb-4">
          <h2 className="text-xl font-bold mb-3">What&apos;s included</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="bg-[#111] rounded-lg p-[14px]">
              <p className="font-bold text-sm">📊 Monthly audit refresh</p>
              <p className="text-xs text-[#666] mt-1">We re-score your page monthly. Leaks drift — new content, new campaigns. We catch what changes.</p>
            </div>
            <div className="bg-[#111] rounded-lg p-[14px]">
              <p className="font-bold text-sm">🔧 Iterative fixes</p>
              <p className="text-xs text-[#666] mt-1">Up to 4 copy/content fixes per month. No per-ticket cost. No scope negotiation.</p>
            </div>
            <div className="bg-[#111] rounded-lg p-[14px]">
              <p className="font-bold text-sm">🛡️ AI workflow governance</p>
              <p className="text-xs text-[#666] mt-1">We track which models touch your data, where inference calls go, and maintain compliance logs. SOC 2-ready, GDPR-aligned.</p>
            </div>
            <div className="bg-[#111] rounded-lg p-[14px]">
              <p className="font-bold text-sm">⚡ Priority support</p>
              <p className="text-xs text-[#666] mt-1">Direct line to the team. Average response &lt;30 min, 24/7. No ticket queues.</p>
            </div>
          </div>
        </section>

        {/* How This Starts */}
        <section className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 mb-4">
          <h2 className="text-xl font-bold mb-3">How this starts</h2>
          <ol className="list-decimal list-inside text-sm text-[#999] mt-3 space-y-3">
            <li><strong className="text-white">We cite the number.</strong> Your audit proved a $X/month leak. That&apos;s the anchor.</li>
            <li><strong className="text-white">We name the risk.</strong> Pages decay. Campaigns change. Content drifts. The fix you implement today is leaky again in 90 days without monitoring.</li>
            <li><strong className="text-white">We position the retainer.</strong> The alternative to a $1,497/month retainer is a $5K discovery redo in 12 months when nobody remembers why those decisions were made.</li>
            <li><strong className="text-white">We show what we do.</strong> Monitoring. Iteration. Governance. The unglamorous work that keeps the savings real.</li>
            <li><strong className="text-white">We propose a pilot.</strong> 3 months. Clear success criteria. Easy to renew when it works.</li>
          </ol>
        </section>

        {/* Compliance */}
        <section className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 mb-4">
          <h2 className="text-xl font-bold mb-3">Built for regulated clients</h2>
          <p className="text-sm text-[#999]">
            Most firms can&apos;t even quote a HIPAA-covered entity or EU-regulated business because their tool stack is a black box. Ours isn&apos;t.
          </p>
          <div className="flex gap-2 flex-wrap justify-center mt-4">
            <span className="bg-[#0a1a0f] border border-[#bbf7d0] rounded-md px-3 py-1 text-xs font-semibold text-[#10b981]">✓ SOC 2 practices</span>
            <span className="bg-[#0a1a0f] border border-[#bbf7d0] rounded-md px-3 py-1 text-xs font-semibold text-[#10b981]">✓ GDPR-ready</span>
            <span className="bg-[#0a1a0f] border border-[#bbf7d0] rounded-md px-3 py-1 text-xs font-semibold text-[#10b981]">✓ HIPAA-ready</span>
            <span className="bg-[#0a1a0f] border border-[#bbf7d0] rounded-md px-3 py-1 text-xs font-semibold text-[#10b981]">✓ EU AI Act 2026</span>
            <span className="bg-[#0a1a0f] border border-[#bbf7d0] rounded-md px-3 py-1 text-xs font-semibold text-[#10b981]">✓ DORA audit rights</span>
          </div>
          <p className="text-xs text-[#666] mt-4">
            We support Claude, OpenAI, Gemini, and Mistral — you choose the model that fits your residency and compliance rules. Immutable audit logs trace every inference call. White-label delivery available for agency partners.
          </p>
          <p className="text-xs text-[#666] mt-2">
            Not certified against every standard — but architected for auditability from day one.{' '}
            <a href="/agency-partner" className="text-[#2563eb] hover:underline">Agency partners get dedicated compliance documentation.</a>
          </p>
        </section>

        {/* One-off vs Retainer */}
        <section className="bg-[#0a0a0a] border-2 border-[#d97706] rounded-xl p-6 mb-4">
          <h2 className="text-xl font-bold mb-3">One-off vs. retainer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div className="bg-[#1a1500] border border-[#fde68a] rounded-lg p-4">
              <p className="font-bold text-sm mb-2">Vendor model (one-off)</p>
              <p className="text-xs text-[#666]">$5K audit. Clean. Done. Goodbye.</p>
              <p className="text-xs text-[#666] mt-1">Next month: start over finding the next client.</p>
              <p className="text-xs font-semibold text-[#d97706] mt-2">Revenue that ends.</p>
            </div>
            <div className="bg-[#0a1a0f] border border-[#bbf7d0] rounded-lg p-4">
              <p className="font-bold text-sm mb-2">Advisor model (retainer)</p>
              <p className="text-xs text-[#666]">$1,497/mo after the same audit.</p>
              <p className="text-xs text-[#666] mt-1">Same client. $18K/year you don&apos;t have to find cold.</p>
              <p className="text-xs font-semibold text-[#10b981] mt-2">Revenue that compounds.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold mb-3">You know the number. Protect it.</h2>
          <p className="text-sm text-[#666] mb-4">
            Start month to month — or save $1,788 with annual.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href="https://buy.stripe.com/00w5kD1nK0wkaa573A43S0c"
              className="bg-white text-black font-bold text-[15px] py-[14px] px-7 rounded-lg hover:bg-gray-100 transition-colors"
            >
              $1,497/mo monthly →
            </a>
            <a
              href="mailto:ops@launchcrate.io?subject=Annual retainer inquiry"
              className="bg-[#10b981] text-white font-bold text-[15px] py-[14px] px-7 rounded-lg hover:bg-[#059669] transition-colors"
            >
              $997/mo annual →
            </a>
          </div>
          <p className="text-xs text-[#666] mt-3">
            Questions?{' '}
            <a href="mailto:ops@launchcrate.io" className="text-[#2563eb] hover:underline">ops@launchcrate.io</a>
          </p>
        </section>
      </div>
    </div>
  )
}
