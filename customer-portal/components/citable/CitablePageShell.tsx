import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  CITABLE_OVERVIEW_PATH,
  type CitableRoute,
  getCitableRouteByPath,
} from '@/app/resources/citable/content'
import { createBreadcrumbSchema } from '@/app/lib/schema'

const BASE_URL = 'https://nebulacomponents.com'

interface CitablePageShellProps {
  route: CitableRoute
  children: ReactNode
  showRelatedNavigation?: boolean
}

export function CitablePageShell({
  route,
  children,
  showRelatedNavigation = true,
}: CitablePageShellProps) {
  const relatedRoutes = route.relatedPaths
    .map(getCitableRouteByPath)
    .filter((related): related is CitableRoute => Boolean(related && related.status === 'published'))

  const breadcrumbSchema = createBreadcrumbSchema(
    route.path === CITABLE_OVERVIEW_PATH
      ? [
          { name: 'Home', url: BASE_URL },
          { name: 'Resources', url: `${BASE_URL}/resources` },
          { name: 'Citable', url: `${BASE_URL}${route.path}` },
        ]
      : [
          { name: 'Home', url: BASE_URL },
          { name: 'Resources', url: `${BASE_URL}/resources` },
          { name: 'Citable', url: `${BASE_URL}${CITABLE_OVERVIEW_PATH}` },
          { name: route.h1, url: `${BASE_URL}${route.path}` },
        ]
  )

  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
          <Link href="/resources" className="transition-colors hover:text-fg">
            Resources
          </Link>
          <span aria-hidden="true">/</span>
          {route.path === CITABLE_OVERVIEW_PATH ? (
            <span aria-current="page">Citable</span>
          ) : (
            <>
              <Link href={CITABLE_OVERVIEW_PATH} className="transition-colors hover:text-fg">
                Citable
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{route.h1}</span>
            </>
          )}
        </nav>

        {/*
          Pin layout properties that the legacy unscoped `header` rule in
          globals.css otherwise overrides on Citable pages.
        */}
        <header className="static block max-w-4xl border-b border-border bg-transparent p-0 pb-12 backdrop-blur-none">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            {route.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-fg md:text-6xl">
            {route.h1}
          </h1>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
            {route.primaryQuestion}
          </p>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-fg md:text-xl">
            {route.directAnswer}
          </p>
        </header>

        <div className="py-12">{children}</div>

        {showRelatedNavigation && relatedRoutes.length > 0 && (
          <nav aria-label="Related Citable guides" className="border-t border-border pt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fg-muted">
              Continue with Citable
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {relatedRoutes.map((related) => (
                <Link
                  key={related.path}
                  href={related.path}
                  className="rounded-xl border border-border bg-bg-panel p-5 transition-colors hover:border-accent/30"
                >
                  <span className="block text-sm font-semibold text-fg">{related.h1}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-fg-muted">
                    {related.primaryQuestion}
                  </span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </main>
  )
}
