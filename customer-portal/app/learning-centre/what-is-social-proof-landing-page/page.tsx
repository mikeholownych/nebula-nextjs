import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Social Proof on a Landing Page: What It Is and Why It Drives Conversions | Nebula',
  description:
    'Social proof on a landing page is verifiable evidence that other buyers have committed before your visitor. Learn the 5 forms, why placement matters more than presence, and how to audit yours.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/what-is-social-proof-landing-page',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Social Proof on a Landing Page: What It Is and Why It Drives Conversions',
  description:
    'Social proof on a landing page is verifiable evidence that other buyers have committed before your visitor. Learn the 5 forms, why placement matters more than presence, and how to audit yours.',
  url: 'https://nebulacomponents.com/learning-centre/what-is-social-proof-landing-page',
  publishedDate: '2026-08-28',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What counts as social proof on a landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Social proof is any verifiable evidence that other people have already made the commitment you are asking the visitor to make. Named testimonials with specific results, aggregate review scores with counts, recognizable customer logos, usage numbers, and links to published case studies all qualify. Generic quotes without a name or specific result do not.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where should social proof appear on a landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'At least one verifiable proof element should appear adjacent to or immediately above the primary call to action, visible without scrolling on mobile. Social proof placed only in a testimonials section at the bottom of the page is seen after the visitor has already decided whether to act.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does having more social proof always help conversion?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Four specific configurations actively reduce trust: stock-photo avatars on testimonials, undated or stale reviews, testimonials from buyers who do not match the target audience, and generic quotes with no specifics. These configurations lower trust below the baseline of having no testimonials at all.',
      },
    },
  ],
}

