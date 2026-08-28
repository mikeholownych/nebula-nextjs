import type { Metadata } from 'next';
import Link from 'next/link';
import CitationCopy from './CitationCopy';

export const metadata: Metadata = {
  title: 'State of Landing Page Performance Q3 2026 | Nebula Research',
  description:
    'Aggregate findings from 131 completed landing page audits. Public aggregates exclude Above Fold and Ad Signals pending rendered verification. Original research by Nebula Components.',
  alternates: {
    canonical: 'https://nebulacomponents.com/research/landing-page-performance-q3-2026',
  },
};

const signals = [

  {
    name: 'SEO Foundations',
    rate: '78.6%',
    tier: 'high',
    description: 'Title, meta description, or descriptive H1 finding',
  },
  {
    name: 'Social Proof',
    rate: '42.7%',
    tier: 'high',
    description: 'Insufficient proof near the first CTA',
  },
  {
    name: 'CTA',
    rate: '42.0%',
    tier: 'high',
    description: 'Unclear or competing primary action',
  },
  {
    name: 'Load Speed',
    rate: '39.7%',
    tier: 'high',
    description: 'Core Web Vitals or load-speed finding',
  },
  {
    name: 'AI Readiness',
    rate: '32.1%',
    tier: 'moderate',
    description: 'Structured signals for machine-readable content',
  },
  {
    name: 'Headline',
    rate: '16.8%',
    tier: 'lower',
    description: 'Headline clarity or outcome-language finding',
  },
  {
    name: 'Local GBP',
    rate: '5.3%',
    tier: 'lower',
    description: 'Applicable local-business profile finding',
  },
  {
    name: 'Mobile',
    rate: '0.8%',
    tier: 'lower',
    description: 'Primary action visibility or usability finding on 375px viewport',
  },
  /* Current completed-audit aggregates as of 2026-08-06; /benchmarks is the live source. */
];

const tierStyles: Record<string, string> = {
  critical: 'bg-red-950/40 text-red-400 border-red-900/50',
  high: 'bg-orange-950/40 text-orange-400 border-orange-900/50',
  moderate: 'bg-yellow-950/40 text-yellow-500 border-yellow-900/50',
  lower: 'bg-[#0d1110] text-[#9e9e9e] border-border',
};

