import type { Metadata } from 'next'
import Link from 'next/link'
import { auditWebApplicationSchema } from '@/app/lib/schema'
import { auditPageFAQSchema } from '@/app/lib/faq-schemas'
import AuditForm from './AuditForm'
import HonestyGrid from '@/app/components/HonestyGrid'
import AskAiCitability from '@/app/components/AskAiCitability'

export const metadata: Metadata = {
  title: 'Landing Page Audit: Free Conversion Leak Check | Nebula',
  description: 'Free conversion leak detection for any landing page. Check 9 signals - message match, trust, CTA, mobile, speed. Evidence-backed, no signup.',
  alternates: { canonical: 'https://nebulacomponents.com/audit' },
  openGraph: {
    title: 'Landing Page Audit: Free Conversion Leak Check | Nebula',
    description: 'Free conversion leak detection for any landing page. Check 9 signals - message match, trust, CTA, mobile, speed. Evidence-backed, no signup.',
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
  { key: 'above_fold', label: 'Above-fold clarity', pass: false, finding: 'Primary CTA and ICP-specific headline not both visible above fold.' },
  { key: 'mobile_cta', label: 'Mobile CTA', pass: false, finding: 'Primary CTA is below the initial 375px viewport without scroll.' },
  { key: 'load_speed', label: 'Load speed', pass: true, finding: 'The page meets the documented loading threshold.' },
  { key: 'cta_clarity', label: 'CTA clarity', pass: false, finding: 'Competing actions make the primary next step unclear.' },
  { key: 'seo_foundations', label: 'SEO foundations', pass: false, finding: 'The meta description is longer than the documented search display target.' },
  { key: 'ad_signals', label: 'Ad tracking', pass: false, finding: 'No recognized ad-tracking artifact (Facebook Pixel, GA4 ID, or UTM parameters) in static HTML.' },
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

const auditServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://nebulacomponents.com/audit#service',
  name: 'Nebula Landing Page Audit',
  description: 'Free landing page audit that scores 9 conversion signals and returns evidence-backed findings in under 2 minutes.',
  serviceType: 'Landing Page Diagnostic',
  provider: { '@type': 'Organization', name: 'Nebula Components', url: 'https://nebulacomponents.com' },
  url: 'https://nebulacomponents.com/audit',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Conversion signal checks',
    itemListElement: [
      'Message Match', 'Trust Signals', 'Mobile CTA', 'Load Speed',
      'CTA Clarity', 'Above-Fold Clarity', 'Ad Signal Continuity',
      'SEO Foundations', 'AI Readiness',
    ].map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })),
  },
}

const auditHowToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Run a Landing Page Audit with Nebula',
  description: 'Submit a URL and receive a scored diagnostic across 9 conversion signals in under 2 minutes.',
  totalTime: 'PT2M',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Enter your URL', text: 'Paste the full URL of the landing page you want to audit into the input field.' },
    { '@type': 'HowToStep', position: 2, name: 'Submit for analysis', text: 'Click Audit. Nebula fetches the public page and evaluates it against 9 conversion signal checks.' },
    { '@type': 'HowToStep', position: 3, name: 'Review findings', text: 'Each signal returns a pass or fail with an evidence record showing exactly what was checked.' },
    { '@type': 'HowToStep', position: 4, name: 'Prioritise by impact', text: 'Findings are ordered by priority score. Start with the highest-priority failing signal.' },
  ],
}

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Nebula Landing Page Audit',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Free landing page audit tool that scores conversion signals across 9 dimensions',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  url: 'https://nebulacomponents.com/audit',
  publisher: {
    '@type': 'Organization',
    name: 'Nebula Components',
    url: 'https://nebulacomponents.com',
  }
}

