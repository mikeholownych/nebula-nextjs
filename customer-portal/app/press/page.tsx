'use client';

import { useState } from 'react';
import Link from 'next/link';

// Note: metadata must be exported from a server component.
// For client components, set metadata via generateMetadata or a parent layout.
// The canonical/title/description below are documented here for reference and
// should be wired into the nearest server layout if not already present.

// export const metadata: Metadata = {
//   title: 'Press Kit — Nebula Components',
//   description: 'Press kit for Nebula Components: product facts, founder bio, key statistics, and media assets.',
//   alternates: { canonical: 'https://nebulacomponents.com/press' },
// };

const BOILERPLATE = `Nebula Components is a free AI-powered landing page audit tool for founders running paid ads. The audit scores 9 conversion signals — message match, trust, mobile CTA, load speed, CTA clarity, above-fold content, ad signal continuity, SEO foundations, and AI readiness — in under 90 seconds, no account required. Across 86 pages audited, not one scored an A; the average score is 62.7/100. The $97 One-Leak Self-Implementation Kit delivers one tailored fix for one selected finding, implemented by the customer or their developer. nebulacomponents.com.`;

const STAT_CARDS = [
  { value: 'Free', label: 'Audit — score before email' },
  { value: '9', label: 'Signals checked per audit' },
  { value: '90s', label: 'To results' },
  { value: '0 / 86', label: 'Pages that scored an A (none)' },
  { value: '62.7', label: 'Average score out of 100 — Grade C' },
  { value: '100%', label: 'Of audited pages fail Above-Fold clarity' },
  { value: '99%', label: 'Fail Ad Signal Continuity' },
  { value: '29%', label: 'Fail Load Speed (the only thing free tools measure)' },
];

