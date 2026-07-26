import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Why Your LinkedIn Ad Does the Job and Your Landing Page Undoes It | Nebula',
  description: 'LinkedIn ads build professional credibility in seconds. Most landing pages destroy it just as fast. Here is exactly what causes the mismatch and how to fix it without a full redesign.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/linkedin-ad-copy-landing-page-mismatch',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Why Your LinkedIn Ad Does the Job and Your Landing Page Undoes It',
  description: 'LinkedIn ads build professional credibility in seconds. Most landing pages destroy it just as fast. Here is exactly what causes the mismatch and how to fix it without a full redesign.',
  url: 'https://nebulacomponents.shop/learning-centre/linkedin-ad-copy-landing-page-mismatch',
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

export default function LinkedInAdCopyLandingPageMismatchPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-6 pb-24">
        {/* Header */}
        <div className="mb-8">
          <span className="text-sm font-medium text-accent">LinkedIn Ads Leaks</span>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-fg">
            Why Your LinkedIn Ad Does the Job and Your Landing Page Undoes It
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-fg-muted">
            Your LinkedIn ad earns the click. The landing page loses the conversion. The culprit is
            almost never the offer — it is the gap between the professional register of the ad and
            the generic marketing language waiting on the other side of it.
          </p>
          <p className="mt-2 text-sm text-fg-muted">Published 25 July 2026</p>
        </div>

        {/* Section 1 — The LinkedIn context switch */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-semibold text-fg">
            The LinkedIn Context Switch
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Clicking a LinkedIn ad is a professional decision. The person who clicks is not browsing
            casually — they are on a platform where their reputation is visible, their role is
            stated, and their intent is work-related. That context shapes everything about how they
            read your ad. The language, the credibility signals, the specificity of the problem you
            name — all of it lands differently than it would on Facebook or Google.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The landing page is the first thing that confirms or kills the decision they just made.
            If the page matches the professional register of the ad, the visitor relaxes and reads.
            If it does not, something feels off — and in B2B, "something feels off" is enough to
            close the tab. The visitor will not write you a note explaining why. They will just
            leave.
          </p>
          <p className="leading-relaxed text-fg-muted">
            Most advertisers treat the landing page as a separate asset optimised in isolation. The
            ad team writes the ad. The web team owns the page. The handoff is a URL. No one is
            responsible for the seam between them — and that seam is where conversions go to die.
          </p>
        </section>

        {/* Section 2 — The register collapse */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-semibold text-fg">
            The Register Collapse
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            LinkedIn ads that convert use professional-confident language. They name a specific
            problem, reference a recognisable context, and make a claim that sounds like something a
            senior peer would say — not something a vendor would broadcast. The tone is direct
            without being pushy. The specificity signals that the writer understands the
            professional world the reader lives in.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Then the click lands. And the page says something like: "Unlock your potential with our
            cutting-edge platform." Or "Transform your business with best-in-class solutions." The
            register has collapsed from professional-specific to marketing-generic in a single
            scroll. The visitor noticed the gap even if they cannot articulate it.
          </p>
          <p className="leading-relaxed text-fg-muted">
            This is not a copywriting problem in the narrow sense. It is an alignment problem. The
            ad made an implicit contract — "I understand your world" — and the landing page
            immediately broke it. The visitor no longer trusts that the product will deliver what
            the ad implied.
          </p>
        </section>

        {/* Section 3 — The credibility erosion pattern */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-semibold text-fg">
            The Credibility Erosion Pattern: 5 Things That Undo Your LinkedIn Ad
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            These are not hypothetical risks. They are the specific patterns that appear most
            frequently when we audit landing pages receiving LinkedIn traffic that fails to convert.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-fg">
            1. Stock Photos That Contradict the Ad Tone
          </h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            If your ad uses precise, problem-specific language and your landing page hero shows a
            smiling person in a generic office, the mismatch is visual before it is verbal. Stock
            imagery associated with consumer software or lifestyle marketing actively undermines the
            professional credibility your ad built. B2B buyers are pattern-matching for "this is
            for someone like me" — and a generic hero image fails that test instantly.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-fg">
            2. Switching to Casual or Consumer Language
          </h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Words like "amazing," "supercharge," "game-changer," or "easy" read as consumer-grade
            marketing on a page targeting senior buyers. LinkedIn ad copy tends to avoid these
            because experienced copywriters know the audience. Landing pages that were built for
            broad traffic and then pointed at LinkedIn campaigns carry this language by default.
            Each casual word is a small credibility leak.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-fg">
            3. Showing Generic Pricing
          </h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            A LinkedIn ad targeting heads of engineering at 500-person SaaS companies implies a
            certain price point and a certain buying context. A pricing section that shows
            "Starter / Pro / Enterprise" tiers with no reference to the buyer profile signals that
            the product was not built for that specific buyer — it was built for anyone. Generic
            pricing on a professional-audience landing page reads as a mismatch between the
            targeting precision of the ad and the positioning maturity of the product.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-fg">
            4. Burying B2B-Specific Proof Below the Fold
          </h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Case studies from companies your visitor recognises, metrics from businesses at their
            scale, testimonials from people with their title — these are the proof types that
            convert professional LinkedIn traffic. Pages built for general SEO traffic often bury
            this proof in a lower section while using the hero and first section for feature lists
            or benefit statements. For LinkedIn visitors, the proof needs to arrive before the
            pitch, not after.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-fg">
            5. A Form That Asks for a Personal Email on a Professional Offer
          </h3>
          <p className="leading-relaxed text-fg-muted">
            "Enter your email" with no qualification — or worse, a form that accepts Gmail and
            Hotmail addresses on a product marketed to B2B teams — signals that the offer is not
            actually designed for professional buyers. Asking for a work email explicitly, or
            requiring company size or role, does two things: it filters for qualified leads and it
            signals to the visitor that this product is built for professional contexts. The form
            is the last thing standing between the visit and the conversion. It should reinforce
            professional seriousness, not erode it.
          </p>
        </section>

        {/* Section 4 — LinkedIn-specific pages outperform generic pages */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-semibold text-fg">
            Why LinkedIn-Specific Landing Pages Outperform Generic Ones by 2–3x
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The 2–3x conversion lift from LinkedIn-specific landing pages is consistently reported
            by B2B advertisers who have run the experiment — splitting LinkedIn traffic between a
            generic product page and a page built or adapted specifically for that audience and
            offer. The lift is not driven by any single change. It is driven by the cumulative
            effect of removing every signal that tells the visitor "this page was not made for
            you."
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            LinkedIn-specific pages differ from generic landing pages in four concrete ways. They
            reference the professional context the visitor came from — their role, their industry,
            the specific problem named in the ad. They use the same language register as the ad:
            precise, direct, peer-level. They lead with proof that is credible to that audience
            specifically — recognisable company logos, titles that match the target persona, metrics
            that mean something in that professional context. And they remove everything that would
            work fine for a general audience but creates friction for a professional buyer: consumer
            imagery, vague benefit language, and forms that do not signal professional intent.
          </p>
          <p className="leading-relaxed text-fg-muted">
            The mechanism is simple: reducing cognitive dissonance reduces exit rate. Every moment a
            professional visitor spends resolving a mismatch between the ad and the page is a moment
            they are not advancing toward conversion. LinkedIn-specific pages eliminate the
            dissonance at the source.
          </p>
        </section>

        {/* Section 5 — The message match test */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-semibold text-fg">
            The Message Match Test for B2B
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Before running LinkedIn traffic to any landing page, run it through these questions.
            Each "no" is a conversion leak.
          </p>
          <ul className="space-y-4">
            <li className="leading-relaxed text-fg-muted">
              <span className="font-semibold text-fg">Does the headline use the same vocabulary as the ad?</span>{' '}
              Not a paraphrase — the same words, the same problem frame. A visitor who clicked on
              "reduce engineering handoff time" should not land on a page headed "Streamline your
              workflow."
            </li>
            <li className="leading-relaxed text-fg-muted">
              <span className="font-semibold text-fg">Does the first screen contain proof specific to the target audience?</span>{' '}
              Not generic five-star reviews. Case studies, logos, or metrics from companies and roles
              that match the LinkedIn audience you targeted.
            </li>
            <li className="leading-relaxed text-fg-muted">
              <span className="font-semibold text-fg">Is the language register consistent above the fold?</span>{' '}
              Read the ad copy and then read the first 100 words of the landing page. Do they sound
              like they were written by the same person for the same reader?
            </li>
            <li className="leading-relaxed text-fg-muted">
              <span className="font-semibold text-fg">Does the imagery match the professional context?</span>{' '}
              No stock photos of generic office scenes. Product screenshots, customer logos, or
              context-specific visuals that signal "this is built for a professional environment."
            </li>
            <li className="leading-relaxed text-fg-muted">
              <span className="font-semibold text-fg">Does the CTA match the intent of the LinkedIn click?</span>{' '}
              Someone who clicked a thought leadership ad is not ready to "Start a free trial." A
              soft CTA — "See how it works for [role/industry]" — matches the intent of a
              professional who is evaluating, not purchasing.
            </li>
            <li className="leading-relaxed text-fg-muted">
              <span className="font-semibold text-fg">Does the form ask for professional context?</span>{' '}
              Work email, company size, or role — at least one signal that this offer is for
              professional buyers, not general consumers.
            </li>
          </ul>
        </section>

        {/* Section 6 — Quick fixes */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-semibold text-fg">
            Quick Fixes: Adapting an Existing Page for LinkedIn Traffic
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            A full redesign is not always possible. These changes can be made to an existing page
            without touching the structure, and they address the most damaging mismatch signals
            first.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-fg">
            Rewrite the headline to mirror the ad
          </h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Take the core phrase or problem statement from the ad and make it the first thing the
            visitor reads on the page. This single change eliminates the most common source of
            register collapse — the visitor landed expecting one framing and received another.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-fg">
            Add a professional-context qualifier to the subheadline
          </h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            A subheadline that names the target role or company type — "Built for ops teams at
            scaling SaaS companies" — immediately signals that the page was made for this specific
            visitor. It costs one line of copy and eliminates most of the "is this for me?" friction.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-fg">
            Move your most credible B2B proof above the fold
          </h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            If you have logos from companies your LinkedIn audience recognises, or a case study
            result from a business at their scale, move it up. Even a single line — "Trusted by
            ops teams at [Company A], [Company B], and [Company C]" — positioned under the
            headline changes the credibility signal on arrival.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-fg">
            Replace the primary stock photo
          </h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Swap any generic office or lifestyle hero image for a product screenshot, a data
            visualisation, or a customer quote with a real name and title. This is often a
            30-minute change and it removes one of the most visible credibility signals that the
            page was not built for a professional audience.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-fg">
            Change the form to require a work email
          </h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Add "Work email" as the field label rather than "Email," and add client-side validation
            that flags common consumer domains. This is a 20-minute technical change that improves
            lead quality and signals to the visitor that this offer is professional-grade.
          </p>

          <h3 className="mb-2 mt-6 text-lg font-semibold text-fg">
            Soften the CTA to match evaluation intent
          </h3>
          <p className="leading-relaxed text-fg-muted">
            If your primary CTA is "Start free trial" or "Buy now," add a secondary CTA that matches
            the intent of a LinkedIn professional who clicked to evaluate: "See a 5-minute demo" or
            "Read how [Company] solved this." Most LinkedIn clicks come from people in an evaluation
            mindset, not a purchase mindset. A page that only offers a hard conversion CTA loses
            everyone in the evaluation phase — which on LinkedIn is the majority of your audience.
          </p>
        </section>

        {/* CTA */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-3 text-xl font-semibold text-fg">
            See What Your LinkedIn Visitors Actually Experience
          </h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            Nebula audits your landing page against the LinkedIn ad driving traffic to it — checking
            register consistency, proof placement, CTA alignment, and form friction. You get a
            specific list of what to fix, ranked by conversion impact.
          </p>
          <Link
            href="/#audit"
            className="inline-block rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Get Your Free LinkedIn Landing Page Audit
          </Link>
        </section>

        {/* Related articles */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-fg">Related Articles</h2>
          <ul className="space-y-2">
            <li>
              <Link
                href="/learning-centre/linkedin-ads-not-converting"
                className="text-accent underline-offset-2 hover:underline"
              >
                Why Your LinkedIn Ads Are Not Converting
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/linkedin-authority-gap"
                className="text-accent underline-offset-2 hover:underline"
              >
                The LinkedIn Authority Gap and How to Close It
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/message-match-checklist"
                className="text-accent underline-offset-2 hover:underline"
              >
                The Message Match Checklist for B2B Landing Pages
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/b2b-saas-landing-page-not-converting"
                className="text-accent underline-offset-2 hover:underline"
              >
                Why Your B2B SaaS Landing Page Is Not Converting
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
