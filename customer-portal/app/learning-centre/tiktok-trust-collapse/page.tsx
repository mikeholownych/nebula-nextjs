import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: "The TikTok Trust Collapse: When Gen Z Buyers Hit a Page That Looks Like 2019 | Nebula",
  description: "TikTok trains buyers to detect inauthenticity instantly. If your landing page looks like 2019, Gen Z bounces before they read a word. Here is what to fix.",
  alternates: {
    canonical: "https://nebulacomponents.shop/learning-centre/tiktok-trust-collapse",
  },
}

const articleSchema = createArticleSchema({
  headline: "The TikTok Trust Collapse: When Gen Z Buyers Hit a Page That Looks Like 2019",
  description: "TikTok trains buyers to detect inauthenticity instantly. If your landing page looks like 2019, Gen Z bounces before they read a word. Here is what to fix.",
  url: "https://nebulacomponents.shop/learning-centre/tiktok-trust-collapse",
  publishedDate: "2026-07-25",
  modifiedDate: "2026-07-25",
})

export default function TiktokTrustCollapsePage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-4 pb-24">
        {/* Header */}
        <div className="mb-2 text-sm font-medium uppercase tracking-widest text-accent">
          TikTok Ads Leaks
        </div>
        <h1 className="mb-4 text-4xl font-bold leading-tight text-fg">
          The TikTok Trust Collapse: When Gen Z Buyers Hit a Page That Looks Like 2019
        </h1>
        <p className="mb-8 text-lg leading-relaxed text-fg-muted">
          TikTok has trained an entire generation to detect inauthenticity in under two seconds. If your landing page looks like it was built in 2019, Gen Z buyers will bounce before they finish reading your headline - and your ad spend disappears with them.
        </p>

        {/* Section 1 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-semibold text-fg">
            Why TikTok Trains Buyers to Detect Inauthenticity
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            TikTok's algorithm rewards raw, human, unpolished content. A founder filming on their phone in a cluttered office outperforms a slick studio production on that platform every single time. This is not a quirk - it is the core mechanic of how TikTok distributes reach.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The consequence is that anyone who spends real time on TikTok becomes an expert at spotting templates. They have seen thousands of hours of authentic content. The moment they land on a page built from a generic SaaS template, something in their brain registers: "This is not real." They cannot always articulate it, but they act on it - instantly.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            This pattern is documented across TikTok ad performance data. Click-through rates from TikTok campaigns routinely look strong. Then conversion rates collapse. The ad felt authentic. The page did not. The buyer left the moment the two worlds clashed.
          </p>
          <p className="leading-relaxed text-fg-muted">
            Understanding this dynamic is the prerequisite for fixing it. You are not optimising a landing page. You are closing a credibility gap between a channel that rewards humanity and a page that was built to impress a procurement committee.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-semibold text-fg">
            What a 2019-Looking Page Actually Signals
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            There is a specific aesthetic that reads as "2019 SaaS" to a TikTok-native buyer. It includes stock photos of diverse professionals in modern offices, gradient hero sections in purple-to-teal, phrases like "next-generation solutions," "end-to-end platform," and "empower your team." None of these are overtly wrong. Collectively, they signal that nobody real built this page - a design committee approved it.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The specific trust-kill elements are: photography that is clearly licensed rather than taken by someone in the company, headlines that describe a category rather than a specific outcome, and copy that could apply to any of 500 competing products. These patterns say: "We are a company. We have a marketing budget. We are not talking to you specifically."
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            TikTok buyers - especially Gen Z - are not less sophisticated than older B2B buyers. They are more sophisticated in a specific way: they have been trained by the platform to evaluate trust signals at a glance. The signals that worked in 2019 (polished design, brand logos, award badges) are now actively counterproductive when the traffic source is TikTok.
          </p>
          <p className="leading-relaxed text-fg-muted">
            This is not about making your page look cheap. It is about making your page look human. Those are different problems with different solutions.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-semibold text-fg">
            Trust Elements TikTok Traffic Specifically Requires
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            TikTok buyers need to see a real founder face - not a brand mascot, not a stock photo of a CEO type, not an illustrated avatar. An actual photograph of an actual person who built the thing. This one element changes conversion rates more than any headline test for TikTok-sourced traffic.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Named customers with specific outcomes outperform anonymous testimonials by a wide margin. "A mid-market SaaS company reduced churn by 34%" is invisible to a TikTok buyer. "Jamie at Fervent Software cut churn from 8.2% to 5.1% in the first 60 days" is real. The specificity signals that the story actually happened.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Human language matters. TikTok buyers have finely calibrated BS detectors for corporate language. Copy that sounds like it was approved by a legal team will feel like a wall between them and the product. Write the way the founder would explain the thing to a friend - direct, specific, slightly unpolished.
          </p>
          <p className="leading-relaxed text-fg-muted">
            Finally: dated proof. A testimonial from 2021 or a case study with no date reads as potentially outdated or cherry-picked. TikTok buyers want to know the product is working right now. Timestamps on testimonials, recent join dates on customer counts ("412 teams this quarter"), and clearly current screenshots all signal active traction.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-semibold text-fg">
            The Price Signal Problem
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            TikTok drives impulse-adjacent buying behaviour. A buyer arrives from a 30-second video with emotional momentum - they are curious, they want to know more, they are close to a decision. Hidden pricing or form-gated pricing kills that momentum dead.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            "Contact us for pricing" is the single most conversion-destructive phrase on a page receiving TikTok traffic. It signals to a Gen Z buyer one of two things: either the price is too high to say out loud, or the company does not respect their time. Neither interpretation drives action.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            TikTok buyers will not fill out a form to find out whether they can afford something. They will find a competitor who shows pricing openly. If your pricing is complex, show a starting point. "Plans from $49/month" with a link to the full pricing page is infinitely more effective than a request form.
          </p>
          <p className="leading-relaxed text-fg-muted">
            The deeper issue is that hiding pricing optimises for a different buyer than TikTok sends. Enterprise procurement processes that involve multiple stakeholders and multi-week evaluations do not start with a TikTok ad. Build the page for the buyer TikTok actually sends, not the buyer your sales team is used to handling.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-semibold text-fg">
            Social Proof Format Mismatch
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The format of your social proof matters as much as the content. Formal case studies - the kind with an executive headshot, a three-paragraph narrative, and a PDF download link - are not the social proof format that TikTok buyers trust. They are the social proof format that enterprise procurement teams trust. These are different audiences.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            G2 badges, Capterra awards, and analyst reports read as institutional validation. TikTok buyers are not looking for institutional validation. They are looking for peer validation - evidence that someone like them made this decision and it worked out. UGC-style proof is the format that matches the channel.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Practically, this means short-form video testimonials outperform written case studies. Screenshots of real Slack messages or emails outperform polished pull-quotes. A founder posting a quick video explaining one customer result outperforms a professionally produced brand video. The rough edges are features, not bugs - they signal that the proof is real.
          </p>
          <p className="leading-relaxed text-fg-muted">
            If you only have formal case studies, repurpose them. Extract the one specific number. Put a face and a first name on it. Write it in plain language. That is not dumbing it down - that is translating it for the channel where your ads are running.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-semibold text-fg">
            Authenticity Audit: Questions to Ask Before Running TikTok Spend
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Before sending TikTok traffic to a landing page, run it through these specific questions. Each "no" answer is a conversion leak you are about to pay to create.
          </p>
          <ul className="mb-4 space-y-3 text-fg-muted">
            <li className="flex gap-3">
              <span className="mt-1 text-accent">→</span>
              <span><strong className="text-fg">Is there a real founder or team face on the page?</strong> Not a logo, not a stock photo - a photograph of an actual person who built this product.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 text-accent">→</span>
              <span><strong className="text-fg">Are customer names and outcomes specific?</strong> "A logistics company saved time" fails. "Dan at Routly cut dispatch time by 40% in week one" passes.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 text-accent">→</span>
              <span><strong className="text-fg">Is pricing visible without a form or call?</strong> If a buyer cannot determine affordability in under ten seconds, they will not stay long enough to find out.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 text-accent">→</span>
              <span><strong className="text-fg">Does the copy sound like a human being wrote it?</strong> Read the headline out loud. Would you say that sentence to another person? If not, rewrite it.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 text-accent">→</span>
              <span><strong className="text-fg">Is the social proof recent and dated?</strong> Undated testimonials signal either that they are old or that they are fake. Add dates to everything.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 text-accent">→</span>
              <span><strong className="text-fg">Is the proof format peer-style rather than institutional?</strong> UGC-style video, screenshots, and first-name testimonials outperform formal case studies and award badges for this traffic source.</span>
            </li>
          </ul>
          <p className="leading-relaxed text-fg-muted">
            If you answer yes to all six, your page is ready for TikTok traffic. If you answer no to three or more, fixing the page before running ads will return more value than any bid strategy optimisation you could apply.
          </p>
        </section>

        {/* Related Articles */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">Related Articles</h2>
          <ul className="space-y-3">
            <li>
              <Link
                href="/learning-centre/tiktok-ads-not-converting"
                className="text-accent underline-offset-4 hover:underline"
              >
                TikTok Ads Not Converting: The Real Reason Your Clicks Go Nowhere
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/tiktok-landing-page-scroll-speed-gap"
                className="text-accent underline-offset-4 hover:underline"
              >
                The TikTok Landing Page Scroll Speed Gap
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/no-testimonials-on-landing-page"
                className="text-accent underline-offset-4 hover:underline"
              >
                No Testimonials on Your Landing Page: What You Are Signalling to Buyers
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/social-proof-backfire"
                className="text-accent underline-offset-4 hover:underline"
              >
                When Social Proof Backfires: The Trust Signals That Actually Hurt Conversions
              </Link>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-3 text-2xl font-semibold text-fg">
            See What TikTok Buyers Actually See When They Land on Your Page
          </h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            Nebula audits your landing page against the specific trust signals TikTok traffic requires - founder presence, pricing visibility, proof format, and language authenticity. Get a scored report before your next campaign launch.
          </p>
          <Link
            href="/#audit"
            className="inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
          >
            Get Your Free Page Audit
          </Link>
        </section>
      </div>
    </main>
  )
}