export default function PressPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(BOILERPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for environments without clipboard API
    }
  };

  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="max-w-3xl mx-auto px-6 py-20">

        {/* ── Header ── */}
        <header className="mb-16">
          <p className="font-mono text-sm text-accent uppercase tracking-widest mb-4">
            Press Kit
          </p>
          <h1 className="text-4xl font-extrabold text-fg leading-tight mb-6">
            Everything you need to write about Nebula.
          </h1>
          <p className="text-fg-muted text-lg leading-relaxed mb-4">
            For journalists, podcasters, and newsletter writers. All facts here are verifiable.
            Contact{' '}
            <a
              href="mailto:hello@nebulacomponents.com"
              className="text-accent underline underline-offset-2"
            >
              hello@nebulacomponents.com
            </a>{' '}
            for interviews or additional information.
          </p>
          <p className="font-mono text-xs text-fg-muted">Last updated: August 2026</p>
        </header>

        <hr className="border-bg-surface mb-16" />

        {/* ── What Nebula does ── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-fg mb-6">What Nebula does</h2>
          <div className="space-y-4 text-fg-muted leading-relaxed">
            <p>
              Nebula Components is a landing page audit tool for founders running paid traffic.
              The audit checks 9 conversion signals against the public HTML of any landing page
              URL — message match, trust signals, CTA visibility on mobile, load time, CTA
              clarity, above-fold state, ad-tracking artifacts, SEO foundations, and AI readiness.
            </p>
            <p>
              Every finding is traceable to a specific, observable condition in the page source.
              The audit returns a pass/fail score per signal, a composite grade (A–F), and a
              ranked fix list. The score and initial findings appear before email. No account required.
            </p>
            <p>
              The paid product is a $97 One-Leak Self-Implementation Kit: a tailored implementation kit written for
              the highest-confidence failing signal on the audited page.
            </p>
          </div>
        </section>

        <hr className="border-bg-surface mb-16" />

        {/* ── Research data ── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-fg mb-2">Research data</h2>
          <p className="text-fg-muted text-sm mb-8">
            Verified from 86 automated audits run through Nebula&apos;s engine, August 2026.
            All assets licensed for editorial use. Credit: Nebula Components.
          </p>

          {/* Grade distribution chart */}
          <div className="mb-8 bg-bg-surface border border-white/5 rounded-xl overflow-hidden">
            <img
              src="/press/grade-distribution.png"
              alt="Grade distribution chart: 86 landing pages audited — 0 scored A, 40 B, 43 C, 3 D. Not one page scored an A."
              className="w-full"
              width={1200}
              height={630}
            />
            <div className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="font-semibold text-fg text-sm mb-1">Grade distribution — 86 pages audited</p>
                <p className="text-xs text-fg-muted leading-5">
                  A=0 · B=40 · C=43 · D=3. Average: 62.7/100. Median: 61/100. Best page: 77/100. Worst: 40/100.
                  Selection bias acknowledged: founders who suspect a problem are more likely to run an audit.
                </p>
              </div>
              <a
                href="/press/grade-distribution.png"
                download="nebula-grade-distribution-2026.png"
                className="shrink-0 font-mono text-xs text-accent border border-accent/30 rounded px-3 py-1.5 hover:bg-accent/5 transition-colors"
              >
                Download →
              </a>
            </div>
          </div>

          {/* Scorecard example */}
          <div className="mb-8 bg-bg-surface border border-white/5 rounded-xl overflow-hidden">
            <img
              src="/press/scorecard-example.png"
              alt="Sample Nebula audit scorecard showing 9 conversion signals scored for example-saas.com: 58/100 Grade C, with Above-Fold Content flagged as the top leak at 2/10."
              className="w-full"
              width={1400}
              height={680}
            />
            <div className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="font-semibold text-fg text-sm mb-1">Sample 9-signal scorecard</p>
                <p className="text-xs text-fg-muted leading-5">
                  Illustrative audit of example-saas.com (anonymized). Shows all 9 signals with pass/fail/warn
                  status, evidence, and a ranked top-leak callout. Licensed for editorial use.
                </p>
              </div>
              <a
                href="/press/scorecard-example.png"
                download="nebula-scorecard-example-2026.png"
                className="shrink-0 font-mono text-xs text-accent border border-accent/30 rounded px-3 py-1.5 hover:bg-accent/5 transition-colors"
              >
                Download →
              </a>
            </div>
          </div>

          {/* Signal failure table */}
          <div className="bg-bg-surface border border-white/5 rounded-xl p-6">
            <p className="font-mono text-xs text-accent uppercase tracking-widest mb-4">Signal failure rates — 86 pages</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/5">
                  <th className="pb-2 font-medium text-fg-muted">Signal</th>
                  <th className="pb-2 font-medium text-fg-muted text-right">Pages flagged</th>
                  <th className="pb-2 font-medium text-fg-muted text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Above-fold content', 86, 100],
                  ['Ad signal continuity', 85, 99],
                  ['SEO foundations', 63, 73],
                  ['Social proof', 41, 48],
                  ['CTA clarity', 39, 45],
                  ['AI readiness', 27, 31],
                  ['Load speed', 25, 29],
                ].map(([signal, count, pct]) => (
                  <tr key={String(signal)}>
                    <td className="py-2 text-fg-muted">{signal}</td>
                    <td className="py-2 text-right font-mono text-fg-muted">{count}</td>
                    <td className="py-2 text-right font-mono text-accent">{pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-fg-muted/60">
              "Flagged" = signal produced at least one finding. Load speed — the primary output of
              PageSpeed Insights — is the least-common failure. Above-fold and ad signal continuity
              are present on virtually every audited page.
            </p>
          </div>
        </section>

        <hr className="border-bg-surface mb-16" />
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-fg mb-8">Key facts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STAT_CARDS.map(({ value, label }) => (
              <div
                key={label}
                className="bg-bg-surface border border-white/5 rounded-lg p-5"
              >
                <p className="font-mono text-2xl text-accent mb-1">{value}</p>
                <p className="text-sm text-fg-muted">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-bg-surface mb-16" />

        {/* ── The problem Nebula solves ── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-fg mb-6">The problem Nebula solves</h2>
          <p className="text-fg-muted leading-relaxed">
            Most founders spending on paid ads assume low conversion is an ad quality problem.
            The majority of landing pages we audit fail observable, fixable checks — headline
            doesn't match the ad, CTA is below the fold on mobile, no trust signals before
            the buy button. These are structural defects, not optimization opportunities.
            Nebula diagnoses them before ad spend continues.
          </p>
        </section>

        <hr className="border-bg-surface mb-16" />

        {/* ── Founder ── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-fg mb-6">Founder</h2>
          <div className="bg-bg-surface border border-white/5 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img
                src="/mike-holownych-founder.jpg"
                alt="Mike Holownych, Founder of Nebula Components"
                width={120}
                height={180}
                className="rounded-lg object-cover shrink-0"
              />
              <div>
                <p className="font-semibold text-fg text-lg mb-1">Mike Holownych</p>
            <p className="font-mono text-xs text-accent mb-5 uppercase tracking-wider">Founder</p>
            <p className="text-fg-muted leading-relaxed mb-6">
              Mike Holownych founded Nebula Components after observing the same conversion failure
              patterns recur across landing page after landing page while working with founders
              running paid traffic. The same structural defects appeared regardless of industry:
              wrong headline, buried CTA, no proof above the fold. The audit engine is the
              instrument he built to find them without a spreadsheet.
            </p>
            <ul className="space-y-2 font-mono text-sm text-fg-muted">
              <li>
                <span className="text-fg-muted/50 mr-2">LinkedIn</span>
                <a
                  href="https://linkedin.com/in/mikeholownych"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline underline-offset-2"
                >
                  linkedin.com/in/mikeholownych
                </a>
              </li>
              <li>
                <span className="text-fg-muted/50 mr-2">X</span>
                <a
                  href="https://x.com/mikeholownych"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline underline-offset-2"
                >
                  @mikeholownych
                </a>
              </li>
              <li>
                <span className="text-fg-muted/50 mr-2">Email</span>
                <a
                  href="mailto:hello@nebulacomponents.com"
                  className="text-accent underline underline-offset-2"
                >
                  hello@nebulacomponents.com
                </a>
              </li>
            </ul>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-bg-surface mb-16" />

        {/* ── Boilerplate ── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-fg mb-2">Boilerplate</h2>
          <p className="text-fg-muted text-sm mb-6">
            Copy-paste this paragraph into your article or show notes.
          </p>
          <div className="bg-bg-surface border border-white/5 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
              <span className="font-mono text-xs text-fg-muted">boilerplate.txt</span>
              <button
                onClick={handleCopy}
                className="font-mono text-xs text-accent hover:text-fg transition-colors px-2 py-1 rounded"
                aria-label="Copy boilerplate to clipboard"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="font-mono text-sm text-fg-muted leading-relaxed p-5 whitespace-pre-wrap">
              {BOILERPLATE}
            </p>
          </div>
        </section>

        <hr className="border-bg-surface mb-16" />

        {/* ── Brand assets ── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-fg mb-4">Brand assets</h2>
          <p className="text-fg-muted leading-relaxed mb-4">
            Logos, wordmarks, color values, and usage guidelines are available on the brand page.
            Please use the provided assets rather than screenshots.
          </p>
          <Link
            href="/brand"
            className="inline-flex items-center gap-2 font-mono text-sm text-accent border border-accent/30 rounded px-4 py-2 hover:bg-accent/5 transition-colors"
          >
            View brand assets →
          </Link>
        </section>

        <hr className="border-bg-surface mb-16" />

        {/* ── What makes this a story ── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-fg mb-2">What makes this a story</h2>
          <p className="text-fg-muted text-sm mb-6">
            Three angles, ready for an editor pitch.
          </p>
          <div className="space-y-4">
            {[
              {
                angle: '1',
                headline: 'We audited 86 landing pages. Not one scored an A.',
                body: 'Across 86 automated audits of pages running paid traffic, the average score is 62.7/100 — Grade C. Zero pages earned an A. The two most common failures: above-fold content (100% of pages) and ad signal continuity (99%). The full grade distribution and methodology are available at nebulacomponents.com/press.',
              },
              {
                angle: '2',
                headline: 'The default diagnostic for landing pages measures the wrong thing.',
                body: 'Load speed — the primary output of PageSpeed Insights and the industry\'s default check — was a problem on just 29% of audited pages. The two failures present on virtually every page (above-fold gaps and ad signal continuity) are invisible to speed tools. Founders are optimizing for the least common failure.',
              },
              {
                angle: '3',
                headline: 'The CRO agency model sells retainers before diagnosis.',
                body: 'Nebula argues the industry model is structurally broken — retainer before diagnosis, A/B tests on pages without enough traffic to reach significance, 90-day timelines for problems fixable in a week. The audit takes 90 seconds, costs nothing, and finds more actionable issues than most agency discovery audits. Full argument at nebulacomponents.com/why-cro-agencies-dont-work.',
              },
            ].map(({ angle, headline, body }) => (
              <div key={angle} className="bg-bg-surface border border-white/5 rounded-lg p-5">
                <p className="font-mono text-xs text-accent mb-2 uppercase tracking-wider">Angle {angle}</p>
                <p className="font-semibold text-fg mb-2">{headline}</p>
                <p className="text-sm text-fg-muted leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-bg-surface mb-16" />

        {/* ── Media assets ── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-fg mb-2">Media assets</h2>
          <p className="text-fg-muted text-sm mb-6">
            Licensed for editorial use. No modifications. Credit: Nebula Components.
          </p>
          <div className="space-y-3">
            <div className="bg-bg-surface border border-white/5 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-fg text-sm mb-1">Grade distribution chart (1200×630)</p>
                  <p className="text-xs text-fg-muted leading-5">
                    86 pages audited · 0 A, 40 B, 43 C, 3 D · "Not one page scored an A" · August 2026.
                    Licensed for editorial use. Credit: Nebula Components.
                  </p>
                </div>
                <a
                  href="/press/grade-distribution.png"
                  download="nebula-grade-distribution-2026.png"
                  className="shrink-0 font-mono text-xs text-accent border border-accent/30 rounded px-3 py-1.5 hover:bg-accent/5 transition-colors"
                >
                  Download →
                </a>
              </div>
            </div>
            <div className="bg-bg-surface border border-white/5 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-fg text-sm mb-1">9-signal scorecard example (1400×680)</p>
                  <p className="text-xs text-fg-muted leading-5">
                    Illustrative audit showing all 9 signals with pass/fail/warn status, finding evidence,
                    and top-leak callout. Score 58/100, Grade C. Licensed for editorial use.
                  </p>
                </div>
                <a
                  href="/press/scorecard-example.png"
                  download="nebula-scorecard-example-2026.png"
                  className="shrink-0 font-mono text-xs text-accent border border-accent/30 rounded px-3 py-1.5 hover:bg-accent/5 transition-colors"
                >
                  Download →
                </a>
              </div>
            </div>
            <div className="bg-bg-surface border border-white/5 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-fg text-sm mb-1">Audit result screenshot — Basecamp teardown</p>
                  <p className="text-xs text-fg-muted leading-5">
                    Public teardown of basecamp.com, July 29 2026. Score: 5.4/10, Grade C, 5 findings.
                    Each finding shows signal, evidence, and fix. Licensed for editorial use.
                  </p>
                </div>
                <a
                  href="/teardowns/basecamp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-mono text-xs text-accent border border-accent/30 rounded px-3 py-1.5 hover:bg-accent/5 transition-colors"
                >
                  View →
                </a>
              </div>
            </div>
            <div className="bg-bg-surface border border-white/5 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-fg text-sm mb-1">Brand mark &amp; wordmark</p>
                  <p className="text-xs text-fg-muted leading-5">
                    SVG and PNG in dark/light/mono variants. Usage guidelines apply.
                  </p>
                </div>
                <a
                  href="/brand"
                  className="shrink-0 font-mono text-xs text-accent border border-accent/30 rounded px-3 py-1.5 hover:bg-accent/5 transition-colors"
                >
                  View →
                </a>
              </div>
            </div>
            <div className="bg-bg-surface border border-white/5 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-fg text-sm mb-1">Founder photo — Mike Holownych</p>
                  <p className="text-xs text-fg-muted leading-5">
                    Professional headshot. Licensed for editorial use. Credit: Nebula Components.
                    Do not crop, filter, or alter.
                  </p>
                </div>
                <a
                  href="/mike-holownych-founder.jpg"
                  download="mike-holownych-nebula-founder.jpg"
                  className="shrink-0 font-mono text-xs text-accent border border-accent/30 rounded px-3 py-1.5 hover:bg-accent/5 transition-colors"
                >
                  Download →
                </a>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-bg-surface mb-16" />

        {/* ── Contact ── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-fg mb-6">Contact</h2>
          <div className="bg-bg-surface border border-white/5 rounded-lg p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <span className="font-mono text-xs text-fg-muted/50 uppercase tracking-wider w-40 shrink-0">
                Press inquiries
              </span>
              <a
                href="mailto:hello@nebulacomponents.com"
                className="text-accent underline underline-offset-2 text-sm"
              >
                hello@nebulacomponents.com
              </a>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <span className="font-mono text-xs text-fg-muted/50 uppercase tracking-wider w-40 shrink-0">
                Interview requests
              </span>
              <a
                href="mailto:hello@nebulacomponents.com"
                className="text-accent underline underline-offset-2 text-sm"
              >
                hello@nebulacomponents.com
              </a>
            </div>
            <p className="font-mono text-xs text-fg-muted pt-2 border-t border-white/5">
              We respond to press inquiries within 24 hours.
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}
