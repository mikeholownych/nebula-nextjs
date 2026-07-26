import type { Metadata } from 'next'
import { createArticleSchema, createBreadcrumbSchema } from '@/app/lib/schema'
import { CitablePageShell } from '@/components/citable/CitablePageShell'
import { CitableProofPanel } from '@/components/citable/CitableProofPanel'
import {
  CITABLE_ORIGIN,
  citableComparisonRows,
  citableComparisonStatusLabels,
  getCitableMetadata,
  getCitableRouteByPath,
} from '../content'

const registeredRoute = getCitableRouteByPath('/resources/citable/compare')

if (!registeredRoute || registeredRoute.kind !== 'compare' || registeredRoute.status !== 'published') {
  throw new Error('The published Citable comparison route is missing from the registry.')
}

const route = registeredRoute
export const metadata: Metadata = getCitableMetadata(route)

const canonical = `${CITABLE_ORIGIN}${route.path}`
const articleSchema = createArticleSchema({
  headline: route.h1,
  description: route.description,
  url: canonical,
  publishedDate: '2026-07-26',
})
const breadcrumbSchema = createBreadcrumbSchema([
  { name: 'Resources', url: `${CITABLE_ORIGIN}/resources` },
  { name: 'Citable', url: `${CITABLE_ORIGIN}/resources/citable` },
  { name: 'Category comparison', url: canonical },
])

export default function CitableComparisonPage() {
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
          <section aria-labelledby="comparison-matrix-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Decision matrix
            </p>
            <h2 id="comparison-matrix-heading" className="mt-3 text-3xl font-bold tracking-tight text-fg">
              Match the evidence to the decision
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-fg-muted">
              This is a comparison of product categories and workflows, not named vendors. Each row
              states whether its boundary is documented here, not assessed here, or requires an
              external source.
            </p>

            <div className="mt-7 overflow-x-auto rounded-2xl border border-border">
              <table className="min-w-[760px] w-full border-collapse text-left text-sm">
                <thead className="bg-bg-elevated text-fg">
                  <tr>
                    <th scope="col" className="p-4 font-semibold">Category</th>
                    <th scope="col" className="p-4 font-semibold">Workflow</th>
                    <th scope="col" className="p-4 font-semibold">Evidence state</th>
                    <th scope="col" className="p-4 font-semibold">Boundary and next need</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-bg-panel text-fg-muted">
                  {citableComparisonRows.map((row) => (
                    <tr key={row.category}>
                      <th scope="row" className="p-4 align-top font-semibold text-fg">{row.category}</th>
                      <td className="p-4 align-top leading-relaxed">{row.workflow}</td>
                      <td className="p-4 align-top">
                        <span className="inline-flex rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-fg">
                          {citableComparisonStatusLabels[row.status]}
                        </span>
                      </td>
                      <td className="p-4 align-top leading-relaxed">
                        <p>{row.boundary}</p>
                        <p className="mt-3 font-medium text-fg">{row.operationalNeed}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="fit-heading" className="mt-12 border-t border-border pt-10">
            <h2 id="fit-heading" className="text-2xl font-bold tracking-tight text-fg">Use the tools together</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-bg-panel p-6">
                <h3 className="text-lg font-semibold text-fg">Citable is appropriate when</h3>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  You need a bounded technical or semantic observation, its inputs and limits, and a
                  retained evidence package before a person makes a publication or remediation decision.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-bg-panel p-6">
                <h3 className="text-lg font-semibold text-fg">Citable is not a monitoring replacement</h3>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  Use an external source whenever the decision depends on observed crawler behavior,
                  rank movement, or AI-provider visibility rather than on the bounded source evidence.
                </p>
              </div>
            </div>
          </section>
        </article>

        <CitableProofPanel />
      </CitablePageShell>
    </>
  )
}
