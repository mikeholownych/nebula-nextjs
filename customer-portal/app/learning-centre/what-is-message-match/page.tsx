import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'What Is Message Match? Landing Page to Ad Alignment Explained | Nebula',
  description:
    'Message match is the exact degree of continuity between what your ad promises and what your landing page delivers. When it breaks, paid traffic leaks even when targeting is perfect.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/what-is-message-match',
  },
}

const articleSchema = createArticleSchema({
  headline: 'What Is Message Match? Landing Page to Ad Alignment Explained',
  description:
    'Message match is the exact degree of continuity between what your ad promises and what your landing page delivers. When it breaks, paid traffic leaks even when targeting is perfect.',
  url: 'https://nebulacomponents.com/learning-centre/what-is-message-match',
  publishedDate: '2026-08-28',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is message match on a landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Message match is the degree of alignment between what your ad says and what your landing page says. When a visitor clicks an ad promising a free trial and lands on a page talking about scheduling a demo, the message match has broken. That mismatch triggers doubt before a single word is read.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why does message match affect conversion rates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Paid traffic arrives with an expectation set by the ad. If the landing page does not immediately confirm that expectation, visitors conclude they clicked the wrong result and leave. In Nebula\'s data from 293 audits, 62% of pages fail the headline check, making message match the most common conversion leak.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I check if my landing page has a message match problem?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Read your ad copy, then read your landing page H1 and first paragraph without any prior context. Ask whether a first-time visitor who saw only the ad would feel they arrived at the right place. If there is any hesitation, there is a message match gap.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are common examples of message match fail?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ad says \'Free Trial\' but landing page requires credit card. Ad mentions \'SaaS pricing calculator\' but page shows only demo booking. Ad targets \'Enterprise solutions\' but page displays small business features. Ad promises \'Instant results\' but page emphasizes 30-day implementation. These mismatches cause visitors to bounce before converting, treating the landing page as irrelevant.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much do message match failures cost in wasted ad spend?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When message match breaks, conversion rates typically drop 30-50% despite perfect targeting and audience match. In Nebula\'s audits, pages failing headline alignment waste approximately 40% of paid traffic budget. A $5,000/month campaign with message match gaps effectively burns $2,000 monthly on traffic that leaves immediately after arrival.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does message match differ across Google Ads, Facebook, and LinkedIn?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The core principle is identical: ad promise must match landing page delivery. However, execution varies. Google Ads require exact keyword alignment in headlines. Facebook\'s image-based ads need visual consistency on landing pages. LinkedIn\'s narrative-focused ads demand tone matching. Regardless of channel, visitors expect immediate confirmation of the ad\'s specific claim.',
      },
    },
  ],
}

