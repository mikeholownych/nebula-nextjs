import type { Metadata } from 'next'
import Link from 'next/link'
import Benchmarks, { type BenchmarksData } from './Benchmarks'

export const metadata: Metadata = {
  title: 'The Landing Page Leak Index - Real Audit Data | Nebula',
  description:
    'Live aggregate data from completed Nebula landing page audits: which verified documented checks produce findings. Deprecated source-only checks and composite scores are excluded pending rendered verification.',
  alternates: { canonical: '/benchmarks' },
}

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

async function getStats(): Promise<BenchmarksData | null> {
  try {
    const res = await fetch(`${API_BASE}/audit/stats/benchmarks`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return (await res.json()) as BenchmarksData
  } catch {
    return null
  }
}

export default async function BenchmarksPage() {
  const data = await getStats()

  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'The Landing Page Leak Index',
    description:
      'Aggregate finding rates from completed Nebula landing page audits. The index reports which verified documented checks produced findings; composite scores remain unpublished pending rendered verification.',
    url: 'https://nebulacomponents.com/benchmarks',
    creator: {
      '@type': 'Organization',
      name: 'Nebula Components',
      url: 'https://nebulacomponents.com',
    },
    dateModified: data?.generated_at ?? undefined,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'audit_count', value: data?.audit_count ?? undefined },
      { '@type': 'PropertyValue', name: 'avg_score', value: data?.avg_score ?? undefined },
      {
        '@type': 'PropertyValue',
        name: 'avg_failures_per_page',
        value: data?.avg_failures_per_page ?? undefined,
      },
    ],
    ...(data && data.audit_count > 0
      ? {
          distribution: {
            '@type': 'DataDownload',
            encodingFormat: 'application/json',
            contentUrl: 'https://nebulacomponents.com/api/audit/stats/benchmarks',
          },
        }
      : {}),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.com/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'The Landing Page Leak Index',
        item: 'https://nebulacomponents.com/benchmarks',
      },
    ],
  }

  return (
    <main id="main-content" className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <section className="border-b border-border px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Evidence, not projections
          </p>
          <h1 className="heading-1 text-fg">Discover Real Landing Page Benchmark Data and Conversion Statistics</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-fg-muted md:text-lg">
            Live failure-rate data from every completed Nebula audit. It reports only what was
            measured - never estimates or placeholder averages. When the verified dataset is empty,
            this page says so.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="rounded bg-accent px-7 py-3.5 font-semibold text-bg hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-base"
            >
              Audit Your Page
            </Link>
            <Link href="/teardowns" className="text-sm text-fg-muted hover:text-fg transition-colors">
              See Full Teardowns &rarr;
            </Link>
          </div>
        </div>
      </section>
      <Benchmarks initialData={data} />
    </main>
  )
}
