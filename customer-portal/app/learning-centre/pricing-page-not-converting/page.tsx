import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Pricing Page Not Converting: The Real Reason Visitors Do Not Buy | Nebula Components',
  description: 'A pricing page that does not convert usually has one of four diagnosable problems. Identify yours before changing the price.',
  alternates: { canonical: 'https://nebulacomponents.com/learning-centre/pricing-page-not-converting' },
}

const articleSchema = createArticleSchema({
  headline: 'Pricing Page Not Converting? The Tier Structure May Be Wrong',
  description: 'A pricing page that does not convert usually has one of four diagnosable problems. Identify yours before changing the price.',
  url: 'https://nebulacomponents.com/learning-centre/pricing-page-not-converting',
  publishedDate: '2026-01-01',
  modifiedDate: '2026-07-27',
})

export default function LearningCentrePage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre" className="text-sm font-semibold text-accent hover:text-fg transition-colors">
          ← Learning Centre
        </Link>

        <div className="mt-8 rounded-md border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Industry Specific · Pricing Page Not Converting
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Pricing Page Not Converting? The Tier Structure May Be Wrong
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            Pricing pages confuse instead of guide. Wrong tiers, unclear value, pricing anxiety. Fix the tier structure and proof before the price.
          </p>
        </div>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The pricing page leak chain</h2>
          <p className="leading-relaxed text-fg-muted">
            Most pricing pages lose visitors before they ever see the price. Confusion comes first. Then comparison paralysis. Then fear. Each stage leaks potential customers who might otherwise buy.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A visitor lands on your pricing page already interested. They scroll looking for clarity. Instead they find tier names that mean nothing, feature lists that blur together, and no clear indication of which option fits them. Confusion turns into comparison paralysis. They can&apos;t decide, so they leave &quot;to think about it.&quot; They never come back.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Common tier mistakes</h2>
          <ul className="space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Too many options:</strong> 5 or 6 tiers overwhelm. Decision fatigue sets in. The visitor who could not choose between your product and nothing now cannot choose between your products.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Unclear differences:</strong> Tier names like Bronze, Silver, Gold say nothing about who each tier serves. Feature checkmarks repeat across columns. The buyer cannot translate features into outcomes.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">No anchor:</strong> Without a clear recommended option, the visitor must do math and comparison shopping in their head. Most will not bother.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Value hidden behind price:</strong> The price shows first. The value shows later, if at all. This reverses the correct sequence.</span>
            </li>
          </ul>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Good tier structure</h2>
          <p className="leading-relaxed text-fg-muted">
            Three tiers. This is not a rule but a strong default. Three gives enough choice without overwhelming. It creates a natural comparison: good, better, best.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Clear naming. Name tiers after who they serve, not arbitrary labels. Starter, Growth, Enterprise. Solo, Team, Organization. The name should hint at the buyer&apos;s situation.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Value per tier. Each tier should have a clear &quot;what you get&quot; that maps to a specific outcome. &quot;Up to 5,000 contacts&quot; is a feature. &quot;Send your monthly newsletter without hitting limits&quot; is the value story.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            One tier highlighted. The middle option gets the &quot;Most Popular&quot; or &quot;Recommended&quot; badge. Most buyers will not comparison shop. They will take the suggested option.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Usage-based and seat-based pricing add a specific anxiety</h2>
          <p className="leading-relaxed text-fg-muted">
            Flat-tier pricing has a tier-selection problem. Usage-based or per-seat pricing has a
            different, sharper one: the visitor cannot answer &quot;what will I actually pay?&quot;
            without doing math the page didn&apos;t offer to do for them.
          </p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">No calculator, just a per-unit rate:</strong> &quot;$0.002 per API call&quot; tells a visitor nothing until they know their own volume. Without an interactive estimate, most will not do the multiplication themselves - they will assume the worst case and leave.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">No visible ceiling:</strong> Usage-based pricing without a stated cap or overage-alert mechanism reads as open-ended financial risk, even to a buyer who would comfortably fit in the lowest tier.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Seat pricing with unclear seat definition:</strong> &quot;Per user&quot; pricing that doesn&apos;t specify whether viewers, guests, or integrations count as seats creates the same uncertainty - buyers overestimate cost to be safe, then bounce.</span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The fix is rarely to hide the model - it&apos;s to make the math visible. A simple
            slider or a &quot;typical customer at your size pays $X&quot; anchor removes the guesswork
            that otherwise gets resolved by leaving.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Quick wins</h2>
          <ul className="space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Add feature comparison:</strong> A simple table that shows what each tier includes. Not a wall of checkmarks, but the 4-6 features that actually matter to the decision.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Recommended badge:</strong> Highlight one tier. Put &quot;Most Popular&quot; or &quot;Best for Growing Teams&quot; on the middle option. Remove the need for active comparison.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Annual discount:</strong> Show monthly and annual pricing side by side. Make the savings obvious. Offer a two-month discount for annual. This increases average order value and reduces churn.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Proof before price:</strong> Move testimonials, case results, or trust signals above the pricing table. The visitor should want the outcome before they see the cost.</span>
            </li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Fix your pricing page</h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              The free Nebula audit identifies likely page-side leaks. The $97 One-Leak Repair Sprint
              delivers a tailored kit for one high-confidence page-level finding. You or your developer implements it, and the 30-day re-audit verifies the page condition. It does not promise conversion lift.
            </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit?utm_source=learning-centre&utm_medium=organic-content" className="inline-flex rounded bg-accent px-6 py-3 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors">
              Run the free audit
            </Link>
            <Link href="/learning-centre/landing-page-not-converting" className="inline-flex rounded border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors">
              Diagnose landing page leaks
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/landing-page-not-converting" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Landing Page Not Converting? Diagnose These 5 Leaks First
            </Link>
            <Link href="/learning-centre/cta-not-working" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              CTA Not Working: Why The Button Is Rarely The Problem
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