export default function WhatIsSocialProofLandingPagePage() {
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

        <div className="mt-8 rounded-md border border-border bg-bg-panel p-8 md:p-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            Trust Signals
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-fg md:text-4xl">
            Social Proof on a Landing Page: What It Is and Why It Drives Conversions
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-muted">
            Social proof on a landing page is verifiable evidence that other people have already
            made the commitment you are asking your visitor to make. It is not decoration. It is
            not a testimonials section. It is the mechanism by which a stranger decides whether
            your page is worth trusting before they act. This article covers what social proof
            actually is, the 5 forms it takes, why placement matters more than volume, and how
            to audit your page in under 5 minutes.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/audit?utm_source=lc-social-proof-landing&utm_medium=hero-cta"
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

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">What Social Proof Actually Means</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The term comes from psychology: when people are uncertain what to do, they look at
            what others have done and treat it as evidence of the correct action. On a landing
            page, the visitor is uncertain whether your offer is worth trusting. Social proof
            reduces that uncertainty by showing that other people already decided yes.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The operative word is <strong className="text-fg">verifiable</strong>. A testimonial
            with a stock photo is not social proof. A logo strip of companies no visitor has
            heard of is not social proof. Social proof is evidence a visitor could, in theory,
            check independently: a named person at a recognizable company, a review platform
            rating with a count, a specific result with a number attached. If your visitor would
            say &ldquo;I could verify this if I wanted to&rdquo;, it qualifies. If they would
            say &ldquo;that seems made up&rdquo;, it does not.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">The 5 Forms of Social Proof on a Landing Page</h2>

          <div className="mt-6 space-y-6">
            <div>
              <p className="font-semibold text-fg">1. Named testimonials with specific results</p>
              <p className="mt-2 leading-relaxed text-fg-muted">
                The highest-trust form. A real name, a real company, and a specific outcome
                (&ldquo;We cut our cost per lead from $45 to $18 in six weeks&rdquo;). The
                specificity is what makes it credible. Generic quotes (&ldquo;Great product,
                highly recommend!&rdquo;) are almost worthless because they could apply to
                anything.
              </p>
            </div>
            <div>
              <p className="font-semibold text-fg">2. Review counts with a score</p>
              <p className="mt-2 leading-relaxed text-fg-muted">
                &ldquo;4.8 out of 5 from 312 reviews&rdquo; works because the number of
                reviews is verifiable and the aggregation is hard to fake at scale. A single
                5-star rating is easy to dismiss. Three hundred of them are not. Link the
                widget to the actual review platform when possible.
              </p>
            </div>
            <div>
              <p className="font-semibold text-fg">3. Customer logos</p>
              <p className="mt-2 leading-relaxed text-fg-muted">
                Logos work when the brands are recognizable to your target buyer. A SaaS
                founder trusts a logo strip featuring Shopify, HubSpot, and Intercom. The same
                strip with logos they have never seen does nothing. Choose logos your ICP
                respects, not the most prestigious clients you have regardless of relevance.
              </p>
            </div>
            <div>
              <p className="font-semibold text-fg">4. Usage numbers</p>
              <p className="mt-2 leading-relaxed text-fg-muted">
                &ldquo;293 landing pages audited&rdquo; or &ldquo;used by 4,000+ marketers&rdquo;
                provides credibility through scale. The number needs to be specific and plausible.
                Round numbers (&ldquo;thousands of customers&rdquo;) read as approximations. Exact
                numbers (&ldquo;4,127 teams&rdquo;) read as real.
              </p>
            </div>
            <div>
              <p className="font-semibold text-fg">5. Case study references</p>
              <p className="mt-2 leading-relaxed text-fg-muted">
                A link to a full case study signals that you have enough proof to publish a
                detailed account. Even visitors who never click the link benefit from its
                presence. It signals confidence in the evidence behind your claims.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Why Placement Matters More Than Volume</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The most common social proof mistake is putting it in the wrong place. Many pages have
            strong social proof buried in a testimonials section at the bottom, after the visitor
            has already decided whether to act. By then it is too late.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The trust-before-ask principle: at least one verifiable proof element must appear
            adjacent to, or immediately before, the primary call to action. The visitor should see
            evidence before they are asked to commit. Evidence after the ask is confirmation for
            someone already persuaded. It does not help someone who is still uncertain.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A page with one well-placed testimonial next to the CTA will convert better than a
            page with 12 testimonials after the fold. The question is not how much social proof
            you have. It is whether the proof is in the right position relative to the ask.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            In Nebula&rsquo;s data across 293 audited pages, social proof failures have the
            highest average impact score of any conversion signal (4.1 out of 5) and appear on
            39% of pages. That combination means it is both common and costly when it is wrong.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">The 5-Minute Self-Audit</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Open your landing page on a mobile device. Without scrolling, answer three questions:
          </p>
          <ol className="mt-4 space-y-3 list-decimal list-inside text-fg-muted">
            <li className="leading-relaxed">
              Is there any verifiable evidence that other people have used this product?
            </li>
            <li className="leading-relaxed">
              Is that evidence adjacent to or above the primary call to action?
            </li>
            <li className="leading-relaxed">
              Would a skeptical visitor describe this evidence as specific and checkable?
            </li>
          </ol>
          <p className="mt-4 leading-relaxed text-fg-muted">
            If the answer to any of these is no, you have a trust signal gap. The{' '}
            <Link href="/signals/trust-signals" className="text-accent hover:text-fg transition-colors">
              Trust Signals diagnostic
            </Link>{' '}
            checks this automatically for any public URL.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Related Reading</h2>
          <ul className="mt-4 space-y-3 text-fg-muted">
            <li>
              <Link href="/signals/trust-signals" className="text-accent hover:text-fg transition-colors">
                Trust Signals: the diagnostic definition and decision rule
              </Link>
            </li>
            <li>
              <Link href="/learning-centre/types-of-social-proof" className="text-accent hover:text-fg transition-colors">
                Types of social proof ranked by conversion impact
              </Link>
            </li>
            <li>
              <Link href="/learning-centre/social-proof-backfire" className="text-accent hover:text-fg transition-colors">
                4 testimonial configurations that actively hurt conversion
              </Link>
            </li>
            <li>
              <Link href="/learning-centre/proof-before-cta" className="text-accent hover:text-fg transition-colors">
                Why social proof must appear before the CTA, not after
              </Link>
            </li>
          </ul>
          <div className="mt-6">
            <Link
              href="/audit?utm_source=lc-social-proof-landing&utm_medium=footer-cta"
              className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
            >
              Check your page for trust signal gaps &rarr;
            </Link>
          </div>
        </section>
        {/* FAQ section */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Frequently Asked Questions</h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold text-fg">What counts as social proof on a landing page?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Social proof is any verifiable evidence that other people have already made the commitment you are asking the visitor to make. Named testimonials with specific results, aggregate review scores with counts, recognizable customer logos, usage numbers, and links to published case studies all qualify. Generic quotes without a name or specific result do not.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">Where should social proof appear on a landing page?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">At least one verifiable proof element should appear adjacent to or immediately above the primary call to action, visible without scrolling on mobile. Social proof placed only in a testimonials section at the bottom of the page is seen after the visitor has already decided whether to act.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">Does having more social proof always help conversion?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">No. Four specific configurations actively reduce trust: stock-photo avatars on testimonials, undated or stale reviews, testimonials from buyers who do not match the target audience, and generic quotes with no specifics. These configurations lower trust below the baseline of having no testimonials at all.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
