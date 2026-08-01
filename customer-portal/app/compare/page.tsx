import { Metadata } from 'next'
import { comparisons } from './comparisons'

export const metadata: Metadata = {
  title: 'Nebula Components vs Landing Page Tools — Comparisons',
  description:
    'Honest, evidence-led comparisons of Nebula Components against landing page builders and performance tools: Unbounce, Instapage, PageSpeed Insights, Leadpages.',
  openGraph: {
    title: 'Nebula Components vs Landing Page Tools — Comparisons',
    description:
      'Evidence-led landing page audit vs the builders and meters. Honest boundaries, published pass standards.',
    url: 'https://nebulacomponents.shop/compare',
  },
  alternates: {
    canonical: 'https://nebulacomponents.shop/compare',
  },
}

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24" id="main-content" role="main">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-3">Nebula Components vs the tools founders actually use</h1>
        <p className="text-gray-400 text-lg mb-10">
          Landing page builders create pages. Performance meters measure speed. Nebula audits
          conversion readiness against published pass standards. These pages state the boundary
          honestly — and where the other tool wins, it says so.
        </p>

        <section className="space-y-6">
          {comparisons.map((comparison) => (
            <a
              key={comparison.slug}
              href={`/compare/${comparison.slug}`}
              className="block bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 hover:border-emerald-800 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-emerald-400">
                  vs {comparison.toolName}
                </h2>
                <span className="text-xs text-gray-500 border border-gray-700 rounded-full px-3 py-1">
                  {comparison.category}
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{comparison.shortDescription}</p>
            </a>
          ))}
        </section>

        <section className="mt-12 bg-[#0a0a0a] border border-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Stop comparing. Start diagnosing.</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            The free audit scores the page you already have against published component pass
            standards — no signup, no site access, no rebuild.
          </p>
          <a
            href="/audit"
            className="inline-block rounded-lg bg-emerald-500 px-8 py-3 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
          >
            Free Audit
          </a>
        </section>
      </div>
    </main>
  )
}
