import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Landing Page Conversion Rate Benchmark: What the Numbers Mean | Nebula Components',
  description:
    'What is a good landing page conversion rate? The benchmarks vary by traffic source, offer type, and vertical. Here is how to read them without drawing wrong conclusions.',
  alternates: {
    canonical:
      'https://nebulacomponents.shop/learning-centre/landing-page-conversion-rate-benchmark',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Landing Page Conversion Rate Benchmark: What the Numbers Actually Mean',
  description:
    'What is a good landing page conversion rate? The benchmarks vary by traffic source, offer type, and vertical. Here is how to read them without drawing wrong conclusions.',
  url: 'https://nebulacomponents.shop/learning-centre/landing-page-conversion-rate-benchmark',
  publishedDate: '2026-07-21',
  modifiedDate: '2026-07-21',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a good landing page conversion rate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "It depends on traffic source, offer type, and vertical. For paid search (Google Ads), WordStream's 2026 benchmarks across 13,000+ campaigns found an all-industries average of 8.18%. For Business Services — the most relevant vertical for B2B lead gen — the average is 4.85%. A rate below your vertical's average with meaningful traffic (500+ sessions) is a diagnostic signal, not a verdict. The right question is not 'is my rate good' but 'which of the 7 conversion signals is pulling it down.'",
      },
    },
    {
      '@type': 'Question',
      name: 'Are conversion rate benchmarks comparable across industries?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "No, and comparing across verticals is one of the most common benchmarking mistakes. WordStream's 2026 Google Ads data shows conversion rates ranging from 2.64% in Finance and Insurance to 16.22% in Animals and Pets — a 6x gap. A 3% conversion rate is below average for an Automotive Repair shop but above average for a Finance lead generation page. Always compare against your own vertical's benchmark, not an all-industries figure.",
      },
    },
    {
      '@type': 'Question',
      name: 'Does traffic source affect conversion rate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes, significantly. Paid search traffic (Google Ads) arrives with higher intent than paid social traffic (Meta, TikTok) — the visitor was actively searching for a solution, not interrupted while scrolling. Email list traffic is warmer than either. This means the same page can show 1% from cold paid social, 5% from paid search, and 12% from a warm email list. Benchmarking your page's overall rate against paid-search averages when your traffic mix is primarily cold social will make your page look worse than it is.",
      },
    },
    {
      '@type': 'Question',
      name: 'What conversion rate should I aim for on a landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Aim to be in the top quartile for your vertical and traffic source — not just at the average. For paid search, the top-performing pages in most verticals convert at 2–3x the average rate. The gap between average and top-quartile performance is almost never about the ad — it is about which of the 7 conversion signals is broken on the page. Fixing the right signal is more reliable than optimising toward a number.",
      },
    },
    {
      '@type': 'Question',
      name: 'How many sessions do I need before my conversion rate is meaningful?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'At least 500 paid traffic sessions to a single landing page before drawing diagnostic conclusions. Below that, variance is too high — a single week with unusual traffic composition can shift a 3% rate to 8% and back without the page changing at all. If you are below 500 sessions, focus on ensuring the 7 signals are in place structurally rather than optimising toward a number.',
      },
    },
  ],
}

