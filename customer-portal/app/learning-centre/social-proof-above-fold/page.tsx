import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Social Proof Above the Fold: Why Placement Beats Volume on Landing Pages | Nebula',
  description:
    'One verifiable proof element visible near your CTA without scrolling converts better than ten testimonials buried below the fold. Three placement patterns and a self-check.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/social-proof-above-fold',
  },
}

const articleSchema = createArticleSchema({
  headline:
    'Social Proof Above the Fold: Why Placement Beats Volume on Landing Pages',
  description:
    'One verifiable proof element visible near your CTA without scrolling converts better than ten testimonials buried below the fold. Three placement patterns and a self-check.',
  url: 'https://nebulacomponents.com/learning-centre/social-proof-above-fold',
  publishedDate: '2026-08-28',
  modifiedDate: '2026-08-28',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What does "above the fold" mean on a landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Above the fold means the portion of the page visible on screen without scrolling. On mobile at 375px width, this is typically 600-700px of vertical space. Any element a visitor must scroll to see is below the fold and will be missed by visitors who bounce before engaging.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should social proof be above the fold?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Visitors make the decision whether to continue reading within a few seconds of landing. If social proof is only at the bottom of the page, visitors who are uncertain whether to trust the offer will never see it. One piece of verifiable proof above the fold reduces uncertainty before the visitor decides to leave.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I add social proof above the fold without cluttering the design?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Three patterns work without adding visual noise: a single-line trust bar with a review count and score directly under the headline, a compact testimonial with name and one-sentence result placed beside the CTA button, or a row of three recognizable customer logos above the fold. Each adds proof without competing with the primary CTA for attention.',
      },
    },
  ],
}

