import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Google Ads Quality Score Low: Fix The Landing Page, Not The Ad | Nebula Components',
  description: 'Low Quality Score is a landing page problem, not an ad problem. Learn what Google is measuring and how to fix it.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/google-ads-quality-score-low' },
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
            Google Ads Leaks · google ads quality score low
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Google Ads Quality Score Low? Fix The Page Before The Account
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            Quality Score is not a medal. It is a diagnostic: Google telling you the landing page does not match what the searcher expected. Most accounts try to fix the ad. The real leak is almost always on the page.
          </p>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">What Quality Score actually measures</h2>
          <p className="leading-relaxed text-fg-muted">
            Quality Score is Google&apos;s prediction of how relevant your ad and landing page are to the person searching. It is not a judgment of your business—it is a signal about match quality between search intent and arrival experience.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">The score is calculated from three components:</p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Ad relevance:</strong> Does your ad copy match the keyword?</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Expected click-through rate:</strong> Do people click when they see your ad?</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Landing page experience:</strong> Does the page deliver on the ad&apos;s promise?</span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Most advertisers obsess over the first two. But the third—the landing page—is where the real leverage lives. If the page breaks the chain, relevance and CTR will also suffer over time.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The page factors that tank Quality Score</h2>
          <p className="leading-relaxed text-fg-muted">Google evaluates your landing page on factors you can actually control:</p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Load speed:</strong> If the page takes more than 3 seconds, mobile searchers bounce before it renders. Speed is not just UX—it is eligibility.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Content match:</strong> Does the first screen repeat the promise from the ad? If someone searches &quot;emergency plumber same day&quot; and lands on a generic &quot;About Us&quot; page, the match is broken.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Click-through behavior:</strong> Do people who land stay long enough to take action? If they bounce in under 5 seconds, Google lowers the score for that keyword-page pair.</span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The pattern: searcher picks an ad based on a promise, arrives, does not see that promise reflected immediately, and leaves. The page leaked the click.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Quick wins: match the headline to the keyword</h2>
          <p className="leading-relaxed text-fg-muted">
            A consistent Quality Score improvement is also the simplest: make the hero headline repeat the exact keyword phrase the searcher used.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">Example:</p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Search:</strong> &quot;google ads quality score low&quot;</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Ad promise:</strong> &quot;Quality Score tanking? Fix the page, not the account&quot;</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Landing page headline:</strong> &quot;Google Ads Quality Score Low? Fix The Page Before The Account&quot;</span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            This is not clever copywriting. It is mechanical match reinforcement. When the searcher sees their exact intent reflected back, they stay. When they stay, Google raises the Quality Score.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">Other quick wins:</p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Put the main benefit in the first 100 visible pixels
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Remove any auto-play video or aggressive popups that delay reading
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Make the primary CTA visible without scrolling on mobile
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Match the ad&apos;s specific offer to the page&apos;s specific page—not a generic homepage
            </li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">When to give up on the keyword</h2>
          <p className="leading-relaxed text-fg-muted">
            Not every keyword deserves to be saved. Some Quality Score problems are symptoms of a deeper mismatch: the keyword does not align with what you actually offer.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">Signs it is time to pause or negative-match the keyword:</p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Quality Score below 3 for 30+ days</strong> despite headline and content fixes</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Consistently high bounce rate</strong> (over 70%) from that keyword&apos;s traffic</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Sales or leads do not match search intent</strong>—e.g., searchers want information, you offer a service</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">The page converts for other keywords</strong> but not this one</span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            In these cases, the leak is not on the page. The leak is targeting the wrong intent. Better to cut the keyword and reallocate budget to terms that match what searchers actually want.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Find the page leak first</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            Before you rewrite ads or restructure campaigns, run the free Nebula audit. It will show you exactly where the landing page breaks the chain from click to conversion.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit" className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors">
              Run the free audit
            </Link>
            <Link href="/learning-centre/message-match-checklist" className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors">
              Open message match checklist
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/google-ads-clicks-no-sales" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Google Ads Clicks But No Sales: Check The Page Before Budget
            </Link>
            <Link href="/learning-centre/message-match-checklist" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Message Match Checklist: Align Ad, Page, and Intent
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
