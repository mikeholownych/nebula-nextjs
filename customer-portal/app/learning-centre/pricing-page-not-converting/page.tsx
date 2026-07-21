import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing Page Not Converting: The Real Reason Visitors Do Not Buy | Nebula Components',
  description: 'A pricing page that does not convert usually has one of four diagnosable problems. Identify yours before changing the price.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/pricing-page-not-converting' },
}

export default function LearningCentrePage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre" className="text-sm font-semibold text-accent hover:text-accent-light transition-colors">
          ← Learning Centre
        </Link>

        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Industry Specific · pricing page not converting
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Pricing Page Not Converting? The Tier Structure May Be Wrong
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            Pricing pages confuse instead of guide. Wrong tiers, unclear value, pricing anxiety. Fix the tier structure and proof before the price.
          </p>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The pricing page leak chain</h2>
          <p className="leading-relaxed text-fg-muted">
            Most pricing pages lose visitors before they ever see the price. Confusion comes first. Then comparison paralysis. Then fear. Each stage leaks potential customers who might otherwise buy.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            A visitor lands on your pricing page already interested. They scroll looking for clarity. Instead they find tier names that mean nothing, feature lists that blur together, and no clear indication of which option fits them. Confusion turns into comparison paralysis. They can&apos;t decide, so they leave &quot;to think about it.&quot; They never come back.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
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

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
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

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
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
            Run the free Nebula audit to spot tier structure issues. Buy the $97 Fix Pack when you know what to change.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit" className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors">
              Run the free audit
            </Link>
            <Link href="/learning-centre/landing-page-not-converting" className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors">
              Diagnose landing page leaks
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
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
