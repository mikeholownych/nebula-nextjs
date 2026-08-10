import type { Metadata } from 'next'
import Link from 'next/link'
import SelfScan from './components/SelfScan'
import AggregateProof from './components/AggregateProof'
import RecentFinding from './components/RecentFinding'
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
  { key: 'headline', label: 'Headline', desc: 'Headline names the buyer outcome', pass: 'Headline is outcome-specific and 12-90 characters' },
  { key: 'cta', label: 'CTA clarity', desc: 'One clear action, action+outcome language', pass: 'Primary CTA uses action + outcome copy' },
  { key: 'social_proof', label: 'Social proof', desc: 'Proof visible near the first CTA', pass: 'Sample output, quote, metric, or guarantee near the CTA' },
  { key: 'mobile', label: 'Mobile viewport', desc: 'Page renders correctly on mobile', pass: 'Responsive viewport meta present' },
  { key: 'load_speed', label: 'Load speed', desc: 'Page does not leak visitors while loading', pass: 'Page weight and request count within sane limits' },

  { key: 'seo_foundations', label: 'SEO foundations', desc: 'Title, meta description, and H1 all present', pass: 'Title tag, meta description, and a single descriptive H1 all present' },
  { key: 'ai_readiness', label: 'AI citation readiness', desc: 'Page is citable by AI systems', pass: 'Structured signals (JSON-LD, OG tags, clean hierarchy) present' },
]

const TEARDOWN_PROOFS = ['knallhart', 'postmint', 'basecamp']

