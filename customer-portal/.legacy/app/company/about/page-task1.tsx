import { Metadata } from 'next'
import { organizationSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'About Nebula Components',
  description: 'Nebula Components provides landing page conversion optimization for founders bleeding money on ads. Free audit, $147 implementation, no retainer.',
  openGraph: {
    title: 'About Nebula Components',
    description: 'Landing page conversion optimization for founders bleeding money on ads.',
    url: 'https://nebulacomponents.shop/company/about',
  },
  alternates: {
    canonical: 'https://nebulacomponents.shop/company/about',
  },
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white" id="main-content" role="main">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 id="hero-title" className="text-4xl font-bold mb-6">
          About Nebula Components
        </h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-emerald-400">Mission</h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            Stop the bleed. Founders waste billions on ads that convert at 2-3%. We find the leak
            with evidence-backed analysis and offer a bounded implementation path — no calls, no retainers, no agency ambiguity.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-emerald-400">What We Do</h2>
          <ul className="text-gray-300 space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-emerald-400">▸</span>
              <span><strong>Audit status:</strong> Automated URL submission and scoring are paused during the evidence-backed rebuild.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400">▸</span>
              <span><strong>Fix Pack ($147):</strong> We implement the fix. You get conversions in 24 hours.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400">▸</span>
              <span><strong>AI Ops Retainer ($1,497/mo):</strong> Continuous optimization for scaling brands.</span>
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-emerald-400">Why We Exist</h2>
          <p className="text-gray-300 text-lg">
            Agencies charge $5,000/month for "strategy" with no guaranteed results. Consultants
            want 3-month retainers before touching your page. We flipped the model: diagnosis
            first, fast implementation, no commitment.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-emerald-400">Contact</h2>
          <p className="text-gray-300">
            <strong>Email:</strong>{' '}
            <a href="mailto:hello@nebulacomponents.shop" className="text-emerald-400 hover:underline">
              hello@nebulacomponents.shop
            </a>
          </p>
        </section>

        {/* Organization structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              ...organizationSchema,
              '@id': 'https://nebulacomponents.shop/#organization',
              foundingDate: '2025',
              numberOfEmployees: '1-10',
              areaServed: 'Worldwide',
            }),
          }}
        />
      </div>
    </main>
  )
}
