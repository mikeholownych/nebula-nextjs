import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Agency Handoff Debt: 7 Regressions That Kill Conversions',
  description:
    'You hired an agency, got a great landing page, then handed it to a developer for minor changes. Here are the 7 ways it quietly stopped working - and how to find them.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/agency-handoff-debt',
  },
}

const articleSchema = createArticleSchema({
  headline:
    'Agency Handoff Debt: 7 Silent Regressions That Kill Landing Page Performance',
  description:
    'You hired an agency, got a great landing page, then handed it to a developer for minor changes. Here are the 7 ways it quietly stopped working - and how to find them.',
  url: 'https://nebulacomponents.shop/learning-centre/agency-handoff-debt',
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

export default function AgencyHandoffDebtPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link
          href="/learning-centre"
          className="text-sm font-semibold text-accent hover:text-accent-light transition-colors"
        >
          ← Learning Centre
        </Link>

        {/* Opening panel */}
        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            Landing Page Leaks
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-fg md:text-4xl">
            Agency Handoff Debt: 7 Silent Regressions That Kill Landing Page Performance
          </h1>
          <p className="mt-5 text-lg text-fg-muted leading-relaxed">
            The agency delivered. You reviewed it, approved it, and it was converting. Then you
            handed it to a developer for "a few minor tweaks" - and three months later you're
            wondering why traffic went up but leads went down. This is agency handoff debt: the
            compounding damage that accumulates when a page moves from the people who optimised it
            to the people who maintain it. It isn't malice. It isn't even carelessness. It's the
            seven specific changes that almost always happen, each individually defensible, together
            devastating.
          </p>
        </div>

        {/* Section 1 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            1. The Meta Description That Got "Cleaned Up"
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Agency copywriters write meta descriptions at 155–160 characters because that's the
            search-result cutoff. They test the phrasing, include a verb, and front-load the value
            prop. When a developer consolidates the head section or migrates to a new CMS, the
            description often gets shortened - either truncated manually or dropped to a generic
            fallback. Google rewrites your snippet, click-through rate drops 10–20%, and nothing in
            your analytics dashboard tells you why.
          </p>
          <p className="mt-3 text-fg-muted leading-relaxed">
            Check your current meta description against the one the agency wrote. If it's shorter
            than 140 characters, vaguer in language, or missing the specific offer, it has been
            changed.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            2. The Social Proof Section That Moved Below the Fold
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Agencies place testimonials and client logos in the first scroll because research is
            unanimous: social proof above the fold converts. Developers fix mobile layout issues by
            reordering sections - it is one practical way to stop something breaking on a 390px
            screen. The testimonials move down. The layout looks fine. Nobody moves them back,
            because the problem they solved (the mobile bug) is gone.
          </p>
          <p className="mt-3 text-fg-muted leading-relaxed">
            On your current page, scroll to 100vh on a desktop viewport. If social proof isn't
            visible before that line, it was moved. The agency put it there deliberately. That
            decision has been undone.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            3. The Conversion Pixel Deleted During Script Deduplication
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Agencies install tracking scripts precisely: Meta Pixel, Google Ads conversion tag,
            LinkedIn Insight Tag - each fired on specific events. When a developer inherits the
            codebase and runs a "clean up the scripts" pass, duplicate-looking tags get removed.
            The agency's event-specific pixel fires on button click. The developer's consolidated
            tag fires on page load. They look the same in the head. They measure completely
            different things.
          </p>
          <p className="mt-3 text-fg-muted leading-relaxed">
            If your ad platform reported a sudden drop in conversion events around the same time as
            a development sprint, this is almost certainly what happened. Reinstating the pixel
            doesn't recover the lost attribution data - it only stops future bleeding.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            4. The H1 That Got Rewritten to Be "Cleaner"
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Agency copywriters write H1s with keyword alignment in mind. The headline may sound
            slightly unnatural in isolation - that's intentional. It matches the language a
            prospect types into Google, not the language a founder prefers on a slide deck.
            Developers (and founders reviewing their own pages) frequently edit the H1 to something
            that sounds sharper, more brand-aligned, or "less SEO-y." The ranking signal for the
            primary keyword weakens immediately.
          </p>
          <p className="mt-3 text-fg-muted leading-relaxed">
            Pull the original H1 from a Wayback Machine snapshot or the agency's handoff document.
            Compare it word-for-word against what's live today. If the primary keyword phrase is
            absent or reordered, the page's topical authority for that query has been diluted.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            5. The Page Load Time That Ballooned After New Libraries Were Added
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Agencies building landing pages optimise for Core Web Vitals because they know Google
            measures them and visitors abandon slow pages. In-house developers working in a broader
            codebase add utility libraries, import shared components, and pull in the same
            dependency stack they use everywhere else. A page that loaded in 1.8 seconds now loads
            in 4.2 seconds. LCP tanks. Bounce rate climbs. Paid traffic becomes dramatically more
            expensive because Quality Score falls.
          </p>
          <p className="mt-3 text-fg-muted leading-relaxed">
            Run a PageSpeed Insights report on the current URL. If Time to First Byte or Largest
            Contentful Paint has degraded since the agency's handoff date, the JavaScript bundle
            has grown. Every 100ms of added latency costs roughly 1% of conversions - the math is
            not theoretical.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            6. The Trust Logos That Started 404ing After an Asset Reorganisation
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Agency-built pages reference logo images from a specific asset directory. When a
            developer migrates the project to a new framework, restructures the public folder, or
            moves to a CDN, the paths break. Broken image tags don't throw JavaScript errors -
            they render as empty boxes. Visitors see blank spaces where "As seen in Forbes" or
            client logos used to be. The trust signal disappears silently, and it can persist for
            months before anyone notices because internal reviewers aren't looking for it.
          </p>
          <p className="mt-3 text-fg-muted leading-relaxed">
            Open your page, right-click any logo in the trust bar, and inspect the image element.
            If the src returns a 404 in the Network tab, you are actively showing visitors a broken
            page and attributing lost conversions to your copy instead of your infrastructure.
          </p>
        </section>

        {/* Section 7 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            7. The CTA That Lost Its Action Verb
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Specific, outcome-focused button copy gives visitors more information than generic labels such
            as "Submit." Test the wording against your own traffic rather than assuming a universal lift.
            Developers editing button text to feel "less pushy" or "more professional" routinely
            swap action verbs for nouns: "Get started" becomes "Start," "Book a call" becomes
            "Contact us," "See my results" becomes "Learn more." Each change is individually
            small. The cumulative effect is a CTA that no longer tells the visitor what they're
            getting or why they should click it.
          </p>
          <p className="mt-3 text-fg-muted leading-relaxed">
            Read your primary CTA button text aloud. If it doesn't include a verb that describes an
            outcome - not an action the visitor takes, but a result they receive - it has been
            softened past the point of effectiveness. Restore the original, or write a new version
            that follows the same pattern: verb + specific outcome.
          </p>
        </section>

        {/* Conclusion section */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">The Compounding Problem</h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            None of these seven changes would crater a page on its own. A slightly shorter meta
            description costs you a few clicks. A misplaced testimonial costs you a few conversions.
            A softened CTA costs you a few leads. But all seven together - which is the typical
            state of a page six months after a developer handoff - create a compounding drag where
            every layer of the funnel is running at 80% of its original efficiency. The output is a
            page that looks like the agency's page, passes a casual review, and converts at half
            the rate.
          </p>
          <p className="mt-3 text-fg-muted leading-relaxed">
            This is not a reason to distrust your developer. It is a reason to audit the specific
            elements that agencies optimise and developers don't track. The page the agency
            delivered may have been fine. What the developer handed back was different in seven
            ways that compounded each other silently.
          </p>
        </section>

        {/* CTA section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Find Your Handoff Regressions in 60 Seconds</h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            If you handed your page to someone else in the last six months, you probably have at
            least three of these. The audit takes 60 seconds to find them - it checks your meta
            description length, H1 keyword alignment, CTA text, social proof placement, page speed,
            and broken assets in a single pass. You'll know exactly which regressions are live on
            your page before you finish your coffee.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/audit"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-light transition-colors"
            >
              Run the free audit →
            </Link>
            <Link
              href="/learning-centre/landing-page-load-time-slow"
              className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-semibold text-fg hover:border-accent hover:text-accent transition-colors"
            >
              Why your page load time is slow
            </Link>
          </div>
        </section>

        {/* Related links */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Related Articles</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link
                href="/learning-centre/landing-page-not-converting"
                className="text-accent hover:text-accent-light font-medium transition-colors"
              >
                Why your landing page isn't converting →
              </Link>
              <p className="mt-1 text-sm text-fg-muted">
                A systematic walkthrough of the most common reasons high-traffic pages produce
                low-lead volume - starting with the opening screen and working down.
              </p>
            </li>
            <li>
              <Link
                href="/learning-centre/proof-before-cta"
                className="text-accent hover:text-accent-light font-medium transition-colors"
              >
                Proof before CTA: the simple fix most landing pages miss →
              </Link>
              <p className="mt-1 text-sm text-fg-muted">
                Why missing or buried social proof is the single most reliable predictor of a
                landing page that underperforms its traffic potential.
              </p>
            </li>
            <li>
              <Link
                href="/learning-centre/above-fold-landing-page"
                className="text-accent hover:text-accent-light font-medium transition-colors"
              >
                What should be above the fold on a landing page →
              </Link>
              <p className="mt-1 text-sm text-fg-muted">
                The five elements that must appear before the first scroll - and the ordering that
                converts best based on eye-tracking and heatmap data.
              </p>
            </li>
            <li>
              <Link
                href="/learning-centre/landing-page-load-time-slow"
                className="text-accent hover:text-accent-light font-medium transition-colors"
              >
                Landing page load time is slow →
              </Link>
              <p className="mt-1 text-sm text-fg-muted">
                How to diagnose a slow landing page, which metrics actually matter, and the fixes
                that recover the most performance with the least engineering effort.
              </p>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
