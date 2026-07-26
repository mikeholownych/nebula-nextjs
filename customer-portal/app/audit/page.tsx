import type { Metadata } from 'next'
import { getPublicClaim } from '@/app/lib/evidence-atoms'
import { auditPageFAQSchema } from '@/app/lib/faq-schemas'
import AuditForm from './AuditForm'

export const metadata: Metadata = {
  title: 'Find the Leak — Free Landing Page Diagnosis | Nebula Components',
  description: "See if your page is what's killing your ads. Evidence-backed audit in under 2 minutes — no signup required.",
  alternates: { canonical: 'https://nebulacomponents.shop/audit' },
  openGraph: {
    title: 'Find the Leak — Free Landing Page Diagnosis | Nebula Components',
    description: "See if your page is what's killing your ads. Evidence-backed audit in under 2 minutes — no signup required.",
    url: 'https://nebulacomponents.shop/audit',
    siteName: 'Nebula Components',
    locale: 'en_US',
    type: 'website',
  },
}

export default function AuditPage() {
  const auditMethodClaim = getPublicClaim('claim-7-point-diagnosis', {
    route: '/audit',
    slot: 'audit-method-summary',
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(auditPageFAQSchema) }}
      />
      <main id="main-content" role="main" className="min-h-screen bg-bg pt-24">
      {/* Hero Section */}
      <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6 py-16 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Landing Page Leak Check
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-fg md:text-5xl">
          See if the page is what's killing your ads.
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-lg text-fg-muted">
          Drop your URL. Get evidence-backed findings in under 2 minutes. No email required to see results.
        </p>

        {/* Audit Form */}
        <AuditForm />
      </section>

      {/* What You'll Get */}
      <section className="border-t border-border px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-xl font-bold text-fg">
            What You'll Get
          </h2>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-3xl">📊</div>
              <h3 className="mb-1 font-semibold text-fg text-sm">Evidence-Based Score</h3>
              <p className="text-xs text-fg-muted">
                Not a guess — actual checks for headline, CTAs, trust, speed
              </p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl">🎯</div>
              <h3 className="mb-1 font-semibold text-fg text-sm">Prioritized Fixes</h3>
              <p className="text-xs text-fg-muted">
                Quick wins today vs major projects for later
              </p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl">💰</div>
              <h3 className="mb-1 font-semibold text-fg text-sm">Conversion Focus</h3>
              <p className="text-xs text-fg-muted">
                Every finding ties back to reducing friction
              </p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl">✓</div>
              <h3 className="mb-1 font-semibold text-fg text-sm">No Commitment</h3>
              <p className="text-xs text-fg-muted">
                Start free. Email only for full report download
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border bg-bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-xl font-bold text-fg">
            How It Works
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-bg">
                1
              </div>
              <h3 className="mb-1 font-semibold text-fg">Enter URL</h3>
              <p className="text-sm text-fg-muted">
                Drop any landing page URL
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-bg">
                2
              </div>
              <h3 className="mb-1 font-semibold text-fg">We Analyze</h3>
              <p className="text-sm text-fg-muted">
                7 conversion signals in parallel
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-bg">
                3
              </div>
              <h3 className="mb-1 font-semibold text-fg">Get Results</h3>
              <p className="text-sm text-fg-muted">
                Scored findings + what to fix first
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What the audit checks */}
      <section className="border-t border-border px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-lg font-bold text-fg">
            What the audit checks
          </h2>
          {auditMethodClaim ? (
            <p
              className="mb-4 text-sm text-fg-muted leading-7"
              data-claim-id={auditMethodClaim.claimId}
              data-evidence-ids={auditMethodClaim.evidenceIds.join(',')}
            >
              {auditMethodClaim.text}
            </p>
          ) : null}
          <p className="text-sm text-fg-muted leading-7">
            Most founders spending on Google or Meta ads assume low conversion rates are an ad problem. 
            Very often the bottleneck is on the landing page: a headline that doesn't match the ad copy, 
            a form that appears before any trust is built, or a mobile layout where the primary CTA 
            is hidden on the first scroll.
          </p>
        </div>
      </section>
    </main>
    </>
  )
}
