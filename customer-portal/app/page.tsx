import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import ROICalculator from './components/ROICalculator'
import WithWithout from './components/WithWithout'
import HowItWorksAnimated from './components/HowItWorksAnimated'
import StackTaxComparison from './components/StackTaxComparison'
import HonestyGrid from './components/HonestyGrid'
import AgenticNativeBanner from './components/AgenticNativeBanner'
import MobileStickyAuditCTA from './components/MobileStickyAuditCTA'
import dynamic from 'next/dynamic'
const AuditCardArtifact = dynamic(() => import('./components/AuditCardArtifact'), {
  loading: () => (
    <div className="h-[340px] w-full max-w-sm rounded-2xl border border-border/40 bg-bg-muted/20 animate-pulse" aria-hidden="true" />
  ),
})
import { TEARDOWNS } from './teardowns/[slug]/data'
import { HOMEPAGE_DESCRIPTION, HOMEPAGE_SEO_TITLE } from './lib/homepageContent'
import { SignalIcon } from '@/components/SignalIcons'
import { homeFAQSchema } from './lib/faq-schemas'

export const metadata: Metadata = {
  title: HOMEPAGE_SEO_TITLE,
  description: HOMEPAGE_DESCRIPTION,
  alternates: { canonical: 'https://nebulacomponents.com/' },
  openGraph: {
    title: HOMEPAGE_SEO_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    url: 'https://nebulacomponents.com',
    siteName: 'Nebula Components',
    locale: 'en_US',
    type: 'website',
  },
}

const SIGNALS = [
  { key: 'message_match', label: 'Message match', desc: 'Ad promise vs. page headline', pass: 'Ad headline matches page headline and names the buyer outcome' },
  { key: 'cta', label: 'CTA clarity', desc: 'One clear primary action with action + outcome copy', pass: 'Primary CTA uses action + outcome copy, visible in initial viewport' },
  { key: 'above_fold', label: 'Above-fold clarity', desc: 'Primary CTA, headline, and proof visible before scroll', pass: 'Primary CTA, ICP-specific headline, and trust signal all visible above fold' },
  { key: 'social_proof', label: 'Trust signals', desc: 'Proof visible near the first CTA', pass: 'Named testimonial, review count, or customer logo visible near primary CTA' },
  { key: 'load_time', label: 'Load speed', desc: 'Page does not leak visitors while loading', pass: 'LCP under 2.5s, CLS under 0.1, INP under 200ms on mobile' },
  { key: 'mobile', label: 'Mobile viewport', desc: 'Page renders correctly on mobile', pass: 'Primary CTA visible and usable on 375px viewport without zoom' },
  { key: 'ad_signals', label: 'Ad tracking', desc: 'Recognized ad-tracking artifact present', pass: 'Facebook Pixel, GA4 ID, or UTM-bearing link present in static HTML' },
  { key: 'seo_foundations', label: 'SEO foundations', desc: 'Title tag, meta description, and descriptive H1', pass: 'Title tag, meta description, and single descriptive H1 all present' },
  { key: 'ai_readiness', label: 'AI readiness', desc: 'Structured signals support machine-readable interpretation', pass: 'JSON-LD, OG tags, and clean DOM hierarchy present for AI citation' },
]

const TEARDOWN_PROOFS = ['knallhart', 'postmint', 'basecamp']

