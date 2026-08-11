import { Metadata } from 'next'
import { formatUsd, getActiveFixPack } from '@/app/lib/public-facts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Terms of Service - Nebula Components',
  description: 'Terms of service for Nebula Components landing page audit and optimization services.',
  alternates: { canonical: 'https://nebulacomponents.com/terms' },
}

export default function TermsPage() {
  const fixPack = getActiveFixPack()

  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 pb-24">
      <div className="mx-auto max-w-2xl px-6">
        <h1 className="text-3xl font-bold tracking-tight text-fg">Terms of Service</h1>
        <p className="mt-2 mb-12 text-sm text-fg-muted">Last updated: August 1, 2026</p>

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
                The current One-Leak Repair Sprint ({formatUsd(fixPack.priceCents)}) covers one
                landing page and one selected audit finding. After payment, you receive a tailored
                implementation kit containing exact copy, a code snippet, or a configuration change.
                You implement it yourself, with your developer, or through your CMS.
                Nebula does not take access to your site, CMS, or hosting. One additional
                same-scope evidence check may be requested within {fixPack.reAudit.windowDays} days
                to verify the fix held. This service does not guarantee conversion lift.
              </p>
            ) : (
              <p className="text-base leading-7 text-fg-muted">
                No verified paid Repair Sprint offer is currently available. Any future paid
                service will be described at checkout before payment is accepted.
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
              <a href="mailto:hello@nebulacomponents.com" className="text-accent hover:underline">
                hello@nebulacomponents.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
