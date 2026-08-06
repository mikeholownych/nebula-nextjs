import type { ReactNode } from 'react'

export function Surface({ children }: { children: ReactNode }) {
  return <div className="min-h-32 w-full max-w-3xl rounded-2xl bg-bg p-6 text-fg">{children}</div>
}

export function StateNote({ children }: { children: ReactNode }) {
  return <p className="mb-4 text-sm text-fg-muted">{children}</p>
}
