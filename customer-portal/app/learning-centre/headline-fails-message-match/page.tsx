import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Why Your Landing Page Headline Fails Message Match (And How to Fix It) | Nebula',
  description:
    '62% of audited landing pages fail the headline message match check. Three root causes explain almost every failure. This article shows you how to diagnose which one you have and what to change.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/headline-fails-message-match',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Why Your Landing Page Headline Fails Message Match (And How to Fix It)',
  description:
    '62% of audited landing pages fail the headline message match check. Three root causes explain almost every failure. This article shows you how to diagnose which one you have and what to change.',
  url: 'https://nebulacomponents.com/learning-centre/headline-fails-message-match',
  publishedDate: '2026-08-28',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why does my landing page headline not match my ad?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The three most common causes are: the ad and page were written by different people without a shared brief, the ad copy was updated after the landing page was built without updating the page, or the headline was deliberately broadened to appeal to a wider audience at the cost of relevance. All three are fixable in under an hour.',
      },
    },
    {
      '@type': 'Question',
      name: 'How common is headline mismatch on landing pages?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'In Nebula\'s Q3 2026 data from 293 audited pages, 62% failed the headline check. That makes headline mismatch the most common single conversion leak detected, ahead of load speed failures (40%) and missing social proof (39%).',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the fastest way to fix a headline that fails message match?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pull the exact promise from the ad that sent the most traffic to that page. Rewrite the H1 to fulfill that promise directly, using the same verb and outcome language. Then check that the first sentence of body copy reinforces the same promise. The whole fix takes under 15 minutes if you know what the ad said.',
      },
    },
  ],
}

