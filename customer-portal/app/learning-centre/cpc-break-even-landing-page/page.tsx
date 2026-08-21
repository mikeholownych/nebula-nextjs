import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'What a $50 CPC Actually Needs to Look Like on a Landing Page to Break Even | Nebula',
  description:
    'Reverse-engineer your paid traffic maths. At $50 CPC and $200 AOV you need 25% CVR to break even - an impossible target. Here\'s the formula that shows you exactly what your landing page must deliver before you touch your bids.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/cpc-break-even-landing-page',
  },
}

const articleSchema = createArticleSchema({
  headline:
    'Improve Landing Pages to Break Even and Scale High CPC Traffic',
  description:
    'Reverse-engineer your paid traffic maths. At $50 CPC and $200 AOV you need 25% CVR to break even - an impossible target. Here\'s the formula that shows you exactly what your landing page must deliver before you touch your bids.',
  url: 'https://nebulacomponents.com/learning-centre/cpc-break-even-landing-page',
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

export default function CpcBreakEvenLandingPagePage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-6 py-14">
        {/* Opening panel */}
        <div className="mb-12">
          <span className="mb-4 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            Paid Traffic Economics
          </span>
          <h1 className="mb-6 heading-1 leading-tight tracking-tight text-fg lg:text-5xl">
            Improve Landing Pages to Break Even and Scale High CPC Traffic
          </h1>
          <p className="text-xl leading-relaxed text-fg-muted">
            Most founders set their bids, launch campaigns, and then wonder why
            paid traffic doesn't work. The maths was never going to allow it.
            Before you optimise a single headline or swap a button colour,
            you need to know the exact conversion rate your page must hit just
            to stop losing money - and whether that number is even achievable
            given your price point.
          </p>
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/audit?utm_source=learning-centre-cpc-break-even-landing-page&utm_medium=hero-cta"
                className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
              >
                Get your free audit →
              </Link>
              <Link
                href="/repair-sprint"
                className="inline-flex min-h-[44px] items-center justify-center rounded border border-border px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
              >
                Explore $97 Repair Sprint
              </Link>
            </div>
        </div>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            The Backwards Planning Failure
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            The standard playbook goes: choose keywords, set bids, build a
            landing page, watch what happens. The problem is that every step in
            that sequence is backwards. You're committing to a cost before you
            know what outcome the cost requires.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            When a founder sets a $50 CPC, they've implicitly agreed to pay $50
            every time someone arrives on their page. They haven't asked the
            prior question: given my price and margin, how many of those arrivals
            need to buy just to cover the ad spend? Until you answer that, you're
            not running a campaign - you're running a lottery and hoping the
            numbers work out.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            Page quality is treated as a post-launch creative problem when it is
            actually a pre-launch financial constraint. The page has to hit a
            specific CVR threshold or the business model is mathematically
            unsound at that CPC. Optimising the page after the fact is closing
            the stable door; the financial structure should determine the page
            brief before a single word is written.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            The Break-Even Formula in Plain English
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            The maths is straightforward: divide your CPC by your average order
            value and you get the conversion rate you need just to break even on
            ad spend alone - before fulfilment, overheads, or any margin.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            <strong className="text-fg">Break-even CVR = CPC ÷ AOV</strong>
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            At $50 CPC and $200 AOV: 50 ÷ 200 = 0.25, or 25%. You need one in
            four visitors to purchase just to recover your ad spend. Median
            ecommerce CVR is 1–3%. A well-optimised landing page might reach
            5–8%. 25% is not a page optimisation problem - it is a unit
            economics mismatch. The CPC is too high for the AOV.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            That leaves three levers: bring the CPC down (tighter targeting,
            better Quality Score, different channels), bring the AOV up (bundles,
            upsells, higher-tier positioning), or accept the first-purchase loss
            and justify it through lifetime value. Everything else is rearranging
            deck chairs.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            What Different CVR Thresholds Actually Look Like on a Page
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            CVR is not random. Pages that convert at 1%, 3%, and 8% are
            structurally different - not cosmetically different. Understanding
            what separates them tells you where your own page sits.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            <strong className="text-fg">1% CVR pages</strong> typically have a
            generic headline, product-first copy (features before outcomes), a
            single CTA buried below the fold, little or no social proof, and no
            objection handling. They look like a brochure. Visitors arrive,
            feel uncertain, and leave.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            <strong className="text-fg">3% CVR pages</strong> lead with a
            specific outcome for a specific person, have a clear above-fold CTA,
            and include at least one trust signal - a testimonial, a logo bar, a
            guarantee. The copy addresses the primary objection. There is
            friction reduction (clear returns policy, visible pricing, no
            surprises at checkout). These pages convert the already-willing.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            <strong className="text-fg">8% CVR pages</strong> do something
            different altogether: they convert the not-yet-willing. The headline
            names the problem the visitor just typed into Google. The page
            structure moves from pain → credibility → mechanism → proof →
            offer → risk removal. There are multiple CTAs calibrated to
            different buying stages, urgency is contextual not manufactured, and
            the copy pre-empts the top three reasons someone might not buy.
            These pages don't just capture intent - they create it.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            The LTV Adjustment: When Losing on the First Purchase Is the Strategy
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            The break-even formula above assumes you only ever sell once. For
            SaaS with monthly recurring revenue, repeat ecommerce, or
            high-ticket service businesses with strong referral loops, that
            assumption is wrong - and acting on it will make you underinvest in
            acquisition.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            If a customer pays $200 upfront but generates $800 in lifetime
            revenue, your real break-even CVR is 50 ÷ 800 = 6.25%, not 25%.
            That's a number a well-built page can actually hit. The constraint
            isn't the CPC - it's whether your LTV data is reliable enough to
            justify the initial loss.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            When the page is asking for a loss-leader action, it needs to do
            something different: it must sell the relationship, not just the
            transaction. That means demonstrating what ongoing value looks like -
            retention proof (customer tenure, usage stats, case studies spanning
            multiple months), not just first-purchase testimonials. The page is
            recruiting a long-term customer, not closing a one-time sale, and
            the copy must reflect that.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            Page Quality Is a Unit Economics Lever, Not a Branding Decision
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            Here is the reframe that changes how founders think about their
            pages: every percentage point of CVR improvement has a direct dollar
            value. It is not subjective. It is arithmetic.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            <strong className="text-fg">
              Monthly revenue gain from CVR lift = (traffic × CVR lift) × AOV
            </strong>
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            At 1,000 visitors per month, $200 AOV, improving CVR from 2% to 3%
            adds 10 sales: $2,000 per month, $24,000 per year. That same lift
            simultaneously reduces your effective CPA - meaning your existing ad
            budget suddenly performs 50% better without spending an extra dollar
            on clicks.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            A page redesign or CRO project that costs $3,000 and delivers a 1
            percentage point CVR lift at that traffic volume pays for itself in
            six weeks. No paid media investment offers that return profile. The
            founders who understand this stop treating their landing page as a
            creative asset and start treating it as the highest-leverage
            financial instrument in their acquisition stack.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            The Dangerous Middle: Pages That Look Professional but Guarantee Losses
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            The worst position in paid traffic is a page converting at 0.5% that
            looks polished enough to keep running. It doesn't trigger alarm
            bells. The creative looks fine. The layout is clean. There are no
            obvious errors. So the ads keep spending, the data keeps accumulating,
            and the losses compound quietly in the background.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            These pages fail for structural reasons, not aesthetic ones. The
            headline speaks to the product rather than the visitor's problem.
            The above-fold section answers the wrong question. The trust signals
            are there but they're the wrong type - brand logos when the visitor
            needs peer testimonials, or awards when they need a guarantee. The
            CTA asks for too much too soon from a cold audience.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            The danger is that a 0.5% CVR page is good enough to make you think
            the channel doesn't work, when actually the channel is fine and the
            page is the constraint. Founders kill profitable ad channels every
            week because they attribute the poor return to the traffic source
            rather than the landing page. The page is the last thing they change,
            when it should have been the first.
          </p>
        </section>

        {/* CTA */}
        <section className="mb-12 rounded-2xl border border-accent/20 bg-accent/5 px-8 py-10">
          <h2 className="mb-3 text-xl font-bold text-fg">
            Know What Your Page Is Actually Delivering Before You Touch Your Bids
          </h2>
          <p className="leading-relaxed text-fg-muted mb-6">
            Before optimising your bids, know what your page is currently
            delivering. The free audit shows the structural elements - headline,
            CTA, trust signals, above-fold structure - that most often limit CVR.
            You'll see exactly where your page sits on the 1% / 3% / 8%
            spectrum, and what specific changes would move it.
          </p>
          <Link
            href="/audit?utm_source=learning-centre&utm_medium=organic-content"
            className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Get the free landing page audit →
          </Link>
        </section>

        {/* Related */}
        <section>
          <h2 className="mb-5 text-lg font-bold text-fg">Related articles</h2>
          <ul className="space-y-3">
            <li>
              <Link
                href="/learning-centre/high-cpc-low-conversion"
                className="text-accent underline-offset-4 hover:underline"
              >
                High CPC, Low Conversion: Why Your Traffic Quality Isn't the Problem
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/before-you-raise-ad-budget"
                className="text-accent underline-offset-4 hover:underline"
              >
                Before You Raise Your Ad Budget, Check These Five Page Metrics
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/landing-page-conversion-rate-benchmark"
                className="text-accent underline-offset-4 hover:underline"
              >
                Landing Page Conversion Rate Benchmarks by Industry and Traffic Source
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/paid-traffic-leak-map"
                className="text-accent underline-offset-4 hover:underline"
              >
                The Paid Traffic Leak Map: Where Your Ad Spend Is Actually Going
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