const PATTERNS = [
  {
    label: 'Failure mode',
    heading: 'Pricing behind the email gate',
    body: 'Asking for commitment before demonstrating value. The visitor hasn\'t decided yet - gating behind email before showing them anything useful is how you lose them.',
    dominant: true,
  },
  {
    label: 'Failure mode',
    heading: 'CTA you cannot see',
    body: 'Low contrast, buried placement, or competing nav links. The visitor wants to act and can\'t find where to go.',
    dominant: false,
  },
  {
    label: 'Failure mode',
    heading: 'No proof near the first CTA',
    body: 'Cold traffic doesn\'t know you. Asking them to buy before they\'ve seen evidence of anything raises the cost of every click.',
    dominant: false,
  },
]

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFAQSchema) }}
      />
      <main id="main-content" className="min-h-screen bg-bg pt-24">

        {/* ── 1. Hero: asymmetric split, copy left, product proof right ── */}
        <section className="section-hero relative mx-auto max-w-6xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                              'radial-gradient(ellipse 55% 45% at 70% 40%, rgba(199, 255, 47, 0.07) 0%, transparent 65%)',
            }}
          />
          <div className="relative grid gap-12 md:grid-cols-[1fr_1.3fr] md:items-center">

            {/* Left: copy */}
            <div className="flex flex-col">
              <h1 className="heading-1">
                Know exactly what&apos;s killing your conversions, without hiring a consultant.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-fg-muted">
                Your ads are working. The page is leaking the budget. Nebula checks 9 conversion signals
                against your actual page HTML in under 30 seconds — then delivers the exact fix for the highest-impact leak,
                not a list of recommendations.
              </p>
              <div className="mt-8">
                <Link
                  href="/audit?utm_source=homepage&utm_medium=internal"
                  className="inline-block rounded bg-accent px-6 py-3.5 text-base font-semibold text-bg hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
                >
                  Get My Free Conversion Score
                </Link>
                <p className="mt-3 text-sm text-fg-muted">Free. No signup. 9 signals checked in under 30 seconds.</p>
              </div>
              {/* Stat strip - elevated card */}
              <div className="mt-8 rounded-lg border border-border/40 bg-bg-surface/50 p-5">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="stat-number">9</p>
                    <p className="stat-label">signals checked</p>
                  </div>
                  <div className="text-center">
                    <p className="stat-number">&lt;2m</p>
                    <p className="stat-label">to results</p>
                  </div>
                  <div className="text-center">
                    <p className="stat-number">0</p>
                    <p className="stat-label">pages scored an A</p>
                  </div>
                  <div className="text-center">
                    <p className="stat-number">$0</p>
                    <p className="stat-label">to find the leak</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: composed audit card artifact */}
            <div className="flex flex-col">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-8 bg-[radial-gradient(ellipse_55%_45%_at_70%_40%,rgba(199,255,47,0.06),transparent_65%)]"
                />
                <AuditCardArtifact />
              </div>
              <p className="mt-4 text-sm text-fg-muted">
                9 signals. Scored against your actual page. Top leak identified with specific evidence and fix.
              </p>
            </div>

          </div>
        </section>

        {/* Mobile sticky CTA, sentinel placed here so it appears after hero exits viewport */}
        <MobileStickyAuditCTA />

        {/* ── 1c. ROI Calculator ── */}
        <ROICalculator />

        {/* ── 1d. Unfair Advantage Matrix: Stack Tax Comparison ── */}
        <StackTaxComparison />

        {/* ── 2. Origin / honest proof ── */}
        <section className="section-default">
          <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <h2 className="heading-2 mb-6">
                Built from a pattern. The same failures kept showing up.
              </h2>
              <p className="text-base text-fg-muted leading-relaxed">
                Before the audit engine, there was a spreadsheet. Working with founders on paid
                traffic, the same page failures kept showing up — wrong headline, no proof near the
                first CTA, a CTA buried under the nav. The clicks were coming in. The sales weren&apos;t.
                The page looked fine. The problems were specific and fixable every time. Nebula
                is the instrument that finds them. We run this audit on ourselves first.
              </p>
              <p className="mt-5 text-base text-fg-muted leading-relaxed">
                When we have a real client outcome with dates, proof, and a way for you to verify it,
                it will appear here. Until then: the audit runs on your actual page, returns raw
                evidence, and ranks findings by impact. No estimates. No hypothetical lift.
              </p>
              <div className="mt-8 flex items-start gap-4">
                <Image
                  src="/mike-holownych-founder.webp"
                  alt="Mike Holownych, Founder of Nebula Components"
                  width={64}
                  height={64}
                  priority
                  className="h-16 w-16 rounded-full object-cover shrink-0 ring-2 ring-border/40"
                />
                <div>
                  <p className="text-base font-semibold text-fg">Mike Holownych</p>
                  <p className="text-sm text-fg-muted">Founder, Nebula Components</p>
                  <p className="text-sm text-fg-dim mt-1">
                    Enterprise AI governance lead · TMX Group · AI Syndicate
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-fg-dim">
                Last updated: <time dateTime="2026-08-04">August 2026</time>
              </p>
            </div>
