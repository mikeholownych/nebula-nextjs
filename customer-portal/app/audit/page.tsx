import type { Metadata } from 'next'
import Image from 'next/image'
import { getPublicClaim } from '@/app/lib/evidence-atoms'
import { auditWebApplicationSchema } from '@/app/lib/schema'
import AuditForm from './AuditForm'

export const metadata: Metadata = {
  title: 'Free Landing Page Audit: Find Conversion Friction | Nebula',
  description: 'Run a free evidence-backed landing page audit. Discover observable conversion friction across message match, trust signals, mobile layout, and page speed.',
  alternates: { canonical: 'https://nebulacomponents.com/audit' },
  openGraph: {
    title: 'Free Landing Page Audit: Find Conversion Friction | Nebula',
    description: 'Run a free evidence-backed landing page audit. Discover observable conversion friction across message match, trust signals, mobile layout, and page speed.',
    url: 'https://nebulacomponents.com/audit',
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
  { key: 'mobile_cta', label: 'Mobile CTA', score: 4, pass: false, finding: 'Primary CTA button is 890px from top on 375px viewport — below fold without scroll.' },
  { key: 'load_speed', label: 'Load speed', score: 8, pass: true, finding: 'LCP 2.1s on mobile. Passes threshold.' },
  { key: 'cta_clarity', label: 'CTA clarity', score: 5, pass: false, finding: '3 competing CTAs in hero: "Get started", "Learn more", "Book a call". No clear primary action.' },
  { key: 'above_fold', label: 'Above the fold', score: 3, pass: false, finding: 'Offer not clear until second viewport — headline is a company name, not a buyer outcome.' },
  { key: 'ad_signals', label: 'Ad signals', score: 9, pass: true, finding: 'Google Ads conversion tag present in source.' },
  { key: 'seo_foundations', label: 'SEO foundations', score: 6, pass: false, finding: 'Meta description is 197 characters — truncated in SERP at 155.' },
  { key: 'ai_readiness', label: 'AI readiness', score: 7, pass: true, finding: 'OpenGraph tags and JSON-LD present. Page is citable.' },
  { key: 'headline', label: 'Message match', score: 4, pass: false, finding: 'Ad headline "Cut your CAC in half" — page headline says "Grow your business." Zero word overlap.' },
]

export default function AuditPage() {
  const auditMethodClaim = getPublicClaim('claim-9-signal-diagnosis', {
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
      <main id="main-content" className="min-h-screen bg-bg pt-24">

        {/* ── 1. Hero: form-forward split ── */}
        <section className="mx-auto max-w-6xl px-6 py-12 md:py-20">
          <div className="grid gap-12 md:grid-cols-2 md:items-start">

            {/* Form first on mobile (order-1 on mobile, order-2 on md+) */}
            <div id="run-audit" className="order-1 rounded-2xl border border-border bg-bg-muted/30 p-6 md:order-2 md:p-8">
              <p className="mb-4 text-sm font-semibold text-fg">
                Paste your landing page URL
              </p>
              <AuditForm />
            </div>

            {/* Copy second on mobile (order-2 on mobile, order-1 on md+) */}
            <div className="order-2 flex flex-col justify-center md:order-1">
              <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
                See if the page is what&apos;s killing your ads.
              </h1>
              <p className="mt-4 max-w-lg text-lg leading-7 text-fg-muted">
                Paste your URL. Get 9 conversion signals checked against your actual page.
                See your score and initial findings before sharing an email.
              </p>
              <ul className="mt-6 space-y-2">
                {[
                  'Results in under 2 minutes',
                  'No signup, no account',
                  '$97 One-Leak Self-Implementation Kit gives you one implementation-ready change',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-fg-muted">
                    <span className="text-accent">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>

        {/* ── 1b. Real self-audit screenshot - not a mockup ── */}
        <section className="border-t border-border px-6 py-14">
          <div className="mx-auto max-w-4xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Not a mockup
            </p>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-fg md:text-3xl">
              See the evidence before you decide.
            </h2>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">Historical proof</p>
            <p className="mb-6 max-w-2xl text-fg-muted">
              This screenshot is a historical audit artifact captured from nebulacomponents.com.
              It documents the result format and evidence surface; it is not a current score.
              Run a fresh audit below for current evidence.
            </p>
            <div className="overflow-hidden rounded-2xl border border-border">
              <Image
                src="/screenshots/audit-results-example-com.webp"
                alt="Historical Nebula audit results artifact for nebulacomponents.com showing a 7.7/10 conversion readiness score, Grade B, analysed across 9 conversion signals"
                width={1600}
                height={650}
                className="h-auto w-full"
              />
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
                <p className="text-xs text-fg-muted">{failCount} of 9 signals failing</p>
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: 'Message match', desc: 'Ad promise vs. page headline — within 3 words' },
                { label: 'Trust signals', desc: 'Testimonials or logos above fold — minimum 2' },
                { label: 'Mobile CTA', desc: 'Primary action visible on 375px without scroll' },
                { label: 'Above the fold', desc: 'Offer, audience, and action clear in first viewport' },
                { label: 'Ad signals', desc: 'Ad pixel or conversion tracking detectable in source' },
                { label: 'SEO foundations', desc: 'Title tag, meta description, single descriptive H1' },
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
                { label: 'Load speed', desc: 'LCP under 2.5s, CLS under 0.1, INP under 200ms' },
                { label: 'AI readiness', desc: 'Structured data and signals for AI citation' },
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
              <li>The audit engine fetches and scores your page across all 9 signals</li>
              <li>You receive a structured report with specific, actionable findings</li>
              <li>Each finding includes a severity rating and a recommended fix</li>
            </ol>
          </div>
        </section>

        {/* ── 3c. Audit Privacy, Inspection & Data Handling Boundaries ── */}
        <section className="border-t border-border bg-bg-muted/10 px-6 py-14">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-fg md:text-3xl">
              Audit Data Handling &amp; Inspection Boundaries
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-fg-muted">
              We operate under strict inspection boundaries so you know exactly how data is evaluated and processed when you submit a landing page URL:
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-bg-muted/20 p-5">
                <h3 className="mb-2 font-semibold text-fg text-sm">URL Retention &amp; Result Privacy</h3>
                <p className="text-xs text-fg-muted leading-relaxed">
                  Submitted URLs are retained to run the audit and generate your report. Audit findings are accessible via your unique session URL; they are not listed in a public directory or sold to third parties.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-bg-muted/20 p-5">
                <h3 className="mb-2 font-semibold text-fg text-sm">Page Captures &amp; Render Evaluation</h3>
                <p className="text-xs text-fg-muted leading-relaxed">
                  The scanner fetches public HTML/CSS assets to evaluate DOM elements and layout. Screenshots and page captures are generated transiently during analysis for layout and contrast measurement.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-bg-muted/20 p-5">
                <h3 className="mb-2 font-semibold text-fg text-sm">JavaScript &amp; Mobile Heuristics</h3>
                <p className="text-xs text-fg-muted leading-relaxed">
                  The audit evaluates client-rendered DOM structures and simulates a 375px mobile viewport heuristic to measure element visibility, contrast, and above-fold button positioning.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-bg-muted/20 p-5">
                <h3 className="mb-2 font-semibold text-fg text-sm">Form &amp; AI Provider Scope</h3>
                <p className="text-xs text-fg-muted leading-relaxed">
                  The audit inspects visible form fields and labels, but never submits forms, enters data, or traverses checkout flows. Extracted text signals are processed securely to generate findings without training third-party AI models.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. After the audit: self-implementation kit ── */}
        <section className="border-t border-border px-6 py-14">
          <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-fg md:text-3xl">
                If it fails, the $97 kit gives you one implementation-ready change.
              </h2>
              <p className="mb-6 text-base text-fg-muted leading-7">
                The free audit shows you what is broken and in what order to fix it.
                Pay $97 and receive a tailored implementation kit for one specific failing signal —
                exact copy changes, code snippets, or configuration fixes — sent after successful payment.
                No site access is needed. You implement it yourself or hand it to your developer.
              </p>
              <div className="space-y-2">
                {[
                  'Tailored implementation instructions for one selected finding',
                  'Exact copy, a code snippet, or a configuration change — not generic advice',
                  'Sent by email after successful payment',
                  'One additional same-scope re-audit within 30 days',
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
                href="#run-audit"
                className="block w-full rounded-xl bg-accent py-3.5 text-center font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-sm"
              >
                Run the audit first &rarr;
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
