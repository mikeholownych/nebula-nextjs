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
            <p>
              The One-Leak Repair Sprint ($97) covers one landing page and one high-confidence,
              buyer-approved page-level repair selected from the audit. It includes baseline evidence,
              bounded implementation, production verification, a same-scope re-audit, and one additional
              same-scope evidence check within 30 days.
            </p>
            <p>
              The service excludes full redesigns, multiple pages, backend application logic, analytics
              migrations, and paid third-party tools. You must approve the scope before implementation and
              provide temporary collaborator access or approve a patch handoff. Never send passwords by email.
            </p>
          </section>

          <section>
            <h2>4. Refund Policy</h2>
            <p>
              We offer a full refund before work begins if we cannot safely implement a bounded repair on
              your page or if you request cancellation before implementation starts. Once implementation
              has begun, refunds are offered at our discretion based on work completed.
            </p>
          </section>

          <section>
            <h2>5. Intellectual Property</h2>
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
