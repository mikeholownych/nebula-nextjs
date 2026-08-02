import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Proof Before CTA: Social Proof Placement Guide | Nebula',
  description:
    'What visitors see before a CTA can change how they evaluate the ask. Use these proof-placement sequences as hypotheses to test on your own traffic.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/proof-before-cta' },
}

const articleSchema = createArticleSchema({
  headline: 'Proof Before CTA: Why Social Proof Placement Determines Conversion',
  description:
    'What visitors see before a CTA can change how they evaluate the ask. These proof-placement sequences are testable hypotheses, not universal laws.',
  url: 'https://nebulacomponents.shop/learning-centre/proof-before-cta',
  publishedDate: '2025-07-15',
  modifiedDate: '2026-07-27',
})

export default function ProofBeforeCTAPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
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
            Sequencing is a testable conversion lever. When a page asks for commitment before it has
            established credibility, some visitors may hesitate. Test whether moving relevant,
            verifiable proof before the ask improves the behavior that matters.
          </p>
        </div>

        {/* Section 1 — Psychology */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            Why Asking Before Proving Fails
          </h2>
          <p className="leading-relaxed text-fg-muted">
            A practical hypothesis is that visitors evaluate an ask using the information they have already
            seen. A CTA that appears before any relevant evidence gives them less context for that
            judgment. The visitor bounces not because
            the offer is wrong - but because the page gave them no reason to trust it before
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
            The common counter-argument - &quot;our audience is impatient, get to the button fast&quot; -
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
            specificity and verifiability. Useful proof formats to test include:
          </p>
          <ul className="space-y-4 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <div>
                <span className="font-semibold text-fg">Outcome statistics with context.</span>{' '}
                &quot;A documented before-and-after result tied to a specific intervention.&quot; The
                claim is useful only when the source, period, and method are inspectable.
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
                &quot;Sarah L., Performance Marketing Manager, [Company]&quot; gives the visitor
                more context than &quot;Sarah L.&quot; alone. The role signals that the reviewer has
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
            A useful experiment is to place one relevant proof element before the first
            meaningful CTA. &quot;Meaningful&quot; means any button asking for contact details,
            a purchase, a demo, or a free trial. Here are three sequence patterns to test:
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
            A common mistake is treating proof as decoration - dropping a logo strip
            at the very bottom where no one who already bounced will see it. Proof earns
            its value only when it appears at the moment of hesitation, where the visitor is deciding whether the ask is credible.
          </p>
        </section>

        {/* Section 4 — 3 quick implementations */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            3 Implementations That Don&apos;t Require a Redesign
          </h2>
          <p className="mb-5 leading-relaxed text-fg-muted">
            None of these require touching your ad creative, rebuilding the page, or waiting for a
            development sprint. Each is a bounded edit that can be tested without rebuilding the page.
          </p>
          <div className="space-y-5">
            <div>
              <h3 className="mb-1 text-lg font-semibold text-fg">1. Insert a single stat above the hero CTA</h3>
              <p className="leading-relaxed text-fg-muted">
                Take your strongest outcome number - a percentage lift, a revenue figure, a client
                count - and place it in a small badge or inline text directly above the primary
                button. One line is sufficient. The stat does not need a headline of its own.
                Example: <em>&quot;See the issue, the evidence, and the next fix.&quot;</em> If you use
                an outcome or customer count instead, publish it only when the underlying record is
                current and inspectable.
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
                verifiable result. Replace a generic benefit statement with a specific outcome claim only when you can
                substantiate it. A claim is not proof on its own; place the supporting method,
                source, and limitations close enough for the visitor to inspect.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 — Zero testimonials */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">
            What to Use When You Have Zero Testimonials Yet
          </h2>
          <p className="mb-5 leading-relaxed text-fg-muted">
            A new offer or a new landing page often has no reviews to show. That is not a
            reason to skip proof entirely - it is a reason to substitute a different, still
            verifiable, form of it until testimonials exist:
          </p>
          <ul className="space-y-4 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <div>
                <span className="font-semibold text-fg">A specific, verifiable process claim.</span>{' '}
                &quot;Every audit runs the same 9-signal diagnostic&quot; is proof of rigor even
                without an outcome number attached - it tells the visitor the evaluation is
                systematic, not improvised.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <div>
                <span className="font-semibold text-fg">Founder or operator credibility, stated plainly.</span>{' '}
                A short, honest line about who is behind the offer and why - not a fabricated
                client count - can substitute for social proof when none exists yet.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <div>
                <span className="font-semibold text-fg">Transparent scarcity.</span>{' '}
                Stating plainly that you do not yet have a case study - and explaining what one
                would require to publish - reads as more trustworthy than an invented number,
                because it is falsifiable and specific.
              </div>
            </li>
          </ul>
          <p className="mt-5 leading-relaxed text-fg-muted">
            What does not work: leaving the proof slot empty, or filling it with an unverifiable
            claim. Both cost more trust than an honest &quot;here is what we can show you right
            now&quot; statement.
          </p>
        </section>

        {/* CTA block */}
        <section className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-8">
          <h2 className="mb-3 text-2xl font-bold text-fg">Find the proof leak on your page</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            The free Nebula audit reports where the page may lose credibility before the
            CTA - missing proof, weak proof, misplaced proof. If the audit flags a proof leak,
            the $97 One-Leak Repair Sprint selects it as the one high-confidence repair,
            confirms the scope with you, implements it, and verifies the live change.
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
