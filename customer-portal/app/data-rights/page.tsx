import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Rights — Nebula Components',
  description: 'Exercise your GDPR and CCPA data rights. Request access, deletion, or export of your personal data.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/data-rights',
  },
};

export default function DataRightsPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-16 pb-24">
      <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
        Your Data Rights
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-10">
        GDPR (EU) & CCPA (California) Compliance
      </p>

      <section className="mt-8">
        <div className="prose prose-invert max-w-none">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Your Rights
          </h2>
          
          <p className="text-[var(--text-secondary)] mb-6">
            Under GDPR (for EU residents) and CCPA (for California residents), you have the right to:
          </p>

          <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-3 mb-8">
            <li><strong>Access</strong> — Request a copy of all personal data we hold about you</li>
            <li><strong>Rectification</strong> — Correct inaccurate or incomplete data</li>
            <li><strong>Erasure</strong> — Request deletion of your personal data</li>
            <li><strong>Portability</strong> — Receive your data in a machine-readable format</li>
            <li><strong>Restriction</strong> — Limit how we use your data</li>
            <li><strong>Objection</strong> — Object to processing for direct marketing</li>
            <li><strong>Withdrawal of Consent</strong> — Withdraw consent at any time</li>
          </ul>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            How to Exercise Your Rights
          </h2>

          <p className="text-[var(--text-secondary)] mb-6">
            Send your request to:
          </p>

          <div className="p-6 bg-[var(--bg-panel)] border border-white/5 rounded-xl mb-8">
            <p className="text-[var(--text-secondary)]">
              <strong>Email:</strong>{' '}
              <a
                href="mailto:privacy@nebulacomponents.shop"
                className="text-[var(--accent)] font-semibold hover:underline"
              >
                privacy@nebulacomponents.shop
              </a>
            </p>
            <p className="text-[var(--text-secondary)] mt-2">
              <strong>Subject line:</strong> Data Rights Request — [Your Email]
            </p>
            <p className="text-[var(--text-muted)] text-sm mt-3 mb-0">
              We verify your identity before processing. Response time: 30 days (GDPR) / 45 days (CCPA).
            </p>
          </div>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            What We&apos;ll Need
          </h2>

          <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2 mb-8">
            <li>Your email address (used with our services)</li>
            <li>Type of request (access, delete, export, correct)</li>
            <li>Optional: specific data points you&apos;re concerned about</li>
          </ul>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Data Retention Periods
          </h2>

          <table className="w-full text-[var(--text-secondary)] mb-8">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 font-semibold">Data Type</th>
                <th className="text-left py-3 font-semibold">Retention</th>
                <th className="text-left py-3 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="py-3">Email (audit delivery)</td>
                <td className="py-3">90 days post-delivery</td>
                <td className="py-3">Follow-up, support</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3">Payment records</td>
                <td className="py-3">7 years</td>
                <td className="py-3">Tax/regulatory</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3">Analytics (anonymized)</td>
                <td className="py-3">26 months</td>
                <td className="py-3">Product improvement</td>
              </tr>
              <tr>
                <td className="py-3">Cookie consent</td>
                <td className="py-3">Until withdrawn</td>
                <td className="py-3">Compliance</td>
              </tr>
            </tbody>
          </table>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Third-Party Services
          </h2>

          <p className="text-[var(--text-secondary)] mb-4">
            We use these services with your data:
          </p>

          <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2 mb-8">
            <li><strong>Stripe</strong> — Payment processing (PCI-DSS compliant)</li>
            <li><strong>SendGrid</strong> — Email delivery (transactional)</li>
            <li><strong>Google Analytics</strong> — Website analytics (anonymized)</li>
          </ul>

          <p className="text-[var(--text-secondary)]">
            To request deletion from these services, contact us and we&apos;ll coordinate on your behalf.
          </p>
        </div>
      </section>
    </div>
  );
}
