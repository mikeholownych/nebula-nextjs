import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'LinkedIn Ads Getting Clicks But No Conversions: Fix The Page First | Nebula Components',
  description: 'If LinkedIn ads get clicks but no conversions, separate campaign delivery from post-click behaviour before changing targeting or the landing page.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/linkedin-ads-not-converting' },
}

const articleSchema = createArticleSchema({
  headline: 'LinkedIn Ads Getting Clicks But No Conversions: Isolate the Post-Click Leak',
  description: 'If LinkedIn ads get clicks but no conversions, separate campaign delivery from post-click behaviour before changing targeting or the landing page.',
  url: 'https://nebulacomponents.shop/learning-centre/linkedin-ads-not-converting',
  publishedDate: '2026-07-21',
  modifiedDate: '2026-07-21',
})

export default function LinkedinAdsNotConvertingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
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
            LinkedIn Ads Getting Clicks But No Conversions: Isolate the Post-Click Leak
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            LinkedIn clicks can be expensive, which makes diagnosis before
            iteration important. Before adjusting targeting or creative, verify
            tracking and inspect how each campaign&apos;s visitors behave on
            the page they actually receive.
          </p>
        </div>

        {/* Direct answer */}
        <section
          data-editorial="answer-first"
          className="mt-6 rounded-2xl border border-border bg-bg-panel p-8"
        >
          <h2 className="mb-4 text-2xl font-bold text-fg">
            Direct answer: test the post-click journey, not an assumption
          </h2>
          <p className="leading-relaxed text-fg-muted">
            Segment LinkedIn traffic by campaign, audience, device, and landing
            page. Confirm conversion events, then check whether the first
            viewport continues the ad&apos;s audience and promise, offers
            relevant proof, and asks for a proportionate next step. Use those
            observations to select one hypothesis and measure it against the
            current baseline.
          </p>
          <aside
            role="note"
            aria-label="Evidence boundary"
            className="mt-5 rounded-xl border border-border px-5 py-4 text-sm leading-relaxed text-fg-muted"
          >
            <strong className="text-fg">Evidence boundary:</strong> high CPC,
            clicks, and low conversion can prioritise a page-side hypothesis,
            but they do not prove causality or exclude targeting, offer,
            attribution, and sales-process effects. No page change guarantees a
            conversion or cost outcome.
          </aside>
          <div className="mt-5 flex flex-col gap-2 text-sm">
            <Link
              href="/learning-centre/linkedin-authority-gap"
              className="font-semibold text-accent hover:text-accent-light"
            >
              Inspect the LinkedIn authority gap
            </Link>
            <Link
              href="/learning-centre/b2b-saas-landing-page-not-converting"
              className="font-semibold text-accent hover:text-accent-light"
            >
              Diagnose a B2B SaaS landing page
            </Link>
          </div>
        </section>

        {/* Section 1 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Cost of Every Page Leak Is Amplified on LinkedIn</h2>
          <p className="leading-relaxed text-fg-muted">
            Use your own CPC and observed conversion rate to model the
            post-click cost. For illustration, 100 clicks at a $10 CPC cost
            $1,000: two recorded conversions imply $500 of media spend per
            conversion, while five imply $200. This is arithmetic, not a
            LinkedIn benchmark or forecast.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Run this calculation before anything else: what is your current cost-per-lead from LinkedIn? Now divide that by your close rate. That's your cost-per-acquisition. If that number is unsustainable, the first place to look is your landing page conversion rate - not your bid strategy, not your audience segments.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Model several conversion-rate scenarios with your actual spend,
            then validate any observed change against the same conversion
            definition and a comparable traffic period. Do not present a
            modelled saving as a measured result.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">B2B Decision Makers Need Peer Proof, Not Feature Lists</h2>
          <p className="leading-relaxed text-fg-muted">
            The professional scrolling LinkedIn is not evaluating your product emotionally - they're evaluating risk. A VP of Marketing who clicks your ad is asking: "Will this embarrass me if I recommend it? Will it actually do what it claims? Has anyone like me used it and gotten results?"
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A feature-led page may leave those questions unanswered when proof
            is generic or detached from the audience named in the ad. Inspect
            whether each proof point identifies the customer context and the
            source of any claimed result.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Evidence formats to evaluate for LinkedIn traffic:
          </p>
          <ul className="mt-3 space-y-2 text-fg-muted">
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>Named testimonials with job title, company size, and specific outcome ("reduced churn 22% in Q1")</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>Logos of recognisable companies in your ICP's peer group - not just any logo wall</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>Case study snippets with measurable results, not narrative prose</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>Proof visible before the CTA - not after it</span></li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Demo Request Is Too High-Commitment for Cold Traffic</h2>
          <p className="leading-relaxed text-fg-muted">
            A common LinkedIn ad funnel sends awareness traffic directly to a
            &ldquo;Book a Demo&rdquo; page. That CTA may fit a re-engagement
            touchpoint, but it can be a high-commitment first step for visitors
            seeing the brand for the first time.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A B2B decision maker clicking during the workday may not be ready to
            commit to a sales call. That makes CTA architecture a variable to
            test:
          </p>
          <ul className="mt-3 space-y-2 text-fg-muted">
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>Compare a specific guide with the current demo request for the same traffic segment</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>Test whether a relevant tool or assessment better matches the ad&apos;s promised next step</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>If you must ask for a demo, the page needs to do significant proof-of-value work before that ask lands</span></li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            If your LinkedIn ads go to a "Book a Demo" page with no prior warm-up content on that
            page, test conversion architecture as one hypothesis. Campaign targeting, offer fit,
            and post-click experience still need separate evidence.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Message Match: The Ad Made a Promise, The Page Must Keep It</h2>
          <p className="leading-relaxed text-fg-muted">
            LinkedIn lets you target with precision: seniority, function, company size, industry. You can show a CFO at a 200-person SaaS company a specific ad about financial reporting. That ad created a specific expectation about what the landing page would contain.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            If that CFO lands on a generic homepage or a generic product page that doesn't echo the specific language, promise, and audience framing of the ad - the implicit contract is broken. They don't see the page as relevant to them. They leave.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Diagnose your message match by reading the headline of your ad, then reading the headline of your landing page. Ask: does the landing page headline feel like the logical continuation of the ad's promise? The specific outcome named in the ad should be reflected - not paraphrased, reflected - in the above-fold copy of the page.
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
