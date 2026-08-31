import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Landing Page Headline Formula: Write H1s That Convert Paid Traffic | Nebula',
  description:
    'A converting H1 names your ICP, their outcome, and the mechanism or timeframe. This formula with five before/after examples shows you how to build a headline that passes the message match test.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/landing-page-headline-formula',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Landing Page Headline Formula: Write H1s That Convert Paid Traffic',
  description:
    'A converting H1 names your ICP, their outcome, and the mechanism or timeframe. This formula with five before/after examples shows you how to build a headline that passes the message match test.',
  url: 'https://nebulacomponents.com/learning-centre/landing-page-headline-formula',
  publishedDate: '2026-08-28',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What makes a landing page headline effective?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An effective landing page headline states who it is for, what outcome they get, and how or how fast they get it. It mirrors the language and promise of the traffic source that sent the visitor. Generic benefit claims and brand-name-only headlines are the two most common failures.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long should a landing page headline be?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Landing page headlines work best at 6 to 12 words. Long enough to communicate a specific outcome, short enough to be parsed at a glance. Headlines over 15 words typically lose the scannability that above-fold real estate demands.',
      },
    },
    {
      '@type': 'Question',
      name: 'Should the landing page headline match the ad headline exactly?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not word-for-word, but in promise and intent. The ad creates an expectation; the landing page headline must fulfill that expectation immediately. Copying the ad headline verbatim can feel mechanical. Rephrasing the same promise in slightly different language is fine as long as the core offer and audience match.',
      },
    },
  ],
}

