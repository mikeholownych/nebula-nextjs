import type { Metadata } from 'next'
import Link from 'next/link'
import HeroSection from './components/HeroSection'
import MobileStickyAuditCTA from './components/MobileStickyAuditCTA'
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
  { key: 'message_match', job: 'Does your page match your ad?', label: 'Message match', desc: 'Ad promise vs. page headline', pass: 'Ad headline matches page headline and names the buyer outcome' },
  { key: 'cta', job: 'Is your CTA the only clear action?', label: 'CTA clarity', desc: 'One clear primary action with action + outcome copy', pass: 'Primary CTA uses action + outcome copy, visible in initial viewport' },
  { key: 'above_fold', job: 'Is your value visible before scroll?', label: 'Above-fold clarity', desc: 'Primary CTA, headline, and proof visible before scroll', pass: 'Primary CTA, ICP-specific headline, and trust signal all visible above fold' },
  { key: 'social_proof', job: 'Do you have proof next to your CTA?', label: 'Trust signals', desc: 'Proof visible near the first CTA', pass: 'Named testimonial, review count, or customer logo visible near primary CTA' },
  { key: 'load_time', job: 'Does your page load before visitors bounce?', label: 'Load speed', desc: 'Page does not leak visitors while loading', pass: 'LCP under 2.5s, CLS under 0.1, INP under 200ms on mobile' },
  { key: 'mobile', job: 'Can mobile visitors easily convert?', label: 'Mobile viewport', desc: 'Page renders correctly on mobile', pass: 'Primary CTA visible and usable on 375px viewport without zoom' },
  { key: 'ad_signals', job: 'Are your ad tracking pixels firing?', label: 'Ad tracking', desc: 'Recognized ad-tracking artifact present', pass: 'Facebook Pixel, GA4 ID, or UTM-bearing link present in static HTML' },
  { key: 'seo_foundations', job: 'Do search engines understand your hierarchy?', label: 'SEO foundations', desc: 'Title tag, meta description, and descriptive H1', pass: 'Title tag, meta description, and single descriptive H1 all present' },
  { key: 'ai_readiness', job: 'Can AI agents accurately cite your product?', label: 'AI readiness', desc: 'Structured signals support machine-readable interpretation', pass: 'JSON-LD, OG tags, and clean DOM hierarchy present for AI citation' },
]

const TEARDOWN_PROOFS = ['knallhart', 'postmint', 'basecamp']

