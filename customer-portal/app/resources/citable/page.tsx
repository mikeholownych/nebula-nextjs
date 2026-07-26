import type { Metadata } from 'next'
import Link from 'next/link'
import { CitablePageShell } from '@/components/citable/CitablePageShell'
import { CitableProofPanel } from '@/components/citable/CitableProofPanel'
import {
  CITABLE_ORIGIN,
  CITABLE_OVERVIEW_PATH,
  CITABLE_SOFTWARE_ID,
  citableLicenseFacts,
  citableReleaseFacts,
  getCitableMetadata,
  getCitableRouteByPath,
  getPublishedCitableRoutes,
} from './content'

const registeredRoute = getCitableRouteByPath(CITABLE_OVERVIEW_PATH)

if (!registeredRoute || registeredRoute.kind !== 'overview' || registeredRoute.status !== 'published') {
  throw new Error('The published Citable overview route is missing from the registry.')
}

const route = registeredRoute

export const metadata: Metadata = getCitableMetadata(route)

const citableSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': CITABLE_SOFTWARE_ID,
  name: 'Citable',
  description: route.description,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: `Node.js ${citableReleaseFacts.nodeRequirement}`,
  url: `${CITABLE_ORIGIN}${route.path}`,
  downloadUrl: 'https://www.npmjs.com/package/@nebulacomponents/citable',
  softwareVersion: citableReleaseFacts.version,
  dateModified: citableReleaseFacts.releasedAt,
  license: citableLicenseFacts.url,
  author: { '@id': 'https://nebulacomponents.shop/#organization' },
}

const supportingRoutes = getPublishedCitableRoutes()

export default function CitablePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(citableSchema) }}
      />

      <CitablePageShell route={route} showRelatedNavigation={false}>
        <section aria-labelledby="release-facts-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                Synchronized package facts
              </p>
              <h2 id="release-facts-heading" className="mt-3 text-2xl font-bold tracking-tight text-fg">
                Current documented release
              </h2>
            </div>
            <p className="text-sm text-fg-muted">
              v{citableReleaseFacts.version} · released {citableReleaseFacts.releasedAt}
            </p>
          </div>

          <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Detectors', citableReleaseFacts.detectorCount],
              ['Namespaces', citableReleaseFacts.namespaceCount],
              ['Registries', citableReleaseFacts.registryCount],
              ['License', citableLicenseFacts.label],
            ].map(([label, value]) => (
              <div key={label} className="bg-bg-panel p-6">
                <dt className="text-sm text-fg-muted">{label}</dt>
                <dd className="mt-2 text-2xl font-bold text-fg">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-fg-muted">
            Package facts come from <code className="text-fg">{citableReleaseFacts.source}</code>.
            They document the package, not its workflow or deployment state.
          </p>
        </section>

        <section aria-labelledby="routes-heading" className="mt-14 border-t border-border pt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Job-led guides
          </p>
          <h2 id="routes-heading" className="mt-3 text-3xl font-bold tracking-tight text-fg">
            Start with the evidence question
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-fg-muted">
            Each guide owns one operational question and keeps package observations separate from
            downstream outcomes. The category guide and release page keep adjacent decision work
            equally evidence-bounded.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {supportingRoutes.map((supportingRoute) => (
              <Link
                key={supportingRoute.path}
                href={supportingRoute.path}
                prefetch={false}
                className="group rounded-2xl border border-border bg-bg-panel p-6 transition-colors hover:border-accent/30"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-accent">
                  {supportingRoute.eyebrow}
                </p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-fg">
                  {supportingRoute.h1}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  {supportingRoute.primaryQuestion}
                </p>
                <span className="mt-5 inline-block text-sm font-semibold text-accent">
                  Read guide <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="boundary-heading" className="mt-14 border-t border-border pt-12">
          <h2 id="boundary-heading" className="text-3xl font-bold tracking-tight text-fg">
            Eligibility, support, and observation stay separate
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Technically available',
                body: 'Audit retrieval conditions and preserve the responses, directives, discovery paths, and run configuration that produced the finding.',
              },
              {
                title: 'Supportable',
                body: 'Connect claims to registered evidence, freshness, authority, and review state without allowing automation to invent missing support.',
              },
              {
                title: 'Externally observed',
                body: 'Keep owner exports, logs, prompt experiments, workflow receipts, and deployment receipts distinct from package capability.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-border p-6">
                <h3 className="text-lg font-semibold text-fg">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-fg-muted">
            Citable does not guarantee crawling, indexing, ranking, citation, recommendation,
            inclusion, sentiment, conversion, workflow success, or deployment success.
          </p>
        </section>

        <CitableProofPanel />

        <section className="mt-12 flex flex-wrap gap-3 border-t border-border pt-10">
          <Link
            href="/resources/citable/quick-start"
            prefetch={false}
            className="rounded-xl bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light"
          >
            Run the quick start
          </Link>
          <Link
            href="https://www.npmjs.com/package/@nebulacomponents/citable"
            prefetch={false}
            className="rounded-xl border border-border px-6 py-3 font-semibold text-fg transition-colors hover:border-accent/30"
          >
            Read package documentation
          </Link>
        </section>
      </CitablePageShell>
    </>
  )
}
