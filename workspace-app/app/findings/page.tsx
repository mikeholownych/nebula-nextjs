import { Suspense } from 'react'
import type { Metadata } from 'next'
import FindingsClient from './FindingsClient'

// Session-scoped surface: never cached by shared caches.
export const dynamic = 'force-dynamic'


export const metadata: Metadata = {
  title: 'Findings',
}

export default function FindingsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8"><div className="h-16 animate-pulse rounded-md bg-bg-panel" /></div>}>
      <FindingsClient />
    </Suspense>
  )
}
