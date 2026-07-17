import Link from 'next/link'
import { Card } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default function AuditPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-12 flex items-center justify-center">
      <Card variant="elevated" className="max-w-xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
          Temporary maintenance
        </p>
        <h1 className="mb-4 text-3xl font-bold text-fg">The Audit Is Being Rebuilt</h1>
        <p className="mb-6 text-fg-muted">
          We have paused automated audits while we replace the prototype scoring system with verified analysis.
          We will not show you guessed scores or fabricated findings.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 font-semibold text-fg transition-colors hover:border-accent"
        >
          Back to Home
        </Link>
      </Card>
    </main>
  )
}
