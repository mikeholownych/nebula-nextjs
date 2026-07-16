'use client'

import Link from 'next/link'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen bg-bg px-6 py-24 text-fg">
      <div className="mx-auto max-w-xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-danger">Application error</p>
        <h1 className="mb-4 text-4xl font-bold">Something went wrong</h1>
        <p className="mb-8 text-fg-muted">
          This page cannot process an audit or collect contact information. Retry the request or return home.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="rounded-xl bg-accent px-5 py-3 font-semibold text-bg" onClick={reset} type="button">
            Try again
          </button>
          <Link className="rounded-xl border border-border px-5 py-3 font-semibold" href="/">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