export default function SocialProofAboveFoldPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link
          href="/learning-centre"
          className="text-sm text-fg-muted hover:text-fg transition-colors"
        >
          &larr; Learning Centre
        </Link>

        {/* Opening panel */}
        <div className="mt-8 rounded-md border border-border bg-bg-panel p-8 md:p-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            Trust Signals
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-fg md:text-4xl">
            Social Proof Above the Fold: Why Placement Beats Volume on Landing Pages
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-muted">
            The most common social proof mistake is not having too little of it - it is placing all of it
            below where most visitors stop reading. One credible proof element visible alongside your
            CTA on a 375px mobile screen consistently outperforms ten testimonials that require
            scrolling to reach. This article explains why, and gives you three placement patterns
            you can act on today.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/audit?utm_source=learning-centre-social-proof-above-fold&utm_medium=hero-cta"
              className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
            >
              Get your free audit &rarr;
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
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Why Proof at the Bottom Converts Worse
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            When a visitor arrives on your landing page from a paid ad, they are making a real-time
            judgment: is this worth my time and money? That judgment happens in the first few seconds,
            and it happens in the viewport they can see without scrolling. On a 375px-wide mobile
            device - the most common screen size for paid traffic - that viewport is roughly 650 to
            750px tall. What sits below that line is invisible at the moment the decision is forming.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Testimonials that appear only after the fold are not useless, but they serve a different
            purpose: they reinforce a decision that has already been made. They do not initiate trust
            in a visitor who has not yet decided to keep reading. If your CTA is above the fold but
            your proof is below it, you are asking for commitment before credibility. That order
            suppresses conversion.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">The core principle:</span> at least one
            verifiable proof element must be visible in the same viewport as your primary CTA, without
            any scrolling, on a 375px mobile screen. Not a generic star rating - a specific, checkable
            signal such as a named customer quote, a verified review badge, or a named publication logo.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Placement Pattern 1: Trust Bar Under the Headline
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A trust bar is a single horizontal row of compact social proof placed immediately below
            the headline, before the sub-headline or body copy. It typically contains three to five
            elements: a star rating with review count, one or two named customer logos, and possibly
            a short quote fragment of five to eight words.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The reason this pattern works is timing. The headline stops the scroll; the trust bar
            answers the immediate scepticism that follows. The visitor's brain reads headline,
            questions whether to believe it, and immediately encounters evidence that others have
            already believed it and acted. That sequence - claim, then proof, then CTA - mirrors
            how persuasion works in conversation.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">What to include:</span> only verifiable elements.
            A star rating linked to a real review platform, logos of real customers, or a quote
            fragment with a name and company. Avoid generic badges like &ldquo;Trusted by thousands&rdquo;
            with no source - visitors see through them and the ambiguity creates distrust.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Placement Pattern 2: Testimonial Beside the CTA
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            On desktop layouts with a two-column structure, placing a single strong testimonial
            directly beside the CTA button is the highest-proximity proof arrangement possible.
            The visitor's eye moves from the offer to the button and encounters the proof without
            any redirecting of attention.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The testimonial in this position needs to be the strongest one you have - not the
            longest, but the most specific. It should name a concrete outcome, identify the customer
            by name and company, and ideally address the most common objection your visitor has
            at this moment. &ldquo;We cut our cost per acquisition by 40% in the first two weeks&rdquo; is
            significantly stronger than &ldquo;Great product, very easy to use.&rdquo;
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            On mobile, this pattern collapses to a stacked layout: testimonial above the CTA
            button, with the testimonial shortened to two or three lines to stay within the fold.
            The name, company, and one specific claim must survive the truncation.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Placement Pattern 3: Review Badge Next to the CTA Label
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            When space is constrained - a narrow mobile viewport, a short hero section, or a
            minimal design system - the most compact form of above-fold proof is a review
            badge placed directly adjacent to the CTA button label. This is typically a small
            star rating with a number: &ldquo;4.9 / 5 from 312 reviews&rdquo; rendered at 12 to 14px,
            positioned immediately below or inline with the button.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            This pattern has almost no layout cost and can be added to any existing hero section
            in under an hour. Its power comes from proximity: the proof is physically attached
            to the action. The visitor reads the button label and the social proof in a single
            fixation. The micro-commitment friction drops because the last thing they see before
            clicking is evidence that others have already clicked and found it worthwhile.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">Critical requirement:</span> the number must be
            real and linkable. If the review count is fabricated or unverifiable, experienced buyers
            will notice and the badge becomes negative proof rather than positive. Link the badge
            to the platform where the reviews live - G2, Trustpilot, Google, or App Store.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Self-Check: The 375px Mobile Screenshot Test
          </h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Before publishing any change to your above-fold layout, take a screenshot at exactly
            375px width with Chrome DevTools or Firefox's responsive design mode. Look at the first
            viewport height - approximately 667px on a standard iPhone SE - and ask two questions:
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            First: is there at least one verifiable proof element visible in this screenshot? A
            star rating with a linked source, a named customer quote, a recognisable logo, or a
            verified badge counts. A generic &ldquo;trusted by businesses worldwide&rdquo; line does not.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Second: is the proof element in the same visual unit as the CTA? If the proof is at
            the top of the page and the CTA is at the bottom of the first viewport, the proximity
            effect is weakened. The closer the proof is to the button - ideally within 40 to 80px -
            the stronger the conversion support.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            If either answer is no, pick one of the three patterns above and implement it before
            your next traffic campaign. The{' '}
            <Link
              href="/signals/trust-signals"
              className="underline underline-offset-4 hover:text-fg transition-colors"
            >
              Trust Signals diagnostic
            </Link>{' '}
            in Nebula's audit identifies exactly which proof elements are present above the fold
            and whether they meet the verifiability threshold.
          </p>
        </section>

        {/* CTA section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Check Your Above-Fold Trust Signals</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Nebula's free audit checks whether verifiable proof is present in the same viewport as
            your CTA on mobile, flags missing or unverifiable badges, and gives you a prioritised
            fix list. Takes under two minutes to run.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/audit?utm_source=learning-centre-social-proof-above-fold&utm_medium=closing-cta"
              className="inline-flex items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
            >
              Get your free audit &rarr;
            </Link>
            <Link
              href="/learning-centre/what-is-social-proof-landing-page"
              className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
            >
              Read: What Is Social Proof on a Landing Page?
            </Link>
          </div>
        </section>

        {/* Related articles */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-lg font-bold text-fg">Related Articles</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link
                href="/learning-centre/what-is-social-proof-landing-page"
                className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
              >
                What Is Social Proof on a Landing Page? A Founder's Guide
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/social-proof-backfire"
                className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
              >
                Social Proof Backfire: The 4 Testimonial Configurations That Hurt Conversion
              </Link>
            </li>
            <li>
              <Link
                href="/signals/trust-signals"
                className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg transition-colors"
              >
                Trust Signals: How Nebula Audits Social Proof on Your Landing Page
              </Link>
            </li>
          </ul>
        </section>
        {/* FAQ section */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Frequently Asked Questions</h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold text-fg">What does &ldquo;above the fold&rdquo; mean on a landing page?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Above the fold means the portion of the page visible on screen without scrolling. On mobile at 375px width, this is typically 600-700px of vertical space. Any element a visitor must scroll to see is below the fold and will be missed by visitors who bounce before engaging.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">Why should social proof be above the fold?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Visitors make the decision whether to continue reading within a few seconds of landing. If social proof is only at the bottom of the page, visitors who are uncertain whether to trust the offer will never see it. One piece of verifiable proof above the fold reduces uncertainty before the visitor decides to leave.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">How do I add social proof above the fold without cluttering the design?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Three patterns work without adding visual noise: a single-line trust bar with a review count and score directly under the headline, a compact testimonial with name and one-sentence result placed beside the CTA button, or a row of three recognizable customer logos above the fold. Each adds proof without competing with the primary CTA for attention.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
