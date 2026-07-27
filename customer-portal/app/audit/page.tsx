import type { Metadata } from 'next'
import { getPublicClaim } from '@/app/lib/evidence-atoms'
import { auditWebApplicationSchema } from '@/app/lib/schema'
import AuditForm from './AuditForm'

export const metadata: Metadata = {
  title: 'Find the Leak - Free Landing Page Diagnosis | Nebula',
  description: "See if your page is what's killing your ads. Evidence-backed audit in under 2 minutes, no signup required.",
  alternates: { canonical: 'https://nebulacomponents.shop/audit' },
  openGraph: {
    title: 'Find the Leak - Free Landing Page Diagnosis | Nebula',
    description: "See if your page is what's killing your ads. Evidence-backed audit in under 2 minutes, no signup required.",
    url: 'https://nebulacomponents.shop/audit',
    siteName: 'Nebula Components',
    locale: 'en_US',
    type: 'website',
  },
}

// Static sample output - shows what a real audit result looks like.
// Scores and findings are illustrative only; not a real audit of any live page.
const SAMPLE_FINDINGS = [
  { key: 'message_match', label: 'Message match', score: 3, pass: false, finding: 'Ad headline "Stop wasting ad spend" does not match page headline "We help businesses grow".' },
  { key: 'trust_signals', label: 'Trust signals', score: 2, pass: false, finding: 'No testimonials or logos visible above fold. First trust signal appears after 3 scrolls.' },
  { key: 'mobile_cta', label: 'Mobile CTA', score: 4, pass: false, finding: 'Primary CTA button is 890px from top on 375px viewport - below fold without scroll.' },
  { key: 'load_time', label: 'Load time', score: 8, pass: true, finding: 'LCP 2.1s on mobile. Passes threshold.' },
  { key: 'cta_clarity', label: 'CTA clarity', score: 5, pass: false, finding: '3 competing CTAs in hero: "Get started", "Learn more", "Book a call". No clear primary action.' },
  { key: 'form_friction', label: 'Form friction', score: 9, pass: true, finding: '3-field form. Clear labels. Low friction.' },
  { key: 'compliance', label: 'Compliance', score: 7, pass: true, finding: 'GDPR banner present and does not block conversion path.' },
]

