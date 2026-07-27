import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Social Proof Backfire: The 4 Testimonial Configurations That Hurt Conversion | Nebula',
  description:
    'Four specific testimonial configurations that actively reduce trust below baseline - stock photos, stale dates, ICP mismatch, and generic claims. How to diagnose and fix each one.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/social-proof-backfire',
  },
}

const articleSchema = createArticleSchema({
  headline:
    'Social Proof Backfire: The 4 Testimonial Configurations That Hurt Conversion More Than No Testimonials At All',
  description:
    'Four specific testimonial configurations that actively reduce trust below baseline - stock photos, stale dates, ICP mismatch, and generic claims. How to diagnose and fix each one.',
  url: 'https://nebulacomponents.shop/learning-centre/social-proof-backfire',
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

export default function SocialProofBackfirePage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link
          href="/learning-centre"
          className="text-sm text-fg-muted hover:text-fg transition-colors"
        >
          ← Learning Centre
        </Link>

        {/* Opening panel */}
        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            Trust Leaks
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-fg md:text-4xl">
            Social Proof Backfire: The 4 Testimonial Configurations That Hurt Conversion More Than
            No Testimonials At All
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-muted">
            If your page has testimonials and still doesn't convert, the problem probably isn't
            missing social proof - it's broken social proof. Certain testimonial configurations
            don't just fail to help; they actively lower trust below the baseline of having no
            testimonials at all. Here are the four patterns, what your visitor's brain does when it
            sees each one, and the exact fix.
          </p>
        </div>

        {/* Section 1 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Configuration 1: Stock-Photo Avatars
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The uncanny valley of trust. Buyers in 2026 have seen thousands of AI-generated and
            purchased stock faces. The recognition is unconscious but instant: something is slightly
            wrong about that face. The proportions are too perfect. The background is too clean. The
            smile is too symmetric. Within milliseconds, the brain flags the image as artificial and
            immediately discounts whatever quote sits beneath it.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The visitor doesn't consciously think "that is a fake person." They just feel vaguely
            suspicious of the whole section. The testimonial has not only failed to build trust - it
            has planted a seed of doubt that contaminates every other claim on the page.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">The fix:</strong> Use a real headshot from your customer or
            remove the avatar entirely. A genuine, slightly imperfect photo - bad lighting, informal
            crop - signals authenticity more powerfully than a polished one. If you don't have a
            headshot, show a company logo instead. A logo is verifiable. A stock face is not.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Configuration 2: Undated or Obviously Stale Reviews
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A testimonial dated 2019 on a 2026 page forces the visitor to draw one of two
            conclusions: either you haven't had a customer since 2019, or you've deliberately hidden
            the recent ones. Neither is the read you want. Even if neither is true, the ambiguity
            alone is damaging enough to suppress action.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Undated testimonials are almost as bad. The absence of a date reads as an attempt to
            hide something. A visitor thinking about spending money is already primed for
            scepticism; no date is the kind of detail that tips them from cautious to unconvinced.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">The fix:</strong> Date every testimonial. If your most
            recent dated testimonial is more than 18 months old, prioritise collecting a fresh one
            before the next traffic campaign. In the interim, remove the date rather than display a
            stale one - but treat this as a temporary measure, not a solution. Recency is a
            trust signal that cannot be faked or omitted indefinitely.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Configuration 3: ICP Mismatch
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Testimonials from the wrong person create exclusion rather than identification. If your
            product serves solo founders and your testimonials are from Fortune 500 CMOs, the solo
            founder reads the page and thinks: "This isn't for me." The social proof has actively
            signalled that the ideal customer is someone they are not.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            This failure is common on pages that have upgraded their client roster over time and
            updated the testimonials to match, without realising that their current traffic is still
            composed of the earlier, smaller audience. It can also happen in reverse: testimonials
            from tiny companies on a page targeting enterprise buyers suggest the product isn't used
            at scale.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">The fix:</strong> Match the testimonial source to the
            visitor persona on each specific page. If you serve multiple segments, create
            segment-specific landing pages with segment-appropriate testimonials. The rule is
            simple: the person in the testimonial should look like the person reading the page - in
            role, company size, and the problem they were trying to solve.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Configuration 4: Generic Outcome Claims
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            "This changed my business!" is not a testimonial. It is a vague positive statement, and
            the visitor's brain reads vagueness as fabrication. When a real customer has a real
            result, they describe it in specific terms - a number, a time frame, a named problem
            that went away. The absence of specifics signals that the quote was either invented or
            too embarrassing in its modesty to include as written.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Generic claims also fail to transfer. A visitor who reads "We increased revenue by 34%
            in the first 90 days after switching" can imagine that outcome for themselves. A visitor
            who reads "Great product, highly recommend!" cannot map that to anything. The
            testimonial has given them nothing to hold.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">The fix:</strong> Before publishing a testimonial, ask: is
            there a specific outcome, a before/after state, or a named problem in this quote? If
            not, go back to the customer and ask a follow-up question: "What was the specific result
            you saw, and over what time frame?" Most customers will give you the specifics if
            prompted. If they can't or won't, the testimonial is not strong enough to publish.
          </p>
        </section>

        {/* Section 5 — Removing beats keeping */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Removing Broken Testimonials Outperforms Keeping Them
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            If any of the four configurations above appear on your page, removing them will
            outperform keeping them. This is the counterintuitive result that founders resist: "But
            at least I have something." Something that triggers the uncanny valley, signals
            abandonment, excludes the visitor, or reads as fabricated is worse than nothing.
            Nothing is neutral. Broken social proof is negative.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The baseline for social proof is not "does it exist?" It is "does it make a suspicious
            person less suspicious?" Run each testimonial through that filter before it goes live.
            If the honest answer is no, it doesn't belong on the page yet.
          </p>
        </section>

        {/* CTA section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Find the Trust Leaks on Your Page</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Nebula's audit identifies social proof failures - including cases where testimonials are
            present but structurally undermined by stock photos, stale dates, ICP mismatch, or
            vague outcomes. You'll see exactly which configurations are costing you conversion and
            what to replace them with.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/audit"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get your free audit →
            </Link>
            <Link
              href="/learning-centre/proof-before-cta"
              className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
            >
              Read: Proof Before CTA - why placement matters as much as quality
            </Link>
          </div>
        </section>

        {/* Related articles */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-lg font-bold text-fg">Related Articles</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link
                href="/learning-centre/proof-before-cta"
                className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
              >
                Proof Before CTA: Why Testimonial Placement Converts Better Than Testimonial Volume
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/no-testimonials-on-landing-page"
                className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
              >
                No Testimonials on Your Landing Page? Here's What to Use Instead
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/landing-page-not-converting"
                className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
              >
                Landing Page Not Converting: The 7 Structural Failures Behind Most Underperforming Pages
              </Link>
            </li>
            <li>
              <Link
                href="/social-proof-landing-page"
                className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
              >
                Trust Signals on Landing Pages: What Works, What's Noise, and What Actively Hurts
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