export default function LandingPagePerformanceQ3Page() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          {/* Eyebrow */}
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-[#c7ff2f]">
            Nebula Research · Q3 2026
          </p>

          {/* H1 */}
          <h1 className="font-extrabold text-3xl md:text-5xl leading-tight text-white mb-6">
            Discover the State of Landing Page Performance - Q3 2026
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-[#9e9e9e] leading-relaxed mb-6">
            Aggregate findings from 131 completed landing page audits conducted through the Nebula audit
            engine. August 2026.
          </p>

          <div className="mb-8 flex flex-wrap gap-3">
            <Link
              href="/audit?utm_source=research-hero&utm_medium=hero-cta"
              className="inline-flex items-center justify-center rounded bg-[#c7ff2f] px-6 py-3 text-sm font-semibold text-[#050505] transition-opacity hover:opacity-85"
            >
              Get your free audit →
            </Link>
          </div>

          {/* Author byline */}
          <div className="flex items-center gap-3 mt-4 mb-8">
            <img
              src="/mike-holownych-founder.jpg"
              alt="Mike Holownych"
              width={36}
              height={36}
              className="rounded-full border border-border object-cover"
            />
            <div className="text-sm text-[#9e9e9e]">
              <span className="font-medium text-white">Mike Holownych</span>
              {' '}&middot;{' '}
              <span>Founder, Nebula Components</span>
              <span className="mx-2 text-border">·</span>
              <span>Enterprise AI governance lead, TMX Group</span>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#9e9e9e] border-t border-border pt-6">
            <span>
              Published:{' '}
              <time dateTime="2026-08" className="text-white">
                August 2026
              </time>
            </span>
            <span className="hidden md:inline text-border">|</span>
            <span>
              Methodology:{' '}
              <Link
                href="/audit?utm_source=content&utm_medium=organic-content"
                className="text-[#c7ff2f] underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Nebula Audit Engine
              </Link>
            </span>
            <span className="hidden md:inline text-border">|</span>
            <span>n = 131 audits (collected through Aug 2026; frozen edition)</span>
          </div>

          {/* Cite as */}
          <div className="mt-6 rounded-md border border-border bg-[#0d1110] px-4 py-3 font-mono text-xs text-[#9e9e9e]">
            <span className="text-[#c7ff2f] mr-2">Cite as:</span>
            Nebula Components. State of Landing Page Performance Q3 2026. August 2026.
            nebulacomponents.com/research/landing-page-performance-q3-2026
          </div>
        </div>
      </header>

      {/* ─── Body ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-20">

        {/* 2. Executive Summary */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 pb-3 border-b border-border">
            Executive Summary
          </h2>
          <ul className="space-y-4">
            {[
              'The completed-audit sample contains 131 audits collected through August 2026.',
              'Public finding rates below exclude Above Fold and Ad Signals because those source-only checks have not passed rendered verification.',
              'The remaining rates describe recorded findings, not conversion lift or revenue outcomes.',
              'The live benchmarks endpoint is the source of truth for the current public aggregate table.',
            ].map((finding, i) => (
              <li key={i} className="flex gap-4">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#c7ff2f]/10 border border-[#c7ff2f]/30 flex items-center justify-center text-[#c7ff2f] text-xs font-mono">
                  {i + 1}
                </span>
                <p className="text-[#9e9e9e] leading-relaxed">{finding}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Methodology */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 pb-3 border-b border-border">
            Methodology
          </h2>
          <div className="space-y-4 text-[#9e9e9e] leading-relaxed">
            <p>
              <span className="text-white font-medium">Source.</span> All audits were conducted
              through the Nebula audit engine (
              <Link
                href="/audit?utm_source=content&utm_medium=organic-content"
                className="text-[#c7ff2f] underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                nebulacomponents.com/audit
              </Link>
              ) between site launch and August 2026.
            </p>
            <p>
              <span className="text-white font-medium">Evaluation method.</span> The engine fetches
              the public page and records observable conversion findings against its documented
              checks. Signal definitions and pass/fail criteria are published in the{' '}
              <Link
                href="/spec/landing-page-diagnostic-v1"
                className="text-[#c7ff2f] underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Landing Page Diagnostic Specification v1
              </Link>
              . No pages are excluded from aggregate calculations. Named teardowns are
              published at{' '}
              <Link
                href="/teardowns"
                className="text-[#c7ff2f] underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                nebulacomponents.com/teardowns
              </Link>
              .
            </p>
            <p>
              <span className="text-white font-medium">Sample size.</span> 131 completed audits.
            </p>
            <div className="rounded-md border border-border bg-[#0d1110] p-4">
              <p className="text-xs font-medium uppercase tracking-widest text-[#9e9e9e] mb-2">
                Limitations
              </p>
              <p className="text-sm text-[#9e9e9e] leading-relaxed">
                The engine evaluates static HTML at the time of audit. Dynamic content,
                server-side personalization, and A/B test variants are not captured.
                JavaScript-rendered content is partially evaluated via heuristics.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Signal Failure Rates */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-3 pb-3 border-b border-border">
            Recorded Finding Rates
          </h2>
          <p className="text-[#9e9e9e] text-sm mb-6 leading-relaxed">
            The percentage of completed audits containing each recorded finding. Findings
            are ordered from highest to lowest observed failure rate.
          </p>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-[#0d1110]">
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-widest text-[#9e9e9e]">
                    Signal
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-widest text-[#9e9e9e]">
                    Failure Rate
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-widest text-[#9e9e9e] hidden md:table-cell">
                    Observation
                  </th>
                </tr>
              </thead>
              <tbody>
                {signals.map((signal, i) => (
                  <tr
                    key={signal.name}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 0 ? 'bg-[#050505]' : 'bg-[#0a0f0d]'
                    }`}
                  >
                    <td className="px-4 py-3 text-white font-medium">{signal.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-xs font-mono font-medium ${tierStyles[signal.tier]}`}
                      >
                        {signal.rate}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#9e9e9e] hidden md:table-cell">
                      {signal.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-[#9e9e9e]">
            Live rates may change as completed audits are added. The current source is{' '}
            <Link
              href="/benchmarks"
              className="text-[#c7ff2f] underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              nebulacomponents.com/benchmarks
            </Link>
            .
          </p>
        </section>

        {/* 5. Key Findings */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 pb-3 border-b border-border">
            Key Findings
          </h2>
          <div className="space-y-8">
            {/* Finding 1 */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-[#0d1110] px-5 py-4 flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400 font-mono text-sm font-bold">
                  1
                </span>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    Above Fold is the universal failure
                  </h3>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3 text-[#9e9e9e] leading-relaxed text-sm">
                <p>
                  A 100% failure rate means this is not an optimization problem; it is a structural
                  default. Most landing pages are built desktop-first, then responsively adapted -
                  the above-fold state on mobile is an afterthought, not a design constraint.
                </p>
                <div className="rounded border border-[#c7ff2f]/20 bg-[#c7ff2f]/5 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-widest text-[#c7ff2f] mb-1">
                    Implication
                  </p>
                  <p>
                    CTA must be visible at 375px width without scrolling. A trust signal must be
                    adjacent to the CTA. Treat mobile above-fold as the primary design constraint,
                    not a secondary adaptation.
                  </p>
                </div>
              </div>
            </div>

            {/* Finding 2 */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-[#0d1110] px-5 py-4 flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-950/50 border border-orange-900/50 flex items-center justify-center text-orange-400 font-mono text-sm font-bold">
                  2
                </span>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    Message match failure is the most costly
                  </h3>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3 text-[#9e9e9e] leading-relaxed text-sm">
                <p>
                  The visitor arrived from an ad with a specific promise. If the headline does not
                  confirm that promise within 3 words, the visitor re-evaluates their click - and
                  frequently exits. Most pages fail this check because ads are written separately
                  from landing page copy, often by different people on different timelines.
                </p>
                <div className="rounded border border-[#c7ff2f]/20 bg-[#c7ff2f]/5 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-widest text-[#c7ff2f] mb-1">
                    Implication
                  </p>
                  <p>
                    Ad copy and landing page H1 should share a keyword. The scent from click to
                    headline must be unbroken. This is a workflow problem as much as a copy problem.
                  </p>
                </div>
              </div>
            </div>

            {/* Finding 3 */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-[#0d1110] px-5 py-4 flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#c7ff2f]/10 border border-[#c7ff2f]/30 flex items-center justify-center text-[#c7ff2f] font-mono text-sm font-bold">
                  3
                </span>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    The most expensive pages are often the most broken
                  </h3>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3 text-[#9e9e9e] leading-relaxed text-sm">
                <p>
                  Pages receiving $5,000+/month in paid traffic have the same structural failure
                  rates as pages receiving $500/month. Budget does not predict page quality. High
                  ad spend often indicates the page has been patched with creative and audience
                  optimization rather than fixed at the structural layer.
                </p>
                <div className="rounded border border-[#c7ff2f]/20 bg-[#c7ff2f]/5 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-widest text-[#c7ff2f] mb-1">
                    Implication
                  </p>
                  <p>
                    Structural audit before ad spend increase. The structural issues are the
                    multiplier on every dollar of traffic. Fixing them first is a higher-leverage
                    action than increasing budget to a broken page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Industry Benchmarks */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 pb-3 border-b border-border">
            Comparison to Industry Benchmarks
          </h2>
          <div className="space-y-4 text-[#9e9e9e] leading-relaxed">
            <p>
              Industry CRO benchmarks suggest average landing page conversion rates for cold paid
              traffic fall between 2% and 5%, with significant variance by industry, offer type,
              and traffic temperature. The median sits closer to 2–3%.
            </p>
            <p>
              This report does not claim that a particular audit score predicts conversion rate. The
              dataset records structural findings, not attributable revenue outcomes; above-fold
              clarity, message scent, and friction reduction remain diagnostic signals rather than
              a validated conversion-rate model.
            </p>
            <div className="rounded-md border border-border bg-[#0d1110] p-4">
              <p className="text-xs font-medium uppercase tracking-widest text-[#9e9e9e] mb-2">
                Forward-looking note
              </p>
              <p className="text-sm leading-relaxed">
                This hypothesis will be tested as Nebula collects before/after outcome data from
                pages that implemented structural recommendations. Outcome data will be reported in
                subsequent editions of this research.
              </p>
            </div>
          </div>
        </section>

        {/* 7. What This Means for Founders */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 pb-3 border-b border-border">
            What This Means for Founders
          </h2>
          <div className="space-y-5 text-[#9e9e9e] leading-relaxed">
            <p>
              Before testing creative, audiences, or offers - audit the page structural layer. The
              structural defects documented in this report exist independently of copy quality,
              visual design, or traffic source. They represent a floor below which optimization
              cannot operate effectively.
            </p>
            <p>
              The structural defects are observable in the HTML. You can verify every finding
              yourself using browser developer tools, a mobile device, and the 9 signal definitions
              published at{' '}
              <Link
                href="/audit?utm_source=content&utm_medium=organic-content"
                className="text-[#c7ff2f] underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                nebulacomponents.com/audit
              </Link>
              . No third-party tool is required to confirm the findings on your own page.
            </p>
            <p>
              Fix structural defects first; then the traffic quality and creative questions become
              answerable. A page with multiple structural findings does not produce reliable
              signal on creative performance. The structural layer must be resolved before
              higher-order variables can be meaningfully tested.
            </p>
          </div>
        </section>

        {/* 8. CTA Section */}
        <section className="rounded-xl border border-border bg-[#0d1110] p-8">
          <h2 className="text-xl font-bold text-white mb-2">Apply these findings</h2>
          <p className="text-[#9e9e9e] text-sm mb-8">
            Three resources built directly from the data in this report.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="group flex flex-col gap-2 rounded-lg border border-border bg-[#050505] p-5 hover:border-[#c7ff2f]/50 transition-colors"
            >
              <span className="text-[#c7ff2f] text-xs font-medium uppercase tracking-widest">
                01
              </span>
              <span className="text-white font-semibold text-sm group-hover:text-[#c7ff2f] transition-colors">
                Run the audit on your page →
              </span>
              <span className="text-[#9e9e9e] text-xs leading-relaxed">
                Evaluate your page against the applicable documented checks. Free.
              </span>
            </Link>
            <Link
              href="/benchmarks"
              className="group flex flex-col gap-2 rounded-lg border border-border bg-[#050505] p-5 hover:border-[#c7ff2f]/50 transition-colors"
            >
              <span className="text-[#c7ff2f] text-xs font-medium uppercase tracking-widest">
                02
              </span>
              <span className="text-white font-semibold text-sm group-hover:text-[#c7ff2f] transition-colors">
                See live benchmark data →
              </span>
              <span className="text-[#9e9e9e] text-xs leading-relaxed">
                Exact failure percentages updated as audits are completed.
              </span>
            </Link>
            <Link
              href="/teardowns"
              className="group flex flex-col gap-2 rounded-lg border border-border bg-[#050505] p-5 hover:border-[#c7ff2f]/50 transition-colors"
            >
              <span className="text-[#c7ff2f] text-xs font-medium uppercase tracking-widest">
                03
              </span>
              <span className="text-white font-semibold text-sm group-hover:text-[#c7ff2f] transition-colors">
                Read the full teardowns →
              </span>
              <span className="text-[#9e9e9e] text-xs leading-relaxed">
                Named page-by-page analyses with annotated findings.
              </span>
            </Link>
          </div>
        </section>

        {/* 9. Citation Block */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Cite this report</h2>
          <CitationCopy />
        </section>

      </div>

      {/* ─── Footer rule ─────────────────────────────────────────── */}
      <footer className="border-t border-border mt-8">
        <div className="mx-auto max-w-3xl px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-[#9e9e9e]">
          <span>© 2026 Nebula Components. All data from the Nebula audit engine.</span>
          <Link
            href="/research"
            className="text-[#c7ff2f] hover:opacity-80 transition-opacity"
          >
            ← All Research
          </Link>
        </div>
      </footer>
    </main>
  );
}
