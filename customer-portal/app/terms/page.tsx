import { Metadata } from 'next'
import { formatUsd, getActiveFixPack } from '@/app/lib/public-facts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Terms of Service — Nebula Components',
  description: 'Terms of service for Nebula Components landing page audit and optimization services.',
  alternates: { canonical: 'https://nebulacomponents.shop/terms' },
}

export default function TermsPage() {
  const fixPack = getActiveFixPack()

  return (
    <main id="main-content" role="main" className="min-h-screen bg-bg pt-24 pb-24">
      <div className="mx-auto max-w-2xl px-6">
        <h1 className="text-3xl font-bold tracking-tight text-fg">Terms of Service</h1>
        <p className="mt-2 mb-12 text-sm text-fg-muted">Last updated: July 26, 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-fg">1. Services</h2>
            <p className="text-base leading-7 text-fg-muted">
              Nebula Components provides landing page conversion audits and, when a verified paid
              offer is active, diagnostic materials that customers can use to make their own
              changes. We do not take access to a customer&apos;s site, CMS, or hosting.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-fg">2. Free Audit Service</h2>
            <p className="text-base leading-7 text-fg-muted">
              Our free audit provides a diagnostic analysis of your landing page. By submitting your
              URL and email, you agree to receive audit results via email. We may also send relevant
              follow-up communications, which you can opt out of at any time.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-fg">3. Paid Services</h2>
            {fixPack ? (
              <p className="text-base leading-7 text-fg-muted">
                The current Fix Pack ({formatUsd(fixPack.priceCents)}) is an automated, tailored AI
                prompt pack delivered by email within minutes of payment. The customer or their
                developer implements the fixes; Nebula does not require access to the
                customer&apos;s site, CMS, or hosting. Payment is processed securely through
                Stripe, and the service is fulfilled when the prompt pack is delivered. One
                re-audit may be requested within {fixPack.reAudit.windowDays} days to observe what
                changed and what remains open.
              </p>
            ) : (
              <p className="text-base leading-7 text-fg-muted">
                No verified paid Fix Pack offer is currently available. Any future paid service
                will be described at checkout before payment is accepted.
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-fg">4. Intellectual Property</h2>
            <p className="text-base leading-7 text-fg-muted">
              Our audit methodology and recommendations are proprietary. You retain ownership of your
              landing page content. We grant you a license to use our recommendations for your own
              business purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-fg">5. Limitation of Liability</h2>
            <p className="text-base leading-7 text-fg-muted">
              Nebula Components provides analysis and recommendations based on best practices. We cannot
              guarantee specific conversion results. Our liability is limited to the amount paid for
              services rendered.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-fg">6. Contact</h2>
            <p className="text-base leading-7 text-fg-muted">
              For questions about these terms, contact us at{' '}
              <a href="mailto:hello@nebulacomponents.shop" className="text-accent hover:underline">
                hello@nebulacomponents.shop
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
