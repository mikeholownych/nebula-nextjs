import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-24 text-fg">
      <div className="mx-auto max-w-xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">404</p>
        <h1 className="mb-4 text-4xl font-bold">Page not found</h1>
        <p className="mb-8 text-fg-muted">
          The requested page is unavailable. No email or audit information is collected here.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link className="rounded-xl bg-accent px-5 py-3 font-semibold text-bg" href="/">
            Back to home
          </Link>
          <Link className="rounded-xl border border-border px-5 py-3 font-semibold" href="/audit">
            Run free audit
          </Link>
        </div>
      </div>
    </main>
  )
}
