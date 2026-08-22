import type { Metadata } from 'next'
import Link from 'next/link'
import { fetchTeardownList } from './[slug]/data.server'
import { CARD_COPY, CURATED_ORDER } from './card-display'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Public Audit Teardowns | Nebula',
  description:
    'Nebula runs its evidence-backed audit on well-known public pages and publishes the raw findings. Not customers - demonstrations of what the engine produces.',
  alternates: {
    canonical: 'https://nebulacomponents.com/teardowns',
  },
}

export default async function TeardownsPage() {
  const rows = await fetchTeardownList()
  const rank = new Map(CURATED_ORDER.map((slug, i) => [slug, i]))
  const ordered = [...rows].sort(
    (a, b) =>
      (rank.get(a.slug) ?? CURATED_ORDER.length) -
      (rank.get(b.slug) ?? CURATED_ORDER.length),
  )

  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Public Audit Teardowns
        </p>
        <h1 className="heading-1 tracking-tight text-fg md:text-5xl">Discover Conversion Leaks from Real SaaS Landing Page Audits</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
          These companies are not Nebula customers. We run the same 9-signal engine on public pages
          and publish the raw findings - not to criticize anyone, but to show exactly what the audit
          produces on pages you can verify yourself.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            href="/audit?utm_source=teardowns-hero&utm_medium=hero-cta"
            className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
          >
            Get your free landing page audit →
          </Link>
          <Link
            href="/repair-sprint"
            className="inline-flex min-h-[44px] items-center justify-center rounded border border-border px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
          >
            Explore $97 Repair Sprint
          </Link>
        </div>
      </section>

      <section className="border-t border-border px-6 py-12">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {ordered.map((row) => {
            const copy = CARD_COPY[row.slug]
            const urlDisplay = copy?.urlDisplay ?? row.domain
            const scoreColor =
              row.score >= 7 ? 'text-green-400' : row.score >= 5 ? 'text-amber-400' : 'text-red-400'
            return (
              <article
                key={row.slug}
                className="rounded-md border border-border bg-bg-panel p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
                      {urlDisplay}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-fg">{row.name}</h2>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${scoreColor}`}>
                      {row.score}
                      <span className="text-lg text-fg-muted">/10</span>
                    </p>
                    <p className={`text-sm font-semibold ${scoreColor}`}>Grade {row.grade}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-fg-muted">{copy?.findingCount ?? 0} findings</p>
                <p className="mt-2 text-sm text-fg-muted leading-relaxed">{copy?.topFinding ?? row.summary}</p>

                <div className="mt-5 flex items-center justify-between">
                  <p className="text-xs text-fg-muted">Audited {copy?.auditedAt ?? ''}</p>
                  <Link
                    href={`/teardowns/${row.slug}`}
                    className="text-sm font-semibold text-accent hover:text-fg"
                  >
                    Read teardown →
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-fg">See what it finds on your page</h2>
        <p className="mt-4 text-fg-muted">Free, no signup. Same engine as every teardown above.</p>
        <Link
          href="/audit?from=%2Fteardowns"
          className="mt-8 inline-block rounded bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
        >
          Find the Leak →
        </Link>
      </section>
    </main>
  )
}
