import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Retargeting Ads Not Converting: The Landing Page Is Still The Issue | Nebula Components',
  description: 'Retargeting campaigns that do not convert send warm traffic to the same broken landing pages as cold campaigns.',
  alternates: { canonical: 'https://nebulacomponents.com/learning-centre/retargeting-ads-not-converting' },
}

const articleSchema = createArticleSchema({
  headline: 'Fix Retargeting Landing Pages to Recover and Save Lost Buyers',
  description: 'Retargeting campaigns that do not convert send warm traffic to the same broken landing pages as cold campaigns.',
  url: 'https://nebulacomponents.com/learning-centre/retargeting-ads-not-converting',
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
            Meta Ads Leaks · Retargeting Not Converting
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Fix Retargeting Landing Pages to Recover and Save Lost Buyers
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            Retargeting fails when the first impression leaked trust. Fix the cold traffic page before blaming retargeting. If visitors didn&apos;t convert the first time, the page left a gap-and showing it again won&apos;t close it.
          </p>
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/audit?utm_source=learning-centre-retargeting-ads-not-converting&utm_medium=hero-cta"
                className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
              >
                Get your free audit →
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
          <h2 className="mb-4 text-2xl font-bold text-fg">The retargeting misconception</h2>
          <p className="leading-relaxed text-fg-muted">
            Most teams assume retargeting ads aren&apos;t working when conversions stay low. But retargeting doesn&apos;t create demand-it reminds. If the first visit didn&apos;t move the visitor toward action, the tenth visit won&apos;t either.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The problem isn&apos;t the ads not working. It&apos;s the page not working. Retargeting amplifies what already exists. A broken funnel gets more traffic. A working funnel gets more conversions.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">How the first page affects retargeting</h2>
          <p className="leading-relaxed text-fg-muted">
            <strong className="text-fg">Trust:</strong> If the first impression felt generic, manipulative, or unclear, retargeting reminds them of that feeling. You&apos;re not re-engaging-you&apos;re reinforcing distrust.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">Memory:</strong> Visitors remember how you made them feel. Confusing navigation, too many form fields, vague headlines-these stick. Retargeting brings them back to the same experience.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            <strong className="text-fg">Intent:</strong> A clear first page creates clear intent. Visitors know what you offer and whether it&apos;s for them. Retargeting then serves as a nudge, not a rescue mission.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Segment retargeting by drop-off point, not just by &quot;visited&quot;</h2>
          <p className="leading-relaxed text-fg-muted">
            A single &quot;all site visitors&quot; retargeting audience treats a visitor who bounced
            in two seconds the same as one who reached checkout and abandoned. Those are different
            problems and need different pages:
          </p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Bounced in under 10 seconds:</strong> The message-match gap is the likely cause - retarget with the original ad&apos;s exact headline restated, not a discount.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Scrolled but didn&apos;t engage the CTA:</strong> The proof or objection-handling further down the page didn&apos;t land - retarget to a page section, not the homepage.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Started checkout or a form, then left:</strong> This is genuine purchase intent that stalled on friction - retarget with a direct link back into the same step, not a new landing page.</span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Sending all three segments to the same generic retargeting creative and the same
            homepage is the most common reason retargeting spend underperforms cold prospecting -
            it treats three distinct leaks as one.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Diagnosing the real leak</h2>
          <p className="leading-relaxed text-fg-muted">Compare cold traffic vs returning traffic conversion rates:</p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              If cold traffic converts below 1%, the landing page is the leak. Retargeting won&apos;t fix it.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              If cold traffic converts above 2% but returning traffic is flat, the retargeting message might be misaligned.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              If both are low, fix the page first. Then test retargeting.
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The first page does the heavy lifting. Retargeting is the assist. Don&apos;t ask the assist to carry the load.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Quick fix</h2>
          <p className="leading-relaxed text-fg-muted">Before adjusting retargeting budgets, frequency, or creative:</p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Read the landing page as a first-time visitor. Does the headline match the ad promise?
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Check mobile experience. Most retargeting impressions happen on mobile.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Reduce form friction. Ask only what&apos;s needed to re-engage.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Add social proof above the fold. Trust signals matter for returning visitors too.
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Run the page through the Nebula audit. Fix the leaks. Then measure retargeting again.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Find the leak on your page</h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              The free Nebula audit identifies likely page-side leaks. The $97 One-Leak Repair Sprint
              delivers a tailored kit for one high-confidence page-level finding. You or your developer implements it, and the 30-day re-audit verifies the page condition. It does not promise conversion lift.
            </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit?utm_source=learning-centre&utm_medium=organic-content" className="inline-flex rounded bg-accent px-6 py-3 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors">
              Run the free audit
            </Link>
            <Link href="/learning-centre/paid-traffic-leak-map" className="inline-flex rounded border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors">
              Open leak map
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/facebook-ads-no-leads" className="block border-b border-border py-2.5 text-fg-muted transition-colors hover:text-accent">
              Facebook Ads Getting Clicks But No Leads
            </Link>
            <Link href="/learning-centre/meta-ads-high-frequency-not-converting" className="block border-b border-border py-2.5 text-fg-muted transition-colors hover:text-accent">
              Meta Ads High Frequency? The Page May Be Burning Budget
            </Link>
            <Link href="/learning-centre/landing-page-not-converting" className="block border-b border-border py-2.5 text-fg-muted transition-colors hover:text-accent">
              Landing Page Not Converting? Diagnose These 5 Leaks First
            </Link>
            <Link href="/learning-centre/google-ads-clicks-no-sales" className="block border-b border-border py-2.5 text-fg-muted transition-colors hover:text-accent">
              Google Ads Clicks But No Sales: Check The Page Before Budget
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
