import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Meta Ads High Frequency Not Converting: The Page Is The Problem | Nebula Components',
  description: 'High-frequency Meta ads that are not converting are usually not an ad fatigue problem. They are a landing page problem.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/meta-ads-high-frequency-not-converting' },
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
            Meta Ads Leaks · meta-ads-high-frequency-not-converting
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Meta Ads High Frequency? The Page May Be Burning Budget
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            When ad frequency climbs, most advertisers assume the audience is exhausted. But if clicks are still coming and conversions have stalled, the leak isn&apos;t the ad — it&apos;s the landing page failing to close.
          </p>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">When frequency matters</h2>
          <p className="leading-relaxed text-fg-muted">
            Frequency indicates how many times the average person has seen your ad. A frequency above 5 with CTR dropping signals genuine audience fatigue — the creative has worn out its welcome.
          </p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Frequency &gt;5 and CTR declining: Your audience has seen the ad too many times
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              CTR dropping below 0.8%: The hook no longer captures attention
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Cost per click rising: You&apos;re paying more for the same impressions
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            In this case, refresh the creative or expand your audience. The ad itself is the bottleneck.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">When the page is the problem</h2>
          <p className="leading-relaxed text-fg-muted">
            But here&apos;s the leak most miss: frequency high, clicks still strong, but conversions flat or falling. The ad is doing its job — people are clicking. The page is where they lose interest.
          </p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Frequency &gt;5 but CTR stable: The ad still works, audience isn&apos;t fatigued
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Clicks consistent but conversions dropping: The page fails to convert interest
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              High bounce rate on landing page: The message-ad mismatch kills momentum
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            This pattern means your ad spend is working — the page is burning the budget after the click.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Test: change the page not the ad</h2>
          <p className="leading-relaxed text-fg-muted">
            Before you pause a high-performing ad or overhaul your targeting, run this test:
          </p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Keep the ad running as-is if CTR is above benchmark
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Build a new landing page variant that matches the ad hook precisely
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Send 50% of traffic to the new page
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Measure conversions, not just clicks
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            If the new page converts at a higher rate while frequency remains stable, you&apos;ve found the leak. The audience was never tired — the page just wasn&apos;t closing.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Find the leak on your page</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            Run the free Nebula audit first. Buy the $147 Fix Pack only when the leak is obvious.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit" className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors">
              Run the free audit
            </Link>
            <Link href="/learning-centre/paid-traffic-leak-map" className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors">
              Open leak map
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/facebook-ads-no-leads" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Facebook Ads Getting Clicks But No Leads
            </Link>
            <Link href="/learning-centre/google-ads-clicks-no-sales" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Google Ads Clicks But No Sales: Check The Page Before Budget
            </Link>
            <Link href="/learning-centre/landing-page-not-converting" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Landing Page Not Converting? Diagnose These 5 Leaks First
            </Link>
            <Link href="/learning-centre/high-cpc-low-conversion" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              High CPC, Low Conversion: Stop Optimizing The Wrong Layer
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