<div className="card-default font-mono text-sm">
               <p className="mb-5 text-xs text-fg-muted">
                 Sample output format, illustrative findings
               </p>
               {SIGNALS.slice(0, 7).map((s) => (
                 <div key={s.key} className="mb-3 flex items-center justify-between text-sm">
                   <span className="text-fg-muted">{s.label}</span>
                   <span className={`font-semibold ${s.pass ? 'text-accent' : 'text-signal-fail'}`}>
                     {s.pass ? 'PASS' : 'FAIL'}
                   </span>
                 </div>
               ))}
               {SIGNALS.slice(7).map((s) => (
                 <div key={s.key} className="mb-3 flex items-center justify-between text-sm">
                   <span className="text-fg-muted">{s.label}</span>
                   <span className={`font-semibold ${s.pass ? 'text-accent' : 'text-signal-fail'}`}>
                     {s.pass ? 'PASS' : 'FAIL'}
                   </span>
                 </div>
               ))}
               <div className="mt-4 border-t border-border/40 pt-4 text-sm text-fg-muted">
                 {SIGNALS.filter(s => !s.pass).length} of {SIGNALS.length} checks failing · illustrative example, not a live result
               </div>
             </div>
          </div>
        </section>

        {/* ── 3. Core checks grid ── */}
        <section className="section-default">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 grid gap-4 md:grid-cols-2 md:items-end">
              <h2 className="heading-2">
                Core checks. Every scan.
              </h2>
              <p className="text-base text-fg-muted md:text-right">
                Not opinions. Specific pass/fail checks against your actual page.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {SIGNALS.slice(0, 4).map((s) => (
                <div key={s.key} className="card-default card-hover">
                  <SignalIcon signalKey={s.key} className="mb-3 h-6 w-6 text-accent" />
                  <p className="mb-2 font-semibold text-fg">{s.label}</p>
                  <p className="text-sm text-fg-muted leading-6">{s.desc}</p>
                  <p className="mt-3 border-t border-border/40 pt-3 text-xs text-fg-dim leading-5">
                    Check: {s.pass}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              {SIGNALS.slice(4).map((s) => (
                <div key={s.key} className="card-default card-hover">
                  <SignalIcon signalKey={s.key} className="mb-3 h-6 w-6 text-accent" />
                  <p className="mb-2 font-semibold text-fg">{s.label}</p>
                  <p className="text-sm text-fg-muted leading-6">{s.desc}</p>
                  <p className="mt-3 border-t border-border/40 pt-3 text-xs text-fg-dim leading-5">
                    Check: {s.pass}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  heading: 'What you receive',
                  body: 'Recorded findings with evidence from your page, and a fix list ranked by impact and effort.',
                },
                {
                  heading: 'See a real report',
                  body: 'Every public teardown below is generated by the same engine your free scan uses. Same format, same evidence standard. Live aggregate benchmarks from all completed audits are on the benchmarks page.',
                  link: { href: '/benchmarks', label: 'Browse live benchmarks' },
                },
                {
                  heading: 'What happens next',
                  body: 'Fix the highest-impact leak yourself with the report - or have Nebula prepare the $97 One-Leak Repair Sprint: one scoped repair package within 48 hours, a 30-day re-audit, and your page compared with the current completed-audit benchmark sample.',
                },
              ].map((item) => (
                <div key={item.heading} className="card-default">
                  <h3 className="heading-3 mb-3">{item.heading}</h3>
                  <p className="text-sm text-fg-muted leading-7">{item.body}</p>
                  {item.link && (
                    <Link href={item.link.href} className="mt-4 inline-block text-sm font-semibold text-accent hover:text-fg transition-colors">
                      {item.link.label} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3b. Clinical Transparency: Honesty Grid ── */}
        <HonestyGrid />

        {/* ── 4. Teardown proof: named pages, named failures ── */}
        <section className="section-default bg-bg-elevated/60">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 grid gap-4 md:grid-cols-2 md:items-end">
              <h2 className="heading-2">
                Named pages. Named failures.
              </h2>
              <p className="text-base text-fg-muted md:text-right">
                These are audits we ran in public. Every finding has a source, a measured value, and a fix.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {TEARDOWN_PROOFS.map((slug) => {
                const t = TEARDOWNS[slug]
                if (!t) return null
                return (
                  <Link
                    key={slug}
                    href={`/teardowns/${slug}`}
                    className="card-default card-hover group"
                  >
                    <p className="mb-3 text-sm font-semibold text-fg-muted">{t.domain}</p>
                    <p className="text-sm text-fg-muted leading-7">
                      {t.summary.replace(/Score: \d+(?:\.\d+)?\/10, Grade [A-F]\.\s*/g, '')}
                    </p>
                    <p className="mt-4 text-xs text-fg-dim font-mono">
                      {t.findings.length} findings documented
                    </p>
                    <p className="mt-5 text-sm font-semibold text-accent group-hover:text-fg transition-colors">
                      View the full report →
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Mid-page persistent CTA ── */}
        <section className="border-b border-border/40 bg-bg-elevated/60 px-6 py-12 text-center">
          <div className="mx-auto max-w-lg">
            <p className="mb-2 text-xs font-semibold uppercase tracking-label text-accent">Free · No signup · 2 minutes</p>
            <h2 className="mb-4 text-xl font-bold text-fg">
              Get your conversion score now.
            </h2>
            <Link
              href="/audit?utm_source=homepage-mid&utm_medium=internal"
              className="inline-block rounded bg-accent px-6 py-3 text-sm font-bold text-bg hover:opacity-85 transition-opacity"
            >
              Get My Free Conversion Score
            </Link>
          </div>
        </section>

        {/* ── 5. Patterns: dominant + 2 ── */}
        <section className="section-default">
          <div className="mx-auto max-w-6xl">
            <h2 className="heading-2 mb-4">
              The ads did their job. The page had one job.
            </h2>
            <p className="mb-10 max-w-xl text-base text-fg-muted leading-relaxed">
              Most founders blame the ad. These are recurring page failure modes we inspect in the audit.
            </p>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">

              {/* Dominant card */}
              <div className="card-feature lg:row-span-2">
                <p className="mb-2 text-xs font-semibold text-accent uppercase tracking-wide">{PATTERNS[0].label}</p>
                <h3 className="mb-5 text-xl font-bold text-fg">{PATTERNS[0].heading}</h3>
                <p className="text-base text-fg-muted leading-relaxed">{PATTERNS[0].body}</p>
                <div className="mt-8 rounded-lg border border-border/40 bg-bg p-5 font-mono text-sm text-fg-muted">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-accent font-semibold">message_match</span>
                    <span className="text-signal-fail font-semibold">FAIL</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border">
                    <div className="h-2 w-[30%] rounded-full bg-signal-fail" />
                  </div>
                  <p className="mt-3 text-sm">Ad: "Get $97 audit" → Page: "Landing page help"</p>
                </div>
              </div>

              {/* Supporting cards */}
              {PATTERNS.slice(1).map((p) => (
                <div key={p.label} className="card-default">
                  <p className="mb-2 text-xs font-semibold text-accent uppercase tracking-wide">{p.label}</p>
                  <h3 className="mb-3 heading-3">{p.heading}</h3>
                  <p className="text-sm text-fg-muted leading-7">{p.body}</p>
                </div>
              ))}
            </div>

            <p className="mt-10 max-w-xl text-sm text-fg-muted">
              Running traffic experiments on pages with structural friction burns budget on the wrong variable.{' '}
              <strong className="text-fg">Fix the page first. Then test creative.</strong>
            </p>
          </div>
        </section>

        {/* ── 6. How it works - animated ── */}
        <HowItWorksAnimated />

        {/* ── 6b. With/Without comparison ── */}
        <WithWithout />

        {/* ── 7. Comparison: not a sales call ── */}
        <section className="section-default">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 md:grid-cols-2 md:items-start">
              <div>
                <h2 className="heading-2 mb-6">
                  Not a sales call in disguise.
                </h2>
                <p className="mb-8 text-base text-fg-muted leading-relaxed">
                  You have seen "free audit" - a PDF with 8 generic recommendations and a discovery call at the end.
                  This is different. See your initial findings before sharing an email.
                </p>
                <Link
                  href="/audit?utm_source=homepage&utm_medium=internal"
                  className="inline-block rounded border border-accent px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent hover:text-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
                >
                  See what you actually get →
                </Link>
              </div>
              <div className="grid gap-5">
                <div className="card-default border-border/40">
                  <p className="mb-4 text-xs font-semibold text-fg-muted uppercase tracking-wide">Other audits</p>
                  <ul className="space-y-3 text-sm text-fg-muted">
                    {[
                      'Generic report - same 8 recommendations for every site',
                      'Vague advice you have to figure out how to apply',
                      'Gated behind a sales call',
                      '3-month engagement to see results',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-1 shrink-0 text-signal-fail">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card-feature">
                  <p className="mb-4 text-xs font-semibold text-accent uppercase tracking-wide">Nebula audit</p>
                  <ul className="space-y-3 text-sm text-fg-muted">
                    {[
                      'Real scrape - scored against 9 specific conversion signals',
                      'Prioritized fixes with impact and effort scores',
                      'No signup to see your results',
                      '$97 One-Leak Repair Sprint gives you one scoped repair package within 48 hours',
                      'Free re-audit 30 days after you implement the fix',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-1 shrink-0 text-accent">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. What the click proved: 3 items ── */}
        <section className="section-default">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 max-w-2xl">
              <h2 className="heading-2">
                Know what the click proved - and what it did not.
              </h2>
              <p className="mt-4 text-base text-fg-muted leading-relaxed">
                A click establishes that the ad generated interest. The page determines whether that interest becomes a decision.
              </p>
            </div>
            <div className="divide-y divide-border/40 border-t border-b border-border/40">
              {[
                {
                  heading: 'A click is not the finish line.',
                  body: 'An ad click proves the message was interesting enough to investigate. The landing page carries that interest forward - or kills it. If the page contradicts the ad, hides the next step, or asks for trust before earning it, the visitor leaves and the ad takes the blame.',
                },
                {
                  heading: 'The audit follows the actual path.',
                  body: 'Nebula checks what a paid visitor experiences: headline, visible action, proof, mobile usability, performance, and measurement. Each failing signal is tied to raw evidence from your page and ranked by impact. The report does not estimate revenue or promise lift that has not been measured.',
                },
                {
                  heading: 'Use it as a stop-or-fix decision.',
                  body: 'If the page passes, look at the audience or offer instead. If it fails, fix the highest-impact issue first, then run the audit again and compare. That\'s the whole loop.',
                },
              ].map((item) => (
                <article
                  key={item.heading}
                  className="grid gap-6 py-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-12"
                >
                  <h3 className="text-lg font-bold text-fg">{item.heading}</h3>
                  <p className="text-sm leading-7 text-fg-muted">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9. Direct answers ── */}
        <section aria-labelledby="direct-answers" className="section-default bg-bg-elevated/60">
          <div className="mx-auto max-w-6xl">
            <h2 id="direct-answers" className="heading-2 mb-8">Direct answers</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="card-default">
                <h3 className="heading-3 mb-3">What does Nebula provide?</h3>
                <p className="text-sm leading-7 text-fg-muted">A scored, evidence-backed diagnosis of why your landing page isn&apos;t converting paid traffic - not generic advice, not a sales call.</p>
              </div>
              <div className="card-default">
                <h3 className="heading-3 mb-3">What does the free audit check?</h3>
                <p className="text-sm leading-7 text-fg-muted">Core conversion signals and applicable technical checks against your actual page. Returns pass/fail findings with raw evidence, ranked by impact. You stop guessing what&apos;s wrong. Under 2 minutes.</p>
              </div>
              <div className="card-default">
                <h3 className="heading-3 mb-3">What does the $97 repair sprint do?</h3>
                <p className="text-sm leading-7 text-fg-muted">One targeted fix for your highest-impact finding - exact copy, code, or configuration change written for your specific page. Includes a 30-day re-audit to verify the fix held and your page benchmarked against real audit data. It does not promise conversion lift - no one can before the fix is live and measured.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 10. Diagnostic Guides & Buyer Audits ── */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-fg md:text-3xl">
              Diagnostic Guides &amp; Industry Audits
            </h2>
            <p className="mb-8 max-w-2xl text-base text-fg-muted">
              Step-by-step diagnostic sequences for common paid traffic conversion failures and industry-specific audit benchmarks.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-bg-panel/60 p-6">
                <h3 className="mb-3 text-lg font-semibold text-fg">Conversion Leak Diagnostics</h3>
                <ul className="space-y-2.5 text-sm text-fg-muted">
                  <li>
                    <Link href="/why-is-my-landing-page-not-converting" className="hover:text-accent transition-colors">
                      Why Is My Landing Page Not Converting? &rarr;
                    </Link>
                  </li>
                  <li>
                    <Link href="/ads-getting-clicks-but-no-sales" className="hover:text-accent transition-colors">
                      Ads Getting Clicks But No Sales &rarr;
                    </Link>
                  </li>
                  <li>
                    <Link href="/landing-page-message-match" className="hover:text-accent transition-colors">
                      Ad to Landing Page Message Match &rarr;
                    </Link>
                  </li>
                  <li>
                    <Link href="/landing-page-trust-signals" className="hover:text-accent transition-colors">
                      Landing Page Trust Signals &amp; Credibility &rarr;
                    </Link>
                  </li>
                  <li>
                    <Link href="/landing-page-cta-audit" className="hover:text-accent transition-colors">
                      Landing Page CTA Audit &amp; Friction &rarr;
                    </Link>
                  </li>
                  <li>
                    <Link href="/mobile-landing-page-audit" className="hover:text-accent transition-colors">
                      Mobile Landing Page Audit &amp; Viewport Leaks &rarr;
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-border bg-bg-panel/60 p-6">
                <h3 className="mb-3 text-lg font-semibold text-fg">Industry-Specific Audits</h3>
                <ul className="space-y-2.5 text-sm text-fg-muted">
                  <li>
                    <Link href="/saas-landing-page-audit" className="hover:text-accent transition-colors">
                      SaaS Landing Page Audit (ICP, Demo &amp; Trial Friction) &rarr;
                    </Link>
                  </li>
                  <li>
                    <Link href="/ecommerce-landing-page-audit" className="hover:text-accent transition-colors">
                      Ecommerce Landing Page Audit (Product &amp; Price Clarity) &rarr;
                    </Link>
                  </li>
                  <li>
                    <Link href="/lead-generation-landing-page-audit" className="hover:text-accent transition-colors">
                      Lead Generation Landing Page Audit (Form Friction) &rarr;
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── 10b. WebMCP Agentic Native Protocol Banner ── */}
        <AgenticNativeBanner />

        {/* ── 11. Final CTA ── */}
        <section className="px-6 py-20 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="mb-3 text-2xl font-bold text-fg">
              Run the leak detection before you spend another dollar.
            </h2>
            <p className="mb-8 text-base text-fg-muted">
              Free, no signup. Find the specific leak costing you conversions.
            </p>
            <Link
              href="/audit?utm_source=homepage&utm_medium=internal"
              className="inline-block rounded bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-base"
            >
              Find the Leak &rarr;
            </Link>
          </div>
        </section>

      </main>
    </>
  )
}
