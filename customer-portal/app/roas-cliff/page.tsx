import { Metadata } from 'next'
import Link from 'next/link'
import '../globals.css'

export const metadata: Metadata = {
  title: 'The ROAS Cliff — Why Your CTR Looks Fine and Your Page Converts Nobody',
  description: 'A self-diagnostic guide for founders running paid traffic with zero or weak conversions. Score your landing page in 10 minutes. Find the monthly leak.',
  openGraph: {
    title: 'The ROAS Cliff — Why Your CTR Looks Fine and Your Page Converts Nobody',
    description: 'Score your landing page across 5 dimensions. See your monthly leak estimate. Three fixes that actually move the number.',
    type: 'article',
    url: 'https://nebulacomponents.shop/roas-cliff',
  },
}

export default function RoasCliffPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      <div className="max-w-[740px] mx-auto px-6 py-16 pb-32">
        
        <p className="text-gray-500 text-sm mb-12">
          Nebula Components · Self-diagnostic guide · 15 min read
        </p>
        
        <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3">
          The ROAS Cliff: Why your CTR looks fine and your page converts nobody
        </h1>
        
        <p className="text-gray-500 mb-12">
          A self-diagnostic guide for founders running paid traffic with zero or weak conversions.
        </p>

        <h2 className="text-xl font-semibold mt-12 mb-4 text-white">
          The screenshot that started it
        </h2>
        
        <p className="mb-5 text-gray-400">
          Monday morning. You open your ad account. CTR is 4.1%. Spend is up from last week. You check Shopify, or your CRM, or whatever you use to count sales. The number is wrong. Not a rounding error — it&apos;s just not there.
        </p>
        
        <p className="mb-5 text-gray-400">
          You go back to the ad manager. The click volume is real. The impressions are fine. You screenshot it and post somewhere — Reddit, a Slack group, a DM to someone you trust — and you write: &quot;Is Meta getting worse or is it me?&quot;
        </p>
        
        <p className="mb-5 text-gray-400">
          That question is wrong. Not in a judgmental way. Just technically wrong. Meta is moving your traffic. Your landing page is failing the conversation.
        </p>

        <div className="bg-[#111111] border border-[#1f1f1f] border-l-4 border-l-emerald-500 p-5 rounded-md my-8">
          <p className="m-0 text-gray-300">
            This guide gives you the framework to find that gap yourself, measure what it&apos;s costing you, and know which fix to make first.
          </p>
        </div>

        <div className="border-t border-[#1f1f1f] my-12" />

        <h2 className="text-xl font-semibold mt-12 mb-4 text-white">
          Message match — the gap nobody talks about
        </h2>
        
        <p className="mb-5 text-gray-400">
          You have probably changed your headline at least twice. Maybe four times. You&apos;ve read about benefit-led copy vs. problem-led copy. You&apos;ve looked at competitors. You&apos;ve asked the designer.
        </p>
        
        <p className="mb-5 text-gray-400">
          The conversion rate barely moved.
        </p>
        
        <p className="mb-5 text-gray-400">
          Here&apos;s why: <strong className="text-gray-200">headline quality is not the bottleneck. Headline continuity is.</strong>
        </p>

        <h3 className="text-base font-semibold mt-8 mb-3 text-emerald-500">
          Three layers of message match
        </h3>
        
        <p className="mb-5 text-gray-400">
          <strong className="text-gray-200">Headline-to-headline.</strong> Does the first thing they read on your page directly continue the claim in the ad? Not echo it. Continue it. If the ad says &quot;finally, a scheduling tool that doesn&apos;t require a 2-hour setup,&quot; the page headline should not say &quot;The scheduling tool for growing teams.&quot; It should say something like &quot;Setup in 11 minutes. Your entire calendar migrated, no IT required.&quot; Specific. Continuous. Same conversation.
        </p>

        <div className="border-t border-[#1f1f1f] my-12" />

        <h2 className="text-xl font-semibold mt-12 mb-4 text-white">
          The 5-dimension self-audit
        </h2>
        
        <p className="mb-5 text-gray-400">
          This is the same scoring system used on every audit. Score yourself 1–10 on each dimension. Being generous to your own page is how you stay stuck.
        </p>

        <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-6 my-4">
          <h3 className="text-base font-semibold mb-3 text-emerald-500">Dimension 1: Message match</h3>
          <p className="mb-4 text-sm text-gray-400">
            If a stranger read only your ad copy and only your above-fold landing page copy in sequence — does the page feel like the next sentence of the same conversation?
          </p>
          <div className="space-y-3">
            <div className="flex gap-3 items-baseline border-b border-[#1f1f1f] pb-3">
              <span className="text-gray-500 text-xs w-20">1–3</span>
              <span className="text-gray-400 text-sm">The ad and page are clearly talking about different things.</span>
            </div>
            <div className="flex gap-3 items-baseline border-b border-[#1f1f1f] pb-3">
              <span className="text-gray-500 text-xs w-20">4–6</span>
              <span className="text-gray-400 text-sm">There&apos;s thematic overlap but the visitor has to do mental work to connect them.</span>
            </div>
            <div className="flex gap-3 items-baseline border-b border-[#1f1f1f] pb-3">
              <span className="text-gray-500 text-xs w-20">7–9</span>
              <span className="text-gray-400 text-sm">The page directly continues the claim or promise from the ad.</span>
            </div>
            <div className="flex gap-3 items-baseline">
              <span className="text-gray-500 text-xs w-20">10</span>
              <span className="text-gray-400 text-sm">Laser-precise. The page headline is essentially the ad headline with more specificity.</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-6 my-4">
          <h3 className="text-base font-semibold mb-3 text-emerald-500">Dimension 2: Above-fold clarity</h3>
          <p className="mb-4 text-sm text-gray-400">
            Does a stranger know, within 3 seconds, exactly what you&apos;re selling and who it&apos;s for?
          </p>
          <div className="space-y-3">
            <div className="flex gap-3 items-baseline border-b border-[#1f1f1f] pb-3">
              <span className="text-gray-500 text-xs w-20">1–3</span>
              <span className="text-gray-400 text-sm">Company name, logo, vague tagline. No offer visible.</span>
            </div>
            <div className="flex gap-3 items-baseline border-b border-[#1f1f1f] pb-3">
              <span className="text-gray-500 text-xs w-20">4–6</span>
              <span className="text-gray-400 text-sm">Product category is clear but the specific outcome or customer isn&apos;t.</span>
            </div>
            <div className="flex gap-3 items-baseline border-b border-[#1f1f1f] pb-3">
              <span className="text-gray-500 text-xs w-20">7–9</span>
              <span className="text-gray-400 text-sm">Clear offer, clear audience, clear outcome in the first viewport.</span>
            </div>
            <div className="flex gap-3 items-baseline">
              <span className="text-gray-500 text-xs w-20">10</span>
              <span className="text-gray-400 text-sm">Sub-2-second comprehension. Visitor understands the value without scrolling.</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-6 my-4">
          <h3 className="text-base font-semibold mb-3 text-emerald-500">Dimension 3: CTA specificity</h3>
          <p className="mb-4 text-sm text-gray-400">
            Is the call-to-action specific enough to reduce decision friction?
          </p>
          <div className="space-y-3">
            <div className="flex gap-3 items-baseline border-b border-[#1f1f1f] pb-3">
              <span className="text-gray-500 text-xs w-20">1–3</span>
              <span className="text-gray-400 text-sm">&quot;Get started.&quot; &quot;Learn more.&quot; &quot;Contact us.&quot;</span>
            </div>
            <div className="flex gap-3 items-baseline border-b border-[#1f1f1f] pb-3">
              <span className="text-gray-500 text-xs w-20">4–6</span>
              <span className="text-gray-400 text-sm">&quot;Start your free trial.&quot; Better but still abstract.</span>
            </div>
            <div className="flex gap-3 items-baseline border-b border-[#1f1f1f] pb-3">
              <span className="text-gray-500 text-xs w-20">7–9</span>
              <span className="text-gray-400 text-sm">&quot;Get my free landing page audit → 60-second result&quot;</span>
            </div>
            <div className="flex gap-3 items-baseline">
              <span className="text-gray-500 text-xs w-20">10</span>
              <span className="text-gray-400 text-sm">The CTA makes the next step feel trivially easy.</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1f1f1f] my-12" />

        <h2 className="text-xl font-semibold mt-12 mb-4 text-white">
          The leak math
        </h2>
        
        <p className="mb-5 text-gray-400">
          A 1.5% conversion rate and a 0.4% conversion rate do not feel different. They&apos;re both &quot;low.&quot; In dollar terms they&apos;re not close.
        </p>
        
        <p className="mb-5 text-gray-400">
          At ,000/month in ad spend and a 7 average order value, assuming 2,000 clicks:
        </p>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 my-8">
          <div className="flex justify-between border-b border-red-500/10 pb-3 mb-3 text-sm">
            <span className="text-gray-400">0.4% conversion rate</span>
            <span className="text-gray-300 font-semibold">8 sales — 76 revenue — ,224 net loss</span>
          </div>
          <div className="flex justify-between border-b border-red-500/10 pb-3 mb-3 text-sm">
            <span className="text-gray-400">1.5% conversion rate</span>
            <span className="text-gray-300 font-semibold">30 sales — ,910 revenue — ,090 net loss</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Monthly difference</span>
            <span className="text-white font-bold">,134 from the same ad spend</span>
          </div>
        </div>

        <div className="border-t border-[#1f1f1f] my-12" />

        <h2 className="text-xl font-semibold mt-12 mb-4 text-white">
          The 3 fixes that actually move the needle
        </h2>
        
        <p className="mb-5 text-gray-400">
          After scoring 40+ landing pages, the same 3 issues account for the majority of conversion gaps.
        </p>

        <h3 className="text-base font-semibold mt-8 mb-3 text-emerald-500">
          Fix 1: Rewrite the above-fold so the first sentence continues the ad
        </h3>
        
        <p className="mb-5 text-gray-400">
          Take the primary claim from your highest-traffic ad. Make the H1 on your landing page the next sentence of that claim. Not a rephrasing — a continuation.
        </p>

        <h3 className="text-base font-semibold mt-8 mb-3 text-emerald-500">
          Fix 2: Move your best proof to the first viewport
        </h3>
        
        <p className="mb-5 text-gray-400">
          You almost certainly have evidence that your offer works — a customer result, a specific metric, a before/after. It&apos;s probably in a testimonials section halfway down the page. Move it up.
        </p>

        <h3 className="text-base font-semibold mt-8 mb-3 text-emerald-500">
          Fix 3: Make the CTA specific about the next 60 seconds
        </h3>
        
        <p className="mb-5 text-gray-400">
          &quot;Get started&quot; creates a decision point. &quot;Get my free landing page audit → 60-second result&quot; creates a next step. The visitor isn&apos;t deciding whether to buy something. They&apos;re deciding whether to spend 60 seconds to see their score.
        </p>

        <div className="border-t border-[#1f1f1f] my-12" />

        <h2 className="text-xl font-semibold mt-12 mb-4 text-white">
          What to do with your score
        </h2>
        
        <p className="mb-5 text-gray-400">
          If you scored under 30 and you&apos;re running paid traffic, you&apos;re funding a leak. The math above shows what that number is.
        </p>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 my-12 text-center">
          <h3 className="text-emerald-500 font-semibold text-lg mb-2">
            Run the free audit on your specific page
          </h3>
          <p className="text-gray-400 mb-6">
            Scored across all 5 dimensions. Monthly leak calculated. Specific fix written out. 60 seconds. No call required.
          </p>
          <Link 
            href="/audit" 
            className="inline-block bg-emerald-500 text-black font-bold px-8 py-3 rounded-md hover:opacity-90 transition-opacity"
          >
            Run my free audit →
          </Link>
          <br />
          <Link 
            href="https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b" 
            className="inline-block border border-[#1f1f1f] text-gray-300 font-medium px-7 py-3 rounded-md mt-3 hover:border-emerald-500 transition-colors"
          >
            Skip ahead — 47 Fix Pack
          </Link>
          <p className="text-xs text-gray-500 mt-4">
            No discovery call. No testing phase. Full refund if we don&apos;t find a problem worth fixing.
          </p>
        </div>

      </div>
    </div>
  )
}
