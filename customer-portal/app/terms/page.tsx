import { Metadata } from 'next'
import { formatUsd, getActiveFixPack } from '@/app/lib/public-facts'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Terms of Service — Nebula Components',
  description: 'Terms of service for Nebula Components landing page audit and optimization services.',
  alternates: { canonical: 'https://nebulacomponents.shop/terms' },
}

export default function TermsPage() {
  const fixPack = getActiveFixPack()

  return (
    <div className="page">
      <main className="legal-page" role="main">
        <div className="legal-content">
          <h1>Terms of Service</h1>
          <p className="legal-updated">Last updated: July 26, 2026</p>

          <section>
            <h2>1. Services</h2>
            <p>
              Nebula Components provides landing page conversion audits and, when a verified paid
              offer is active, diagnostic materials that customers can use to make their own
              changes. We do not take access to a customer&apos;s site, CMS, or hosting.
            </p>
          </section>

          <section>
            <h2>2. Free Audit Service</h2>
            <p>
              Our free audit provides a diagnostic analysis of your landing page. By submitting your 
              URL and email, you agree to receive audit results via email. We may also send relevant 
              follow-up communications, which you can opt out of at any time.
            </p>
          </section>

          <section>
            <h2>3. Paid Services</h2>
            {fixPack ? (
              <p>
                The current Fix Pack ({formatUsd(fixPack.priceCents)}) is an automated, tailored AI
                prompt pack delivered by email within minutes of payment. The customer or their
                developer implements the fixes; Nebula does not require access to the
                customer&apos;s site, CMS, or hosting. Payment is processed securely through
                Stripe, and the service is fulfilled when the prompt pack is delivered. One
                re-audit may be requested within {fixPack.reAudit.windowDays} days to observe what
                changed and what remains open.
              </p>
            ) : (
              <p>
                No verified paid Fix Pack offer is currently available. Any future paid service
                will be described at checkout before payment is accepted.
              </p>
            )}
          </section>

          <section>
            <h2>4. Intellectual Property</h2>
            <p>
              Our audit methodology and recommendations are proprietary. You retain ownership of your 
              landing page content. We grant you a license to use our recommendations for your own 
              business purposes.
            </p>
          </section>

          <section>
            <h2>5. Limitation of Liability</h2>
            <p>
              Nebula Components provides analysis and recommendations based on best practices. We cannot 
              guarantee specific conversion results. Our liability is limited to the amount paid for 
              services rendered.
            </p>
          </section>

          <section>
            <h2>6. Contact</h2>
            <p>
              For questions about these terms, contact us at{' '}
              <a href="/about">hello{'\u0040'}nebulacomponents.shop</a>.
            </p>
          </section>
        </div>
      </main>

    </div>
  )
}
