import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Good Landing Page Conversion Rate: Benchmarks By Traffic Source | Nebula Components',
  description: 'What is a good landing page conversion rate? The median is 2.35% — but that number is almost useless without knowing your traffic source, offer type, and temperature.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/landing-page-conversion-rate-benchmark' },
}

const articleSchema = createArticleSchema({
  headline: 'What Is A Good Landing Page Conversion Rate? The Benchmark By Traffic Source',
  description: 'What is a good landing page conversion rate? The median is 2.35% — but that number is almost useless without knowing your traffic source, offer type, and temperature.',
  url: 'https://nebulacomponents.shop/learning-centre/landing-page-conversion-rate-benchmark',
  publishedDate: '2026-07-21',
  modifiedDate: '2026-07-21',
})

export default function LandingPageConversionRateBenchmarkPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre" className="text-sm font-semibold text-accent hover:text-accent-light transition-colors">
          ← Learning Centre
        </Link>
        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">Paid Traffic Economics · Benchmarks</p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">What Is A Good Landing Page Conversion Rate? The Benchmark By Traffic Source</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">The most quoted number — 2-3% — is technically accurate and almost completely useless. Your conversion rate is meaningless without context: what's driving the traffic, what you're asking visitors to do, and how well-matched the page is to the intent of the click. Here's how to read your number correctly.</p>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Industry Benchmarks (And What They Actually Mean)</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">Across all industries and traffic sources, the median landing page conversion rate sits at <span className="font-semibold text-fg">2.35%</span>. The top quartile — the pages you should be benchmarking against — convert at <span className="font-semibold text-fg">5% or higher</span>. The top 10% of landing pages consistently hit <span className="font-semibold text-fg">11% and above</span>.</p>
          <p className="leading-relaxed text-fg-muted">If you're at 2.35%, you're average. Average means you're burning budget at the same rate as everyone else with an underperforming page. The goal isn't to hit the median — it's to diagnose why you're not in the top quartile, because the gap between 2% and 5% is almost never the ad. It's the page.</p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">CVR By Traffic Source: The Numbers That Matter</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">Traffic source is the single biggest variable in conversion rate, because it determines how warm and how intent-qualified your visitor is when they land.</p>
          <div className="mb-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-fg">Traffic Source</th>
                  <th className="px-4 py-3 text-left font-semibold text-fg">Typical CVR Range</th>
                  <th className="px-4 py-3 text-left font-semibold text-fg">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 text-fg">Google Search (paid)</td>
                  <td className="px-4 py-3 text-accent font-semibold">3–5%</td>
                  <td className="px-4 py-3 text-fg-muted">High intent — they searched for the thing</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-fg">Organic Search (SEO)</td>
                  <td className="px-4 py-3 text-accent font-semibold">2–5%</td>
                  <td className="px-4 py-3 text-fg-muted">High relevance, lower urgency than paid</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-fg">Meta Ads (Facebook/Instagram)</td>
                  <td className="px-4 py-3 text-accent font-semibold">1–3%</td>
                  <td className="px-4 py-3 text-fg-muted">Interrupted intent — they didn't search for you</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-fg">TikTok Ads</td>
                  <td className="px-4 py-3 text-accent font-semibold">0.5–2%</td>
                  <td className="px-4 py-3 text-fg-muted">Entertainment mindset, cold audience</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-fg">LinkedIn Ads</td>
                  <td className="px-4 py-3 text-accent font-semibold">0.5–1.5%</td>
                  <td className="px-4 py-3 text-fg-muted">B2B, high ticket, longer decision cycle</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="leading-relaxed text-fg-muted">The implication: a 1.5% CVR on LinkedIn B2B traffic may be performing well. A 1.5% CVR on Google Search for a high-intent keyword is a problem that needs diagnosing — not more budget.</p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">CVR By Offer Type: Lead Gen vs Ecommerce vs SaaS</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">What you're asking visitors to do changes the baseline entirely. Asking for an email address (lead gen) is fundamentally lower friction than asking for a $97 payment or a 14-day trial signup.</p>
          <ul className="space-y-3 text-fg-muted">
            <li className="flex gap-3"><span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent"></span><span><span className="font-semibold text-fg">Lead gen (free resource, email opt-in):</span> 5–15% on a well-matched page. Below 3% means the offer isn't compelling or the ask feels untrustworthy.</span></li>
            <li className="flex gap-3"><span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent"></span><span><span className="font-semibold text-fg">Ecommerce (product purchase):</span> 1–4%. Top performers in competitive niches hit 5–8% with strong proof and frictionless checkout.</span></li>
            <li className="flex gap-3"><span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent"></span><span><span className="font-semibold text-fg">SaaS free trial / demo:</span> 2–5%. The higher the monthly price, the lower this number will be — longer sales cycles compress it further.</span></li>
            <li className="flex gap-3"><span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent"></span><span><span className="font-semibold text-fg">High-ticket service (discovery call):</span> 0.5–2%. The ask is large. Every element of proof on the page is doing work.</span></li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Dangerous Pattern: Treating CVR As A Fixed Number</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">The most common mistake is benchmarking CVR as if it's a property of your business, when it's actually a readout of how well your page matches the intent and readiness of the visitor in front of it.</p>
          <p className="mb-4 leading-relaxed text-fg-muted">A <span className="font-semibold text-fg">1% CVR with qualified traffic</span> — visitors who searched for your exact solution, have budget, and are ready to act — may be a signal that your page is failing to close what should be easy conversions. Fix the page.</p>
          <p className="leading-relaxed text-fg-muted">A <span className="font-semibold text-fg">5% CVR with unqualified traffic</span> looks great on a dashboard and loses you money on every sale. You've optimised for a number, not a business outcome. The question is never just "what is my CVR?" It's "who is converting, and is the page working for the right people?"</p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">What To Do If You're Below Benchmark</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">The instinct when CVR is low is to increase ad spend, try a new audience, or switch platforms. Before any of that: audit the page. Budget added to a broken page multiplies the loss — it doesn't fix the underlying problem.</p>
          <p className="mb-4 leading-relaxed text-fg-muted">The diagnostic order matters. Check these in sequence:</p>
          <ol className="space-y-3 text-fg-muted list-none">
            <li className="flex gap-3"><span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">1</span><span><span className="font-semibold text-fg">Message match:</span> Does the page headline match the ad copy or search query that sent the click? Mismatch here kills CVR immediately.</span></li>
            <li className="flex gap-3"><span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">2</span><span><span className="font-semibold text-fg">Proof before CTA:</span> Is there enough social proof, specifics, and credibility signals before you ask for the conversion?</span></li>
            <li className="flex gap-3"><span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">3</span><span><span className="font-semibold text-fg">Friction on the CTA itself:</span> Button copy, form length, commitment language — every word in the conversion zone has weight.</span></li>
            <li className="flex gap-3"><span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">4</span><span><span className="font-semibold text-fg">Mobile experience:</span> If 60–70% of your traffic is mobile and the page wasn't built for it, you're leaving most of your conversions on the floor.</span></li>
          </ol>
        </section>

        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Find the leak on your page</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">Run the free Nebula audit to see exactly where your page breaks the chain from click to conversion.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit" className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors">Run the free audit</Link>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/high-cpc-low-conversion" className="block text-accent hover:text-accent-light transition-colors">High CPC, Low Conversion: When The Ad Works But The Page Doesn't →</Link>
            <Link href="/learning-centre/before-you-raise-ad-budget" className="block text-accent hover:text-accent-light transition-colors">Before You Raise Ad Budget: Fix These Page Leaks First →</Link>
            <Link href="/learning-centre/landing-page-not-converting" className="block text-accent hover:text-accent-light transition-colors">Landing Page Not Converting: The Full Diagnostic Checklist →</Link>
            <Link href="/learning-centre/message-match-checklist" className="block text-accent hover:text-accent-light transition-colors">Message Match Checklist: Does Your Page Match The Click That Sent Them? →</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
