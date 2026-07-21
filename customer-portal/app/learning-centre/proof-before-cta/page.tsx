import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Proof Before CTA: Why Social Proof Placement Determines Conversion | Nebula Components',
  description:
    'Where you place social proof relative to your CTA has a measurable impact on conversion. The data consistently favors proof first. Here is the exact order that works.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/proof-before-cta' },
}

const articleSchema = createArticleSchema({
  headline: 'Proof Before CTA: Why Social Proof Placement Determines Conversion',
  description:
    'Where you place social proof relative to your CTA has a measurable impact on conversion. The data consistently favors proof first.',
  url: 'https://nebulacomponents.shop/learning-centre/proof-before-cta',
  publishedDate: '2025-07-15',
  modifiedDate: '2026-07-21',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why does proof placement affect conversion rate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Proof placement affects conversion because it determines what the visitor's brain has processed before encountering the commitment ask. Cold traffic — visitors arriving from paid ads with no prior relationship with the brand — defaults to risk-aversion when asked to take an action. A CTA that appears before any credibility evidence forces the visitor to decide with no supporting data. Proof placed before the CTA creates micro-commitments: the visitor nods at a result, recognises a client name, or processes a stat. These micro-commitments lower the psychological cost of clicking the button that follows.",
      },
    },
    {
      '@type': 'Question',
      name: 'What types of social proof increase conversion rate the most?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Ranked by conversion impact: (1) Outcome statistics with context — a number tied to a specific intervention ('ROAS increased from 1.8× to 4.1× across 23 accounts after fixing the hero section') is hard to dismiss. (2) Case study snippets — a two-sentence before/after with the problem, fix, and result. (3) Named testimonials with role and company — the role signals that the reviewer has relevant authority to assess the claim. (4) Recognisable logos — borrowed credibility, but only when the relationship is genuine. Generic 5-star claims without specifics carry almost no weight. The test for any proof element: can a visitor understand the claim and its relevance in under 10 seconds?",
      },
    },
    {
      '@type': 'Question',
      name: 'Where exactly should proof be placed on a landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "At least one proof element must be visible before the first meaningful CTA — any button asking for contact details, a purchase, a demo, or a free trial. 'Meaningful' excludes navigation links and 'learn more' anchors. For short pages: headline → one outcome stat or logo strip → CTA. For mid-length pages: headline → problem statement → named testimonial or case snippet → CTA → supporting proof → second CTA. The most common error is placing proof at the bottom of the page where visitors who already bounced cannot see it. Proof earns its value only when it appears at the moment of hesitation, which is almost always just before the first ask.",
      },
    },
    {
      '@type': 'Question',
      name: 'How do I add proof to a landing page without a redesign?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Three implementations that require no redesign: (1) Insert a single stat above the hero CTA — one line of text with your strongest outcome number placed directly above the primary button. (2) Pull one testimonial into the hero section — move the shortest, most specific testimonial from wherever it currently sits to directly beneath your subheadline, with name, role, and company. (3) Add an outcome-anchored subheadline — if you have no ready testimonials, rewrite the subheadline to include a verifiable result claim, then immediately follow it with the supporting data. Each of these can be live within an hour.",
      },
    },
  ],
}

