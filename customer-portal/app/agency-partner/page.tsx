import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'White-Label Landing Page Audits — Agency Partner Program | Nebula',
  description: 'Resell Nebula audits under your own brand. No development. No compliance overhead. $497/mo includes white-label delivery, compliance docs, and dedicated support for your regulated clients.',
  openGraph: {
    title: 'Agency Partner Program — White-Label Audits',
    description: 'Sell triggered audits under your brand. $497/mo. No dev. Compliance-ready for regulated clients.',
    type: 'website',
  },
}

const features = [
  {
    title: 'White-label audit engine',
    description: 'Branded as your agency. Your logo, your domain, your email delivery. No Nebula mention.',
  },
  {
    title: 'Compliance documentation pack',
    description: 'GDPR data processing agreement, SOC 2 controls mapping, HIPAA BAA template, EU AI Act risk documentation, DORA audit letters. Ready for your client\'s legal team.',
  },
  {
    title: 'Multi-model support',
    description: 'Claude, OpenAI, Gemini, Mistral. Let your client choose the model that meets their residency and compliance requirements.',
  },
  {
    title: 'Immutable audit trails',
    description: 'Every inference call logged. Tamper-evident. Production-ready for regulator review.',
  },
  {
    title: 'Trigger-aware outreach pipeline',
    description: 'Pre-built lead detection for ad bleed, competitor launches, funding announcements, and 6 other buying triggers.',
  },
  {
    title: 'Dedicated support',
    description: 'Direct line to our ops team. Average response <30 min. We handle compliance questions so you don\'t have to.',
  },
]

const complianceBadges = [
  'SOC 2 controls mapped',
  'GDPR DPIA-ready',
  'HIPAA BAA template',
  'EU AI Act risk docs',
  'DORA audit letters',
]

const complianceDetails = [
  {
    icon: '🔐',
    title: 'Data sovereignty',
    description: 'Choose model provider per client. On-prem or private cloud options for regulated workloads. Full residency control.',
  },
  {
    icon: '📋',
    title: 'Audit-ready logs',
    description: 'Every inference call logged with model, timestamp, input hash, and output hash. Tamper-evident. Produces on demand.',
  },
  {
    icon: '⚖️',
    title: 'EU AI Act 2026',
    description: 'High-risk system documentation. Human-in-the-loop controls. Data lineage logs. Built for August 2026 enforcement.',
  },
  {
    icon: '🏥',
    title: 'HIPAA-ready',
    description: 'Signed BAA, encryption at rest and in transit, access controls, audit trails. PHI never touches an unapproved API.',
  },
]

export default function AgencyPartnerPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="flex gap-4 flex-wrap text-sm mb-6">
          <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
            ← Free audit
          </a>
          <a href="/checkout" className="text-blue-400 hover:text-blue-300 transition-colors">
            $147 Fix Pack
          </a>
          <a href="/growth-launch" className="text-orange-400 hover:text-orange-300 transition-colors">
            🔥 $997 Growth Launch
          </a>
          <a href="/ai-ops-retainer" className="text-blue-400 hover:text-blue-300 transition-colors">
            $1,497 Retainer
          </a>
        </nav>

        {/* Hero Section */}
        <section className="bg-[#0a0a0a] border-2 border-blue-500 rounded-xl p-6 mb-4">
          <span className="inline-block bg-blue-900/50 text-blue-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            Agency Partner Program
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-4 tracking-tight">
            Sell triggered audits under your brand.
          </h1>
          <p className="text-gray-400 mt-3 text-base">
            Your agency lands the client. We power the audit engine — white-labeled, compliance-ready, and built for the regulated clients other vendors can&apos;t quote.
          </p>

          {/* Pricing */}
          <div className="mt-6">
            <span className="text-5xl font-extrabold text-blue-400">$497</span>
            <span className="text-lg text-gray-500">/month</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            No setup fee. Cancel anytime. Includes all compliance documentation.
          </p>

          {/* CTA */}
          <a
            href="https://buy.stripe.com/aFa8wPc2o7YM9613Ro43S0d"
            className="block w-full bg-white text-black font-bold text-center py-4 px-6 rounded-lg mt-4 hover:bg-gray-200 transition-colors"
          >
            Become a partner →
          </a>
          <p className="text-xs text-gray-500 text-center mt-3">
            White-label audits, compliance docs, dedicated support. First 14 days free.
          </p>
        </section>

        {/* Features Section */}
        <section className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">What&apos;s included</h2>
          <ul className="space-y-0">
            {features.map((feature, index) => (
              <li
                key={index}
                className="py-3 border-b border-gray-800 last:border-b-0 flex gap-3"
              >
                <span className="text-blue-400 font-bold shrink-0">→</span>
                <div>
                  <strong className="text-gray-100">{feature.title}</strong>
                  <span className="text-gray-400"> — {feature.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Compliance Section */}
        <section className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 mb-4">
          <h2 className="text-xl font-bold mb-2">Compliance that closes regulated clients</h2>
          <p className="text-sm text-gray-500 mb-4">
            Most agencies can&apos;t sell AI services to healthcare, finance, or EU firms because their tool chain is a black box. Here&apos;s what we provide:
          </p>

          {/* Compliance Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {complianceBadges.map((badge, index) => (
              <span
                key={index}
                className="bg-emerald-900/30 border border-emerald-700/50 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-md"
              >
                ✓ {badge}
              </span>
            ))}
          </div>

          {/* Compliance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {complianceDetails.map((item, index) => (
              <div
                key={index}
                className="bg-[#111] rounded-lg p-4"
              >
                <p className="font-bold text-sm mb-1">
                  {item.icon} {item.title}
                </p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The Math Section */}
        <section className="bg-[#0a0a0a] border-2 border-emerald-600 rounded-xl p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">The math</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
              <p className="font-bold text-sm text-amber-400 mb-2">Without partnership</p>
              <p className="text-xs text-gray-400 mb-2">
                Pay someone to build a branded audit tool: $15K–$50K + months of dev time.
              </p>
              <p className="text-xs text-gray-400 mb-2">
                Hire a compliance consultant to review your stack: $5K–$20K.
              </p>
              <p className="text-xs text-gray-400">
                Lose the regulated deal because you can&apos;t answer &quot;where does my data go.&quot;
              </p>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4">
              <p className="font-bold text-sm text-emerald-400 mb-2">With Nebula partnership</p>
              <p className="text-xs text-gray-300 mb-2">
                $497/mo. Branded audits today. No dev.
              </p>
              <p className="text-xs text-gray-300 mb-2">
                Compliance docs included. Quote regulated clients this week.
              </p>
              <p className="text-xs text-gray-300">
                One audit + retainer deal covers 6+ months of partner fees.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Quote regulated clients this week.</h2>
          <p className="text-sm text-gray-500 mb-4">
            14-day free pilot. White-label audits. Compliance-ready. $497/mo.
          </p>
          <a
            href="https://buy.stripe.com/aFa8wPc2o7YM9613Ro43S0d"
            className="inline-block bg-white text-black font-bold py-4 px-10 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Become a partner →
          </a>
          <p className="text-xs text-gray-500 mt-4">
            Questions?{' '}
            <a href="mailto:ops@launchcrate.io" className="text-blue-400 hover:text-blue-300">
              ops@launchcrate.io
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