export default function LandingPageConversionRateBenchmark() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <Link
            href="/learning-centre"
            className="text-sm font-semibold text-accent hover:text-accent-light transition-colors"
          >
            Back to Learning Centre
          </Link>

          {/* Hero */}
          <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Landing Page Leaks · Conversion Rate Benchmarks
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Landing Page Conversion Rate Benchmark: What the Numbers Actually
              Mean
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              Conversion rate benchmarks are frequently cited and frequently
              misread. The right benchmark depends on traffic source, offer
              type, and vertical. Using the wrong one makes a good page look
              broken, and a broken page look fine.
            </p>
          </div>

          {/* The benchmark that matters */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              The most current paid search benchmark
            </h2>
            <p className="leading-relaxed text-fg-muted">
              The most current and methodologically documented benchmark for
              paid search conversion rates is{' '}
              <a
                href="https://www.wordstream.com/blog/2026-google-ads-benchmarks"
                className="text-accent hover:text-accent-light underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                WordStream&apos;s 2026 Google Ads Benchmarks report
              </a>
              , analysing over 13,000 search advertising campaigns from April
              2025 to March 2026. These are search-campaign averages — not
              single-page rates, not account-level figures.
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm text-fg-muted">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-semibold text-fg">Vertical</th>
                    <th className="pb-3 font-semibold text-fg text-right">Avg CVR (2026)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { vertical: 'Animals & Pets', cvr: '16.22%' },
                    { vertical: 'Automotive — Repair', cvr: '15.51%' },
                    { vertical: 'Education & Instruction', cvr: '13.14%' },
                    { vertical: 'Personal Services', cvr: '12.34%' },
                    { vertical: 'Physicians & Surgeons', cvr: '12.43%' },
                    { vertical: 'Health & Fitness', cvr: '6.94%' },
                    { vertical: 'Business Services', cvr: '4.85%' },
                    { vertical: 'Attorneys & Legal Services', cvr: '5.55%' },
                    { vertical: 'Real Estate', cvr: '3.70%' },
                    { vertical: 'Furniture', cvr: '2.99%' },
                    { vertical: 'Finance & Insurance', cvr: '2.64%' },
                    { vertical: 'All industries (avg)', cvr: '8.18%' },
                  ].map(({ vertical, cvr }) => (
                    <tr key={vertical}>
                      <td className="py-2.5">{vertical}</td>
                      <td className="py-2.5 text-right font-semibold text-fg">{cvr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-fg-muted">
              Source: WordStream 2026 Google Ads Benchmarks — 13,000+ search
              campaigns, April 2025 to March 2026. Unit: search-campaign
              conversion rate averages, not single-page rates.
            </p>
          </section>

          {/* Why the old 2.35% is wrong */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Why the widely-cited 2.35% figure is the wrong benchmark
            </h2>
            <p className="leading-relaxed text-fg-muted">
              The 2.35% figure circulates widely as &ldquo;the average landing
              page conversion rate.&rdquo; It originates from a 2012 Unbounce
              dataset reproduced in a 2014 blog post. Using a 12-year-old
              figure as a current benchmark for paid search performance is not
              informative — the traffic landscape, mobile adoption rates, and
              advertising platform sophistication have all changed substantially.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              More importantly, the 2.35% figure was an all-traffic median —
              mixing organic, direct, email, and paid together. Paid search
              conversion rates are structurally higher than that figure because
              paid search visitors arrive with explicit purchase intent. The
              correct comparison for a paid search landing page is the
              WordStream 2026 data above, not a 2012 all-traffic median.
            </p>
          </section>

          {/* Traffic source variable */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Traffic source is the largest variable
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Traffic source determines how warm and how intent-qualified the
              visitor is when they land. The same page with the same offer can
              show dramatically different rates by source.
            </p>
            <ul className="mt-5 space-y-4">
              {[
                {
                  source: 'Paid search (Google Ads)',
                  note: 'Highest intent of the paid channels. Visitor was actively searching for a solution. WordStream 2026 all-industries average: 8.18%. Use vertical-specific figures for comparison.',
                },
                {
                  source: 'Paid social (Meta, TikTok, LinkedIn)',
                  note: 'Interruption traffic — the visitor was not searching for your offer. Conversion rates are structurally lower. Comparing paid social rates against the WordStream paid search benchmark will always make your page look underperforming.',
                },
                {
                  source: 'Email (owned list)',
                  note: 'Warmest traffic type. Visitors already trust the sender. Email traffic to a landing page commonly converts at 2–5x the rate of cold paid traffic on the same page.',
                },
                {
                  source: 'Retargeting',
                  note: 'Visitor has already seen your brand or page. Higher conversion rate than cold traffic from the same channel by design — this is the expected retargeting premium, not a page quality signal.',
                },
              ].map(({ source, note }) => (
                <li
                  key={source}
                  className="border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <p className="font-semibold text-fg">{source}</p>
                  <p className="mt-1 leading-relaxed text-fg-muted">{note}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* How to use benchmarks diagnostically */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              How to use benchmarks as a diagnostic tool, not a verdict
            </h2>
            <p className="leading-relaxed text-fg-muted">
              A conversion rate below the vertical benchmark is a signal that
              something is broken — not a conclusion about which thing is broken
              or how bad it is. The right response to a low rate is to run a
              signal-level diagnosis:
            </p>
            <ol className="mt-5 space-y-3">
              {[
                'Segment by source and device — confirm the low rate is present on the channel you are optimising for, not an artefact of a high-bounce source dragging the overall number down.',
                'Check load time — if LCP is above 4 seconds on mobile, fix that before anything else. You cannot diagnose copy or layout problems if visitors are bouncing before the page renders.',
                'Run the 7-signal check — message-match, trust, mobile layout, load time, CTA clarity, form friction, proof. The first broken signal is the first fix. Earlier signals gate later ones.',
                'Compare against the right benchmark — your vertical, your traffic source, your offer type. A B2B SaaS lead-gen page at 4% compared against an e-commerce transaction benchmark is a category error.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-fg-muted">
                  <span className="shrink-0 font-bold text-accent">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-5 leading-relaxed text-fg-muted">
              You need at least 500 paid traffic sessions to a single page
              before your conversion rate is statistically meaningful. Below
              that, a single unusual week can shift a 3% rate to 8% and back
              without the page changing. Focus on structural signal checks
              before optimising toward a number.
            </p>
          </section>

          {/* FAQ */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-6 text-2xl font-bold text-fg">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {faqSchema.mainEntity.map((item, i) => (
                <div
                  key={i}
                  className="border-b border-border pb-6 last:border-0 last:pb-0"
                >
                  <h3 className="mb-2 font-semibold text-fg">{item.name}</h3>
                  <p className="leading-relaxed text-fg-muted">
                    {item.acceptedAnswer.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Find what is pulling your rate down
            </h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              The free Nebula audit checks all 7 signals and identifies which
              one is below the threshold for your offer type. The $97 Fix Pack
              implements the fix within 48 hours.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/audit"
                className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors"
              >
                Run the free audit
              </Link>
              <Link
                href="/pricing"
                className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors"
              >
                See the Fix Pack
              </Link>
            </div>
          </section>

          {/* Related */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Related leak checks
            </h2>
            <div className="space-y-1">
              {[
                { href: '/learning-centre/landing-page-not-converting', label: 'Landing Page Not Converting? Diagnose These 5 Leaks First' },
                { href: '/learning-centre/google-ads-clicks-no-sales', label: 'Google Ads Clicks But No Sales: Check The Page' },
                { href: '/learning-centre/high-cpc-low-conversion', label: 'High CPC, Low Conversion: Which Layer Is Broken' },
                { href: '/learning-centre/landing-page-bounce-rate-high', label: 'Landing Page Bounce Rate High: 3 Diagnosable Causes' },
                { href: '/learning-centre/before-you-raise-ad-budget', label: 'Before You Raise Ad Budget: Check These Landing Page Leaks' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
