import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Types of Social Proof for Landing Pages: Which Work and Which Backfire | Nebula',
  description:
    '6 types of social proof ranked by conversion impact, with the specific conditions under which each works, backfires, or becomes invisible. Named testimonials, review counts, logos, usage numbers, case studies, and generic quotes.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/types-of-social-proof',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Types of Social Proof for Landing Pages: Which Work and Which Backfire',
  description:
    '6 types of social proof ranked by conversion impact, with the specific conditions under which each works, backfires, or becomes invisible.',
  url: 'https://nebulacomponents.com/learning-centre/types-of-social-proof',
  publishedDate: '2026-08-28',
})

export default function TypesOfSocialProofPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre" className="text-sm text-fg-muted hover:text-fg transition-colors">
          &larr; Learning Centre
        </Link>

        <div className="mt-8 rounded-md border border-border bg-bg-panel p-8 md:p-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            Trust Signals
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-fg md:text-4xl">
            Types of Social Proof for Landing Pages: Which Work and Which Backfire
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-muted">
            Not all social proof is equal. A named testimonial with a specific result converts
            differently than a logo strip, which converts differently than a generic quote.
            Understanding the hierarchy lets you prioritize the right evidence and avoid the
            configurations that actively reduce trust. Here are the 6 types, ranked by conversion
            impact, with the exact conditions that make each one work or backfire.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/audit?utm_source=lc-types-social-proof&utm_medium=hero-cta"
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
          <h2 className="text-xl font-bold text-fg">1. Named testimonial with a specific result</h2>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-accent">Highest impact</p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A real full name, a recognizable company or role, and a specific measurable outcome.
            &ldquo;We cut our cost per lead from $45 to $18 in six weeks&rdquo; from &ldquo;Sarah
            M., Head of Growth at Acme Inc.&rdquo; is the gold standard.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">Why it works:</strong> The specificity is the proof. A
            number ($45 to $18) is hard to invent casually. A named person at a real company is
            checkable. The combination signals that the result was real enough to document.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">When it backfires:</strong> When the person cannot be
            found, the company does not exist, the result is implausible, or the testimonial reads
            like marketing copy. Visitors pattern-match on these signals faster than you expect.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">2. Review count with aggregate score</h2>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-accent">High impact</p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            &ldquo;4.8 out of 5 from 312 verified reviews on G2&rdquo; converts because the number
            of reviews is verifiable and aggregation at scale is hard to fake. Link the widget
            directly to the review platform.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">Why it works:</strong> Scale implies real customers.
            A single five-star review is easy to dismiss. Three hundred of them require
            sustained effort to manufacture, and your visitor knows this.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">When it backfires:</strong> When the review platform
            is obscure and unverifiable, when the score is suspiciously round (5.0 from 5 reviews),
            or when the link goes nowhere. A broken verification path removes the credibility the
            number was supposed to provide.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">3. Customer logos</h2>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-accent">Moderate to high impact (ICP-dependent)</p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A logo strip works when the brands shown are recognizable and respected by your
            specific target buyer. A founder running paid traffic for a B2B SaaS product
            is influenced by seeing Shopify, HubSpot, and Intercom. The same person is
            unaffected by logos they do not recognize.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">When it backfires:</strong> When logos are generic,
            unfamiliar, or do not match the ICP. A logo strip that signals &ldquo;enterprise&rdquo;
            to a founder looking for an affordable tool creates dissonance. Match logos to
            the buyer reading the page, not to your most prestigious client regardless of fit.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">4. Usage numbers</h2>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-accent">Moderate impact</p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            &ldquo;4,127 teams&rdquo; or &ldquo;293 landing pages audited&rdquo; provides
            credibility through specificity and scale. The number must be precise, plausible,
            and honest. Round numbers (&ldquo;thousands of customers&rdquo;) read as
            approximations. Exact numbers (&ldquo;4,127&rdquo;) read as tracked and real.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">When it backfires:</strong> When the number is
            implausibly large for a young product, when it is clearly inflated to include
            free signups or trials, or when it contradicts other signals on the page. A
            usage number that does not pass basic scrutiny erodes rather than builds trust.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">5. Case study references</h2>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-accent">Moderate impact (credibility signal)</p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A link to a published case study signals that you have enough proof to support a
            detailed written account. Visitors who click read the depth of the result. Those
            who do not click still benefit from knowing it exists. The signal is confidence,
            not just convenience.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">When it backfires:</strong> When the link goes to a
            page that does not exist, is gated behind a form, or is clearly a vendor-written
            success story with no real numbers. The format implies rigor. If the content does
            not deliver rigor, trust drops below baseline.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">6. Generic quotes</h2>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-accent">Low to negative impact</p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            &ldquo;Great product, highly recommend!&rdquo; with no name, no result, and a
            stock-photo avatar. This category represents the most common testimonial configuration
            on landing pages and the least effective.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">Why it backfires:</strong> The quote is not checkable
            and does not communicate anything specific. A visitor who has seen hundreds of
            similar testimonials on other pages patterns it as filler. More damaging: when
            accompanied by a clearly AI-generated or stock face, it actively signals that
            the testimonials section was not written by real customers.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            For a full breakdown of the configurations that hurt conversion, see{' '}
            <Link href="/learning-centre/social-proof-backfire" className="text-accent hover:text-fg transition-colors">
              Social Proof Backfire: the 4 testimonial configurations that reduce trust
            </Link>.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Related</h2>
          <ul className="mt-4 space-y-3 text-fg-muted">
            <li>
              <Link href="/signals/trust-signals" className="text-accent hover:text-fg transition-colors">
                Trust Signals: the Nebula diagnostic check
              </Link>
            </li>
            <li>
              <Link href="/learning-centre/social-proof-above-fold" className="text-accent hover:text-fg transition-colors">
                Social Proof Above the Fold: why placement beats volume
              </Link>
            </li>
            <li>
              <Link href="/learning-centre/proof-before-cta" className="text-accent hover:text-fg transition-colors">
                Proof Before CTA: positioning for trust
              </Link>
            </li>
          </ul>
          <div className="mt-6">
            <Link
              href="/audit?utm_source=lc-types-social-proof&utm_medium=footer-cta"
              className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
            >
              Check your page for trust gaps &rarr;
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