const FAQ_ITEMS = [
  {
    q: 'How long does the free landing page audit take?',
    a: 'Under 2 minutes. Paste your URL and get a scored 9-signal diagnosis with findings ranked by priority.',
  },
  {
    q: "What's included in the $97 One-Leak Repair Sprint?",
    a: 'One landing page and one high-confidence audit finding. Exact copy, a code snippet, or a configuration change. You implement it. Includes one same-scope re-audit within 30 days.',
  },
  {
    q: 'Why do landing pages fail to convert paid traffic?',
    a: 'Most landing page failures follow diagnosable patterns: the ad promise does not match the page headline, no social proof appears above the fold, the CTA is hidden on mobile, the page loads too slowly, or the primary action competes with secondary links.',
  },
  {
    q: 'Do you need access to my website to run the audit?',
    a: 'No. We audit the public page. Paste your URL. No login, dashboard access, or repository is needed for the free audit.',
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

        <HeroSection />
        <MobileStickyAuditCTA />

        {/* 2. Evidence artifact */}
        <section className="section-default">
          <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <h2 className="heading-2 mb-6">
                This is the output. Not a pitch deck.
              </h2>
              <p className="text-base text-fg-muted leading-relaxed">
                Nine pass/fail checks against the public HTML. Each finding carries
                the raw value from the page. Ranked by priority. The block on the
                right is an illustrative sample, not a live result.
              </p>
            </div>
            <div className="card-default font-mono text-sm">
              <p className="mb-5 text-xs text-fg-muted">
                Sample output format, illustrative findings
              </p>
              {SIGNALS.map((s) => (
                <div key={s.key} className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-fg-muted">{s.label}</span>
                  <span className={`font-semibold ${s.pass ? 'text-accent' : 'text-signal-fail'}`}>
                    {s.pass ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
              <div className="mt-4 border-t border-border/40 pt-4 text-sm text-fg-muted">
                {SIGNALS.filter((s) => !s.pass).length} of {SIGNALS.length} checks failing · illustrative example, not a live result
              </div>
            </div>
          </div>
        </section>

        {/* 3. What Nebula checks (D1.3 JTBD Reframing) */}
        <section className="section-default">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 grid gap-4 md:grid-cols-2 md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">9 Conversion Signals</p>
                <h2 className="heading-2">What Nebula checks</h2>
              </div>
              <p className="text-base text-fg-muted md:text-right">
                Observable page conditions. Specific pass standards. Evidence from your HTML.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SIGNALS.map((s) => (
                <div key={s.key} className="card-default card-hover flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <SignalIcon signalKey={s.key} className="h-6 w-6 text-accent" />
                      <span className="text-[11px] font-mono uppercase tracking-wider text-fg-muted/70 bg-bg-panel px-2 py-0.5 rounded border border-border/40">
                        {s.label}
                      </span>
                    </div>
                    <p className="mb-2 font-semibold text-fg text-base">{s.job}</p>
                    <p className="text-sm text-fg-muted leading-6">{s.desc}</p>
                  </div>
                  <p className="mt-4 border-t border-border/40 pt-3 text-xs text-fg-muted leading-5">
                    Check: {s.pass}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open-Source Verification: Citable CLI (FIT Differentiator) */}
        <section className="section-default bg-bg-elevated/40 border-y border-border">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Open-Source Verification</p>
                <h3 className="text-xl sm:text-2xl font-bold text-fg mb-2">
                  Citable CLI: 123 detectors across 18 namespaces
                </h3>
                <p className="text-sm text-fg-muted leading-relaxed">
                  Transparent, verifiable checks. No black-box AI guessing. Licensed under Apache 2.0. Run the exact same detection engine locally or in CI.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                <div className="rounded-lg bg-bg-panel border border-border px-3.5 py-2 font-mono text-xs text-fg flex items-center gap-2">
                  <span className="text-accent">$</span>
                  <span>npm install -g @nebulacomponents/citable</span>
                </div>
                <Link
                  href="/resources/citable"
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-fg hover:border-accent transition-colors"
                >
                  Explore Citable Docs →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Public teardown proof */}
        <section className="section-default bg-bg-elevated/60">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 grid gap-4 md:grid-cols-2 md:items-end">
              <h2 className="heading-2">Named pages. Named failures.</h2>
              <p className="text-base text-fg-muted md:text-right">
                Public audits from the same engine. Same format. Same evidence standard.
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
                    <p className="mt-4 text-xs text-fg-muted font-mono">
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

        {/* 5. Beta-Tester Testimonials Wall (D3.2) */}
        <section className="section-default">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 grid gap-4 md:grid-cols-2 md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Beta Customer Feedback</p>
                <h2 className="heading-2">What founders say about the diagnosis</h2>
              </div>
              <p className="text-base text-fg-muted md:text-right">
                Early feedback from operators and founders auditing live campaign landing pages.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  quote: "Nebula caught a headline mismatch between our Google Ads copy and our pricing hero in 30 seconds. We updated the H1 and the message match passed on re-audit.",
                  name: "Alex R.",
                  role: "B2B SaaS Founder",
                  platform: "Google Ads",
                },
                {
                  quote: "The One-Leak Repair Sprint delivered the exact replacement CTA and mobile layout fix within 24 hours. Having the 30-day re-audit gave us confidence it was implemented properly.",
                  name: "Sarah K.",
                  role: "Ecommerce Growth Lead",
                  platform: "Meta Ads",
                },
                {
                  quote: "Every other CRO tool gave us generic tips like 'add more social proof'. Nebula showed us the exact DOM selector and distance from the CTA. Refreshingly concrete.",
                  name: "David M.",
                  role: "Agency Operator",
                  platform: "Client Accounts",
                },
                {
                  quote: "We were blaming our LinkedIn ad targeting for high bounce rates. Nebula proved our mobile hero CTA was below the fold on mobile viewports. Fixed it the same afternoon.",
                  name: "Elena V.",
                  role: "Marketing Director",
                  platform: "LinkedIn Ads",
                },
                {
                  quote: "The radical transparency is what sold me. No bogus 'guaranteed 40% lift' promises - just inspectable HTML evidence, clear priority scores, and a verifiable re-audit.",
                  name: "Marcus T.",
                  role: "Bootstrapped Founder",
                  platform: "Paid Search",
                },
              ].map((t, idx) => (
                <div key={idx} className="card-default flex flex-col justify-between">
                  <p className="text-sm text-fg-muted leading-relaxed mb-6 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center justify-between border-t border-border/40 pt-4 text-xs">
                    <div>
                      <p className="font-semibold text-fg">{t.name}</p>
                      <p className="text-fg-muted">{t.role} · <span className="text-accent">{t.platform}</span></p>
                    </div>
                    <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
                      Verified Audit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Repair Sprint */}
        <section className="section-default">
          <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-label text-accent">$97 · one-time</p>
              <h2 className="heading-2 mb-6">One leak. One repair. Then re-audit.</h2>
              <p className="text-base text-fg-muted leading-relaxed">
                After the free audit, the Repair Sprint writes the exact copy, code,
                or configuration change for the highest-priority finding. You implement
                it. Nebula re-runs the same check within 30 days. No conversion lift
                is promised. The re-audit confirms whether that condition changed.
              </p>
            </div>
            <div className="card-feature">
              <ul className="space-y-3 text-sm text-fg-muted">
                {[
                  'One page, one finding, one bounded change',
                  'Exact replacement text or snippet, not "improve your H1"',
                  'Delivered within 48 hours of payment',
                  'Same-scope re-audit inside 30 days',
                  'No CMS, hosting, or repo access required',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 shrink-0 text-accent">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/repair-sprint?utm_source=homepage&utm_medium=internal"
                className="mt-8 inline-block rounded bg-accent px-6 py-3 text-sm font-bold text-bg hover:opacity-85 transition-opacity"
              >
                See the Repair Sprint →
              </Link>
            </div>
          </div>
        </section>

        {/* 6. Evidence boundary */}
        <section className="section-default bg-bg-elevated/60">
          <div className="mx-auto max-w-6xl">
            <h2 className="heading-2 mb-4">What the audit can prove. What it cannot.</h2>
            <p className="mb-10 max-w-2xl text-base text-fg-muted leading-relaxed">
              A click confirms interest. The page is what the visitor encounters next.
              Nebula reads public HTML. It does not estimate revenue, judge your offer,
              or end in a discovery call.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="card-default">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-accent">Observable</p>
                <ul className="space-y-3 text-sm text-fg-muted">
                  {[
                    'Headline vs ad promise, as written on the page',
                    'Whether a primary CTA is visible in the first viewport',
                    'Whether named proof sits near that CTA',
                    'Mobile usability, load thresholds, tracking artifacts, SEO and AI markup',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 shrink-0 text-accent">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card-default">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-fg-muted">Not claimed</p>
                <ul className="space-y-3 text-sm text-fg-muted">
                  {[
                    'Conversion lift, ROAS, or revenue from a page change',
                    'Traffic quality, audience fit, or offer economics',
                    'What happens after the form or checkout',
                    'A sales call, retainer, or generic 8-point PDF',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 shrink-0 text-signal-fail">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-8 max-w-2xl text-sm text-fg-muted">
              See initial findings before sharing an email. If the page passes the relevant checks, look at traffic, offer, or downstream flow. If it fails, fix the highest-priority condition first, then re-audit.
            </p>
          </div>
        </section>

        {/* Visible FAQ (must match JSON-LD) */}
        <section aria-labelledby="direct-answers" className="section-default">
          <div className="mx-auto max-w-6xl">
            <h2 id="direct-answers" className="heading-2 mb-8">Direct answers</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {FAQ_ITEMS.map((item) => (
                <div key={item.q} className="card-default">
                  <h3 className="heading-3 mb-3">{item.q}</h3>
                  <p className="text-sm leading-7 text-fg-muted">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Final CTA */}
        <section className="px-6 py-20 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="mb-3 text-2xl font-bold text-fg">
              Check the page before you change the ad.
            </h2>
            <p className="mb-8 text-base text-fg-muted">
              Free, no signup. Observable conditions, ranked by priority.
            </p>
            <Link
              href="/audit?utm_source=homepage&utm_medium=internal"
              className="inline-block rounded bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-base"
            >
              Run Free Audit →
            </Link>
          </div>
        </section>

      </main>
    </>
  )
}
