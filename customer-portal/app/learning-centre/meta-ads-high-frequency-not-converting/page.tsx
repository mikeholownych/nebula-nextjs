import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'
import ArticleFaq from '../ArticleFaq'

export const metadata: Metadata = {
  title: 'Meta Ads High Frequency Not Converting: Check the Landing Page | Nebula Components',
  description: 'High-frequency Meta ads with stable CTR but flat conversions? The landing page is worth investigating before assuming ad fatigue.',
  alternates: { canonical: 'https://nebulacomponents.com/learning-centre/meta-ads-high-frequency-not-converting' },
}

const articleSchema = createArticleSchema({
  headline: 'Fix Landing Page Fatigue to Scale High-Frequency Meta Ads',
  description: 'High-frequency Meta ads with stable CTR but flat conversions? The landing page is worth investigating before assuming ad fatigue.',
  url: 'https://nebulacomponents.com/learning-centre/meta-ads-high-frequency-not-converting',
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
            Meta Ads Leaks · High Frequency, No Conversions
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Fix Landing Page Fatigue to Scale High-Frequency Meta Ads
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            When ad frequency climbs, most advertisers assume the audience is exhausted. But if clicks are still coming and conversions have stalled, the leak isn&apos;t the ad - it&apos;s the landing page failing to close.
          </p>
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/audit?utm_source=learning-centre-meta-ads-high-frequency-not-converting&utm_medium=hero-cta"
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
          <h2 className="mb-4 text-2xl font-bold text-fg">When frequency matters</h2>
          <p className="leading-relaxed text-fg-muted">
            Frequency indicates how many times the average person has seen your ad. A frequency above 5 with CTR dropping signals genuine audience fatigue - the creative has worn out its welcome.
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

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Why placement changes the threshold</h2>
          <p className="leading-relaxed text-fg-muted">
            &quot;Frequency above 5&quot; is not a single universal ceiling - it moves with where the
            ad shows up. Feed placements accumulate frequency slowly, since each impression
            competes with organic content for attention, so fatigue tends to show later. Stories
            and Reels placements are consumed faster and repeat sooner in a single session, so the
            same numeric frequency represents more real exposure to the same eyes.
          </p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Feed:</strong> CTR erosion usually starts to show past a frequency of 6-7.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Stories/Reels:</strong> The same erosion often shows up by a frequency of 3-4, because the format is skippable in under a second.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Retargeting audiences:</strong> Frequency climbs fastest here because the pool is small - check this segment separately from cold prospecting.</span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Break your frequency report out by placement before deciding the ad is fatigued. A
            blended frequency of 4 can hide a Stories segment already past its real ceiling.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">When the page is the problem</h2>
          <p className="leading-relaxed text-fg-muted">
            But here&apos;s the pattern most miss: frequency high, clicks still strong, but conversions flat or falling. People are clicking - the page is where to investigate next.
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
            This pattern suggests the page - not the ad - is worth investigating as the friction point.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Why the page fails first at high frequency</h2>
          <p className="leading-relaxed text-fg-muted">
            A visitor who has seen the same ad four or five times has already formed an
            expectation before they click. Two page-side failures show up specifically at high
            frequency, even when they were invisible at low frequency:
          </p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Static page, rotating creative.</strong> If you refresh ad hooks to fight fatigue but the landing page headline never changes, repeat viewers land on a page that no longer matches the specific angle that got them to click this time.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">No new information on repeat visits.</strong> A visitor on their fourth impression has already read the page once. If nothing on it answers a harder, more skeptical question than the first visit did, there is no reason for this exposure to convert where the last three didn&apos;t.</span>
            </li>
          </ul>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
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
            If the new page converts at a higher rate while frequency remains stable, you&apos;ve found the leak. The audience was never tired - the page just wasn&apos;t closing.
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

        <ArticleFaq
          faqItems={[
            {
              question: 'How do I know if the ad or the page is the problem?',
              answer:
                'Look at the relationship between frequency, CTR, and conversions. If frequency is high but CTR is stable and clicks are still coming while conversions stall, the page is worth investigating. If CTR is dropping, the ad itself is likely fatigued.',
            },
            {
              question: 'Does frequency above 5 always mean ad fatigue?',
              answer:
                'No. The threshold moves with placement. Feed placements tend to erode past a frequency of 6 to 7, while Stories and Reels often erode by 3 to 4 because they are skippable in under a second. Break your frequency report out by placement before deciding.',
            },
            {
              question: 'Why does the page fail first at high frequency?',
              answer:
                'Repeat viewers have already formed an expectation from seeing the ad several times. A static page that never changes its headline stops matching the specific angle that got them to click, and a page with no new information gives a repeat visitor no reason to convert where earlier visits did not.',
            },
            {
              question: 'What test should I run before pausing the ad?',
              answer:
                'Keep the ad running if CTR is above benchmark, build a landing page variant that matches the ad hook precisely, and send a portion of traffic to it. Measure conversions, not just clicks. If the new page converts at a higher rate while frequency stays stable, the page was the leak.',
            },
          ]}
        />

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/facebook-ads-no-leads" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Facebook Ads Getting Clicks But No Leads
            </Link>
            <Link href="/learning-centre/retargeting-ads-not-converting" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Retargeting Ads Not Converting? The First Page Failed Them
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
