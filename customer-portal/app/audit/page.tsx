import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Card } from '@/components/ui'
import AuditForm from './AuditForm'

export const metadata: Metadata = {
  title: 'Free Landing Page Audit — Nebula Components',
  description: 'Get an evidence-backed diagnosis of your landing page in 60 seconds — no signup required to start.',
  alternates: { canonical: 'https://nebulacomponents.shop/audit' },
}

export default function AuditPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">
            Free Landing Page Audit
          </p>
          <h1 className="mb-4 text-4xl font-bold text-fg">
            Find Out Why Your Ads Aren't Converting
          </h1>
          <p className="text-lg text-fg-muted">
            Get actionable insights in 60 seconds — no signup required to start
          </p>
        </div>

        {/* URL Input Card — only interactive piece on this page */}
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-surface" />}>
          <AuditForm />
        </Suspense>

        {/* Trust Signals */}
        <div className="space-y-6">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-fg-muted">
            What You'll Get
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card variant="bordered" className="p-4">
              <h3 className="mb-2 font-semibold text-fg">Evidence-Based Score</h3>
              <p className="text-sm text-fg-muted">
                Not a guess — actual checks for headline clarity, CTAs, trust signals, and load speed
              </p>
            </Card>
            <Card variant="bordered" className="p-4">
              <h3 className="mb-2 font-semibold text-fg">Prioritized Fixes</h3>
              <p className="text-sm text-fg-muted">
                Quick wins you can implement today vs. major projects for later
              </p>
            </Card>
            <Card variant="bordered" className="p-4">
              <h3 className="mb-2 font-semibold text-fg">Conversion Focus</h3>
              <p className="text-sm text-fg-muted">
                Every finding ties back to reducing friction and increasing conversions
              </p>
            </Card>
            <Card variant="bordered" className="p-4">
              <h3 className="mb-2 font-semibold text-fg">No Commitment</h3>
              <p className="text-sm text-fg-muted">
                Start free. Share your email only when you want the full report
              </p>
            </Card>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-12 text-center">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-fg-muted">
            How It Works
          </h2>
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
            <div className="text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-bg">
                1
              </div>
              <p className="text-sm text-fg-muted">Enter URL</p>
            </div>
            <div className="hidden h-px w-12 bg-border sm:block" />
            <div className="text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-bg">
                2
              </div>
              <p className="text-sm text-fg-muted">We Analyze</p>
            </div>
            <div className="hidden h-px w-12 bg-border sm:block" />
            <div className="text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-bg">
                3
              </div>
              <p className="text-sm text-fg-muted">Get Results</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
