import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { comparisons, getComparison } from '../comparisons'

export const dynamicParams = false

const BASE_URL = 'https://nebulacomponents.shop'

export function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const comparison = getComparison(slug)
  if (!comparison) return {}

  const title = `Nebula Components vs ${comparison.toolName} — Landing Page Audit Alternative`
  const description = `${comparison.shortDescription} How Nebula Components compares: evidence-led conversion audits with published pass standards vs ${comparison.toolName}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/compare/${comparison.slug}`,
      type: 'website',
    },
    alternates: {
      canonical: `${BASE_URL}/compare/${comparison.slug}`,
    },
  }
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const comparison = getComparison(slug)
  if (!comparison) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Nebula Components vs ${comparison.toolName}`,
    description: comparison.intro,
    about: [
      { '@type': 'Organization', name: 'Nebula Components', url: BASE_URL },
      { '@type': 'Product', name: comparison.toolName, url: comparison.toolUrl },
    ],
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24" id="main-content" role="main">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <p className="text-sm text-emerald-400 font-medium mb-2">
          <a href="/compare" className="hover:underline">← All comparisons</a>
        </p>
        <h1 className="text-4xl font-bold mb-3">
          Nebula Components vs {comparison.toolName}
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          {comparison.shortDescription}
        </p>

        <section className="mb-10">
          <p className="text-gray-300 leading-relaxed">{comparison.intro}</p>
        </section>

        {/* What it does well / where it stops / where Nebula fits */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <section className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-3">What {comparison.toolName} does well</h2>
            <ul className="space-y-2 text-sm text-gray-300">
              {comparison.whatItDoesWell.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-emerald-400">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-3">Where it stops</h2>
            <ul className="space-y-2 text-sm text-gray-300">
              {comparison.whereItStops.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-red-400">−</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-[#0a0a0a] border border-emerald-900/60 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-3">Where Nebula fits</h2>
            <ul className="space-y-2 text-sm text-gray-300">
              {comparison.nebulaFit.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-emerald-400">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Comparison table */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Side by side</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0a0a0a] text-left text-gray-400">
                  <th className="px-4 py-3 font-medium">Dimension</th>
                  <th className="px-4 py-3 font-medium">{comparison.toolName}</th>
                  <th className="px-4 py-3 font-medium text-emerald-400">Nebula Components</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {comparison.table.map((row) => (
                  <tr key={row.dimension}>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap align-top">{row.dimension}</td>
                    <td className="px-4 py-3 text-gray-300 align-top">{row.tool}</td>
                    <td className="px-4 py-3 text-gray-200 align-top">{row.nebula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Use both */}
        <section className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 mb-10">
          <h2 className="text-lg font-bold text-white mb-2">The honest take: use both</h2>
          <p className="text-gray-300 leading-relaxed">{comparison.useBoth}</p>
        </section>

        {/* Verdict */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">Verdict</h2>
          <p className="text-gray-300 leading-relaxed">{comparison.verdict}</p>
        </section>

        {/* CTA */}
        <section className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Run the free audit</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Score the page you have right now against published component pass standards — no signup, no site access, no rebuild.
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
