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

        {/* 3. What Nebula checks */}
        <section className="section-default">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 grid gap-4 md:grid-cols-2 md:items-end">
              <h2 className="heading-2">What Nebula checks</h2>
              <p className="text-base text-fg-muted md:text-right">
                Observable page conditions. Specific pass standards. Evidence from your HTML.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SIGNALS.map((s) => (
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
