import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Your Google Ads CTR Is 8% But Conversion Rate Is 0.1% - The Landing Page Disconnect Audit | Nebula',
  description: 'A high CTR with a low conversion rate points to a page-level disconnect. Diagnose which conversion signals fail when click volume is strong but actions are not.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/google-ads-high-ctr-low-conversion',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Your Google Ads CTR Is 8% But Conversion Rate Is 0.1% - The Landing Page Disconnect Audit',
  description: 'A high CTR with a low conversion rate points to a page-level disconnect. Diagnose which conversion signals fail when click volume is strong but actions are not.',
  url: 'https://nebulacomponents.com/learning-centre/google-ads-high-ctr-low-conversion',
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

export default function GoogleAdsHighCtrLowConversionPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-6 py-14">

        {/* Opening panel */}
        <div className="mb-12">
          <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent mb-6">
            Google Ads Leaks
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-fg mb-6 leading-tight">
            Your Google Ads CTR Is 8% But Conversion Rate Is 0.1% - The Landing Page Disconnect Audit
          </h1>
          <p className="text-xl leading-relaxed text-fg-muted">
            An 8% click-through rate indicates the ad is generating interest. A 0.1% conversion rate on the other side of that click means something may be breaking the moment a high-intent visitor lands on your page. The landing page is one of the variables worth investigating — and it is the one you can check without changing your ad account.
          </p>
        </div>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-fg mb-4">
            Why High CTR + Low CVR Is the Clearest Diagnostic Signal in Paid Search
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            Most paid search problems are ambiguous. A low CTR could mean bad targeting, a weak headline, a mismatched audience, or an irrelevant offer. But when your CTR is high and your CVR is near zero, the pattern suggests the ad is generating interest — and something on the page is not converting that interest into action.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            High CTR tells you that the query intent, the ad copy, and the audience match well enough that people are choosing your result over competitors&apos;. That part of the funnel is working. The conversion gap occurs between the click and the form submission — which makes the landing page the next logical place to investigate.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            This is a useful diagnostic position. Targeting and creative are less likely to be the issue. The next step is to check the page for observable conversion-signal failures — the structural conditions that may be creating friction between the click and the action.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-fg mb-4">
            The Expectation Gap: Query Intent vs. Page Intent Mismatch
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            When someone types a buy-intent query into Google - "best CRM for small business", "book a plumber London", "pricing for email marketing software" - they arrive at your page carrying a specific expectation. They expect to be shown the direct answer to what they searched for, immediately, without scrolling.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            Most landing pages fail this test because they were designed to introduce the brand, not to answer the query. The headline talks about the company's mission. The above-fold section shows a product screenshot with no pricing context. The CTA says "learn more." None of this matches the mental model of a visitor who just clicked an ad for "email marketing software pricing."
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            The expectation gap is the single most common cause of high-intent traffic failing to convert. The visitor doesn't bounce because they dislike you - they bounce because the page doesn't confirm that they're in the right place. Without that confirmation in the first three seconds, the back button wins.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-fg mb-4">
            The Top 4 Page Failures That Waste High-Intent Traffic
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            High-intent visitors are not patient. They arrived with a specific goal. Each of these four failures breaks the implicit promise made by the ad that got them there.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            <strong className="text-fg">No direct answer to the query in the H1.</strong> If someone clicked an ad for "conversion rate optimisation agency" and the H1 reads "We Help Businesses Grow Online," the page has immediately failed the first test. The H1 must mirror the query intent - not the brand tagline, not the product category, but the specific thing the visitor just told Google they wanted.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            <strong className="text-fg">No price or offer signal above the fold.</strong> Buy-intent visitors are evaluating fit before they commit to reading. A page that hides pricing, makes the offer vague, or buries the "what you get" below the scroll forces the visitor to work. Most won't. Even a ballpark price range, a "from £X/month" signal, or a clear offer statement above the fold reduces bounce from high-intent traffic significantly.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            <strong className="text-fg">No trust signal for a first-time visitor.</strong> A visitor who clicked your ad has never been to your site. They have no prior relationship with your brand. If the page has no social proof - no client names, no review count, no recognisable logo - within the first viewport, the default assumption is risk. Trust signals need to be visible before the fold, not stacked at the bottom of the page after the testimonials section.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            <strong className="text-fg">A form that asks for more than an email.</strong> Every additional field in a form is a conversion tax. For a first-touch paid visitor, a form asking for name, company, phone number, job title, and budget is asking for a level of commitment that hasn't been earned yet. The ask should match the relationship stage. For cold paid traffic, the minimum viable form is an email address - everything else can be collected after the first conversion event.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-fg mb-4">
            Why Google's Quality Score Doesn't Catch This
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            Quality Score is a common red herring in this diagnosis. A QS of 7 or 8 feels like confirmation that the landing page is fine. It isn't. Quality Score measures two things: expected CTR (which your 8% CTR is clearly passing) and landing page experience score, which Google derives from factors like page load speed, mobile usability, and keyword relevance in the page content.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            What Quality Score does not measure is whether a visitor who lands on the page actually converts. Google doesn't have access to your conversion data unless you've explicitly shared it via goals. Even then, QS is a predicted metric based on signals Google can observe - it is not a measure of your page's persuasive effectiveness for high-intent traffic.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            A page can have a QS of 9, load in under two seconds, be fully mobile-responsive, contain every relevant keyword in the copy, and still convert at 0.1% because the H1 doesn't match the query intent and there's no price signal above the fold. Quality Score and conversion rate measure different things. Don't let a healthy QS close the investigation.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-fg mb-4">
            The Specific Audit Sequence to Run Right Now
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            This audit takes less than fifteen minutes and surfaces the page failures that account for the majority of CTR–CVR gaps. Run it in order - the sequence matters because each check builds on the previous one.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            <strong className="text-fg">Step 1: Check your H1 against the exact keyword triggering the most clicks.</strong> Open your Google Ads search terms report, sort by clicks, take the top keyword, and read your landing page H1. Does the H1 directly and explicitly answer the intent of that keyword? If you can't draw a straight line between the search term and the H1 in under three seconds, the H1 needs to change.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            <strong className="text-fg">Step 2: Screenshot the above-fold view on mobile without scrolling.</strong> This is what your visitor sees first. Verify that this screenshot contains: (a) an H1 that matches query intent, (b) a price or offer signal of some kind, (c) at least one trust marker - logo, review count, or client name - and (d) a CTA that is visible without scrolling. If any of these four elements are missing from the screenshot, you've found a conversion leak.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            <strong className="text-fg">Step 3: Count the fields in your primary form.</strong> For each field beyond email address, consider the friction cost. Fewer fields generally reduce friction for cold paid traffic — forms with five or more fields are a common finding in low-converting pages. If your form has more fields than necessary for the first interaction, try a progressive profiling approach: collect email first, then ask for additional details on the thank-you page or in the follow-up sequence.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-fg mb-4">
            What a 1% CVR Looks Like vs. a 0.1% CVR - The Structural Difference
          </h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            The difference between a landing page converting at 0.1% and one converting at 1% is rarely a full redesign. In most cases it comes down to two or three specific elements, and the changes are surgical rather than cosmetic.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            A 0.1% CVR page typically has a brand-focused H1 that doesn't mirror the search intent, hides pricing behind a "contact us" CTA, puts social proof below the fold, and uses a multi-field form that asks for commitment before delivering value. The page is professionally designed and loads quickly - it just doesn't answer the visitor's specific question fast enough.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            A 1% CVR page has a query-mirrored H1 in the first viewport, a visible price anchor or offer statement above the fold, a trust signal (logo strip, review count, or a single strong testimonial) in the opening section, and a form or CTA that asks for exactly one thing. The design might be simpler. The page might be shorter. But every above-fold element is doing conversion work rather than brand work.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            The 10x gap in conversion rate rarely requires 10x more work to close. Most CTR–CVR disconnects are resolved by fixing the H1, surfacing a price signal, moving one trust element above the fold, and simplifying the form. These are four discrete changes - not a rebuild.
          </p>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-accent/10 border border-accent/20 px-8 py-10 mb-12">
          <h2 className="text-xl font-bold text-fg mb-3">
            Find Exactly Where Your Page Is Losing High-Intent Clicks
          </h2>
          <p className="leading-relaxed text-fg-muted mb-6">
            Run the free audit to see your page's above-fold structure, H1 clarity, trust signal presence, and CTA placement - the four elements most often responsible for the CTR–CVR gap.
          </p>
          <Link
            href="/#audit"
            className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
          >
            Run the Free Audit
          </Link>
        </section>

        {/* Related */}
        <section>
          <h2 className="text-lg font-bold text-fg mb-4">Related Articles</h2>
          <ul className="space-y-3">
            <li>
              <Link
                href="/learning-centre/google-ads-clicks-no-sales"
                className="text-accent hover:underline leading-relaxed"
              >
                Google Ads Clicks But No Sales - Where the Funnel Is Actually Breaking
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/landing-page-not-converting"
                className="text-accent hover:underline leading-relaxed"
              >
                Landing Page Not Converting? The 6-Point Diagnostic Checklist
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/message-match-checklist"
                className="text-accent hover:underline leading-relaxed"
              >
                The Message Match Checklist: Aligning Ads to Landing Pages
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/above-fold-landing-page"
                className="text-accent hover:underline leading-relaxed"
              >
                What Your Above-Fold Landing Page Must Contain to Convert Paid Traffic
              </Link>
            </li>
          </ul>
        </section>

      </div>
    </main>
  )
}
