'use client'

import { startTransition } from 'react'
import type { useRouter } from 'next/navigation'

type Router = ReturnType<typeof useRouter>

/**
 * Wraps a client-side route change in the native View Transitions API when
 * the browser supports it, so the outgoing and incoming pages cross-fade and
 * morph shared elements instead of hard-cutting between routes.
 *
 * Falls back to a plain `router.push` when the API is unavailable (Firefox,
 * or JS-disabled navigation isn't affected either way) — no regression, just
 * no enhancement.
 */
export function pushWithViewTransition(router: Router, href: string) {
  if (typeof document === 'undefined' || !('startViewTransition' in document)) {
    router.push(href)
    return
  }

  document.startViewTransition(() => {
    return new Promise<void>((resolve) => {
      startTransition(() => {
        router.push(href)
        resolve()
      })
    })
  })
}