export default function HeadlineFailsMessageMatchPage() {
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
            Message Match · Diagnosis
          </span>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-fg md:text-4xl">
            Why Your Landing Page Headline Fails Message Match (And How to Fix It)
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-muted">
            Across 293 Nebula landing page audits, 62% of pages failed the headline message
            match check. The failure rate is high enough that if your paid traffic is not
            converting at the rate your targeting data suggests it should, the headline is
            the first place to look. Three root causes explain almost all of it.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/audit?utm_source=learning-centre-headline-fails&utm_medium=hero-cta"
              className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
            >
              Check your headline free →
            </Link>
            <Link
              href="/repair-sprint"
              className="inline-flex min-h-[44px] items-center justify-center rounded border border-border px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
            >
              Explore $97 Repair Sprint
            </Link>
          </div>
        </div>

        {/* Why this matters - context section */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">What the Headline Check Actually Tests</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The{' '}
            <Link
              href="/signals/message-match"
              className="text-accent underline underline-offset-2 hover:opacity-80"
            >
              Nebula message match signal
            </Link>
            {' '}checks whether the page promise matches the expectation created by the ad or
            referring source. The headline check is the first and most weighted component of
            that signal: does the H1 reflect the specific offer and audience implied by the ad
            that sent the visitor there?
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A headline can be well-written and still fail the check. Strong copywriting craft
            does not automatically produce message match. A beautifully crafted H1 that speaks
            to a broader audience than the ad targeted, or that describes a different offer
            than the ad promoted, fails regardless of how good the writing is.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The 62% failure rate is not a copywriting quality problem. It is a process problem.
            The three root causes below explain why.
          </p>
        </section>

        {/* Root cause 1 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 border border-accent/30 text-sm font-bold text-accent">1</span>
            <h2 className="text-xl font-semibold text-fg">Written by Different Teams at Different Times</h2>
          </div>
          <p className="leading-relaxed text-fg-muted">
            The most common cause. The ad was written by a performance marketer or agency
            focused on CTR and relevance score. The landing page headline was written by a
            product marketer, designer, or founder focused on positioning and brand. Neither
            person was in the room when the other made their decision. The two pieces of copy
            evolved independently, optimised for different goals, and the gap between them
            was never measured.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            This pattern is common in companies where ads and landing pages have separate
            owners with separate review cycles. It becomes acute when the ad account is
            managed by an external agency. The agency writes ads against performance targets.
            The internal team writes the page against brand targets. Neither owns the seam
            between them.
          </p>
          <div className="mt-5 rounded-lg border border-border bg-bg-muted p-5">
            <p className="text-sm font-semibold text-fg mb-2">How to diagnose it</p>
            <p className="text-sm leading-relaxed text-fg-muted">
              Ask: who wrote the ad? Who wrote the landing page headline? Were they in the
              same briefing session? If the answer is different people with different briefs,
              you have this cause. Check whether the H1 uses the same noun phrases as the
              top-performing ad copy or different ones.
            </p>
            <p className="mt-3 text-sm font-semibold text-fg">What to change</p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">
              Start from the ad, not the page. Pull the exact noun phrase and offer type from
              your top-spending ad. Use those words in the H1 or within the first sentence
              of the subheadline. The page headline should be a direct continuation of the
              ad headline, not an independently positioned statement.
            </p>
          </div>
        </section>

        {/* Root cause 2 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 border border-accent/30 text-sm font-bold text-accent">2</span>
            <h2 className="text-xl font-semibold text-fg">The Brief Changed After the Page Was Built</h2>
          </div>
          <p className="leading-relaxed text-fg-muted">
            The page was built to match a specific ad campaign. Then the ad campaign was
            updated, a new campaign was launched, or the product offer changed, and the
            landing page was not updated with it. The page once had message match. It
            no longer does, but nobody noticed because the page itself has not changed,
            only the ads pointing to it.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            This also occurs when a new ad is pointed to an existing page that was built
            for a different campaign. It is faster than building a new page, so it happens
            constantly in active ad accounts. The ad says one thing; the page was built
            for a different audience and a different offer. The visitor pays the price of
            that shortcut.
          </p>
          <div className="mt-5 rounded-lg border border-border bg-bg-muted p-5">
            <p className="text-sm font-semibold text-fg mb-2">How to diagnose it</p>
            <p className="text-sm leading-relaxed text-fg-muted">
              Compare the publication date or last-modified date of the landing page against
              the launch date of the current ad campaign. If the campaign is newer than the
              page, check whether the ad copy was written to match the page or the page was
              assumed to be close enough. Also check whether multiple campaigns point to the
              same URL with different promises.
            </p>
            <p className="mt-3 text-sm font-semibold text-fg">What to change</p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">
              Create a one-to-one relationship between each distinct ad promise and a
              dedicated landing page URL. If that is not immediately feasible, update the
              H1 and CTA to reflect the current top-spending campaign rather than the one
              the page was originally built for. Treat the landing page as a dependency
              of the ad campaign, not an independent asset.
            </p>
          </div>
        </section>

        {/* Root cause 3 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 border border-accent/30 text-sm font-bold text-accent">3</span>
            <h2 className="text-xl font-semibold text-fg">The Broad Appeal Tradeoff</h2>
          </div>
          <p className="leading-relaxed text-fg-muted">
            The page was intentionally written for a broad audience because the team runs
            multiple ad campaigns to different segments and did not want to build separate
            pages for each. The result is a headline that is general enough to apply to all
            of them and specific enough for none. Every segment arrives at a page that almost
            matches their ad. Almost is not enough.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            This is a resource constraint that creates a performance penalty. The single
            generic page costs less to maintain than three segment-specific pages. It also
            converts less well than any of those three pages would. The question is whether
            the conversion cost of the generic page exceeds the cost of the additional pages.
            In most active paid campaigns, it does.
          </p>
          <div className="mt-5 rounded-lg border border-border bg-bg-muted p-5">
            <p className="text-sm font-semibold text-fg mb-2">How to diagnose it</p>
            <p className="text-sm leading-relaxed text-fg-muted">
              Look at your ad account and count how many distinct audience segments or
              campaigns share the same landing page URL. If more than two campaigns with
              different audience definitions or offer angles point to the same page, you
              have this cause. Check whether your H1 would be accurately read as describing
              all of them or as a vague compromise between them.
            </p>
            <p className="mt-3 text-sm font-semibold text-fg">What to change</p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">
              Prioritise your highest-spend campaign and build a dedicated page for it first.
              A single well-matched page for your top campaign will typically recover more
              revenue than a general page covering all of them. Once that page is running,
              use the conversion rate lift as the business case for building the next
              segment-specific page.
            </p>
          </div>
        </section>

        {/* 30-second self-audit */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">The 30-Second Self-Audit</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            You can diagnose your own headline in under a minute without any tools.
          </p>
          <ol className="mt-4 space-y-4 text-fg-muted">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/5 text-xs font-bold text-accent">1</span>
              <div>
                Open your top-spending ad. Read the headline and the description.
                Write down in plain language: who is this ad for, and what does it promise?
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/5 text-xs font-bold text-accent">2</span>
              <div>
                Open the landing page. Read only the H1. Write down in plain language:
                who is this page for, and what does it promise?
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/5 text-xs font-bold text-accent">3</span>
              <div>
                Compare the two sentences. Are they describing the same audience?
                The same offer? The same level of specificity? If any answer is no,
                you have a headline message match failure. Identify which of the three
                root causes above applies and use the corresponding fix.
              </div>
            </li>
          </ol>
          <p className="mt-6 leading-relaxed text-fg-muted">
            For a full pre-launch pass/fail checklist that covers the H1, CTA, offer,
            and tone, see the{' '}
            <Link
              href="/signals/message-match"
              className="text-accent underline underline-offset-2 hover:opacity-80"
            >
              message match signal definition
            </Link>
            {' '}and the eight-point{' '}
            <Link
              href="/learning-centre/message-match-checklist"
              className="text-accent underline underline-offset-2 hover:opacity-80"
            >
              message match checklist
            </Link>
            .
          </p>
        </section>

        {/* CTA block */}
        <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Free Diagnostic
          </p>
          <h2 className="mb-3 text-2xl font-bold text-fg">
            Find out which cause applies to your page
          </h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            The Nebula audit checks your headline against the message match signal and
            returns a scored breakdown with the specific failure reason. If the audit
            confirms a headline break, the{' '}
            <strong className="text-fg">$97 One-Leak Repair Sprint</strong> supplies
            a replacement headline and supporting copy built to match your specific ad
            campaign. No retainer, no scope creep.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/audit?utm_source=learning-centre-headline-fails&utm_medium=cta-block"
              className="inline-flex rounded bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:opacity-85"
            >
              Run the free audit
            </Link>
            <Link
              href="/repair-sprint"
              className="inline-flex rounded border border-accent px-6 py-3 font-semibold text-accent transition-colors hover:bg-accent/10"
            >
              See the Repair Sprint
            </Link>
          </div>
        </div>

        {/* Related articles */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-5 text-xl font-semibold text-fg">Related diagnostics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                href: '/learning-centre/what-is-message-match',
                title: 'What Is Message Match?',
                description: 'The precise definition and four match vs. mismatch examples.',
              },
              {
                href: '/learning-centre/landing-page-headline-formula',
                title: 'Landing Page Headline Formula',
                description: 'ICP + outcome + timeframe. How to build a headline that passes.',
              },
              {
                href: '/learning-centre/message-match-checklist',
                title: 'Message Match Checklist',
                description: 'Eight binary checks before activating any paid campaign.',
              },
              {
                href: '/learning-centre/headline-cta-mismatch',
                title: 'Headline and CTA Mismatch',
                description: 'When your H1 and CTA create contradictory expectations.',
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
              <h3 className="font-semibold text-fg">Why does my landing page headline not match my ad?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">The three most common causes are: the ad and page were written by different people without a shared brief, the ad copy was updated after the landing page was built without updating the page, or the headline was deliberately broadened to appeal to a wider audience at the cost of relevance. All three are fixable in under an hour.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">How common is headline mismatch on landing pages?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">In Nebula&apos;s Q3 2026 data from 293 audited pages, 62% failed the headline check. That makes headline mismatch the most common single conversion leak detected, ahead of load speed failures (40%) and missing social proof (39%).</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">What is the fastest way to fix a headline that fails message match?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Pull the exact promise from the ad that sent the most traffic to that page. Rewrite the H1 to fulfill that promise directly, using the same verb and outcome language. Then check that the first sentence of body copy reinforces the same promise. The whole fix takes under 15 minutes if you know what the ad said.</p>
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