export default function WhatIsMessageMatchPage() {
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
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          ← Learning Centre
        </Link>

        {/* Opening panel */}
        <div className="mt-8 rounded-md border border-border bg-bg-panel p-8 md:p-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            Message Match · Definitions
          </span>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-fg md:text-4xl">
            What Is Message Match? Landing Page to Ad Alignment Explained
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-muted">
            Message match is the degree of continuity between the specific words and offer in
            your ad and the specific words and offer on the page that ad points to. When
            the chain breaks, visitors see a different promise from the one they clicked.
            They leave, and your conversion data becomes noise.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/audit?utm_source=learning-centre-what-is-message-match&utm_medium=hero-cta"
              className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
            >
              Check your page free →
            </Link>
            <Link
              href="/repair-sprint"
              className="inline-flex min-h-[44px] items-center justify-center rounded border border-border px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
            >
              Explore $97 Repair Sprint
            </Link>
          </div>
        </div>

        {/* Section 1: Precise definition */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">The Precise Definition</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Message match is a <strong className="text-fg">direct comparison of two pieces of copy</strong>:
            the ad and the landing page. It is not a vague concept about &ldquo;brand alignment&rdquo;
            or &ldquo;consistent tone.&rdquo; It is a measurable, binary test: does the core noun phrase,
            the specific offer, and the emotional register of the ad appear on the page visitors land on?
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The{' '}
            <Link
              href="/signals/message-match"
              className="text-accent underline underline-offset-2 hover:opacity-80"
            >
              Nebula message match signal
            </Link>
            {' '}defines it operationally: does the page promise match the expectation created by the
            ad or referring source? Three layers are checked: the headline, the primary offer, and
            the CTA verb. All three must be consistent for the check to pass.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Message match fails when any of these three layers sends a signal that contradicts what
            the visitor clicked. The failure does not need to be obvious. It does not need to be a
            completely different product. A headline that is merely too broad, or a CTA that asks
            for more commitment than the ad prepared the visitor to give, is a measurable break.
          </p>
        </section>

        {/* Section 2: Why it matters */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">Why Message Match Matters for Paid Traffic</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Every paid click carries a contract. The ad created an expectation. The visitor accepted
            that expectation by clicking. When the page fails to honour it, the visitor registers
            a cognitive mismatch they usually cannot articulate, so they bounce without leaving a
            reason.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The problem compounds because paid traffic arrives pre-filtered. Unlike organic visitors
            who explore and browse, paid visitors arrive in response to a specific promise. They
            have a specific expectation locked in. Showing them a generic page, or a page built
            for a broader audience, fails to meet the contract they were sold when they clicked the ad.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Google describes landing page experience as one component of Quality Score. Pages that
            do not reflect the ad&apos;s topic and offer can create both relevance and conversion
            problems. Measure the effect in your own account rather than assuming a universal outcome.
            The core mechanism, however, is not algorithmic. It is human. Visitors who feel
            misled by a bait-and-switch, even a subtle one, do not convert.
          </p>
        </section>

        {/* Section 3: 4 concrete match vs mismatch examples */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">Four Match vs. Mismatch Examples</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            These are patterns found across real paid campaigns. Each shows how a small copy
            gap creates a meaningful break in the visitor&apos;s experience.
          </p>

          <div className="mt-6 space-y-8">
            {/* Example 1 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Example 1: Offer Mismatch</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded border border-border bg-bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Ad says</p>
                  <p className="text-fg font-medium">&ldquo;Start your free trial today&rdquo;</p>
                </div>
                <div className="rounded border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Page says</p>
                  <p className="text-fg font-medium">&ldquo;Schedule a demo with our team&rdquo;</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                The visitor expected a self-serve, zero-commitment starting point. Instead they
                face a sales interaction with an unknown timeline. The friction gap is the full
                distance between those two actions.
              </p>
            </div>

            {/* Example 2 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Example 2: Audience Mismatch</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded border border-border bg-bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Ad says</p>
                  <p className="text-fg font-medium">&ldquo;Landing page audit for Shopify stores&rdquo;</p>
                </div>
                <div className="rounded border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Page says</p>
                  <p className="text-fg font-medium">&ldquo;We help e-commerce businesses grow&rdquo;</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                The ad named a specific platform and a specific service. The page uses a category
                term that could apply to any of hundreds of services. The visitor who clicked
                for a Shopify-specific audit has no evidence they are in the right place.
              </p>
            </div>

            {/* Example 3 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Example 3: Tone Mismatch</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded border border-border bg-bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Ad says</p>
                  <p className="text-fg font-medium">&ldquo;Still losing money on Google Ads?&rdquo;</p>
                </div>
                <div className="rounded border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Page says</p>
                  <p className="text-fg font-medium">&ldquo;We help ambitious brands unlock their digital potential&rdquo;</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                The ad spoke to pain and urgency. The page speaks to aspiration. These are different
                stages of buyer awareness, and you cannot serve both with a single hero. The visitor
                arrived in problem mode. The page is in vision mode.
              </p>
            </div>

            {/* Example 4 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Example 4: Keyword Mismatch</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded border border-border bg-bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Ad says</p>
                  <p className="text-fg font-medium">&ldquo;AI-powered landing page audit tool&rdquo;</p>
                </div>
                <div className="rounded border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Page says</p>
                  <p className="text-fg font-medium">&ldquo;Conversion Rate Optimisation Services&rdquo;</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                The visitor searched for a specific tool. The page leads with a service category.
                The scent trail from ad click to page confirmation is broken in the first
                screenful. This pattern occurs most often when broad-match keywords route
                to a single generic service page.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: How to check */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">How to Check Your Own Pages</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Open your top-spending ad in one browser tab. Open the destination URL in another.
            Then check three things:
          </p>
          <ol className="mt-4 space-y-4 text-fg-muted">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/5 text-xs font-bold text-accent">1</span>
              <div>
                <span className="font-semibold text-fg">Headline vs H1.</span>{' '}
                Copy the ad headline. Hold it next to the page H1. The core noun phrase
                and specific offer must appear in both. Generic category language is a failure.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/5 text-xs font-bold text-accent">2</span>
              <div>
                <span className="font-semibold text-fg">CTA vs Primary CTA.</span>{' '}
                What action did the ad imply? Does the first above-fold CTA on the page
                use the same verb and the same offer? If the ad said &ldquo;free&rdquo; and the
                page CTA says &ldquo;schedule a consultation,&rdquo; you have an offer mismatch.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/5 text-xs font-bold text-accent">3</span>
              <div>
                <span className="font-semibold text-fg">Emotional register.</span>{' '}
                Is the ad problem-aware, solution-aware, or brand-aware? Does the page hero
                match? A problem-aware ad requires a problem-aware hero, not a vision statement.
              </div>
            </li>
          </ol>
          <p className="mt-6 leading-relaxed text-fg-muted">
            For a complete pre-launch checklist, see the{' '}
            <Link
              href="/learning-centre/message-match-checklist"
              className="text-accent underline underline-offset-2 hover:opacity-80"
            >
              message match checklist
            </Link>
            {' '}with eight binary pass/fail criteria to run before activating any paid campaign.
          </p>
        </section>

        {/* Section 5: Signal definition */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">How Nebula Scores Message Match</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The{' '}
            <Link
              href="/signals/message-match"
              className="text-accent underline underline-offset-2 hover:opacity-80"
            >
              message match signal
            </Link>
            {' '}in a Nebula audit checks whether the page promise matches the expectation
            created by the ad or referring source. It examines above-fold copy, the H1,
            and the primary CTA for evidence of a coherent, specific promise that a visitor
            who clicked a particular ad would recognise as the thing they clicked for.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The signal does not pass on generic copy. A headline that could appear on any
            competitor&apos;s homepage does not match any specific ad. The pass condition
            is a page that a visitor, arriving from a specific ad, would immediately
            recognise as the destination that ad described.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Across 293 audited pages, 62% failed the headline message match check. That
            proportion is high enough to warrant checking your own page before assuming
            the problem lives in your targeting or your creative.
          </p>
        </section>

        {/* CTA block */}
        <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Free Diagnostic
          </p>
          <h2 className="mb-3 text-2xl font-bold text-fg">
            Find the break on your page for free
          </h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            Run the Nebula audit to get a scored breakdown of your landing page&apos;s
            message match, offer clarity, and conversion structure. If the audit surfaces
            a confirmed break, the{' '}
            <strong className="text-fg">$97 One-Leak Repair Sprint</strong> supplies
            tailored hero or CTA copy for one high-confidence finding. No retainer, no
            scope creep.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/audit?utm_source=learning-centre-what-is-message-match&utm_medium=cta-block"
              className="inline-flex rounded bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:opacity-85"
            >
              Run the free audit
            </Link>
            <Link
              href="/learning-centre/message-match-checklist"
              className="inline-flex rounded border border-accent px-6 py-3 font-semibold text-accent transition-colors hover:bg-accent/10"
            >
              See the checklist
            </Link>
          </div>
        </div>

        {/* Related articles */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-5 text-xl font-semibold text-fg">Related diagnostics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                href: '/learning-centre/message-match-checklist',
                title: 'Message Match Checklist',
                description: 'Eight binary checks to run before activating any paid campaign.',
              },
              {
                href: '/learning-centre/headline-cta-mismatch',
                title: 'Headline and CTA Mismatch',
                description: 'When your H1 and CTA create contradictory expectations.',
              },
              {
                href: '/learning-centre/linkedin-ad-copy-landing-page-mismatch',
                title: 'LinkedIn Ad Copy Mismatch',
                description: 'Platform-specific message match failures on LinkedIn.',
              },
              {
                href: '/learning-centre/landing-page-not-converting',
                title: 'Landing Page Not Converting?',
                description: 'Diagnose these structural leaks first.',
              },
            ].map((article) => (
              <Link
                key={article.href}
                href={article.href}
                className="rounded-xl border border-border bg-bg-muted p-5 transition-colors hover:border-accent/40 hover:bg-bg-panel"
              >
                <p className="font-semibold text-fg">{article.title}</p>
                <p className="mt-1 text-sm text-fg-muted">{article.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ section */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Frequently Asked Questions</h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold text-fg">What is message match on a landing page?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Message match is the degree of alignment between what your ad says and what your landing page says. When a visitor clicks an ad promising a free trial and lands on a page talking about scheduling a demo, the message match has broken. That mismatch triggers doubt before a single word is read.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">Why does message match affect conversion rates?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Paid traffic arrives with an expectation set by the ad. If the landing page does not immediately confirm that expectation, visitors conclude they clicked the wrong result and leave. In Nebula&apos;s data from 293 audits, 62% of pages fail the headline check, making message match the most common conversion leak.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">How do I check if my landing page has a message match problem?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Read your ad copy, then read your landing page H1 and first paragraph without any prior context. Ask whether a first-time visitor who saw only the ad would feel they arrived at the right place. If there is any hesitation, there is a message match gap.</p>
            </div>
          </div>
        </section>

        {/* Back link */}
        <div className="mt-10">
          <Link
            href="/learning-centre"
            className="text-sm font-semibold text-accent transition-colors hover:text-fg"
          >
            ← Back to Learning Centre
          </Link>
        </div>
      </div>
    </main>
  )
}
