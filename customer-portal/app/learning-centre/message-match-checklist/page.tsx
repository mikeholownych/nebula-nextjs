import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Message Match Checklist: Align Your Ad to Your Landing Page | Nebula',
  description:
    'Message match is the degree to which your landing page fulfills the exact promise your ad made. Use this 60-second audit checklist before your next paid traffic campaign.',
  alternates: {
    canonical:
      'https://nebulacomponents.shop/learning-centre/message-match-checklist',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Message Match Checklist for Paid Traffic Landing Pages',
  description:
    'Message match is the degree to which your landing page fulfills the exact promise your ad made. Use this 60-second audit checklist before your next paid traffic campaign.',
  url: 'https://nebulacomponents.shop/learning-centre/message-match-checklist',
  publishedDate: '2025-07-15',
  modifiedDate: '2026-07-21',
})

export default function MessageMatchChecklistPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-6 py-14">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-fg-muted">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <span>/</span>
          <Link href="/learning-centre" className="hover:text-accent transition-colors">Learning Centre</Link>
          <span>/</span>
          <span className="text-fg">Message Match Checklist</span>
        </nav>

        {/* Article header */}
        <article>
          <div className="rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Conversion Diagnostics · Message Match
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Message Match Checklist for Paid Traffic Landing Pages
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              Every paid click carries a contract: the ad made a promise, and the landing page must honour it
              word-for-word, offer-for-offer, tone-for-tone. When that chain breaks, bounce rates spike
              and conversion data becomes meaningless noise. This checklist lets you audit the chain in
              under 60 seconds.
            </p>
          </div>

          {/* Section 1: What message match is */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">What Message Match Actually Means</h2>
            <p className="leading-relaxed text-fg-muted">
              Message match is the measurable degree of continuity between the specific words and offer in
              your ad and the specific words and offer on the page that ad points to. It is not a vague
              concept about "alignment" — it is a direct comparison of two pieces of copy.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              A visitor who clicked your Google Search ad for{' '}
              <span className="font-medium text-fg">"free website audit for ecommerce"</span> arrives with
              one expectation locked in. If your hero headline reads{' '}
              <span className="font-medium text-fg">"Grow Your Business Online"</span>, that expectation is
              unmet inside the first 200 milliseconds. The visitor's brain registers the mismatch before
              they consciously process any other element on the page. They leave.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              Google's Quality Score algorithm uses message match as a direct signal. Poor match raises your
              effective CPC. Strong match lowers it. Message match is simultaneously a conversion problem
              and a cost problem — which makes it the highest-leverage fix available on most paid accounts.
            </p>
          </section>

          {/* Section 2: Why it breaks */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">Why It Breaks: The 3 Most Common Failures</h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              Message match breaks in three distinct ways. Each has a different root cause and a different fix.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-fg">
                  1. Keyword Mismatch
                </h3>
                <p className="leading-relaxed text-fg-muted">
                  The ad targets a specific keyword — <em>"landing page audit"</em> — but the page headline
                  uses a category term like <em>"conversion optimisation services."</em> The visitor searched
                  for a precise thing. The page offers a broad category. Scent is broken. This is the most
                  common failure on accounts running broad-match or phrase-match keywords that point to a
                  single generic page.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold text-fg">
                  2. Offer Mismatch
                </h3>
                <p className="leading-relaxed text-fg-muted">
                  The ad promotes a specific, bounded offer — <em>"Free 10-point landing page audit"</em> —
                  but the page leads with a monthly retainer or a vague "get in touch" CTA. The visitor
                  expected a free, low-commitment entry point. Instead they face a high-commitment ask.
                  Cognitive friction spikes. This failure is endemic in agencies that run lead-gen ads but
                  point all traffic to a generic services page.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold text-fg">
                  3. Tone Mismatch
                </h3>
                <p className="leading-relaxed text-fg-muted">
                  The ad copy is direct and problem-aware — <em>"Still losing money on Google Ads?"</em> —
                  but the landing page opens with brand-forward, aspirational copy:{' '}
                  <em>"We help ambitious brands unlock their digital potential."</em> The emotional register
                  is incompatible. The ad spoke to pain; the page speaks to aspiration. These are different
                  stages of buyer awareness, and you cannot serve both with one hero.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: 60-second audit */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">The 60-Second Audit Method</h2>
            <p className="mb-4 leading-relaxed text-fg-muted">
              Open your top-spending ad in one tab. Open the destination URL in another. Now do three
              comparisons:
            </p>
            <ol className="space-y-4 text-fg-muted">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/5 text-xs font-bold text-accent">1</span>
                <div>
                  <span className="font-semibold text-fg">Headline vs H1.</span>{' '}
                  Copy the ad headline. Paste it next to the page H1. The core noun phrase — the thing
                  you are offering — must appear in both. Exact match is ideal. Semantic match is
                  acceptable. Generic category language is a failure.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/5 text-xs font-bold text-accent">2</span>
                <div>
                  <span className="font-semibold text-fg">CTA vs Primary CTA.</span>{' '}
                  What action did the ad imply? ("Get your free audit," "See pricing," "Book a demo.")
                  Does the first above-fold CTA on the page use the same verb and the same offer? If the
                  ad said "free" and the page CTA says "schedule a consultation," you have an offer
                  mismatch.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/5 text-xs font-bold text-accent">3</span>
                <div>
                  <span className="font-semibold text-fg">Emotional register.</span>{' '}
                  Read the first two lines of ad copy. Is the tone problem-aware, solution-aware, or
                  brand-aware? Read the hero paragraph of the page. Does it match? A problem-aware ad
                  requires a problem-aware hero — not a vision statement.
                </div>
              </li>
            </ol>
            <p className="mt-6 leading-relaxed text-fg-muted">
              Total time: under 60 seconds. If you fail any comparison, you have a confirmed message match
              break. Fix the page before spending another dollar on the ad.
            </p>
          </section>

          {/* Section 4: Checklist */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">Pre-Launch Checklist</h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              Run this before activating any paid campaign. Each item is a binary pass/fail.
            </p>
            <ul className="space-y-3 text-fg-muted">
              {[
                'Ad headline noun phrase appears verbatim or semantically in the page H1',
                'The offer in the ad (free audit, discount, demo) is the first offer on the page',
                'The CTA verb in the ad matches the primary CTA verb on the page',
                'The audience segment named or implied in the ad is named on the page above the fold',
                'The tone register (problem-aware / solution-aware / brand-aware) is consistent between ad and hero',
                'If the ad references a specific pain point, that pain point appears in the subheadline or first paragraph',
                'There is no contradictory offer on the same page (e.g., free trial CTA + book-a-call CTA in the hero)',
                'The page H1 would make sense to someone who clicked that specific ad — and only that ad',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 h-4 w-4 shrink-0 rounded border border-accent/40 bg-accent/5" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* CTA block */}
          <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-8">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Free Diagnostic
            </p>
            <h2 className="mb-3 text-2xl font-bold text-fg">
              Find the break on your page — free
            </h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              Run the Nebula audit to get a scored breakdown of your landing page&apos;s message match,
              offer clarity, and conversion structure. If the audit surfaces a confirmed break, the{' '}
              <span className="font-medium text-fg">$97 Fix Pack</span> delivers a rewritten hero and CTA
              within 48 hours — no retainer, no scope creep.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/audit"
                className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light"
              >
                Run the free audit
              </Link>
              <Link
                href="/learning-centre/paid-traffic-leak-map"
                className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent transition-colors hover:bg-accent/10"
              >
                See the leak map
              </Link>
            </div>
          </div>

          {/* Related articles */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-5 text-2xl font-bold text-fg">Related diagnostics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  href: '/learning-centre/google-ads-clicks-no-sales',
                  title: 'Google Ads Clicks But No Sales',
                  description: 'Check the page before the budget.',
                },
                {
                  href: '/learning-centre/facebook-ads-no-leads',
                  title: 'Facebook Ads Getting Clicks But No Leads',
                  description: 'Why clicks and conversions diverge.',
                },
                {
                  href: '/learning-centre/landing-page-not-converting',
                  title: 'Landing Page Not Converting?',
                  description: 'Diagnose these 5 structural leaks first.',
                },
                {
                  href: '/learning-centre/high-cpc-low-conversion',
                  title: 'High CPC, Low Conversion',
                  description: 'Stop optimising the wrong layer.',
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
        </article>

        {/* Back link */}
        <div className="mt-10">
          <Link
            href="/learning-centre"
            className="text-sm font-semibold text-accent transition-colors hover:text-accent-light"
          >
            ← Back to Learning Centre
          </Link>
        </div>

      </div>
    </main>
  )
}