const PATTERNS = [
  {
    label: 'Failure mode',
    heading: 'Pricing behind the email gate',
    body: 'Asking for commitment before demonstrating value. The visitor hasn\'t decided yet — gating behind email before showing them anything useful is how you lose them.',
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

        {/* ── 1. Hero: asymmetric split ── */}
        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-[1.4fr_1fr] md:items-start">

            {/* Left: copy — dominant */}
            <div className="flex flex-col justify-center">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                Landing pages don&apos;t convert. Components do.
              </p>
              <h1 className="text-4xl font-extrabold tracking-display text-fg md:text-5xl lg:text-6xl">
                Your landing page is leaking paying customers. Here&apos;s exactly where.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-7 text-fg-muted">
                Paste your URL. Nebula checks 9 conversion signals plus technical readiness on your actual page and
                returns exactly what's costing you conversions — ranked by impact. Free, no signup, under two minutes.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/audit?utm_source=homepage&utm_medium=internal"
                  className="rounded-xl bg-accent px-7 py-3.5 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-base"
                >
                  Get My Free Score
                </Link>
                <Link
                  href="/teardowns"
                  className="text-sm text-fg-muted hover:text-fg transition-colors"
                >
                  See Sample Audit &rarr;
                </Link>
              </div>
              {/* Reserve height to prevent CLS when async components load */}
              <div className="min-h-[80px] mt-6">
                <AggregateProof />
                <RecentFinding />
              </div>
            </div>

            {/* Right: live self-scan widget — subordinate data module */}
            <div className="flex flex-col gap-4 md:pt-4">
              <div className="rounded-xl border border-border bg-bg-surface p-5 shadow-lifted">
                <p className="mb-0.5 text-xs font-semibold text-accent">Live — our own audit</p>
                <p className="mb-3 text-xs text-fg-muted">Same engine every free scan uses.</p>
                <SelfScan />
              </div>
            </div>

          </div>
        </section>

        {/* ── 1b. Industry standard strip ── */}
        <section className="border-y border-border bg-bg-surface px-6 py-8">
          <div className="mx-auto max-w-6xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-fg-muted max-w-2xl">
                Live aggregate benchmarks are computed from completed audits only. See the current
                sample size and verified finding rates on the Leak Index.
              </p>
            </div>
            <Link href="/benchmarks" className="shrink-0 text-sm font-semibold text-accent hover:text-accent-light transition-colors">
              See full benchmarks &rarr;
            </Link>
          </div>
        </section>

        {/* ── 2. Origin / honest proof ── */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto max-w-6xl grid gap-8 md:grid-cols-2 md:items-start">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">Why this exists</p>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-fg md:text-3xl">
                We run this audit on ourselves first.
              </h2>
              <p className="text-base text-fg-muted leading-7">
                Before the audit engine, there was a spreadsheet. Working with founders on paid
                traffic, the same page failures kept showing up — wrong headline, no proof near the
                first CTA, a CTA buried under the nav. The clicks were coming in. The sales weren&apos;t.
                The page looked fine. The problems were specific and fixable every time. Nebula
                is the instrument that finds them.
              </p>
              <p className="mt-4 text-base text-fg-muted leading-7">
                Our live self-scan — the widget above — shows the evidence from our own page first.
                Most tools lead with case studies they can&apos;t verify. We&apos;d rather show you the
                actual data. Every verified check. Every evidence atom. The same output you get.
              </p>
              <div className="mt-6 flex items-start gap-4">
                <div>
                  <p className="text-sm font-semibold text-fg">Mike Holownych</p>
                  <p className="text-xs text-fg-muted">Founder, Nebula Components</p>
                  <p className="text-xs text-fg-dim mt-1">
                    Enterprise AI governance lead · TMX Group · AI Syndicate
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-fg-dim">
                Last updated: <time dateTime="2026-08-04">August 2026</time>
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-bg-muted/30 p-6 font-mono text-sm">
              <p className="mb-4 text-xs text-fg-muted">
                Sample output format — not our live score
              </p>
              {SIGNALS.map((s) => (
                <div key={s.key} className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-fg-muted">{s.label}</span>
                  <span className="text-accent">pass</span>
                </div>
              ))}
              <div className="mt-3 border-t border-border pt-3 text-xs text-fg-muted">
                Static example only — these statuses are illustrative, not a live result.
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Core checks grid ── */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 grid gap-2 md:grid-cols-2 md:items-end">
              <h2 className="text-2xl font-bold tracking-section text-fg md:text-3xl">
                Core checks. Every scan.
              </h2>
              <p className="text-base text-fg-muted md:text-right">
                Not opinions. Specific pass/fail checks against your actual page.
              </p>
            </div>
            <p className="-mt-6 mb-8 max-w-2xl text-sm text-fg-muted">
              Core checks against your actual page. Each one returns the raw value from your page as
              evidence.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SIGNALS.slice(0, 4).map((s) => (
                <div key={s.key} className="rounded-xl border border-border bg-bg-muted/20 p-4">
                  <SignalIcon signalKey={s.key} className="mb-2 h-5 w-5 text-accent" />
                  <p className="mb-1 font-semibold text-fg text-sm">{s.label}</p>
                  <p className="text-xs text-fg-muted leading-5">{s.desc}</p>
                  <p className="mt-2 border-t border-border pt-2 text-xs text-fg-dim leading-5">
                    Check: {s.pass}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {SIGNALS.slice(4).map((s) => (
                <div key={s.key} className="rounded-xl border border-border bg-bg-muted/20 p-4">
                  <SignalIcon signalKey={s.key} className="mb-2 h-5 w-5 text-accent" />
                  <p className="mb-1 font-semibold text-fg text-sm">{s.label}</p>
                  <p className="text-xs text-fg-muted leading-5">{s.desc}</p>
                  <p className="mt-2 border-t border-border pt-2 text-xs text-fg-dim leading-5">
                    Check: {s.pass}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
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
                  body: 'Fix the highest-impact leak yourself with the report — or get the $97 One-Leak Repair Sprint: one implementation-ready fix, the 30-day re-audit to confirm it held, and your page compared with the current completed-audit benchmark sample.',
                },
              ].map((item) => (
                <div key={item.heading} className="rounded-xl border border-border bg-bg-muted/10 p-5">
                  <h3 className="mb-1 text-sm font-semibold text-fg">{item.heading}</h3>
                  <p className="text-sm text-fg-muted leading-6">{item.body}</p>
                  {item.link && (
                    <Link href={item.link.href} className="mt-2 inline-block text-sm font-semibold text-accent hover:text-accent-light transition-colors">
                      {item.link.label} &rarr;
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Teardown proof: named pages, named failures ── */}
        <section className="border-b border-border bg-bg-muted/10 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 grid gap-2 md:grid-cols-2 md:items-end">
              <h2 className="text-2xl font-bold tracking-section text-fg md:text-3xl">
                Named pages. Named failures.
              </h2>
              <p className="text-base text-fg-muted md:text-right">
                These are audits we ran in public. Every finding has a source, a measured value, and a fix.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {TEARDOWN_PROOFS.map((slug) => {
                const t = TEARDOWNS[slug]
                if (!t) return null
                return (
                  <Link
                    key={slug}
                    href={`/teardowns/${slug}`}
                    className="group rounded-2xl border border-border bg-bg-muted/20 p-6 hover:border-accent/40 transition-colors"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold text-fg-muted">{t.domain}</p>

                    </div>
                    <p className="text-sm text-fg-muted leading-6">
                      {t.summary.replace(/Score: \d+(?:\.\d+)?\/10, Grade [A-F]\.\s*/g, '')}
                    </p>
                    <p className="mt-3 text-xs text-fg-dim">
                      {t.findings.length} findings documented
                    </p>
                    <p className="mt-4 text-sm font-semibold text-accent group-hover:text-accent-light transition-colors">
                      View the full report &rarr;
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── 5. Patterns: dominant + 2 ── */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-2 text-2xl font-bold tracking-section text-fg md:text-3xl">
              The ads did their job. The page had one job.
            </h2>
            <p className="mb-10 max-w-xl text-base text-fg-muted leading-7">
              Most founders blame the ad. These are recurring page failure modes we inspect in the audit.
            </p>
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">

              {/* Dominant card */}
              <div className="rounded-2xl border border-border bg-bg-muted/30 p-8 lg:row-span-2">
                <p className="mb-1 text-xs font-semibold text-accent">{PATTERNS[0].label}</p>
                <h3 className="mb-4 mt-1 text-xl font-bold text-fg">{PATTERNS[0].heading}</h3>
                <p className="text-base text-fg-muted leading-7">{PATTERNS[0].body}</p>
                <div className="mt-8 rounded-xl border border-border bg-bg p-4 font-mono text-xs text-fg-muted">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-accent">message_match</span>
                    <span className="text-signal-fail">FAIL</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-border">
                    <div className="h-1.5 w-[30%] rounded-full bg-signal-fail" />
                  </div>
                  <p className="mt-2 text-fg-muted">Ad: &quot;Get $97 audit&quot; &rarr; Page: &quot;Landing page help&quot;</p>
                </div>
              </div>

              {/* Supporting cards */}
              {PATTERNS.slice(1).map((p) => (
                <div key={p.label} className="rounded-2xl border border-border bg-bg-muted/20 p-6">
                  <p className="mb-1 text-xs font-semibold text-accent">{p.label}</p>
                  <h3 className="mb-2 mt-1 text-base font-bold text-fg">{p.heading}</h3>
                  <p className="text-sm text-fg-muted leading-6">{p.body}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 max-w-xl text-sm text-fg-muted">
              Running traffic experiments on pages with structural friction burns budget on the wrong variable.{' '}
              <strong className="text-fg">Fix the page first. Then test creative.</strong>
            </p>
          </div>
        </section>

        {/* ── 6. How it works ── */}
        <section className="border-b border-border bg-bg-muted/10 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-10 text-2xl font-bold tracking-section text-fg md:text-3xl">
              From URL to knowing exactly what to fix. Under 2 minutes.
            </h2>
            <div className="grid gap-0 md:grid-cols-3">
              {[
                {
                  n: '01',
                  heading: 'Paste your URL',
                  body: 'Any public landing page. No account, no signup, no integration required.',
                },
                {
                  n: '02',
                  heading: 'Get the page checks run',
                  body: 'Headline, CTA clarity, social proof, mobile viewport, load speed, SEO foundations, AI readiness, and applicable technical checks — checked against your actual page.',
                },
                {
                  n: '03',
                  heading: 'See what to fix first',
                  body: 'Every failing signal ranked by conversion impact and effort. Specific findings from your page, not generic advice. You stop guessing. You start fixing the right thing.',
                },
              ].map((step, i) => (
                <div key={step.n} className={`border-border p-6 ${i < 2 ? 'md:border-r' : ''}`}>
                  <p className="mb-3 font-mono text-xs text-fg-muted">{step.n}</p>
                  <h3 className="mb-2 font-semibold text-fg">{step.heading}</h3>
                  <p className="text-sm text-fg-muted leading-6">{step.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/audit?utm_source=homepage&utm_medium=internal"
                className="rounded-xl bg-accent px-7 py-3.5 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-sm inline-block"
              >
                Run the audit free &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* ── 7. Comparison: not a sales call ── */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 md:grid-cols-2 md:items-start">
              <div>
                <h2 className="mb-4 text-2xl font-bold tracking-section text-fg md:text-3xl">
                  Not a sales call in disguise.
                </h2>
                <p className="mb-6 text-base text-fg-muted leading-7">
                  You have seen &quot;free audit&quot; — a PDF with 8 generic recommendations and a discovery call at the end.
                  This is different. See your initial findings before sharing an email.
                </p>
                <Link
                  href="/audit?utm_source=homepage&utm_medium=internal"
                  className="rounded-xl border border-accent px-6 py-3 text-sm font-semibold text-accent hover:bg-accent hover:text-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors inline-block"
                >
                  See what you actually get &rarr;
                </Link>
              </div>
              <div className="grid gap-3">
                <div className="rounded-xl border border-border bg-bg-muted/20 p-5">
                  <p className="mb-3 text-xs font-semibold text-fg-muted">Other audits</p>
                  <ul className="space-y-2 text-sm text-fg-muted">
                    {[
                      'Generic report - same 8 recommendations for every site',
                      'Vague advice you have to figure out how to apply',
                      'Gated behind a sales call',
                      '3-month engagement to see results',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-danger">✕</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
                  <p className="mb-3 text-xs font-semibold text-accent">Nebula audit</p>
                  <ul className="space-y-2 text-sm text-fg-muted">
                    {[
                      'Real scrape - scored against 9 specific conversion signals',
                      'Prioritized fixes with impact and effort scores',
                      'No signup to see your results',
                      '$97 One-Leak Repair Sprint gives you one implementation-ready change',
                      'Free re-audit 30 days after you implement the fix',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-accent">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. What the click proved: 3 items ── */}
        <section className="border-b border-border px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">
                Know what the click proved — and what it did not.
              </h2>
              <p className="mt-3 text-base text-fg-muted leading-7">
                A click proves the ad worked. The page determines whether that click becomes a decision.
              </p>
            </div>
            <div className="divide-y divide-border border-t border-b border-border">
              {[
                {
                  heading: 'A click is not the finish line.',
                  body: 'An ad click proves the message was interesting enough to investigate. The landing page carries that interest forward — or kills it. If the page contradicts the ad, hides the next step, or asks for trust before earning it, the visitor leaves and the ad takes the blame.',
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
                  className="grid gap-4 py-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-12"
                >
                  <h3 className="text-lg font-bold text-fg">{item.heading}</h3>
                  <p className="text-sm leading-7 text-fg-muted">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9. Direct answers ── */}
        <section aria-labelledby="direct-answers" className="border-b border-border bg-bg-muted/10 px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <h2 id="direct-answers" className="mb-5 text-xl font-bold tracking-tight text-fg">Direct answers</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="font-semibold text-fg">What does Nebula provide?</h3>
                <p className="mt-1 text-sm leading-6 text-fg-muted">A scored, evidence-backed diagnosis of why your landing page isn&apos;t converting paid traffic — not generic advice, not a sales call.</p>
              </div>
              <div>
                <h3 className="font-semibold text-fg">What does the free audit check?</h3>
                <p className="mt-1 text-sm leading-6 text-fg-muted">Core conversion signals and applicable technical checks against your actual page. Returns pass/fail findings with raw evidence, ranked by impact. You stop guessing what's wrong. Under 2 minutes.</p>
              </div>
              <div>
                <h3 className="font-semibold text-fg">What does the $97 repair sprint do?</h3>
                <p className="mt-1 text-sm leading-6 text-fg-muted">One targeted fix for your highest-impact finding — exact copy, code, or configuration change written for your specific page. Includes a 30-day re-audit to verify the fix held and your page benchmarked against real audit data. It does not promise conversion lift — no one can before the fix is live and measured.</p>
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
              <div className="rounded-xl border border-border bg-bg-muted/20 p-6">
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

              <div className="rounded-xl border border-border bg-bg-muted/20 p-6">
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
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-base"
            >
              Find the Leak &rarr;
            </Link>
          </div>
        </section>

      </main>
    </>
  )
}
