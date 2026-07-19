import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Nebula Components',
  description: 'Nebula Components privacy policy. How we collect, use, and protect your data. GDPR and CCPA compliant.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/privacy-policy',
  },
}

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-16 pb-24">
      <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
        Privacy Policy
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-10">
        Last updated: July 12, 2026
      </p>

      <p className="text-[var(--text-secondary)] mb-6">
        Nebula Components (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the website nebulacomponents.shop and provides landing page audit services. This privacy policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
          Information We Collect
        </h2>

        <h3 className="text-lg font-semibold text-[var(--text-secondary)] mt-8 mb-3">
          Information You Provide
        </h3>
        <p className="text-[var(--text-secondary)] mb-4">
          We collect information you voluntarily provide when you:
        </p>
        <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2 mb-6">
          <li>Submit a landing page URL for audit</li>
          <li>Provide your email address for audit delivery</li>
          <li>Purchase a Fix Pack or other services</li>
          <li>Contact us via email or web form</li>
          <li>Subscribe to our newsletter or updates</li>
        </ul>

        <p className="text-[var(--text-secondary)] mb-3 font-semibold">
          Personal information collected includes:
        </p>
        <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
          <li>Email address</li>
          <li>Landing page URL (for audit purposes only)</li>
          <li>Payment information (processed securely via Stripe; we don&apos;t store card numbers)</li>
          <li>Optional: name, role, company, monthly ad spend</li>
        </ul>

        <h3 className="text-lg font-semibold text-[var(--text-secondary)] mt-10 mb-3">
          Information Collected Automatically
        </h3>
        <p className="text-[var(--text-secondary)] mb-4">
          When you visit our website, we may automatically collect:
        </p>
        <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
          <li>Browser type and version</li>
          <li>Operating system</li>
          <li>Pages visited and time spent</li>
          <li>Referring website</li>
          <li>IP address (anonymized for analytics)</li>
          <li>Device type (mobile/desktop)</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
          How We Use Your Information
        </h2>
        <p className="text-[var(--text-secondary)] mb-4">
          We use the information we collect to:
        </p>
        <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
          <li>Deliver your free landing page audit to your email</li>
          <li>Process payments for Fix Packs and services</li>
          <li>Send transactional emails (audit delivery, purchase confirmation)</li>
          <li>Respond to your inquiries and support requests</li>
          <li>Improve our website and services through analytics</li>
          <li>Send marketing communications (only if you opt-in)</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
          Cookies and Tracking Technologies
        </h2>
        <p className="text-[var(--text-secondary)] mb-4">
          We use cookies and similar technologies to:
        </p>
        <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
          <li>Remember your cookie preferences</li>
          <li>Analyze website traffic (Google Analytics)</li>
          <li>Remember your session state</li>
        </ul>

        <p className="text-[var(--text-secondary)] mt-6 mb-4">
          <strong>Your cookie choices:</strong> When you first visit our site, you can accept or decline analytics cookies. We respect your choice and store it in your browser&apos;s local storage.
        </p>

        <p className="text-[var(--text-secondary)]">
          <strong>Google Analytics:</strong> We use Google Analytics to understand how visitors use our website. You can opt out using the{' '}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] font-semibold hover:underline"
          >
            Google Analytics Opt-out Browser Add-on
          </a>.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
          Data Sharing and Disclosure
        </h2>
        <p className="text-[var(--text-secondary)] mb-4 font-semibold">
          We do NOT sell, rent, or trade your personal information.
        </p>
        <p className="text-[var(--text-secondary)] mb-4">
          We may share your information only with:
        </p>
        <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
          <li><strong>Stripe</strong> — for secure payment processing (they handle your card data; we don&apos;t store it)</li>
          <li><strong>Email service providers</strong> — to deliver your audit and transactional emails</li>
          <li><strong>Legal authorities</strong> — if required by law or to protect our rights</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
          Data Retention
        </h2>
        <p className="text-[var(--text-secondary)] mb-4">
          We retain your personal information only as long as necessary:
        </p>
        <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
          <li>Email addresses for audit delivery: retained for service delivery + 90 days for follow-up (unless you request deletion)</li>
          <li>Payment records: retained for 7 years as required by tax and accounting regulations</li>
          <li>Analytics data: aggregated and anonymized after 26 months</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
          Your Rights (GDPR &amp; CCPA)
        </h2>
        <p className="text-[var(--text-secondary)] mb-4">
          Depending on your location, you have the right to:
        </p>
        <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
          <li><strong>Access</strong> — request a copy of your personal data</li>
          <li><strong>Rectification</strong> — correct inaccurate data</li>
          <li><strong>Erasure</strong> — request deletion of your data</li>
          <li><strong>Portability</strong> — receive your data in a portable format</li>
          <li><strong>Opt-out</strong> — unsubscribe from marketing emails at any time</li>
          <li><strong>Do Not Sell</strong> — we do NOT sell your data, so this right is automatically honored</li>
        </ul>
        <p className="text-[var(--text-secondary)] mt-6">
          To exercise these rights, contact us at{' '}
          <a
            href="/about"
            className="text-[var(--accent)] font-semibold hover:underline"
          >
            privacy{'\u0040'}nebulacomponents.shop
          </a>. We respond within 30 days.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
          Data Security
        </h2>
        <p className="text-[var(--text-secondary)] mb-4">
          We implement appropriate security measures:
        </p>
        <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
          <li>HTTPS encryption for all data transmission</li>
          <li>Secure payment processing via Stripe (PCI-DSS compliant)</li>
          <li>Access controls and authentication</li>
          <li>Regular security monitoring</li>
        </ul>
        <p className="text-[var(--text-secondary)] mt-6">
          However, no internet transmission is 100% secure. We cannot guarantee absolute security.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
          Third-Party Links
        </h2>
        <p className="text-[var(--text-secondary)]">
          Our website may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies before providing personal information.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
          Children&apos;s Privacy
        </h2>
        <p className="text-[var(--text-secondary)]">
          Our services are not directed to individuals under 16. We do not knowingly collect personal information from children. If you believe we have collected data from a child, contact us immediately.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
          Changes to This Policy
        </h2>
        <p className="text-[var(--text-secondary)]">
          We may update this privacy policy periodically. We will notify you of material changes by posting the new policy on this page with an updated &quot;Last updated&quot; date. Continued use of our website constitutes acceptance of the updated policy.
        </p>
      </section>

      <div className="mt-12 p-6 bg-[var(--bg-panel)] border border-white/5 rounded-xl">
        <h3 className="text-lg font-semibold text-[var(--text-secondary)] mt-0 mb-3">
          Contact Us
        </h3>
        <p className="text-[var(--text-secondary)] mb-3">
          For questions about this privacy policy or to exercise your rights:
        </p>
        <p className="text-[var(--text-secondary)] mb-2">
          <strong>Email:</strong>{' '}
          <a
            href="/about"
            className="text-[var(--accent)] font-semibold hover:underline"
          >
            privacy{'\u0040'}nebulacomponents.shop
          </a>
        </p>
        <p className="text-[var(--text-secondary)]">
          <strong>Response time:</strong> Within 30 days (typically 2-5 business days)
        </p>
      </div>
    </div>
  )
}