export default function ProofBeforeCTAPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-3xl px-6 py-14">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-fg-muted">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/learning-centre" className="hover:text-accent transition-colors">Learning Centre</Link>
          <span aria-hidden="true">/</span>
          <span className="text-fg" aria-current="page">Proof Before CTA</span>
        </nav>

        {/* Article header */}
        <div className="rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Trust Leaks · Proof Before CTA
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Proof Before CTA: The Simple Fix Most Landing Pages Miss
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            Sequencing is a conversion lever. When a page asks for commitment before it has
            established credibility, the visitor&apos;s default answer is no. The fix is not more
            persuasive copy — it is reordering what the visitor sees first.
          </p>
        </div>

        {/* Section 1 — Psychology */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            Why Asking Before Proving Fails
          </h2>
          <p className="leading-relaxed text-fg-muted">
            Commitment psychology is well-documented: people are more willing to take an action
            after they have already formed a positive belief about the entity asking. A CTA that
            appears before any evidence forces the visitor to make a judgment with no data. In the
            absence of data, the brain defaults to risk-aversion. The visitor bounces not because
            the offer is wrong — but because the page gave them no reason to trust it before
            demanding a decision.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            This is especially acute on paid traffic. Cold audiences arrive skeptical. They have
            seen dozens of pages that open with a button. Proof placed above the first CTA short-circuits
            that skepticism before it calculates an exit. The mechanism is simple: evidence
            creates micro-commitments (nods, agreement, recognition) that lower the psychological
            cost of clicking.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The common counter-argument — &quot;our audience is impatient, get to the button fast&quot; —
            confuses speed with sequence. You can keep the page short. The proof can be a single
            stat or one line from a client. What matters is that it appears <em>before</em> the ask,
            not that it takes three scrolls to find.
          </p>
        </section>

        {/* Section 2 — What counts as proof */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            What Actually Counts as Proof
          </h2>
          <p className="mb-5 leading-relaxed text-fg-muted">
            Not every social proof element carries equal weight. Generic testimonials
            (&quot;Amazing team!&quot;) are nearly worthless. Proof earns trust in proportion to its
            specificity and verifiability. Ranked by conversion impact:
          </p>
          <ul className="space-y-4 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <div>
                <span className="font-semibold text-fg">Outcome statistics with context.</span>{' '}
                &quot;Average ROAS increased from 1.8× to 4.1× across 23 accounts after fixing the
                hero section.&quot; A number tied to a specific intervention is hard to dismiss.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <div>
                <span className="font-semibold text-fg">Case study snippets.</span>{' '}
                A two-sentence before/after: the problem, the fix, the result. No narrative
                padding. Visitors can pattern-match their situation to the example in under
                ten seconds.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <div>
                <span className="font-semibold text-fg">Named testimonials with role and company.</span>{' '}
                &quot;Sarah L., Performance Marketing Manager, [Company]&quot; outperforms
                &quot;Sarah L.&quot; by a measurable margin. The role signals that the reviewer has
                relevant authority to assess the claim.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <div>
                <span className="font-semibold text-fg">Recognisable logos.</span>{' '}
                Client or publication logos work as borrowed credibility. One recognisable
                name does more work than a row of unknowns. Include logos only when the
                relationship is real and verifiable.
              </div>
            </li>
          </ul>
          <p className="mt-5 leading-relaxed text-fg-muted">
            The test for any proof element: can a visitor understand the claim and its
            relevance in under ten seconds? If not, compress it or cut it. Density beats
            volume.
          </p>
        </section>

        {/* Section 3 — Proof placement */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            Where to Place Proof Relative to the CTA
          </h2>
          <p className="mb-5 leading-relaxed text-fg-muted">
            The rule is absolute: at least one proof element must be visible before the first
            meaningful CTA. &quot;Meaningful&quot; means any button asking for contact details,
            a purchase, a demo, or a free trial. Here is the hierarchy that works:
          </p>

          {/* Visual hierarchy examples */}
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-bg-muted p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-fg-muted">Minimal (short pages)</p>
              <ol className="space-y-1 text-sm text-fg-muted">
                <li className="flex items-center gap-2"><span className="text-accent font-bold">1.</span> Headline + subheadline</li>
                <li className="flex items-center gap-2"><span className="text-accent font-bold">2.</span> One outcome stat or logo strip</li>
                <li className="flex items-center gap-2"><span className="text-accent font-bold">3.</span> <span className="text-fg font-semibold">CTA</span></li>
              </ol>
            </div>
            <div className="rounded-xl border border-border bg-bg-muted p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-fg-muted">Standard (mid-length pages)</p>
              <ol className="space-y-1 text-sm text-fg-muted">
                <li className="flex items-center gap-2"><span className="text-accent font-bold">1.</span> Headline + subheadline</li>
                <li className="flex items-center gap-2"><span className="text-accent font-bold">2.</span> Problem statement</li>
                <li className="flex items-center gap-2"><span className="text-accent font-bold">3.</span> Named testimonial or case snippet</li>
                <li className="flex items-center gap-2"><span className="text-accent font-bold">4.</span> <span className="text-fg font-semibold">CTA</span></li>
                <li className="flex items-center gap-2"><span className="text-accent font-bold">5.</span> Supporting proof (logos, stats, additional testimonials)</li>
                <li className="flex items-center gap-2"><span className="text-accent font-bold">6.</span> <span className="text-fg font-semibold">Second CTA</span></li>
              </ol>
            </div>
            <div className="rounded-xl border border-border bg-bg-muted p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-fg-muted">Long-form (VSL or sales pages)</p>
              <ol className="space-y-1 text-sm text-fg-muted">
                <li className="flex items-center gap-2"><span className="text-accent font-bold">1.</span> Hero: problem-aware headline</li>
                <li className="flex items-center gap-2"><span className="text-accent font-bold">2.</span> Agitation: cost of the status quo</li>
                <li className="flex items-center gap-2"><span className="text-accent font-bold">3.</span> Proof block: 2–3 case snippets + stats</li>
                <li className="flex items-center gap-2"><span className="text-accent font-bold">4.</span> <span className="text-fg font-semibold">First CTA</span></li>
                <li className="flex items-center gap-2"><span className="text-accent font-bold">5.</span> Mechanism + objection handling</li>
                <li className="flex items-center gap-2"><span className="text-accent font-bold">6.</span> Second proof block (longer testimonials, logos)</li>
                <li className="flex items-center gap-2"><span className="text-accent font-bold">7.</span> <span className="text-fg font-semibold">Final CTA</span></li>
              </ol>
            </div>
          </div>

          <p className="mt-5 leading-relaxed text-fg-muted">
            The common mistake is treating proof as decoration — dropping a logo strip
            at the very bottom where no one who already bounced will see it. Proof earns
            its value only when it appears at the moment of hesitation, which is almost
            always just before the first ask.
          </p>
        </section>

        {/* Section 4 — 3 quick implementations */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            3 Implementations That Don&apos;t Require a Redesign
          </h2>
          <p className="mb-5 leading-relaxed text-fg-muted">
            None of these require touching your ad creative, rebuilding the page, or waiting for a
            development sprint. Each can be live within an hour.
          </p>
          <div className="space-y-5">
            <div>
              <h3 className="mb-1 text-lg font-semibold text-fg">1. Insert a single stat above the hero CTA</h3>
              <p className="leading-relaxed text-fg-muted">
                Take your strongest outcome number — a percentage lift, a revenue figure, a client
                count — and place it in a small badge or inline text directly above the primary
                button. One line is sufficient. The stat does not need a headline of its own.
                Example: <em>&quot;Used by 340+ operators to identify the exact section killing
                their conversions.&quot;</em> That sentence, above the button, costs nothing and
                anchors credibility before the ask.
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-lg font-semibold text-fg">2. Pull one testimonial into the hero section</h3>
              <p className="leading-relaxed text-fg-muted">
                Identify the shortest, most outcome-specific testimonial you have. Move it from
                the social proof section (wherever it currently lives) to directly beneath your
                subheadline. Keep it to two sentences maximum. Add the person&apos;s name, role,
                and company. This alone repositions the CTA from a cold ask to a reinforced
                recommendation.
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-lg font-semibold text-fg">3. Add an outcome-anchored subheadline</h3>
              <p className="leading-relaxed text-fg-muted">
                If you have no testimonials ready to use, rewrite the subheadline to contain a
                verifiable result. Replace a benefit statement (&quot;Turn more clicks into
                customers&quot;) with an outcome claim (&quot;Pages audited with this method
                convert at 2.1× the category average.&quot;). A claim is not proof on its own, but
                it signals that evidence exists and primes the visitor to expect it. Follow it
                immediately with the supporting data point or testimonial.
              </p>
            </div>
          </div>
        </section>

        {/* CTA block */}
        <section className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-8">
          <h2 className="mb-3 text-2xl font-bold text-fg">Find the proof leak on your page</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            The free Nebula audit identifies exactly where your page loses credibility before the
            CTA — missing proof, weak proof, misplaced proof. If the audit flags a proof leak,
            the $97 Fix Pack delivers a prioritised fix plan you can implement the same day.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/audit"
              className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors"
            >
              Run the free audit
            </Link>
            <Link
              href="/learning-centre/paid-traffic-leak-map"
              className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent/10 transition-colors"
            >
              Open the leak map
            </Link>
          </div>
        </section>

        {/* Related articles grid */}
        <section className="mt-10">
          <h2 className="mb-5 text-xl font-bold text-fg">Related leak checks</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/learning-centre/google-ads-clicks-no-sales"
              className="rounded-xl border border-border bg-bg-panel p-5 transition-colors hover:border-accent/50"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-2">Paid Traffic</p>
              <p className="font-semibold text-fg leading-snug">
                Google Ads Clicks But No Sales: Check The Page Before Budget
              </p>
            </Link>
            <Link
              href="/learning-centre/facebook-ads-no-leads"
              className="rounded-xl border border-border bg-bg-panel p-5 transition-colors hover:border-accent/50"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-2">Paid Traffic</p>
              <p className="font-semibold text-fg leading-snug">
                Facebook Ads Getting Clicks But No Leads
              </p>
            </Link>
            <Link
              href="/learning-centre/landing-page-not-converting"
              className="rounded-xl border border-border bg-bg-panel p-5 transition-colors hover:border-accent/50"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-2">Conversion</p>
              <p className="font-semibold text-fg leading-snug">
                Landing Page Not Converting? Diagnose These 5 Leaks First
              </p>
            </Link>
            <Link
              href="/learning-centre/high-cpc-low-conversion"
              className="rounded-xl border border-border bg-bg-panel p-5 transition-colors hover:border-accent/50"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-2">Paid Traffic</p>
              <p className="font-semibold text-fg leading-snug">
                High CPC, Low Conversion: Stop Optimising The Wrong Layer
              </p>
            </Link>
          </div>
        </section>

        {/* Back link */}
        <div className="mt-10 border-t border-border pt-8">
          <Link
            href="/learning-centre"
            className="text-sm font-semibold text-accent hover:text-accent-light transition-colors"
          >
            ← Back to Learning Centre
          </Link>
        </div>

      </div>
    </main>
  )
}