export default function AuditPage() {
  const auditMethodClaim = getPublicClaim('claim-7-point-diagnosis', {
    route: '/audit',
    slot: 'audit-method-summary',
  })

  const failCount = SAMPLE_FINDINGS.filter((f) => !f.pass).length
  const overallScore = Math.round(
    SAMPLE_FINDINGS.reduce((sum, f) => sum + f.score, 0) / SAMPLE_FINDINGS.length
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(auditWebApplicationSchema) }}
      />
      <main id="main-content" role="main" className="min-h-screen bg-bg pt-24">

        {/* ── 1. Hero: form-forward split ── */}
        <section className="mx-auto max-w-6xl px-6 py-12 md:py-20">
          <div className="grid gap-12 md:grid-cols-2 md:items-start">

            {/* Left: copy */}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
                See if the page is what&apos;s killing your ads.
              </h1>
              <p className="mt-4 max-w-lg text-lg leading-7 text-fg-muted">
                Paste your URL. Get 7 conversion signals checked against your actual page.
                No email required to see results.
              </p>
              <ul className="mt-6 space-y-2">
                {[
                  'Results in under 2 minutes',
                  'No signup, no account',
                  '$97 One-Leak Repair Sprint implements your highest-confidence fix',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-fg-muted">
                    <span className="text-accent">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: form */}
            <div className="rounded-2xl border border-border bg-bg-muted/30 p-6 md:p-8">
              <p className="mb-4 text-sm font-semibold text-fg">
                Paste your landing page URL
              </p>
              <AuditForm />
            </div>

          </div>
        </section>

        {/* ── 2. Sample output - what you actually see ── */}
        <section className="border-t border-border px-6 py-14">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 grid gap-2 md:grid-cols-2 md:items-end">
              <h2 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">
                Here is what the output looks like.
              </h2>
              <p className="text-sm text-fg-muted md:text-right">
                Illustrative sample. Your page will differ.
              </p>
            </div>

            {/* Score header */}
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-bg-muted/20 p-5">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-bold text-signal-fail">{overallScore}</span>
                <span className="font-mono text-sm text-fg-muted">/10</span>
              </div>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div>
                <p className="font-semibold text-fg text-sm">example-startup.com</p>
                <p className="text-xs text-fg-muted">{failCount} of 7 signals failing</p>
              </div>
              <div className="ml-auto rounded-lg bg-signal-fail/10 px-3 py-1 font-mono text-xs text-signal-fail">
                Grade D
              </div>
            </div>

            {/* Signal rows */}
            <div className="rounded-2xl border border-border overflow-hidden">
              {SAMPLE_FINDINGS.map((f, i) => (
                <div
                  key={f.key}
                  className={`grid gap-4 p-4 md:grid-cols-[140px_60px_1fr] md:items-start ${
                    i < SAMPLE_FINDINGS.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        f.pass ? 'bg-accent' : 'bg-signal-fail'
                      }`}
                    />
                    <span className="text-sm font-semibold text-fg">{f.label}</span>
                  </div>
                  <span
                    className={`font-mono text-sm ${
                      f.pass ? 'text-accent' : 'text-signal-fail'
                    }`}
                  >
                    {f.score}/10
                  </span>
                  <p className="text-xs leading-5 text-fg-muted">{f.finding}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-fg-muted">
              Illustrative output only. Scores, findings, and page URL are fictional.
              Your audit will reflect your actual page.
            </p>
          </div>
        </section>

        {/* ── 3. What gets checked ── */}
        <section className="border-t border-border bg-bg-muted/10 px-6 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-2xl font-bold tracking-tight text-fg md:text-3xl">
              What the audit checks
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Message match', desc: 'Ad promise vs. page headline - within 3 words' },
                { label: 'Trust signals', desc: 'Testimonials or logos above fold - minimum 2' },
                { label: 'Mobile CTA', desc: 'Primary action visible on 375px without scroll' },
                { label: 'Core Web Vitals', desc: 'LCP under 2.5s, CLS under 0.1, INP under 200ms' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-bg-muted/20 p-4">
                  <p className="mb-1 font-semibold text-fg text-sm">{item.label}</p>
                  <p className="text-xs text-fg-muted leading-5">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'CTA clarity', desc: 'One primary action, no competing choices' },
                { label: 'Form friction', desc: '5 fields or fewer, clear labels, stated benefit' },
                { label: 'Compliance', desc: 'GDPR/CCPA compliant without blocking conversion' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-bg-muted/20 p-4">
                  <p className="mb-1 font-semibold text-fg text-sm">{item.label}</p>
                  <p className="text-xs text-fg-muted leading-5">{item.desc}</p>
                </div>
              ))}
            </div>
            {auditMethodClaim && (
              <p
                className="mt-6 text-sm text-fg-muted leading-7 max-w-2xl"
                data-claim-id={auditMethodClaim.claimId}
                data-evidence-ids={auditMethodClaim.evidenceIds.join(',')}
              >
                {auditMethodClaim.text}
              </p>
            )}
          </div>
        </section>

        {/* ── 3b. How It Works ── */}
        <section className="border-t border-border px-6 py-14">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-3 text-base font-semibold text-fg">How It Works</h2>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-fg-muted">
              <li>Enter your landing page URL in the field above</li>
              <li>The audit engine fetches and scores your page across all 7 signals</li>
              <li>You receive a structured report with specific, actionable findings</li>
              <li>Each finding includes a severity rating and a recommended fix</li>
            </ol>
          </div>
        </section>

        {/* ── 4. After the audit: repair sprint ── */}
        <section className="border-t border-border px-6 py-14">
          <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-fg md:text-3xl">
                If it fails, the $97 One-Leak Repair Sprint fixes it.
              </h2>
              <p className="mb-6 text-base text-fg-muted leading-7">
                The free audit shows you what is broken and in what order to fix it.
                The Repair Sprint selects one high-confidence page-level repair, confirms
                the scope with you, implements it on your live page, and verifies the
                change. One payment, no retainer, no calls required.
              </p>
              <div className="space-y-2">
                {[
                  'Full 7-point diagnosis written up',
                  'One high-confidence repair implemented and verified on your live page',
                  'Scope confirmed with you before any change is made',
                  'One additional same-scope evidence check within 30 days',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-fg-muted">
                    <span className="mt-0.5 shrink-0 text-accent">✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 md:p-8">
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-fg">$97</span>
                <span className="text-sm text-fg-muted">one-time</span>
              </div>
              <p className="mb-6 text-sm text-fg-muted">
                After the free audit identifies what is leaking.
              </p>
              <a
                href="https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h"
                className="block w-full rounded-xl bg-accent py-3.5 text-center font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-sm"
              >
                Get the Repair Sprint &rarr;
              </a>
              <p className="mt-3 text-center text-xs text-fg-muted">
                Run the free audit first &rarr;
              </p>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
