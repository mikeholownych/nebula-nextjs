import type { Metadata } from 'next'
import Link from 'next/link'
import { auditWebApplicationSchema } from '@/app/lib/schema'
import { auditPageFAQSchema } from '@/app/lib/faq-schemas'
import AuditForm from './AuditForm'
import HonestyGrid from '@/app/components/HonestyGrid'

export const metadata: Metadata = {
  title: 'Free Landing Page Audit: Find Conversion Friction | Nebula',
  description: 'Free conversion leak detection for any landing page. Discovers observable conversion leaks across message match, trust signals, mobile layout, and page speed - evidence-backed, not opinions.',
  alternates: { canonical: 'https://nebulacomponents.com/audit' },
  openGraph: {
    title: 'Free Landing Page Audit: Find Conversion Friction | Nebula',
    description: 'Free conversion leak detection for any landing page. Discovers observable conversion leaks across message match, trust signals, mobile layout, and page speed - evidence-backed, not opinions.',
    url: 'https://nebulacomponents.com/audit',
    siteName: 'Nebula Components',
    locale: 'en_US',
    type: 'website',
  },
}

// Static sample output - shows what a real audit result looks like.
// Findings are illustrative only; not a real audit of any live page.
const SAMPLE_FINDINGS = [
  { key: 'message_match', label: 'Message match', pass: false, finding: 'Ad headline "Stop wasting ad spend" does not match page headline "We help businesses grow".' },
  { key: 'trust_signals', label: 'Trust signals', pass: false, finding: 'No testimonials or logos visible near the first CTA.' },
  { key: 'mobile_cta', label: 'Mobile CTA', pass: false, finding: 'Primary CTA is below the initial 375px viewport without scroll.' },
  { key: 'load_speed', label: 'Load speed', pass: true, finding: 'The page meets the documented loading threshold.' },
  { key: 'cta_clarity', label: 'CTA clarity', pass: false, finding: 'Competing actions make the primary next step unclear.' },
  { key: 'seo_foundations', label: 'SEO foundations', pass: false, finding: 'The meta description is longer than the documented search display target.' },
  { key: 'ai_readiness', label: 'AI readiness', pass: true, finding: 'Structured page signals support machine-readable interpretation.' },
]

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

type AuditStats = { audit_count: number; avg_failures_per_page: number | null }

async function getAuditStats(): Promise<AuditStats | null> {
  try {
    const res = await fetch(`${API_BASE}/audit/stats/benchmarks`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as AuditStats
    if (!data.audit_count || data.audit_count < 50) return null
    return data
  } catch {
    return null
  }
}

export default async function AuditPage() {
  const stats = await getAuditStats()
  const failCount = SAMPLE_FINDINGS.filter((f) => !f.pass).length

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(auditWebApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(auditPageFAQSchema) }}
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
                Paste your URL. Leak detection runs core conversion checks against your actual page.
                See the verified findings before sharing an email.
              </p>
              <ul className="mt-6 space-y-2">
                {[
                  'Results in under 2 minutes',
                  'No signup, no account',
                  'Works with Webflow, Framer, Shopify, WordPress & Next.js',
                  '$97 One-Leak Repair Sprint: one targeted fix + 30-day re-audit included',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-fg-muted">
                    <span className="text-accent">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              {stats && (
                <p className="mt-6 border-l-2 border-accent pl-4 text-sm text-fg-muted">
                  <span className="font-semibold text-fg">{stats.audit_count} landing pages analyzed</span>
                  {stats.avg_failures_per_page != null && (
                    <> - average {stats.avg_failures_per_page} conversion leaks per page. Live data from the <Link href="/benchmarks" className="text-accent hover:underline">Landing Page Leak Index</Link>.</>
                  )}
                </p>
              )}
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

            <div className="mb-4 rounded-2xl border border-border bg-bg-muted/20 p-5">
              <p className="font-semibold text-fg text-sm">example-startup.com</p>
              <p className="mt-1 text-xs text-fg-muted">{failCount} of {SAMPLE_FINDINGS.length} verified checks failing</p>
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
                  <p className="text-xs leading-5 text-fg-muted">{f.finding}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-fg-muted">
              Illustrative output only. Findings and page URL are fictional.
              Your audit will reflect your actual page and the checks available for it.
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
                { label: 'Message match', desc: 'Ad promise vs. page headline' },
                { label: 'Trust signals', desc: 'Proof visible near the first CTA' },
                { label: 'Mobile CTA', desc: 'Primary action visible on a 375px viewport' },
                { label: 'Load speed', desc: 'Page meets documented loading thresholds' },
                { label: 'CTA clarity', desc: 'One primary action with clear outcome copy' },
                { label: 'SEO foundations', desc: 'Title tag, meta description, and descriptive H1' },
                { label: 'AI readiness', desc: 'Structured signals support machine-readable interpretation' },
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

          </div>
        </section>

        {/* ── 3b. How It Works ── */}
        <section className="border-t border-border px-6 py-14">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-3 text-base font-semibold text-fg">How It Works</h2>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-fg-muted">
              <li>Enter your landing page URL in the field above</li>
              <li>The audit engine fetches and evaluates your page across its core conversion checks and applicable technical checks</li>
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
                  The audit evaluates client-rendered DOM structures and simulates a 375px mobile viewport heuristic to measure element visibility, contrast, and initial-viewport button positioning.
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

        {/* ── 3d. Clinical Transparency ── */}
        <HonestyGrid />

        {/* ── 4. After the audit: repair sprint ── */}
        <section className="border-t border-border px-6 py-14">
          <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-fg md:text-3xl">
                If it fails, the $97 kit gives you one implementation-ready change.
              </h2>
              <p className="mb-6 text-base text-fg-muted leading-7">
                The free audit shows you what is broken and in what order to fix it.
                Pay $97 and receive a tailored implementation kit for one specific failing signal -
                exact copy changes, code snippets, or configuration fixes - sent after successful payment.
                No site access is needed. You implement it yourself or hand it to your developer.
              </p>
              <div className="space-y-2">
                {[
                  'Tailored implementation instructions for one selected finding',
                  'Exact copy, a code snippet, or a configuration change - not generic advice',
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
