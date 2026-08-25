import { Suspense } from 'react'
import type { Metadata } from 'next'
import OverviewClient from './OverviewClient'

// Session-scoped surface: never cached by shared caches.
export const dynamic = 'force-dynamic'


export const metadata: Metadata = {
  title: 'Overview',
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8"><div className="h-24 animate-pulse rounded-md bg-bg-panel" /></div>}>
      <OverviewClient />
    </Suspense>
  )
}
