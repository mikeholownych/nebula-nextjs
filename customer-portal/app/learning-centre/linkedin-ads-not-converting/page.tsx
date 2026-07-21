import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'LinkedIn Ads Getting Clicks But No Conversions: Fix The Page First | Nebula Components',
  description: 'LinkedIn CPCs run $8–15. Every page leak is expensive. If your LinkedIn ads are clicking but not converting, the fix is almost always on the landing page — not the targeting.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/linkedin-ads-not-converting' },
}

const articleSchema = createArticleSchema({
  headline: 'LinkedIn Ads Getting Clicks But No Conversions: The Page Is Usually Why',
  description: 'LinkedIn CPCs run $8–15. Every page leak is expensive. If your LinkedIn ads are clicking but not converting, the fix is almost always on the landing page — not the targeting.',
  url: 'https://nebulacomponents.shop/learning-centre/linkedin-ads-not-converting',
  publishedDate: '2026-07-21',
  modifiedDate: '2026-07-21',
})

export default function LinkedinAdsNotConvertingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre" className="text-sm font-semibold text-accent hover:text-accent-light transition-colors">
          ← Learning Centre
        </Link>

        {/* Hero card */}
        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            LinkedIn Ads Leaks · linkedin ad to landing page conversion
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            LinkedIn Ads Getting Clicks But No Conversions: The Page Is Usually Why
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            LinkedIn is the most expensive paid channel most B2B companies run. At $8–15 per click, a leaking landing page doesn't just cost you conversions — it compounds losses at a rate no other channel matches. Before you adjust your targeting or creative, audit the page the traffic is landing on.
          </p>
        </div>

        {/* Section 1 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Cost of Every Page Leak Is Amplified on LinkedIn</h2>
          <p className="leading-relaxed text-fg-muted">
            At a $10 average CPC, a page converting at 2% instead of 5% costs you $333 in wasted ad spend for every 100 clicks. Most LinkedIn advertisers accept that performance as a targeting or ICP problem, run more tests, and spend more money reaching the same conclusion. The page was the problem the whole time.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Run this calculation before anything else: what is your current cost-per-lead from LinkedIn? Now divide that by your close rate. That's your cost-per-acquisition. If that number is unsustainable, the first place to look is your landing page conversion rate — not your bid strategy, not your audience segments.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A 1% improvement in landing page conversion rate on a $5,000/month LinkedIn budget can reduce cost-per-lead by 30–50%. No targeting change delivers that return at that speed.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">B2B Decision Makers Need Peer Proof, Not Feature Lists</h2>
          <p className="leading-relaxed text-fg-muted">
            The professional scrolling LinkedIn is not evaluating your product emotionally — they're evaluating risk. A VP of Marketing who clicks your ad is asking: "Will this embarrass me if I recommend it? Will it actually do what it claims? Has anyone like me used it and gotten results?"
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Most B2B landing pages answer none of those questions. They lead with features, describe the product in technical detail, and bury any proof behind a generic "customers love us" section with consumer-style star ratings. That's the wrong format for this audience.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The social proof that converts LinkedIn traffic:
          </p>
          <ul className="mt-3 space-y-2 text-fg-muted">
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Named testimonials with job title, company size, and specific outcome ("reduced churn 22% in Q1")</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Logos of recognisable companies in your ICP's peer group — not just any logo wall</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Case study snippets with measurable results, not narrative prose</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Proof visible before the CTA — not after it</span></li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Demo Request Is Too High-Commitment for Cold Traffic</h2>
          <p className="leading-relaxed text-fg-muted">
            The default LinkedIn ad funnel: run an awareness ad, send traffic to a "Book a Demo" page, wonder why conversion rates are below 1%. The demo CTA made sense when it was a re-engagement touchpoint. For cold LinkedIn traffic seeing your brand for the first time, it's asking for a marriage proposal on a first impression.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A B2B decision maker who clicks your ad at 10am during a busy workday is not ready to commit 30 minutes to a sales call. They are ready to consume something useful without risk. That means your CTA architecture matters:
          </p>
          <ul className="mt-3 space-y-2 text-fg-muted">
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Gated content (a specific, actionable guide) consistently outperforms demo requests for cold LinkedIn traffic</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Free tools or assessments outperform static content because they deliver immediate perceived value</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>If you must ask for a demo, the page needs to do significant proof-of-value work before that ask lands</span></li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            If your LinkedIn ads are going to a "Book a Demo" page with no prior warm-up content on that same page, you have a conversion architecture problem, not a targeting problem.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Message Match: The Ad Made a Promise, The Page Must Keep It</h2>
          <p className="leading-relaxed text-fg-muted">
            LinkedIn lets you target with precision: seniority, function, company size, industry. You can show a CFO at a 200-person SaaS company a specific ad about financial reporting. That ad created a specific expectation about what the landing page would contain.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            If that CFO lands on a generic homepage or a generic product page that doesn't echo the specific language, promise, and audience framing of the ad — the implicit contract is broken. They don't see the page as relevant to them. They leave.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Diagnose your message match by reading the headline of your ad, then reading the headline of your landing page. Ask: does the landing page headline feel like the logical continuation of the ad's promise? The specific outcome named in the ad should be reflected — not paraphrased, reflected — in the above-fold copy of the page.
          </p>
        </section>

        {/* CTA section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Find the leak on your page</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            Run the free Nebula audit to see exactly where your page breaks the chain from click to conversion.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit" className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors">
              Run the free audit
            </Link>
            <Link href="/learning-centre" className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors">
              Browse all leaks
            </Link>
          </div>
        </section>

        {/* Related links */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/b2b-saas-landing-page-not-converting" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → B2B SaaS Landing Page Not Converting
            </Link>
            <Link href="/learning-centre/high-cpc-low-conversion" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → High CPC, Low Conversion: Where the Budget Goes
            </Link>
            <Link href="/learning-centre/proof-before-cta" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Proof Before CTA: Why Order Matters
            </Link>
            <Link href="/learning-centre/traffic-but-no-form-fills" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Traffic But No Form Fills
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
