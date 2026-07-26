import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema, createBreadcrumbSchema } from '@/app/lib/schema'
import { CitablePageShell } from '@/components/citable/CitablePageShell'
import { CitableProofPanel } from '@/components/citable/CitableProofPanel'
import {
  CITABLE_ORIGIN,
  citableControlledAssets,
  citableLicenseFacts,
  citableReleaseFacts,
  getCitableMetadata,
  getCitableRouteByPath,
} from '../content'

const registeredRoute = getCitableRouteByPath('/resources/citable/releases')

if (!registeredRoute || registeredRoute.kind !== 'release' || registeredRoute.status !== 'published') {
  throw new Error('The published Citable releases route is missing from the registry.')
}

const route = registeredRoute
export const metadata: Metadata = getCitableMetadata(route)

const canonical = `${CITABLE_ORIGIN}${route.path}`
const articleSchema = createArticleSchema({
  headline: route.h1,
  description: route.description,
  url: canonical,
  publishedDate: citableReleaseFacts.releasedAt,
  modifiedDate: citableReleaseFacts.releasedAt,
})
const breadcrumbSchema = createBreadcrumbSchema([
  { name: 'Resources', url: `${CITABLE_ORIGIN}/resources` },
  { name: 'Citable', url: `${CITABLE_ORIGIN}/resources/citable` },
  { name: 'Current release', url: canonical },
])

export default function CitableReleasesPage() {
  return (
    <>
      {[articleSchema, breadcrumbSchema].map((schema) => (
        <script
          key={schema['@type']}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <CitablePageShell route={route}>
        <article>
          <section aria-labelledby="current-release-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Synchronized release projection
            </p>
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="current-release-heading" className="text-3xl font-bold tracking-tight text-fg">
                Current documented package release
              </h2>
              <p className="font-semibold text-fg">v{citableReleaseFacts.version}</p>
            </div>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-fg-muted">
              Released {citableReleaseFacts.releasedAt} from{' '}
              <code className="text-fg">{citableReleaseFacts.source}</code>. This page is a current
              projection, not a manually maintained release history.
            </p>

            <dl className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
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
              Runtime requirement: <code className="text-fg">Node.js {citableReleaseFacts.nodeRequirement}</code>.
            </p>
          </section>

          <section aria-labelledby="highlights-heading" className="mt-12 border-t border-border pt-10">
            <h2 id="highlights-heading" className="text-2xl font-bold tracking-tight text-fg">Release highlights</h2>
            <ul className="mt-5 space-y-3 text-base leading-relaxed text-fg-muted">
              {citableReleaseFacts.highlights.map((highlight) => (
                <li key={highlight} className="rounded-xl border border-border bg-bg-panel p-5">{highlight}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="controlled-assets-heading" className="mt-12 border-t border-border pt-10">
            <h2 id="controlled-assets-heading" className="text-2xl font-bold tracking-tight text-fg">Controlled site assets</h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-fg-muted">
              These assets are controlled release-governance surfaces. Their links make the deployed
              bytes inspectable, but they do not establish that the current release reached every
              live surface.
            </p>
            <ul className="mt-5 grid gap-3 md:grid-cols-3">
              {citableControlledAssets.map((asset) => (
                <li key={asset.href} className="rounded-xl border border-border bg-bg-panel p-5">
                  <Link href={asset.href} className="font-semibold text-accent hover:text-accent-light">
                    {asset.label}
                  </Link>
                  <p className="mt-3 text-sm leading-relaxed text-fg-muted">{asset.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="verification-boundary-heading" className="mt-12 rounded-2xl border border-border p-7">
            <h2 id="verification-boundary-heading" className="text-2xl font-bold tracking-tight text-fg">
              Verification boundary
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-fg-muted">
              Workflow verification remains unavailable because no fresh committed workflow receipt is
              projected here. Deployment verification remains unavailable because no fresh committed
              receipt proves the current live surfaces. A package release record or controlled asset
              link is not a substitute for either receipt.
            </p>
          </section>
        </article>

        <CitableProofPanel />
      </CitablePageShell>
    </>
  )
}