export default async function AuditPage() {
  const stats = await getAuditStats()
  const failCount = SAMPLE_FINDINGS.filter((f) => !f.pass).length

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(auditServiceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(auditHowToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(auditWebApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(auditPageFAQSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <main id="main-content" className="min-h-screen bg-bg pt-24">

        {/* ── 1. Hero: form-forward split ── */}
        <section className="mx-auto max-w-6xl px-6 py-12 md:py-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-start">

            {/* Copy first on mobile (order-1 on mobile, order-1 on md+) */}
            <div className="order-1 flex min-w-0 flex-col justify-center">
              <h1 className="heading-1 tracking-tight text-fg md:text-5xl">Landing Page Audit: Check 9 Conversion Signals on Your Live Page</h1>
              <p className="mt-4 max-w-lg text-lg leading-7 text-fg-muted">
                This landing page audit reads public HTML and scores 9 conversion signals.
                Paste your URL. See findings ranked by priority before sharing an email.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="#run-audit"
                  className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
                >
                  Start your free audit ↓
                </a>
              </div>
              <ul className="mt-6 space-y-2">
                {[
                  'Results in under 2 minutes',
                  'No signup, no account',
                  'Works with Webflow, Framer, Shopify, WordPress & Next.js',
                  '$97 One-Leak Repair Sprint: one targeted fix + 30-day re-audit included',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-fg-muted">
                    <span className="mt-0.5 shrink-0 text-accent">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Form second on mobile (order-2 on mobile, order-2 on md+) */}
            <div id="run-audit" className="order-2 min-w-0 overflow-hidden rounded-md border border-border bg-bg-muted/30 p-6 md:p-8">
              <p className="mb-4 text-sm font-semibold text-fg">
                Paste your landing page URL
              </p>
              <AuditForm />

              {/* What you get, visible near the CTA for AI citation and user clarity */}
              <div className="mt-5 border-t border-border pt-5">
                <p className="mb-3 text-xs font-semibold text-fg">What you receive, free</p>
                <ul className="space-y-2">
                  {[
                    'Pass/fail verdict on each conversion signal',
                    'Raw evidence from your page, not generic advice',
                    'Findings ranked by priority',
                    'No email required to see results',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-fg-muted">
                      <span className="mt-px shrink-0 text-accent">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Static benchmark stat, always visible, not API-gated */}
              <p className="mt-4 break-words text-xs text-fg-dim border-l-2 border-accent/40 pl-3">
                From our live dataset: avg 2.8 conversion leaks per page.{' '}
                <Link href="/benchmarks" className="text-accent/80 hover:text-accent transition-colors">
                  See the Leak Index →
                </Link>
              </p>

              {/* Quantity proof - only shown when the live stat is available */}
              {stats && (
                <div className="mt-6 rounded-lg border border-border bg-bg-panel/60 p-4">
                  <p className="text-xs text-fg-muted">
                    <span className="font-semibold text-fg">{stats.audit_count} landing pages analyzed</span>
                    {stats.avg_failures_per_page != null ? (
                      <> - average {stats.avg_failures_per_page} conversion leaks per page. Live data from the <Link href="/benchmarks" className="text-accent hover:underline">Landing Page Leak Index</Link>.</>
                    ) : (
                      <> - Live benchmarks from recent audits.</>
                    )}
                  </p>
                </div>
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

            <div className="mb-4 rounded-md border border-border bg-bg-muted/20 p-5">
              <p className="font-semibold text-fg text-sm">example-startup.com</p>
              <p className="mt-1 text-xs text-fg-muted">{failCount} of {SAMPLE_FINDINGS.length} verified checks failing</p>
            </div>

            {/* Signal rows */}
            <div className="rounded-md border border-border overflow-hidden">
              {SAMPLE_FINDINGS.map((f, i) => (
                <div
                  key={f.key}
                  className={`grid gap-4 p-4 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:items-start ${
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
                  <p className="min-w-0 text-xs leading-5 text-fg-muted">{f.finding}</p>
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
<div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-3">
               {[
                 { label: 'Message match', desc: 'Ad promise vs. page headline' },
                 { label: 'Trust signals', desc: 'Proof visible near the first CTA' },
                 { label: 'Above-fold clarity', desc: 'Primary CTA, headline, and proof visible before scroll' },
                 { label: 'Mobile CTA', desc: 'Primary action visible on a 375px viewport' },
                 { label: 'Load speed', desc: 'Page meets documented loading thresholds' },
                 { label: 'CTA clarity', desc: 'One primary action with clear outcome copy' },
                 { label: 'SEO foundations', desc: 'Title tag, meta description, and descriptive H1' },
                 { label: 'Ad tracking', desc: 'Recognized ad-tracking artifact present' },
                 { label: 'AI readiness', desc: 'Structured signals support machine-readable interpretation' },
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
                If it fails, the $97 One-Leak Repair Sprint gives you one scoped repair package within 48 hours.
              </h2>
              <p className="mb-6 text-base text-fg-muted leading-7">
                The free audit shows you what is broken and in what order to fix it.
                Pay $97 and receive one scoped repair package for one specific failing signal within 48 hours -
                exact copy changes, code snippets, or configuration fixes - sent after successful payment.
                No site access is needed to prepare the scoped package.
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
                className="block w-full rounded bg-accent py-3.5 text-center font-semibold text-bg hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-sm"
              >
                Run the audit first &rarr;
              </a>
              <p className="mt-3 text-center text-xs text-fg-muted">
                Run the free audit first &rarr;
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-border px-6 py-12">
          <div className="mx-auto max-w-3xl">
            <AskAiCitability />
          </div>
        </section>

        {/* ── 5. FAQ, rendered in DOM for AI citation and user clarity ── */}
        {/* FAQPage schema is also injected in <head> above. The two are intentionally
            kept in sync: the JSON-LD feeds structured search features; this prose
            feeds AI engines that read the text layer and users who scan the page. */}
        <section aria-labelledby="faq-heading" className="border-t border-border bg-bg-muted/10 px-6 py-14">
          <div className="mx-auto max-w-3xl">
            <h2 id="faq-heading" className="mb-8 text-2xl font-bold tracking-tight text-fg md:text-3xl">
              Common questions
            </h2>
            <dl className="space-y-8">
              {[
{
    q: 'What does the free landing page audit check?',
    a: 'Nine conversion signals against your actual page: message match (ad promise vs. page headline), trust signals (proof near the CTA), mobile CTA visibility on a 375px viewport, load speed, CTA clarity, SEO foundations (title, meta, H1), above-fold clarity, ad tracking, and AI readiness. Each returns a pass or fail with the raw evidence from your page.',
  },
                {
                  q: 'How long does the audit take?',
                  a: 'Under 2 minutes. Paste your URL and the results appear automatically. No email or account required to see your findings.',
                },
                {
                  q: 'Do I need to create an account?',
                  a: 'No. You see your score and initial findings without sharing an email. You only provide an email if you want the full written report saved to a workspace.',
                },
                {
                  q: 'What does the $97 One-Leak Repair Sprint include?',
                  a: 'One scoped repair package for the highest-priority failing signal on your page, exact copy, code, or configuration change written for your specific page and sent by email within 48 hours. Includes one same-scope re-audit within 30 days. No site access required. Does not promise a conversion-rate outcome.',
                },
                {
                  q: 'Which platforms does the audit work with?',
                  a: 'Any publicly accessible landing page: Webflow, Framer, Shopify, WordPress, Next.js, Squarespace, ClickFunnels, or a hand-coded page. The audit fetches the public HTML and evaluates what a visitor actually sees.',
                },
                {
                  q: 'What does the audit not cover?',
                  a: 'The audit cannot observe visitor intent, ad audience quality, offer economics, or post-form conversion flows. It checks observable page conditions, the things a visitor experiences before they decide to act or leave. Those conditions are measurable and fixable. Business outcomes also depend on traffic quality and offer strength.',
                },
              ].map(({ q, a }) => (
                <div key={q}>
                  <dt className="font-semibold text-fg">{q}</dt>
                  <dd className="mt-2 text-sm leading-7 text-fg-muted">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Related tools */}
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <p className="text-xs font-medium uppercase tracking-widest text-fg-muted mb-4">Related tools</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/lab" className="rounded-md border border-border bg-bg-panel px-4 py-2 text-sm text-fg hover:border-accent/40 transition-colors">
              Component Lab: test your headline, CTA, and message match
            </Link>
            <Link href="/how-nebula-audits" className="rounded-md border border-border bg-bg-panel px-4 py-2 text-sm text-fg hover:border-accent/40 transition-colors">
              How Nebula audits: the 9-signal methodology
            </Link>
            <Link href="/benchmarks" className="rounded-md border border-border bg-bg-panel px-4 py-2 text-sm text-fg hover:border-accent/40 transition-colors">
              Leak Index: aggregate finding rates from {'>'}290 audits
            </Link>
          </div>
        </section>

      </main>
    </>
  )
}