export default function LandingPageHeadlineFormulaPage() {
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
            Conversion Copy · Headlines
          </span>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-fg md:text-4xl">
            Landing Page Headline Formula: Write H1s That Convert Paid Traffic
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-muted">
            Your H1 is the most load-bearing sentence on your landing page. It sets the
            expectation for the offer, the audience, and the outcome. A vague or generic H1
            fails message match before the visitor reads a single word of body copy. This formula
            gives you the structure to write one that passes every time.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/audit?utm_source=learning-centre-headline-formula&utm_medium=hero-cta"
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

        {/* Section 1: The formula */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">The Formula</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A converting H1 has three components. All three must be present for the headline
            to pass the message match test. Missing any one creates a failure mode.
          </p>

          <div className="mt-6 rounded-lg border border-accent/30 bg-accent/5 p-6">
            <p className="text-center text-lg font-bold text-fg tracking-tight">
              [ICP] + [Specific Outcome] + [Timeframe or Mechanism]
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <h3 className="font-semibold text-fg">ICP (Ideal Customer Profile)</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">
                Name the person the page is for. Not &ldquo;businesses&rdquo; or &ldquo;teams.&rdquo;
                The specific role, situation, or type of company. A visitor who sees themselves
                named immediately knows they are in the right place. A visitor who sees a
                generic noun must do work to figure out whether the page is for them. Most
                will not do that work.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">Specific Outcome</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">
                State the result the ICP gets, not the feature that produces it. The outcome
                is what changes for them after using your product or service. It should be
                concrete enough that the visitor could verify it. &ldquo;Better performance&rdquo;
                fails this test. &ldquo;Lower cost per lead from paid traffic&rdquo; passes it.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">Timeframe or Mechanism</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">
                Add either a timeframe (how quickly the outcome is reached) or a mechanism
                (through what specific process). This component separates your headline from
                every competitor who makes the same broad outcome claim. It also sets a
                specific expectation the visitor can evaluate, which builds credibility.
                Omitting it leaves you with a generic benefit claim.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Five before/after examples */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">Five Before and After Examples</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Each example shows a weak headline and a stronger version built from the formula.
            The weak versions are patterns found repeatedly across real landing pages.
          </p>

          <div className="mt-6 space-y-8">
            {/* Example 1 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-3">B2B SaaS / Lead Generation</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded border border-border bg-bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Weak</p>
                  <p className="text-fg">&ldquo;Grow Your Business With Better Marketing&rdquo;</p>
                  <p className="mt-2 text-xs text-fg-muted">No ICP named. Outcome is unmeasurable. No mechanism or timeframe.</p>
                </div>
                <div className="rounded border border-accent/30 bg-accent/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Strong</p>
                  <p className="text-fg">&ldquo;SaaS Founders: Cut Cost Per Trial Sign-Up in 30 Days With One Page Fix&rdquo;</p>
                  <p className="mt-2 text-xs text-fg-muted">ICP: SaaS founders. Outcome: lower CPL. Timeframe: 30 days. Mechanism: one page fix.</p>
                </div>
              </div>
            </div>

            {/* Example 2 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-3">Agency / Service</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded border border-border bg-bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Weak</p>
                  <p className="text-fg">&ldquo;We Help Brands Reach Their Full Potential Online&rdquo;</p>
                  <p className="mt-2 text-xs text-fg-muted">Entirely brand-centric. Visitor cannot tell what the agency does or who it serves.</p>
                </div>
                <div className="rounded border border-accent/30 bg-accent/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Strong</p>
                  <p className="text-fg">&ldquo;E-commerce Brands: More Revenue From the Traffic You Already Have&rdquo;</p>
                  <p className="mt-2 text-xs text-fg-muted">ICP: e-commerce brands. Outcome: more revenue. Mechanism: existing traffic (no extra spend).</p>
                </div>
              </div>
            </div>

            {/* Example 3 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-3">Tool / Software</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded border border-border bg-bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Weak</p>
                  <p className="text-fg">&ldquo;The All-In-One Marketing Platform&rdquo;</p>
                  <p className="mt-2 text-xs text-fg-muted">Pure feature claim. Could describe 300 products. No audience, no outcome.</p>
                </div>
                <div className="rounded border border-accent/30 bg-accent/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Strong</p>
                  <p className="text-fg">&ldquo;Marketing Teams: See Which Landing Pages Are Leaking Paid Traffic in 5 Minutes&rdquo;</p>
                  <p className="mt-2 text-xs text-fg-muted">ICP: marketing teams. Outcome: identify leaks. Timeframe: 5 minutes.</p>
                </div>
              </div>
            </div>

            {/* Example 4 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-3">Coach / Consultant</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded border border-border bg-bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Weak</p>
                  <p className="text-fg">&ldquo;Transform Your Business and Your Life&rdquo;</p>
                  <p className="mt-2 text-xs text-fg-muted">Generic aspiration. No ICP, no specific outcome, no timeframe or mechanism.</p>
                </div>
                <div className="rounded border border-accent/30 bg-accent/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Strong</p>
                  <p className="text-fg">&ldquo;Freelance Consultants: Build a Six-Month Revenue Pipeline in 12 Weeks Without Cold Outreach&rdquo;</p>
                  <p className="mt-2 text-xs text-fg-muted">ICP: freelance consultants. Outcome: 6-month pipeline. Timeframe: 12 weeks. Mechanism: no cold outreach.</p>
                </div>
              </div>
            </div>

            {/* Example 5 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-3">Ecommerce / DTC</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded border border-border bg-bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Weak</p>
                  <p className="text-fg">&ldquo;Premium Quality You Can Trust&rdquo;</p>
                  <p className="mt-2 text-xs text-fg-muted">No product reference, no audience, no specific claim. Could be any brand.</p>
                </div>
                <div className="rounded border border-accent/30 bg-accent/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Strong</p>
                  <p className="text-fg">&ldquo;Runners: Knee Pain Gone in One Training Block or Your Money Back&rdquo;</p>
                  <p className="mt-2 text-xs text-fg-muted">ICP: runners. Outcome: no knee pain. Timeframe: one training block. Risk reversal adds credibility.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Common mistakes */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">Three Common H1 Mistakes</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            These patterns appear repeatedly in failing headline audits. All three produce
            headlines that look complete but fail message match.
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold text-fg">1. Feature-Led H1</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">
                A feature-led headline describes what the product does rather than what the
                visitor gets. &ldquo;AI-Powered Analytics Dashboard&rdquo; is a feature.
                &ldquo;Growth Teams: Know Which Channels Are Wasting Budget Before the Next
                Monthly Review&rdquo; is an outcome. Features belong in body copy once the
                visitor has already decided the page is for them. In the H1, they filter out
                visitors before the promise is made.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">2. Generic Benefit Claim</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">
                Generic benefit claims describe outcomes that any competitor in the category
                could claim. &ldquo;Increase Revenue,&rdquo; &ldquo;Improve Productivity,&rdquo;
                &ldquo;Save Time.&rdquo; These are outcome-shaped words that carry no
                differentiating signal. If your competitor&apos;s page could use the same H1
                without changing a word, yours is generic. Add the ICP, the mechanism, and the
                timeframe until the sentence could only describe your specific offer.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">3. Brand Name Only</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">
                Some landing pages use the company or product name as the H1: &ldquo;Acme CRM.&rdquo;
                This communicates nothing to a visitor who arrived from a paid ad. It tells them
                what they already know (they clicked the ad, they know the name) without confirming
                what they will get. A brand-name H1 wastes the most valuable real estate on the
                page. Reserve it for brand campaigns where name recognition is the goal. For paid
                traffic driving acquisition, the H1 should always carry the formula.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: How to test */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-semibold text-fg">How to Test Your Headline Against Message Match</h2>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Write your proposed H1. Then run it through these four checks before publishing:
          </p>
          <ol className="mt-4 space-y-4 text-fg-muted">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/5 text-xs font-bold text-accent">1</span>
              <div>
                <span className="font-semibold text-fg">The cold reader test.</span>{' '}
                Show the H1 to someone who has never seen your page. Ask them to tell you
                who the page is for and what they will be able to do after using it. If their
                answer does not match your intent, the headline is not saying what you think it is.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/5 text-xs font-bold text-accent">2</span>
              <div>
                <span className="font-semibold text-fg">The competitor swap test.</span>{' '}
                Could your main competitor use this headline word-for-word without it being
                inaccurate? If yes, it is generic. A passing headline is specific enough that
                swapping it onto a competitor&apos;s page would be obviously wrong.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/5 text-xs font-bold text-accent">3</span>
              <div>
                <span className="font-semibold text-fg">The ad echo test.</span>{' '}
                Place your top-spending ad next to the H1. Read the ad headline. Read the page H1.
                The core noun phrase and the offer type must appear in both. If a visitor clicked
                the ad and the H1 makes no echo of what they clicked, message match fails.
                See the{' '}
                <Link
                  href="/signals/message-match"
                  className="text-accent underline underline-offset-2 hover:opacity-80"
                >
                  message match signal definition
                </Link>
                {' '}for the exact pass criteria.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/5 text-xs font-bold text-accent">4</span>
              <div>
                <span className="font-semibold text-fg">The cover test.</span>{' '}
                Cover everything below the H1. Read only the headline. Ask: what do I expect
                to be able to do in the next thirty seconds? Write it down. Now uncover the
                page. Does the primary CTA match what you wrote? If not, either the H1 or
                the CTA needs to change.
              </div>
            </li>
          </ol>
        </section>

        {/* CTA block */}
        <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Free Diagnostic
          </p>
          <h2 className="mb-3 text-2xl font-bold text-fg">
            See how your current H1 scores
          </h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            The Nebula audit checks your above-fold copy, headline specificity, and CTA
            alignment in one pass. If the headline fails message match, the audit flags
            the observed reason. The{' '}
            <strong className="text-fg">$97 One-Leak Repair Sprint</strong> then supplies
            a replacement headline built from the formula above. You implement it; a
            30-day re-audit confirms the fix held.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/audit?utm_source=learning-centre-headline-formula&utm_medium=cta-block"
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
                href: '/learning-centre/headline-cta-mismatch',
                title: 'Headline and CTA Mismatch',
                description: 'When your H1 and CTA create contradictory expectations.',
              },
              {
                href: '/learning-centre/message-match-checklist',
                title: 'Message Match Checklist',
                description: 'Eight binary checks before activating any paid campaign.',
              },
              {
                href: '/learning-centre/above-fold-landing-page',
                title: 'What Should Be Above the Fold',
                description: 'The structural rules for your most important screen.',
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
              <h3 className="font-semibold text-fg">What makes a landing page headline effective?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">An effective landing page headline states who it is for, what outcome they get, and how or how fast they get it. It mirrors the language and promise of the traffic source that sent the visitor. Generic benefit claims and brand-name-only headlines are the two most common failures.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">How long should a landing page headline be?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Landing page headlines work best at 6 to 12 words. Long enough to communicate a specific outcome, short enough to be parsed at a glance. Headlines over 15 words typically lose the scannability that above-fold real estate demands.</p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">Should the landing page headline match the ad headline exactly?</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">Not word-for-word, but in promise and intent. The ad creates an expectation; the landing page headline must fulfill that expectation immediately. Copying the ad headline verbatim can feel mechanical. Rephrasing the same promise in slightly different language is fine as long as the core offer and audience match.</p>
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
