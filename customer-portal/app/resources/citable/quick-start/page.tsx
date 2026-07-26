import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema, createBreadcrumbSchema } from '@/app/lib/schema'
import { CitablePageShell } from '@/components/citable/CitablePageShell'
import { CitableProofPanel } from '@/components/citable/CitableProofPanel'
import {
  CITABLE_ORIGIN,
  citableQuickStartSteps,
  getCitableMetadata,
  getCitableRouteByPath,
} from '../content'

export const dynamic = 'force-dynamic'

const registeredRoute = getCitableRouteByPath('/resources/citable/quick-start')

if (!registeredRoute || registeredRoute.status !== 'published') {
  throw new Error('The published Citable quick-start route is missing from the registry.')
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
  { name: 'Quick start', url: canonical },
])

export default function CitableQuickStartPage() {
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
          <ol className="space-y-6">
            {citableQuickStartSteps.map((step, index) => (
              <li key={step.key} className="rounded-2xl border border-border bg-bg-panel p-6 md:p-8">
                <div className="flex items-baseline gap-4">
                  <span className="text-sm font-semibold text-accent">{String(index + 1).padStart(2, '0')}</span>
                  <h2 className="text-2xl font-bold tracking-tight text-fg">{step.label}</h2>
                </div>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-fg-muted">
                  {step.explanation}
                </p>
                <div className="mt-5 space-y-2">
                  {step.commands.map((command) => (
                    <code
                      key={command}
                      className="block overflow-x-auto rounded-lg border border-border bg-bg-elevated px-4 py-3 text-sm text-fg"
                    >
                      {command}
                    </code>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          <section className="mt-12 rounded-2xl border border-border p-7">
            <h2 className="text-2xl font-bold tracking-tight text-fg">Keep the first run bounded</h2>
            <ul className="mt-5 list-disc space-y-3 pl-5 text-base leading-relaxed text-fg-muted">
              <li>Use a declared build target and base URL; do not mix local and live observations.</li>
              <li>Retain the manifest, findings, report, captured responses, and checksums together.</li>
              <li>Record missing optional dependencies or credentials as incomplete evidence.</li>
              <li>Do not translate retrieval eligibility into a ranking, citation, or conversion promise.</li>
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-fg-muted">
              Commands are taken from the synchronized published package documentation. Review the{' '}
              <Link
                href="https://www.npmjs.com/package/@nebulacomponents/citable"
                className="font-semibold text-accent hover:text-accent-light"
              >
                package documentation
              </Link>{' '}
              before enabling optional browser, Lighthouse, OCR, or owner-data collectors.
            </p>
          </section>
        </article>

        <CitableProofPanel />
      </CitablePageShell>
    </>
  )
}
