import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Nebula Components',
  description: 'Terms of service for Nebula Components landing page audit and optimization services.',
}

export default function TermsPage() {
  return (
    <div className="page">
      <header className="header" role="banner">
        <div className="header-inner">
          <a href="/" className="logo" aria-label="Nebula Components home">
            <span className="logo-mark" aria-hidden="true">◆</span>
            <span className="logo-text">Nebula</span>
          </a>
        </div>
      </header>

      <main className="legal-page" role="main">
        <div className="legal-content">
          <h1>Terms of Service</h1>
          <p className="legal-updated">Last updated: July 15, 2026</p>

          <section>
            <h2>1. Services</h2>
            <p>
              Nebula Components provides landing page conversion audits and optimization services. 
              Our services include free diagnostic audits and paid implementation packages.
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
              Our Fix Pack ($147) includes implementation of recommended fixes. Payment is processed 
              securely through Stripe. Once we deliver your completed implementation, the service is 
              considered fulfilled.
            </p>
          </section>

          <section>
            <h2>4. Refund Policy</h2>
            <p>
              We offer a 30-day refund policy for the Fix Pack. If you request a refund within 
              30 days of purchase and before we begin implementation, we will refund your payment in full. 
              Once implementation has begun, refunds are offered at our discretion based on work completed.
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
            <h2>6. Limitation of Liability</h2>
            <p>
              Nebula Components provides analysis and recommendations based on best practices. We cannot 
              guarantee specific conversion results. Our liability is limited to the amount paid for 
              services rendered.
            </p>
          </section>

          <section>
            <h2>7. Contact</h2>
            <p>
              For questions about these terms, contact us at{' '}
              <a href="mailto:hello@nebulacomponents.shop">hello@nebulacomponents.shop</a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="footer" role="contentinfo">
        <div className="footer-content">
          <nav aria-label="Footer navigation">
            <a href="/learning-centre">Learning Centre</a>
            <a href="/case-studies">Case Studies</a>
            <a href="/pricing">Pricing</a>
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms">Terms</a>
          </nav>
          <p className="footer-copy">© 2026 Nebula Components. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
